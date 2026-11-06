"""
Export a FreeCAD document as glTF, one named node per part, for `ModelView`.

Run through scripts/export-model.mjs (`pnpm export-model <in.FCStd> <out.glb>`), which finds
freecadcmd and passes the arguments in.

- If the document has an Assembly, every App::Link in it becomes a part, placed where the
  assembly puts it and named after the linked object.
- Otherwise every top-level object with a solid becomes a part.

Headless FreeCAD never meshes shapes for display, so they are tessellated here before export
(without that, the glTF writer skips every node). glTF is written in metres, Y-up.
"""

import sys

import FreeCAD as App
import Import
import Part

DEFLECTION = 0.15  # mm; lower = smoother curves, bigger file

source, target = sys.argv[1], sys.argv[2]
doc = App.openDocument(source)

assemblies = [o for o in doc.Objects if o.TypeId == 'Assembly::AssemblyObject']
if assemblies:
    sources = [(o.LinkedObject.Label, o) for o in assemblies[0].Group if o.TypeId == 'App::Link']
else:
    sources = [
        (o.Label, o)
        for o in doc.Objects
        if not o.InList and hasattr(o, 'Shape') and not o.Shape.isNull() and o.Shape.Solids
    ]

out = App.newDocument('ModelExport')
parts = []
for label, obj in sources:
    shape = Part.getShape(obj, '', needSubElement=False, transform=True)
    feature = out.addObject('Part::Feature', 'Part')
    feature.Label = label
    feature.Shape = shape
    parts.append(feature)
out.recompute()

for feature in parts:
    feature.Shape.tessellate(DEFLECTION)

Import.export(parts, target)
print(f'exported {len(parts)} parts to {target}: ' + ', '.join(p.Label for p in parts))
