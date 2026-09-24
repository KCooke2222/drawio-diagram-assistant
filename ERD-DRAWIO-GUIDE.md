# draw.io ER diagram guide (Chen notation)

Knowledge bank for editing and generating ER diagrams in draw.io. It grows as agents learn.

## Notation

| Concept | Shape / label |
|---|---|
| Strong entity | Plain rectangle, bold name |
| Weak entity (e.g. `Menu_Item`) | Double rectangle: outer box + slightly smaller inner box |
| Attribute | Ellipse |
| Primary key | Solid underline |
| Partial key of weak entity (e.g. `item_number`) | **Dashed** underline, not a double underline |
| Attribute link | Short, straight line with no arrowheads |
| Relationship | Diamond, added after entity clusters are placed |

## Layout rules

- Stack each entity's attributes in a **compact column right next to it**, key attribute first. Use a 44px row pitch and give every ellipse the same width. (`tools/gen_erd.py` and `columnLayout()` both do this.)
- Keep attribute lines short and straight.
- Leave open space between entity clusters for relationship diamonds, participation lines and cardinality labels.
- Add relationships and cardinality/participation only after the clusters are placed.

## Reference look: match this

This is the approved look for spacing and style. Make every diagram you create or clean up look like this:

| Element | Size | Style |
|---|---|---|
| Strong entity | 110x45 | `whiteSpace=wrap;html=1;aspect=fixed;fontStyle=1;align=center;` |
| Weak entity outer box | 134x69 (inner + 8 on each side) | `whiteSpace=wrap;html=1;aspect=fixed;fillColor=none;strokeWidth=1;` |
| Weak entity inner box | 118x53 | `whiteSpace=wrap;html=1;aspect=fixed;fillColor=none;fontStyle=1;align=center;` |
| Relationship diamond | 80x80 | `rhombus;whiteSpace=wrap;html=1;shapeInside=1;` |
| Attribute | 38 tall; one width per entity (about 120–130) | `ellipse;whiteSpace=wrap;html=1;shapeInside=1;` |
| Every line | n/a | `edgeStyle=none;html=1;endArrow=none;startArrow=none;` |
| Total participation line | n/a | the same, plus `shape=link;` (draws a double line) |
| Cardinality (1/N) | n/a | a child `edgeLabel` cell on the relationship edge, near the middle of the line |

Layout:
- The most connected entity goes in the middle as the hub, and the other entities sit around it.
- Each diamond sits exactly halfway between its two entities. Where possible, entity centers share an x or y value so relationship lines run straight across or down.
- Attribute columns sit on the **outer side** of the entity, away from the hub (entities left of the hub get their column on the left). The gap is 40px, the row pitch 44px, the key attribute comes first, and the column is centered on the entity.
- Clusters are about 380px apart horizontally and about 320px vertically, which leaves room for diamonds and labels.

## XML recipe

Skeleton:

```xml
<mxfile><diagram><mxGraphModel><root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>
  ...
</root></mxGraphModel></diagram></mxfile>
```

- Node: `<mxCell id=".." vertex="1" parent="1" value=".." style=".."><mxGeometry x="" y="" width="" height="" as="geometry"/></mxCell>`
- Edge: `<mxCell id=".." edge="1" parent="1" source="ID" target="ID" style=".."><mxGeometry relative="1" as="geometry"/></mxCell>`

Styles:

```text
Strong entity   whiteSpace=wrap;html=1;aspect=fixed;fontStyle=1;align=center;
Weak outer box  whiteSpace=wrap;html=1;aspect=fixed;fillColor=none;strokeWidth=1;
Weak inner box  whiteSpace=wrap;html=1;aspect=fixed;fillColor=none;fontStyle=1;align=center;
                (inner = outer inset by 8px on each side, e.g. outer 134x69, inner 118x53)
Attribute       ellipse;whiteSpace=wrap;html=1;shapeInside=1;
Attribute line  edgeStyle=none;endArrow=none;startArrow=none;
```

Labels (XML-escaped in the `value` attribute):

```text
Primary key   value="&lt;u&gt;customer_ID&lt;/u&gt;"
Partial key   value="&lt;span style=&quot;text-decoration-line:underline;text-decoration-style:dashed;&quot;&gt;item_number&lt;/span&gt;"
```

If the dashed HTML underline doesn't render, fall back to a short dashed line shape under the text inside the ellipse.

## Generation rules

- Output valid, editable `.drawio` XML.
- Create entity clusters only. Don't create connectors between entities unless the user asks.

## Live edit in the browser (verified)

1. The diagram is open in draw.io (for a Drive file: `https://app.diagrams.net/#G<driveFileId>`). draw.io autosaves back to wherever the file lives.
2. draw.io has no global `ui` object. Get the graph by briefly wrapping `mxGraph.prototype.getModel`, then firing a mousemove on the canvas:
   ```js
   const orig = mxGraph.prototype.getModel; window.__graphs = new Set();
   mxGraph.prototype.getModel = function(){ window.__graphs.add(this); return orig.apply(this, arguments); };
   document.querySelector('.geDiagramContainer').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:700,clientY:300}));
   await new Promise(r=>setTimeout(r,500)); mxGraph.prototype.getModel = orig;
   const g = [...window.__graphs][0];
   ```
3. Edit through the model so the change is undoable and autosaves. For example:
   ```js
   const cell = Object.values(g.model.cells).find(c => String(c.value).includes('item_number'));
   g.model.setValue(cell, '<span style="text-decoration-line:underline;text-decoration-style:dashed;">item_number</span>');
   ```
   In the live model, values are raw HTML, not XML-escaped. Use `g.model.setStyle(cell, ...)`, `g.insertVertex(...)` and `g.insertEdge(...)` for other changes.
4. Wait until the menu bar shows that changes are saved.

## Notes and quirks

- The live diagram in draw.io is the source of truth. Edit it in place rather than uploading new copies. Undo and draw.io's revision history cover mistakes.
- To get the current XML out of the page, use `downloadXml()` in `tools/drawio-live.js`, which saves a file through the browser.
- In the compact draw.io UI (narrow window), a synthetic mousemove doesn't reach getModel. Hook several `mxGraph.prototype` methods, do one real click on empty canvas, then unhook.
- Relationship lines the user draws by hand default to `orthogonalEdgeStyle` with an arrowhead. The format pass rewrites them as `edgeStyle=none;endArrow=none;startArrow=none;`, keeping `shape=link;` where present.
- Cardinality labels (1/N) are child `edgeLabel` cells of the edge, so they move with it. Don't touch them.
- Leave about 200px between clusters for relationship diamonds. The generator's grid cell is 420x300.
- Google Drive connectors (where available) can't overwrite a file's contents, only rename, move or copy it. Edit live instead.

### Claude in Chrome specifics
- Tool output hides raw XML **and** base64 ("BLOCKED"). JS should return short plain text (counts, OK/CHANGED), never file contents.
- Chrome allows one automatic download per page, then silently blocks more until the user allows "multiple downloads" for app.diagrams.net (address bar icon).
- The glowing cursor in the tab is the extension's agent overlay, not part of the diagram. It goes away when the agent's tab group closes.
- If the tab group closes mid-task, reopen the diagram in a new tab.
