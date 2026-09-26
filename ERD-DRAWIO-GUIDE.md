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
| (min, max) constraint | A label `(min,max)` on each line, placed next to the entity it describes: how many relationship instances **that entity** takes part in. This is the opposite side from 1/N labels. min 0 = partial, min ≥ 1 = total; use `N` for an unlimited max |

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
| Relationship diamond | 80x80 | `rhombus;whiteSpace=wrap;html=1;` |
| Identifying relationship (double diamond) | 80x80 | `rhombus;double=1;whiteSpace=wrap;html=1;` (verified: renders an inner diamond) |
| Attribute | 38 tall; one width per entity (about 120–130) | `ellipse;whiteSpace=wrap;html=1;` |
| Every line | n/a | `edgeStyle=none;html=1;endArrow=none;startArrow=none;` |
| Total participation line | n/a | the same, plus `shape=link;` (draws a double line) |
| Cardinality (1/N) | n/a | a child `edgeLabel` cell on the relationship edge, near the middle of the line. Chen ratios use only 1 and N/M; a bound like "at most 2" comes from the partial key, not a number label. |

Layout:
- The most connected entity goes in the middle as the hub, and the other entities sit around it.
- Each diamond sits exactly halfway between its two entities. Where possible, entity centers share an x or y value so relationship lines run straight across or down.
- Attribute columns sit on the **outer side** of the entity, away from the hub (entities left of the hub get their column on the left). The gap is 40px, the row pitch 44px, the key attribute comes first, and the column is centered on the entity.
- Clusters are about 380px apart horizontally and about 320px vertically, which leaves room for diamonds and labels.

## EER specialization (verified)

- Circle: `ellipse;whiteSpace=wrap;html=1;aspect=fixed;`, 38x38, labeled `o` (overlap) or `d` (disjoint). Center it under the superclass, halfway down to the subclasses.
- Superclass to circle: a double line (`shape=link;`) for total specialization, a single line for partial.
- Circle to each subclass: a straight line with a **∪ subset symbol** as a child label of the edge, so it moves with the line:
  ```js
  const rot = Math.round(Math.atan2(circleCy - subCy, circleCx - subCx) * 180 / Math.PI + 90); // opening faces the circle
  const s = new mxCell('∪', new mxGeometry(0, 0, 20, 20), `text;html=1;align=center;verticalAlign=middle;fontSize=18;resizable=0;labelBackgroundColor=none;rotation=${rot};`);
  s.vertex = true; s.connectable = false; s.geometry.relative = true; s.geometry.offset = new mxPoint(-10, -10);
  m.add(edge, s);
  ```
  Straighten the edge first (`edgeStyle=none`). The rotation assumes a straight line, so recompute it if you move the circle or a subclass.
- **Even layout for an EER tree:** three columns 320px apart (left subclass chain, center superclass/hub chain, right subclass chain), with rows about 340px apart. Move each entity by its center, taking its outer box, inner box and attributes along, then re-run the column, diamond and line passes and re-aim the ∪ symbols. This worked well for the approved layout.
- A superclass with a subclass tree below it can take its attributes in a **row above** it instead of a column: key first, 12px gaps, the row centered on the entity, 70px above it.

## Export pitfalls (verified)

- **Don't use `shapeInside=1`** on ellipses or diamonds. The editor still fits the text, but the PNG/PDF export pushes a label that doesn't fit the inner area outside the shape (e.g. "Comments" appeared under its diamond). Plain `whiteSpace=wrap` exports correctly.
- **Keep everything at positive coordinates** (≥ 40px margin). Export with Size "Page" clips anything above or left of the page origin. Size "Diagram" avoids that, but it's safer not to place content there.

## Layout tricks (verified)

- **Two diamonds between the same pair of entities** (e.g. Posts and Likes between User and Post): put them on either side of the midpoint, offset about ±70px perpendicular to the line between the entities, so they don't stack.
- **Recursive relationship:** place the diamond about 120px above the entity. Give the two lines distinct ends: `exitX=0.2;exitY=0;exitPerimeter=0` → the diamond's left corner (`entryX=0;entryY=0.5`), and `exitX=0.8` → the right corner (`entryX=1`). Put the relationship attribute above the diamond.
- **Relationship attributes** attach to the diamond. Place them on a side with no lines.
- **Dangling lines** (an endpoint dropped near, not on, a shape) have `source`/`target` null and a `sourcePoint`/`targetPoint`. Attach them with `m.setTerminal(edge, shape, isSource)` before formatting, or they'll float.
- A diamond whose label is longer than about 9 characters: widen it to 110.
- When a pass also adds attribute edges, compare signatures of the relationship edges only, since the new edges change the full edge signature.

## Relational schema tables (verified)

