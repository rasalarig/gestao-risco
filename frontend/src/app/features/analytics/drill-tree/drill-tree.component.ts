import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import * as d3 from 'd3';

import { ApiService } from '../../../core/services/api.service';

interface TreeNode {
  id: string;
  name: string;
  type: 'category' | 'risk' | 'control' | 'action_plan';
  status?: string;
  children?: TreeNode[];
  _children?: TreeNode[]; // collapsed children
}

@Component({
  selector: 'app-drill-tree',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="drill-tree-container">
      <h2 class="drill-tree-title">Drill Tree &ndash; Detalhamento de Riscos</h2>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      @if (!loading && noData) {
        <mat-card class="no-data-card">
          <mat-card-content>
            <div class="no-data">
              <mat-icon>account_tree</mat-icon>
              <p>Nenhum dado disponivel para a arvore de riscos.</p>
              <p class="hint">Cadastre riscos, controles e planos de acao para visualizar.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <div class="tree-wrapper" [style.display]="loading || noData ? 'none' : 'block'">
        <!-- Legend -->
        <div class="legend">
          <div class="legend-item">
            <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="#00338D"/></svg>
            <span>Categoria</span>
          </div>
          <div class="legend-item">
            <svg width="20" height="20"><rect x="2" y="4" width="16" height="12" rx="2" fill="#FFA300"/></svg>
            <span>Risco</span>
          </div>
          <div class="legend-item">
            <svg width="20" height="20"><polygon points="10,2 18,10 10,18 2,10" fill="#00A3A1"/></svg>
            <span>Controle</span>
          </div>
          <div class="legend-item">
            <svg width="20" height="20"><rect x="3" y="3" width="14" height="14" fill="#7C3AED"/></svg>
            <span>Plano de Acao</span>
          </div>
        </div>
        <div #treeContainer class="svg-container"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .drill-tree-container {
        padding: 0;
      }

      .drill-tree-title {
        font-size: 20px;
        font-weight: 600;
        color: #00338d;
        margin: 0 0 16px;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      .no-data-card {
        border-radius: 12px;
      }

      .no-data {
        text-align: center;
        padding: 48px 24px;
        color: #999;
      }

      .no-data mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }

      .no-data .hint {
        font-size: 13px;
        color: #bbb;
      }

      .tree-wrapper {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        padding: 16px;
        overflow: hidden;
      }

      .legend {
        display: flex;
        gap: 24px;
        padding: 8px 16px;
        margin-bottom: 8px;
        border-bottom: 1px solid #eee;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #555;
      }

      .svg-container {
        width: 100%;
        min-height: 500px;
        overflow: auto;
        cursor: grab;
      }

      .svg-container:active {
        cursor: grabbing;
      }
    `,
  ],
})
export class DrillTreeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('treeContainer', { static: false }) treeContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  loading = true;
  noData = false;
  private treeData: TreeNode | null = null;

  private readonly nodeColors: Record<string, string> = {
    category: '#00338D',
    risk: '#FFA300',
    control: '#00A3A1',
    action_plan: '#7C3AED',
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Tree is rendered after data loads
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;
    this.apiService
      .getDrillTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const nodes: TreeNode[] = data.nodes || [];
          if (nodes.length === 0) {
            this.noData = true;
            this.loading = false;
            return;
          }
          // Wrap in a virtual root
          this.treeData = {
            id: 'root',
            name: 'Riscos',
            type: 'category',
            children: nodes,
          };
          this.noData = false;
          this.loading = false;
          setTimeout(() => this.renderTree(), 0);
        },
        error: () => {
          this.loading = false;
          this.noData = true;
        },
      });
  }

  private renderTree(): void {
    if (!this.treeData || !this.treeContainer) return;

    const container = this.treeContainer.nativeElement as HTMLElement;
    container.innerHTML = '';

    const margin = { top: 20, right: 200, bottom: 20, left: 120 };
    const width = Math.max(container.clientWidth, 900);

    // Create hierarchy
    const root = d3.hierarchy<TreeNode>(this.treeData);
    const nodeCount = root.descendants().length;
    const height = Math.max(500, nodeCount * 28);

    // Tree layout
    const treeLayout = d3.tree<TreeNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    treeLayout(root);

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(
        d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on('zoom', (event) => {
          g.attr('transform', event.transform);
        }) as any
      );

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '100')
      .style('max-width', '250px');

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
      .attr('d', (d: any) => {
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      });

    // Nodes
    const node = g
      .selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: any) => {
        const data = d.data as TreeNode;
        const typeLabels: Record<string, string> = {
          category: 'Categoria',
          risk: 'Risco',
          control: 'Controle',
          action_plan: 'Plano de Acao',
        };
        let html = `<strong>${typeLabels[data.type] || data.type}</strong><br/>${data.name}`;
        if (data.status) {
          html += `<br/>Status: ${data.status}`;
        }
        const childCount = (data.children?.length || 0) + (data._children?.length || 0);
        if (childCount > 0) {
          html += `<br/>Filhos: ${childCount}`;
        }
        tooltip
          .html(html)
          .style('left', event.offsetX + 15 + 'px')
          .style('top', event.offsetY - 10 + 'px')
          .style('opacity', '1');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', '0');
      })
      .on('click', (_event: MouseEvent, d: any) => {
        this.toggleNode(d);
        this.updateTree(g, root, treeLayout, tooltip, margin, width);
      });

    // Draw shapes based on type
    node.each((d: any, i: number, nodes: any) => {
      const el = d3.select(nodes[i]);
      const data = d.data as TreeNode;
      const color = this.nodeColors[data.type] || '#999';

      switch (data.type) {
        case 'category':
          el.append('circle').attr('r', 10).attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 2);
          break;
        case 'risk':
          el.append('rect')
            .attr('x', -12)
            .attr('y', -8)
            .attr('width', 24)
            .attr('height', 16)
            .attr('rx', 3)
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
          break;
        case 'control':
          el.append('polygon')
            .attr('points', '0,-10 10,0 0,10 -10,0')
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
          break;
        case 'action_plan':
          el.append('rect')
            .attr('x', -8)
            .attr('y', -8)
            .attr('width', 16)
            .attr('height', 16)
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
          break;
        default:
          el.append('circle').attr('r', 8).attr('fill', '#999');
      }

      // Collapse indicator
      const hasChildren = data.children && data.children.length > 0;
      if (hasChildren) {
        el.append('text')
          .attr('dy', 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text(d.children ? '-' : '+');
      }
    });

    // Labels
    node
      .append('text')
      .attr('dy', 4)
      .attr('x', (d: any) => (d.children ? -16 : 16))
      .attr('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d: any) => {
        const name = d.data.name as string;
        return name.length > 40 ? name.substring(0, 37) + '...' : name;
      });
  }

  private toggleNode(d: any): void {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else if (d._children) {
      d.children = d._children;
      d._children = null;
    }
  }

  private updateTree(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    root: d3.HierarchyNode<TreeNode>,
    treeLayout: d3.TreeLayout<TreeNode>,
    tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>,
    margin: { top: number; right: number; bottom: number; left: number },
    width: number
  ): void {
    // Re-render the tree by clearing and redrawing
    if (!this.treeContainer) return;
    const container = this.treeContainer.nativeElement as HTMLElement;
    container.innerHTML = '';
    this.renderTree();
  }
}
