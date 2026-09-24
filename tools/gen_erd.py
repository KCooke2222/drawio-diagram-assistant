#!/usr/bin/env python3
"""Generate a Chen-notation .drawio file of entity clusters from a JSON spec.

Usage: python3 tools/gen_erd.py specs/<name>.json diagrams/<name>.drawio

Spec format:
  {"entities": [
     {"name": "Customer", "pos": [0, 0],
      "attrs": ["*customer_ID", "name", "email"]},
     {"name": "Menu_Item", "weak": true, "pos": [1, 1],
      "attrs": ["~item_number", "price"]}]}
  "*attr" = primary key (solid underline), "~attr" = partial key (dashed underline).
  "pos" = [col, row] in the cluster grid.

Only entity clusters are drawn. Relationships are added by hand in draw.io.
"""
import json
import sys
from html import escape

# Layout constants. Change them here and record the change in ERD-DRAWIO-GUIDE.md.
ENT_W, ENT_H = 110, 45
WEAK_PAD = 8          # outer box inset for weak entities
ATTR_H, ROW = 38, 44  # ellipse height, vertical pitch
ATTR_GAP = 40         # entity edge -> attribute column
CELL_W, CELL_H = 420, 300  # grid cell size per cluster (leaves room for diamonds)
ORIGIN = (40, 40)

S_ENT = "whiteSpace=wrap;html=1;aspect=fixed;fontStyle=1;align=center;"
S_WEAK_OUTER = "whiteSpace=wrap;html=1;aspect=fixed;fillColor=none;strokeWidth=1;"
S_WEAK_INNER = "whiteSpace=wrap;html=1;aspect=fixed;fillColor=none;fontStyle=1;align=center;"
S_ATTR = "ellipse;whiteSpace=wrap;html=1;shapeInside=1;"
S_LINE = "edgeStyle=none;html=1;endArrow=none;startArrow=none;"
S_REL = "rhombus;whiteSpace=wrap;html=1;shapeInside=1;"  # 80x80, for relationships
S_ID_REL = "rhombus;double=1;whiteSpace=wrap;html=1;shapeInside=1;"  # identifying relationship

PK = "<u>{}</u>"
PARTIAL = '<span style="text-decoration-line:underline;text-decoration-style:dashed;">{}</span>'


def label(attr):
    if attr.startswith("*"):
        return PK.format(attr[1:])
    if attr.startswith("~"):
        return PARTIAL.format(attr[1:])
    return attr


def attr_width(attr):
    return max(85, 8 * len(attr.lstrip("*~")) + 30)


def build(spec):
    cells, n = [], [0]

    def nid():
        n[0] += 1
        return f"c{n[0]}"

    def vertex(value, style, x, y, w, h):
        i = nid()
        cells.append(
            f'<mxCell id="{i}" value="{escape(value)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return i

    def edge(src, dst):
        cells.append(
            f'<mxCell id="{nid()}" style="{S_LINE}" edge="1" parent="1" source="{src}" target="{dst}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    for ent in spec["entities"]:
        col, row = ent["pos"]
        attrs = ent.get("attrs", [])
        # Key attributes first.
        attrs = sorted(attrs, key=lambda a: not a.startswith(("*", "~")))
        block_h = max(ENT_H, len(attrs) * ROW - (ROW - ATTR_H))
        ex = ORIGIN[0] + col * CELL_W
        ey = ORIGIN[1] + row * CELL_H + (block_h - ENT_H) / 2

        if ent.get("weak"):
            anchor = vertex("", S_WEAK_OUTER, ex - WEAK_PAD, ey - WEAK_PAD,
                            ENT_W + 2 * WEAK_PAD, ENT_H + 2 * WEAK_PAD)
            vertex(ent["name"], S_WEAK_INNER, ex, ey, ENT_W, ENT_H)
            right = ex + ENT_W + WEAK_PAD
        else:
            anchor = vertex(ent["name"], S_ENT, ex, ey, ENT_W, ENT_H)
            right = ex + ENT_W

        aw = max((attr_width(a) for a in attrs), default=0)
        top = ey + ENT_H / 2 - (len(attrs) * ROW - (ROW - ATTR_H)) / 2
        for k, a in enumerate(attrs):
            aid = vertex(label(a), S_ATTR, right + ATTR_GAP, top + k * ROW, aw, ATTR_H)
            edge(anchor, aid)

    body = "".join(cells)
    return (
        '<mxfile host="app.diagrams.net"><diagram name="Page-1" id="erd">'
        '<mxGraphModel grid="1" gridSize="10" guides="1" connect="1" page="1" pageScale="1">'
        f'<root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root>'
        "</mxGraphModel></diagram></mxfile>\n"
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    with open(sys.argv[1]) as f:
        spec = json.load(f)
    with open(sys.argv[2], "w") as f:
        f.write(build(spec))
    print(f"wrote {sys.argv[2]}")