For ER-to-relational mapping, draw one single-row draw.io table per relation, with a bold title above it:
- Table: `shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;fontSize=16;` with a child row `shape=tableRow;horizontal=0;startSize=0;...;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;` and one child cell per column: `shape=partialRectangle;html=1;whiteSpace=wrap;connectable=1;...;fontSize=16;`, 40 tall, width about `max(70, 10*len+24)`.
- Set **`connectable=1`** on the cells. draw.io's default table cells use `connectable=0`, which means foreign-key arrows can only attach to the table's outer edge, not to a specific column.
- Title: `text;html=1;...;align=left;fontSize=16;fontStyle=1;` placed 30px above the table. Stack the tables 130px apart, leaving room at the side for FK arrows.
- Primary key columns: `<u>name</u>`. For a composite key, underline every part.
- Build them with `new mxCell` and `m.add(parent|table|row, cell)` inside one update.
- **FK arrow routing (readable, verified):** Every arrow leaves the bottom of the FK cell and drops into the gap below its table. It then runs left to its own vertical lane left of the tables (lanes 14px apart, shorter spans nearer the tables), goes up to the gap below the target table, runs right, and rises into the bottom of the PK cell. Use `edgeStyle=none` with 4 explicit points, `exitX/entryX` with `exitY=entryY=1` and `*Perimeter=0`, and `endArrow=classic`. FK arrows keep their arrowheads, unlike ER lines. Within a gap, the outgoing segments sit above the incoming ones. Several arrows into one cell get entry points spread 14px apart.
- **Minimizing crossings:** brute-force the side (left or right track) for every arrow, 2^n combinations (fine up to about 12 arrows), times the two spreading orders for entry points. Score each layout by horizontal/vertical segment crossings, adding +5 when two segments run on top of each other, and keep the lowest. On a stack of 8 tables with 9 arrows this took crossings from 16 (all left) to 8.
- **Composite FK:** use one arrow for the pair. Attach it to the first column with `exitX=1` (the boundary between the two columns) and aim it at the boundary between the referenced key columns (`entryX=1` on the first key cell).
- **Reverse mapping (schema → ER):** a table keyed by its own ID becomes a strong entity, and each FK column becomes a 1:N relationship (the FK isn't an ER attribute). A table keyed only by FKs becomes an M:N relationship; its other columns go on the diamond, and two FKs to the same table make a recursive relationship with role labels. A table keyed by an FK plus an extra column becomes a weak entity with a partial key.
- Mapping reminders: a multivalued attribute (double oval) gets its own table (owner key + value, both in the key). A composite attribute becomes its parts. A derived attribute (dashed oval) is dropped. A weak entity's key is the owner key + the partial key. An M:N relationship gets its own table; 1:N adds an FK on the N side.

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
Attribute       ellipse;whiteSpace=wrap;html=1;
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

- For review, read the structure with `describe()` instead of screenshots. A weak entity's outer box shows as `OUTERBOX`, and relationship lines attach to it, not to the inner named box.
- After the graph-hook click, press Escape. The click can select a shape, and a later keypress would then edit it.
- The graph-hook click has to land on empty canvas. In the full UI the left sidebar covers x < ~220, so take a screenshot first and click an empty spot beside the diagram.

- **EditorUi handle** (pages, actions): wrap `EditorUi.prototype` methods (`updateActionStates`, `getCurrentFile`, `isDiagramEmpty`, `updateDocumentTitle`), fire a mousemove on the canvas, and keep the instance whose `editor.graph` is your graph. Cache it as `window.__ui`.
- Pages: `ui.pages`, `ui.currentPage.getName()`. The same graph object shows whichever page is current, so check the current page before editing. Rename silently with `g.model.execute(new RenamePage(ui, page, 'Name'))`. `ui.renamePage()` opens a dialog instead.
- New page: `const p = ui.insertPage(null, ui.pages.length); g.model.execute(new RenamePage(ui, p, 'Name')); ui.selectPage(p);`
- Zoom to fit: `ui.actions.get('fitWindow').funct()`.
- Use `g.getChildCells(g.getDefaultParent())` for "all cells". It covers only the current page, whereas `Object.values(m.cells)` can include stale cells from other pages.
- formatPass leaves an attribute row that sits above its entity alone (the superclass layout) and puts keys first in columns.
- Adding clusters live: `g.insertVertex(parent, null, label, x, y, w, h, style)` and `g.insertEdge(parent, null, '', src, dst, style)` inside one `beginUpdate`/`endUpdate`, so it's a single undo step.

### Chrome DevTools MCP specifics (preferred when available)
- It attaches to the user's real browser, so it's already logged in to Drive. Use `list_pages` to find the draw.io tab, then pass its `pageId` to `evaluate_script`.
- Cache the graph handle as `window.__g`. It survives between calls, so you hook it once per page load.
- In the full UI, synthetic `mousemove`/`pointermove` events on `.geDiagramContainer` are enough to catch the graph. No real click is needed.
- Output isn't filtered: XML and base64 come back as-is, so no download workaround is needed.
- Pass `waitForStableDom: false` for read-only scripts.

### Claude in Chrome specifics
- Tool output hides raw XML **and** base64 ("BLOCKED"). JS should return short plain text (counts, OK/CHANGED), never file contents.
- Chrome allows one automatic download per page, then silently blocks more until the user allows "multiple downloads" for app.diagrams.net (address bar icon).
- The glowing cursor in the tab is the extension's agent overlay, not part of the diagram. It goes away when the agent's tab group closes.
- If the tab group closes mid-task, reopen the diagram in a new tab.
