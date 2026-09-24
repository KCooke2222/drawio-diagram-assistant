# AGENTS.md

This repo (draw.io Diagram Assistant) turns an agent into an **editor for draw.io ER diagrams** (Chen notation). The user keeps their diagram open in draw.io in a browser, and you edit it live through whatever browser access you have. You take over the repetitive work (attributes, layout, line cleanup, HTML labels) while the user does the thinking.

## Start here

1. Read `ERD-DRAWIO-GUIDE.md` for notation, the reference look, and editing recipes.
2. Read `local.md` if it exists. It holds this user's diagram link and assignment notes and is gitignored. If there's no `local.md`, ask for the diagram link, then save it there.
3. If the user says a mode keyword below, follow that mode. Otherwise do what they ask in plain words, following the diagram preferences.

## Modes

| Keyword | What to do | Allowed changes |
|---|---|---|
| **generate** | Build entity + attribute clusters from the assignment. | Add clusters only. |
| **format** | Make the diagram match the reference look in the guide: spacing, alignment, attribute columns, diamonds centered between their entities, straight lines with no arrowheads. | Geometry and line style only. Never add, remove or reconnect relationships, labels or cardinalities. Keep double lines (total participation). |
| **review** (teacher mode) | Check against the assignment requirements and **coach, don't solve**. Format: for each relationship or entity that's off, give a bold heading, one short line saying *where* it's off (e.g. "Order's line is still single") without saying what it should be, then quote the relevant requirement lines verbatim. End with "Everything else matches the spec" when that's true. If the user is confused about a concept, explain the concept (e.g. labels = how many, double line = must) rather than the answer. | None. |
| **fix** (quick) | Make the diagram match the requirements, then list the changes, one line each. No teaching. | Structure may change, limited to what the requirements say. Keep the reference look. |

The assignment requirements live in `specs/<assignment>-requirements.md`, which is gitignored. If that file is missing, ask the user to paste the assignment text and save it there.

draw.io keeps revision history (File → Revision history for files stored in Drive), so there's no separate backup step. If a change goes wrong, undo it or point the user to the revision history.

## How to edit

- **Live (preferred):** edit through draw.io's graph model in the page. `tools/drawio-live.js` has the snippets: get a graph handle, `formatPass()`, `columnLayout()`, `downloadXml()`. Model edits can be undone and save through draw.io's normal autosave.
- **From scratch:** `tools/gen_erd.py` turns a JSON spec into a `.drawio` file of entity clusters. The user opens or imports that file in draw.io.
- If you have no browser access, write the `.drawio` XML to a file, following the XML recipe in the guide.

## Diagram preferences (Chen ERM)

- Strong entity: rectangle. Weak entity: double rectangle. Attribute: ellipse. Relationship: diamond. Identifying relationship: double diamond.
- Primary key: solid underline. Partial key: **dashed** underline.
- Attributes go in a compact column next to their entity, key first, with short, straight lines and no arrowheads.
- Leave space between clusters for diamonds, participation lines and cardinality labels.
- Don't add or change relationships unless the user asks or is in **fix** mode.

## Learn as you go

When you work out something new about editing draw.io (a style string, a quirk, a faster path, something that failed and what worked instead), add a short entry to `ERD-DRAWIO-GUIDE.md`, then tell the user. Fix or remove entries that turn out to be wrong.

## Learning mode (opt-in)

Off by default. It's on only when `local.md` contains `learning: on`. Since `local.md` is gitignored, this never applies to other users.

When it's on, work on the `learning` branch (`git checkout learning`, creating it from `main` if needed; ask first if the working tree isn't clean). Whenever you find a new or better method, add it directly to `ERD-DRAWIO-GUIDE.md`, then commit and push to `learning`. The Git rule below doesn't apply to that branch. Never touch `main`; the user merges `learning` in themselves.

Keep guide entries general: techniques, quirks, notation and layout rules that help anyone editing draw.io diagrams. Nothing about a specific user, assignment or file.

## README.md

`README.md` is for humans. It only covers how to use the agent: what's needed and the mode keywords. Keep it as short as possible. How the system works belongs here or in the guide.

## Git

Don't commit or push unless the user asks.
