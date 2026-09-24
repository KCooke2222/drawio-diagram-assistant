# draw.io Diagram Assistant

A chat-based assistant for editing draw.io ER diagrams (Chen notation). You draw the parts that take thought. The agent handles the repetitive work: adding attributes, moving entities, straightening lines and removing arrowheads, and cleaning up spacing. It can also make labels draw.io's menus don't have, like dashed or double underlines, using HTML.

**Needs:** a coding agent (e.g. Claude Code) that can control your browser, such as the Claude in Chrome extension or any browser MCP.

**Use:** open your diagram in draw.io, run the agent in this repo, and tell it one of these:

| Say | It does |
|---|---|
| **generate** | Builds the entity + attribute clusters from the assignment |
| **format** | Cleans up spacing and makes all lines straight. Leaves relationships alone. |
| **review** | Teacher mode. Hints at what's wrong without giving the answer. Changes nothing. |
| **fix** | Quickly fixes the diagram to match the assignment |

Or just ask in plain words ("make item_number a dashed underline", "move Driver above Order").

Made a mistake? Undo, or restore from draw.io's revision history (File → Revision history).
