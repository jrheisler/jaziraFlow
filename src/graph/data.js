export const nodes = [
  { id: 'n1', label: 'Start', w: 120, h: 48 },
  { id: 'n2', label: 'Task A', w: 120, h: 48 },
  { id: 'n3', label: 'Decision', w: 120, h: 48 },
  { id: 'n4', label: 'Task B', w: 120, h: 48 },
  { id: 'n5', label: 'End', w: 120, h: 48 },
];

export const links = [
  { id: 'e1', source: 'n1', target: 'n2' },
  { id: 'e2', source: 'n2', target: 'n3' },
  { id: 'e3', source: 'n3', target: 'n4' },
  { id: 'e4', source: 'n4', target: 'n5' },
];
