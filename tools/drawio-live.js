// Run in the draw.io page with any browser tool that can execute JS there.
// Edits go through the model, so they can be undone and draw.io autosaves them as usual.

// 1. Grab the graph. draw.io exposes no global, so catch it via getModel.
//    If this finds nothing (compact UI), hook several mxGraph.prototype methods
//    (getModel, getView, isEnabled, fireMouseEvent), do ONE real click on empty
//    canvas, then restore them.
const orig = mxGraph.prototype.getModel;
window.__graphs = new Set();
mxGraph.prototype.getModel = function () { window.__graphs.add(this); return orig.apply(this, arguments); };
document.querySelector('.geDiagramContainer')
  .dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 700, clientY: 300 }));
await new Promise(r => setTimeout(r, 500));
mxGraph.prototype.getModel = orig;
const g = [...window.__graphs][0];
const m = g.model;

// 2. Helpers.
const cells = () => Object.values(m.cells);
const byText = t => cells().find(c => typeof c.value === 'string' && c.value.includes(t));
const DASHED = t => `<span style="text-decoration-line:underline;text-decoration-style:dashed;">${t}</span>`;

// Stack every entity's attributes in a column to its right, with keys first.
function columnLayout({ gap = 40, row = 44, h = 38 } = {}) {
  const isAttr = c => c && c.vertex && String(c.style).startsWith('ellipse');
  const ents = cells().filter(c => c.vertex && !isAttr(c) &&
    cells().some(e => e.edge && (e.source === c || e.target === c) && isAttr(e.source === c ? e.target : e.source)));
  m.beginUpdate();
  try {
    for (const ent of ents) {
      const eg = ent.geometry;
      const edges = cells().filter(e => e.edge && (e.source === ent || e.target === ent));
      const attrs = edges.map(e => e.source === ent ? e.target : e.source).filter(isAttr);
      attrs.sort((a, b) => /underline|<u>/.test(b.value) - /underline|<u>/.test(a.value));
      const w = Math.max(...attrs.map(a => a.geometry.width));
      const top = eg.y + eg.height / 2 - (attrs.length * row - (row - h)) / 2;
      attrs.forEach((a, i) => {
        const ng = a.geometry.clone();
        Object.assign(ng, { x: eg.x + eg.width + gap, y: Math.round(top + i * row), width: w, height: h });
        m.setGeometry(a, ng);
      });
      edges.forEach(e => m.setStyle(e, 'edgeStyle=none;endArrow=none;startArrow=none;'));
    }
  } finally { m.endUpdate(); }
}

// FORMAT mode: layout and line style only; relationships are never changed.
// Normalizes attribute columns (40px gap, kept on
// their current side), centers each diamond between its two entities, and makes
// every edge straight with no arrowheads (shape=link kept for total participation).
// Returns 'relationships unchanged' or 'CHANGED'. If it says CHANGED, undo.
function formatPass({ gap = 40, row = 44, h = 38 } = {}) {
  const isAttr = c => c && c.vertex && String(c.style).startsWith('ellipse');
  const isRel = c => c && c.vertex && String(c.style).includes('rhombus');
  const ctr = c => ({ x: c.geometry.x + c.geometry.width / 2, y: c.geometry.y + c.geometry.height / 2 });
  const sig = () => cells().filter(c => c.edge).map(e => [e.source?.id, e.target?.id, /shape=link/.test(e.style)].join()).sort().join('|');
  const attrsOf = ent => cells().filter(e => e.edge && (e.source === ent || e.target === ent))
    .map(e => e.source === ent ? e.target : e.source).filter(isAttr);
  const before = sig();
  m.beginUpdate();
  try {
    const ents = cells().filter(c => c.vertex && attrsOf(c).length);
    for (const ent of ents) {
      const eg = ent.geometry, as = attrsOf(ent).sort((a, b) => a.geometry.y - b.geometry.y);
      const left = as[0].geometry.x < eg.x, w = Math.max(...as.map(a => a.geometry.width));
      const top = eg.y + eg.height / 2 - (as.length * row - (row - h)) / 2;
      as.forEach((a, i) => { const ng = a.geometry.clone();
        Object.assign(ng, { width: w, height: h, x: left ? eg.x - gap - w : eg.x + eg.width + gap, y: Math.round(top + i * row) });
        m.setGeometry(a, ng); });
    }
    for (const r of cells().filter(isRel)) {
      const ends = cells().filter(e => e.edge && (e.source === r || e.target === r)).map(e => e.source === r ? e.target : e.source);
      if (ends.length !== 2) continue;
      const a = ctr(ends[0]), b = ctr(ends[1]), ng = r.geometry.clone();
      ng.x = Math.round((a.x + b.x) / 2 - ng.width / 2); ng.y = Math.round((a.y + b.y) / 2 - ng.height / 2);
      m.setGeometry(r, ng);
    }
    for (const e of cells().filter(c => c.edge)) {
      m.setStyle(e, 'edgeStyle=none;html=1;endArrow=none;startArrow=none;' + (/shape=link/.test(e.style) ? 'shape=link;' : ''));
      const ng = e.geometry.clone(); ng.points = null; m.setGeometry(e, ng);
    }
  } finally { m.endUpdate(); }
  return before === sig() ? 'relationships unchanged' : 'CHANGED';
}
// Before formatPass, aligning entity centers (moving an entity with its attribute
// column) turns diagonal relationship lines horizontal or vertical. That's a manual step.

// Export the current XML as a browser download (usually ~/Downloads/<name>).
function downloadXml(name) {
  const xml = '<mxfile host="app.diagrams.net"><diagram name="Page-1">' +
    mxUtils.getPrettyXml(new mxCodec().encode(m)) + '</diagram></mxfile>';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([xml], { type: 'text/plain' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

// REVIEW helper: plain-text summary of the diagram's structure, with keys marked,
// relationship edges with their 1/N labels, and double lines. It returns no '=' or ';',
// which keeps browser-tool output filters from blocking it.
function describe() {
  const strip = v => String(v ?? '').replace(/<[^>]+>/g, '').trim();
  const isAttr = c => String(c?.style).startsWith('ellipse');
  const name = c => strip(c?.value) || (c?.vertex ? 'OUTERBOX' : '?');
  const out = [];
  for (const c of cells().filter(c => c.vertex && !/edgeLabel/.test(c.style))) {
    if (isAttr(c)) out.push('ATTR ' + name(c) + (/<u>/.test(c.value) ? ' PK' : /dashed/.test(c.value) ? ' PARTIAL' : ''));
    else out.push((/rhombus/.test(c.style) ? 'DIAMOND ' : 'BOX ') + name(c) + (/double=1/.test(c.style) ? ' DOUBLE' : ''));
  }
  for (const e of cells().filter(c => c.edge && !isAttr(c.source) && !isAttr(c.target)))
    out.push(`REL ${name(e.source)} -- ${name(e.target)} [${e.getChildCount() ? strip(e.getChildAt(0).value) : strip(e.value) || '-'}]` +
      (/shape=link/.test(e.style) ? ' DOUBLE' : ''));
  return out.join('\n');
}

// Examples:
// m.setValue(byText('item_number'), DASHED('item_number'));
// columnLayout();
// describe();   // review input
// formatPass();
// downloadXml('diagram.drawio');
