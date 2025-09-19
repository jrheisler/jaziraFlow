import './styles.css';
import * as d3 from 'd3';

const svg = d3.select('#svg');
const width = window.innerWidth - 260;
const height = window.innerHeight;

// Zoom + pan setup
const gRoot = svg.append('g');
const gGrid = gRoot.append('g').attr('class', 'grid');
const gLinks = gRoot.append('g').attr('class', 'links');
const gNodes = gRoot.append('g').attr('class', 'nodes');

svg.call(
  d3.zoom().scaleExtent([0.25, 2.5]).on('zoom', (e) => {
    gRoot.attr('transform', e.transform);
  }),
);

// Subtle grid
const gridStep = 40;
const gridCount = 200;
gGrid
  .selectAll('line.v')
  .data(d3.range(-gridCount, gridCount + 1))
  .enter()
  .append('line')
  .attr('class', 'v')
  .attr('x1', (d) => d * gridStep)
  .attr('y1', -gridCount * gridStep)
  .attr('x2', (d) => d * gridStep)
  .attr('y2', gridCount * gridStep);
gGrid
  .selectAll('line.h')
  .data(d3.range(-gridCount, gridCount + 1))
  .enter()
  .append('line')
  .attr('class', 'h')
  .attr('x1', -gridCount * gridStep)
  .attr('y1', (d) => d * gridStep)
  .attr('x2', gridCount * gridStep)
  .attr('y2', (d) => d * gridStep);

// Arrowheads
svg
  .append('defs')
  .append('marker')
  .attr('id', 'arrow')
  .attr('viewBox', '0 0 10 10')
  .attr('refX', 10)
  .attr('refY', 5)
  .attr('markerWidth', 7)
  .attr('markerHeight', 7)
  .attr('orient', 'auto-start-reverse')
  .append('path')
  .attr('d', 'M 0 0 L 10 5 L 0 10 z')
  .attr('fill', '#aab1ff');

// Graph data
const nodes = [
  { id: 'n1', label: 'Start', w: 120, h: 48 },
  { id: 'n2', label: 'Task A', w: 120, h: 48 },
  { id: 'n3', label: 'Decision', w: 120, h: 48 },
  { id: 'n4', label: 'Task B', w: 120, h: 48 },
  { id: 'n5', label: 'End', w: 120, h: 48 },
];
const links = [
  { id: 'e1', source: 'n1', target: 'n2' },
  { id: 'e2', source: 'n2', target: 'n3' },
  { id: 'e3', source: 'n3', target: 'n4' },
  { id: 'e4', source: 'n4', target: 'n5' },
];

// Create a simulation
const sim = d3
  .forceSimulation(nodes)
  .force('link', d3.forceLink(links).id((d) => d.id).distance(140).strength(0.8))
  .force('charge', d3.forceManyBody().strength(-600))
  .force('collide', d3.forceCollide().radius((d) => Math.max(d.w, d.h) / 2 + 20))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .on('tick', ticked);

// Pending link creation (click source, then click target)
let pendingSource = null;

// Render
function render() {
  // LINKS
  const linkSel = gLinks.selectAll('path.link').data(links, (d) => d.id);
  linkSel.exit().remove();
  const linkEnter = linkSel
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('marker-end', 'url(#arrow)');
  linkEnter.merge(linkSel);

  // NODES (group)
  const nodeSel = gNodes.selectAll('g.node').data(nodes, (d) => d.id);
  nodeSel.exit().remove();
  const nodeEnter = nodeSel
    .enter()
    .append('g')
    .attr('class', 'node')
    .call(
      d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended),
    )
    .on('click', nodeClicked);

  // Node visuals
  nodeEnter
    .append('rect')
    .attr('rx', 12)
    .attr('ry', 12)
    .attr('width', (d) => d.w)
    .attr('height', (d) => d.h)
    .attr('x', (d) => -d.w / 2)
    .attr('y', (d) => -d.h / 2);

  // Label
  nodeEnter
    .append('text')
    .attr('class', 'label')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .text((d) => d.label);

  // Ports (simple left/right)
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

  nodeEnter.merge(nodeSel);
  ticked();
}

function ticked() {
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

function nodeEdgePoint(node, towards) {
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

function dragstarted(e, d) {
  if (!e.active) sim.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(e, d) {
  d.fx = e.x;
  d.fy = e.y;
}

function dragended(e, d) {
  if (!e.active) sim.alphaTarget(0);
  d.fx = e.x;
  d.fy = e.y;
}

function nodeClicked(e, d) {
  e.stopPropagation();
  if (!pendingSource) {
    pendingSource = d;
    highlightPending(true, d);
  } else if (pendingSource && pendingSource.id !== d.id) {
    const id = `e${Date.now()}`;
    links.push({ id, source: pendingSource.id, target: d.id });
    sim.force('link').links(links);
    pendingSource = null;
    highlightPending(false);
    render();
    sim.alpha(0.3).restart();
  } else {
    pendingSource = null;
    highlightPending(false);
  }
}

function highlightPending(on, node) {
  gNodes
    .selectAll('g.node')
    .classed('selected', (n) => on && n.id === (node?.id ?? null));
  gLinks.selectAll('path.link').classed('pending', on);
}

// Panel controls
document.getElementById('addNodeBtn').onclick = () => {
  const id = `n${Date.now()}`;
  nodes.push({
    id,
    label: `Node ${nodes.length + 1}`,
    w: 120,
    h: 48,
    x: Math.random() * 400 - 200,
    y: Math.random() * 200 - 100,
    fx: null,
    fy: null,
  });
  sim.nodes(nodes);
  render();
  sim.alpha(0.4).restart();
};

document.getElementById('randomizeBtn').onclick = () => {
  nodes.forEach((n) => {
    n.fx = null;
    n.fy = null;
    n.vx = (Math.random() - 0.5) * 10;
    n.vy = (Math.random() - 0.5) * 10;
  });
  sim.alpha(0.9).restart();
};

document.getElementById('stabilizeBtn').onclick = () => {
  for (let i = 0; i < 60; i += 1) sim.tick();
  sim.alpha(0);
  ticked();
};

document.getElementById('exportBtn').onclick = () => {
  const data = {
    nodes: nodes.map(({ id, label, w, h, x, y, fx, fy }) => ({ id, label, w, h, x, y, fx, fy })),
    links: links.map(({ id, source, target }) => ({
      id,
      source: typeof source === 'object' ? source.id : source,
      target: typeof target === 'object' ? target.id : target,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'graph.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

document.getElementById('importInput').onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const json = JSON.parse(await file.text());
  nodes.length = 0;
  links.length = 0;
  nodes.push(...json.nodes);
  links.push(...json.links);
  sim.nodes(nodes);
  sim.force('link').links(links);
  render();
  sim.alpha(0.4).restart();
  e.target.value = '';
};

render();
