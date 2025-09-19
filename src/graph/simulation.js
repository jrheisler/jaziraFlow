import * as d3 from 'd3';

export function createSimulation(nodes, links, width, height, ticked) {
  return d3
    .forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d) => d.id).distance(140).strength(0.8))
    .force('charge', d3.forceManyBody().strength(-600))
    .force('collide', d3.forceCollide().radius((d) => Math.max(d.w, d.h) / 2 + 20))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked);
}

export function nodeEdgePoint(node, towards) {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const dx = (towards.x ?? 0) - x;
  const dy = (towards.y ?? 0) - y;
  const hw = (node.w ?? 120) / 2;
  const hh = (node.h ?? 48) / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx / hw > absDy / hh) {
    const sx = dx > 0 ? x + hw : x - hw;
    const sy = y + dy * (hw / absDx);
    return { x: sx, y: sy };
  }
  const sy = dy > 0 ? y + hh : y - hh;
  const sx = x + dx * (hh / absDy);
  return { x: sx, y: sy };
}

export function ticked(gNodes, gLinks) {
  gNodes
    .selectAll('g.node')
    .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);

  gLinks.selectAll('path.link').attr('d', (d) => {
    const s = nodeEdgePoint(d.source, d.target);
    const t = nodeEdgePoint(d.target, d.source);
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const c1x = s.x + dx / 3;
    const c1y = s.y;
    const c2x = t.x - dx / 3;
    const c2y = t.y;
    return `M ${s.x},${s.y} C ${c1x},${c1y} ${c2x},${c2y} ${t.x},${t.y}`;
  });
}

export function dragstarted(sim, event, node) {
  if (!event.active) sim.alphaTarget(0.3).restart();
  node.fx = node.x;
  node.fy = node.y;
}

export function dragged(sim, event, node) {
  node.fx = event.x;
  node.fy = event.y;
}

export function dragended(sim, event, node) {
  if (!event.active) sim.alphaTarget(0);
  node.fx = event.x;
  node.fy = event.y;
}
