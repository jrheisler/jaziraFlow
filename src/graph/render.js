import * as d3 from 'd3';
import { dragended, dragged, dragstarted } from './simulation.js';

export function render(sim, svg, nodes, links, onNodeClick) {
  const gLinks = svg.select('g.links');
  const gNodes = svg.select('g.nodes');

  const linkSel = gLinks.selectAll('path.link').data(links, (d) => d.id);
  linkSel.exit().remove();
  linkSel
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('marker-end', 'url(#arrow)');

  const nodeSel = gNodes.selectAll('g.node').data(nodes, (d) => d.id);
  nodeSel.exit().remove();

  const nodeEnter = nodeSel.enter().append('g').attr('class', 'node');

  nodeEnter
    .append('rect')
    .attr('rx', 12)
    .attr('ry', 12)
    .attr('width', (d) => d.w)
    .attr('height', (d) => d.h)
    .attr('x', (d) => -d.w / 2)
    .attr('y', (d) => -d.h / 2);

  nodeEnter
    .append('text')
    .attr('class', 'label')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .text((d) => d.label);

  nodeEnter
    .append('circle')
    .attr('class', 'port port-left')
    .attr('r', 5)
    .attr('cx', (d) => -d.w / 2)
    .attr('cy', 0);

  nodeEnter
    .append('circle')
    .attr('class', 'port port-right')
    .attr('r', 5)
    .attr('cx', (d) => d.w / 2)
    .attr('cy', 0);

  const dragBehavior = d3
    .drag()
    .on('start', (event, d) => dragstarted(sim, event, d))
    .on('drag', (event, d) => dragged(sim, event, d))
    .on('end', (event, d) => dragended(sim, event, d));

  const mergedNodes = nodeEnter.merge(nodeSel);
  mergedNodes.call(dragBehavior);
  if (onNodeClick) {
    mergedNodes.on('click', onNodeClick);
  }
}
