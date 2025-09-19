export function registerControls({
  nodes,
  links,
  sim,
  rerender,
  importInput,
  addNodeButton,
  randomizeButton,
  stabilizeButton,
  exportButton,
}) {
  addNodeButton.addEventListener('click', () => {
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
    rerender();
    sim.alpha(0.4).restart();
  });

  randomizeButton.addEventListener('click', () => {
    nodes.forEach((node) => {
      node.fx = null;
      node.fy = null;
      node.vx = (Math.random() - 0.5) * 10;
      node.vy = (Math.random() - 0.5) * 10;
    });
    sim.alpha(0.9).restart();
  });

  stabilizeButton.addEventListener('click', () => {
    for (let i = 0; i < 60; i += 1) {
      sim.tick();
    }
    sim.alpha(0);
    rerender();
  });

  exportButton.addEventListener('click', () => {
    const data = {
      nodes: nodes.map(({ id, label, w, h, x, y, fx, fy }) => ({ id, label, w, h, x, y, fx, fy })),
      links: links.map(({ id, source, target }) => ({
        id,
        source: typeof source === 'object' ? source.id : source,
        target: typeof target === 'object' ? target.id : target,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'graph.json';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  });

  importInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const json = JSON.parse(await file.text());
    nodes.length = 0;
    links.length = 0;
    nodes.push(...json.nodes);
    links.push(...json.links);
    sim.nodes(nodes);
    sim.force('link').links(links);
    rerender();
    sim.alpha(0.4).restart();
    event.target.value = '';
  });
}
