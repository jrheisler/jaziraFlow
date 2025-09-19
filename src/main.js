import './styles.css';
import * as d3 from 'd3';
import { links, nodes } from './graph/data.js';
import { createSimulation, ticked as tickedHelper } from './graph/simulation.js';
import { render } from './graph/render.js';
import { registerControls } from './panel/controls.js';

window.addEventListener('DOMContentLoaded', () => {
  const svg = d3.select('#svg');
  const width = window.innerWidth - 260;
  const height = window.innerHeight;

  const gRoot = svg.append('g');
  const gGrid = gRoot.append('g').attr('class', 'grid');
  gRoot.append('g').attr('class', 'links');
  gRoot.append('g').attr('class', 'nodes');

  svg.call(
    d3.zoom().scaleExtent([0.25, 2.5]).on('zoom', (event) => {
      gRoot.attr('transform', event.transform);
    }),
  );

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

  const gLinks = svg.select('g.links');
  const gNodes = svg.select('g.nodes');

  const tick = () => tickedHelper(gNodes, gLinks);
  const sim = createSimulation(nodes, links, width, height, tick);

  let pendingSource = null;

  function highlightPending(on, node) {
    gNodes
      .selectAll('g.node')
      .classed('selected', (n) => on && n.id === (node?.id ?? null));
    gLinks.selectAll('path.link').classed('pending', on);
  }

  function nodeClicked(event, node) {
    event.stopPropagation();
    if (!pendingSource) {
      pendingSource = node;
      highlightPending(true, node);
    } else if (pendingSource && pendingSource.id !== node.id) {
      const id = `e${Date.now()}`;
      links.push({ id, source: pendingSource.id, target: node.id });
      sim.force('link').links(links);
      pendingSource = null;
      highlightPending(false);
      rerender();
      sim.alpha(0.3).restart();
    } else {
      pendingSource = null;
      highlightPending(false);
    }
  }

  function rerender() {
    render(sim, svg, nodes, links, nodeClicked);
    tick();
  }

  rerender();

  registerControls({
    nodes,
    links,
    sim,
    rerender,
    importInput: document.getElementById('importInput'),
    addNodeButton: document.getElementById('addNodeBtn'),
    randomizeButton: document.getElementById('randomizeBtn'),
    stabilizeButton: document.getElementById('stabilizeBtn'),
    exportButton: document.getElementById('exportBtn'),
  });

  svg.on('click', () => {
    pendingSource = null;
    highlightPending(false);
  });
});
