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

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'risk' | 'control' | 'action_plan';
  severity?: string;
  status?: string;
  highlighted?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: string;
}

@Component({
  selector: 'app-drill-web',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="drill-web-container">
      <h2 class="drill-web-title">Drill Web</h2>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      @if (!loading && noData) {
        <mat-card class="no-data-card">
          <mat-card-content>
            <div class="no-data">
              <mat-icon>hub</mat-icon>
              <p>Nenhum dado disponivel para a rede de riscos.</p>
              <p class="hint">Cadastre riscos, controles e planos de acao para visualizar.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <div class="web-wrapper" [style.display]="loading || noData ? 'none' : 'block'">
        <!-- Legend -->
        <div class="legend">
          <div class="legend-item">
            <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="#00338D"/></svg>
            <span>Risco</span>
          </div>
          <div class="legend-item">
            <svg width="20" height="20"><circle cx="10" cy="10" r="6" fill="#00A3A1"/></svg>
            <span>Controle</span>
          </div>
          <div class="legend-item">
            <svg width="20" height="20"><circle cx="10" cy="10" r="4" fill="#FFA300"/></svg>
            <span>Plano de Acao</span>
          </div>
        </div>
        <div #webContainer class="svg-container"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .drill-web-container {
        padding: 0;
      }

      .drill-web-title {
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

      .web-wrapper {
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
        height: 600px;
        position: relative;
      }
    `,
  ],
})
export class DrillWebComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('webContainer', { static: false }) webContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  loading = true;
  noData = false;
  private simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

  private readonly nodeConfig: Record<string, { color: string; radius: number }> = {
    risk: { color: '#00338D', radius: 18 },
    control: { color: '#00A3A1', radius: 12 },
    action_plan: { color: '#FFA300', radius: 8 },
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.apiService
      .getDrillWeb()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const nodes: GraphNode[] = data.nodes || [];
          const links: GraphLink[] = data.links || [];
          if (nodes.length === 0) {
            this.noData = true;
            this.loading = false;
            return;
          }
          this.noData = false;
          this.loading = false;
          setTimeout(() => this.renderGraph(nodes, links), 0);
        },
        error: () => {
          this.loading = false;
          this.noData = true;
        },
      });
  }

  private renderGraph(nodes: GraphNode[], links: GraphLink[]): void {
    if (!this.webContainer) return;

    const container = this.webContainer.nativeElement as HTMLElement;
    container.innerHTML = '';

    const width = container.clientWidth || 900;
    const height = 600;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(
        d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 5]).on('zoom', (event) => {
          g.attr('transform', event.transform);
        }) as any
      );

    const g = svg.append('g');

    // Tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '100')
      .style('max-width', '250px');

    // Build node map for link resolution
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Resolve link source/target to objects
    const resolvedLinks: GraphLink[] = links
      .filter((l) => nodeMap.has(l.source as string) && nodeMap.has(l.target as string))
      .map((l) => ({
        ...l,
        source: nodeMap.get(l.source as string)!,
        target: nodeMap.get(l.target as string)!,
      }));

    // Force simulation
    this.simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(resolvedLinks)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => (this.nodeConfig[d.type]?.radius || 10) + 5));

    // Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(resolvedLinks)
      .enter()
      .append('line')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) this.simulation!.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) this.simulation!.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append('circle')
      .attr('r', (d) => this.nodeConfig[d.type]?.radius || 10)
      .attr('fill', (d) => this.nodeConfig[d.type]?.color || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Labels
    node
      .append('text')
      .attr('dy', (d) => -(this.nodeConfig[d.type]?.radius || 10) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#444')
      .text((d) => {
        const name = d.name;
        return name.length > 25 ? name.substring(0, 22) + '...' : name;
      });

    // Hover / Click interactions
    node
      .on('mouseover', (event: MouseEvent, d: GraphNode) => {
        const typeLabels: Record<string, string> = {
          risk: 'Risco',
          control: 'Controle',
          action_plan: 'Plano de Acao',
        };
        let html = `<strong>${typeLabels[d.type] || d.type}</strong><br/>${d.name}`;
        if (d.severity) html += `<br/>Severidade: ${d.severity}`;
        if (d.status) html += `<br/>Status: ${d.status}`;
        tooltip
          .html(html)
          .style('left', event.offsetX + 15 + 'px')
          .style('top', event.offsetY - 10 + 'px')
          .style('opacity', '1');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', '0');
      })
      .on('click', (_event: MouseEvent, d: GraphNode) => {
        // Highlight connected nodes
        const connectedIds = new Set<string>();
        connectedIds.add(d.id);
        resolvedLinks.forEach((l) => {
          const src = (l.source as GraphNode).id;
          const tgt = (l.target as GraphNode).id;
          if (src === d.id) connectedIds.add(tgt);
          if (tgt === d.id) connectedIds.add(src);
        });

        node
          .select('circle')
          .attr('opacity', (n: any) => (connectedIds.has(n.id) ? 1 : 0.2));
        node
          .select('text')
          .attr('opacity', (n: any) => (connectedIds.has(n.id) ? 1 : 0.2));
        link.attr('stroke-opacity', (l: any) => {
          const src = (l.source as GraphNode).id;
          const tgt = (l.target as GraphNode).id;
          return connectedIds.has(src) && connectedIds.has(tgt) ? 0.8 : 0.05;
        });
      });

    // Double-click to reset
    svg.on('dblclick.reset', () => {
      node.select('circle').attr('opacity', 1);
      node.select('text').attr('opacity', 1);
      link.attr('stroke-opacity', 0.6);
    });

    // Simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }
}
