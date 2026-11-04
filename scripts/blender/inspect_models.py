# Prints each model's size and object tree after import. Read-only: saves nothing.
import bpy, os, sys
from mathutils import Vector
FOLDER = sys.argv[sys.argv.index('--') + 1]
for name in sorted(os.listdir(FOLDER)):
    if not name.endswith('.glb'):
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(FOLDER, name))
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(min(a, b) for a, b in zip(lo, w)); hi = Vector(max(a, b) for a, b in zip(hi, w))
    print(f"\n## {name} objects={len(bpy.context.scene.objects)} meshes={len(meshes)} size={tuple(round(v, 3) for v in hi - lo)} min={tuple(round(v, 3) for v in lo)} actions={[a.name for a in bpy.data.actions][:30]}")
    for o in meshes[:60]:
        d = o.dimensions
        loc = o.matrix_world.translation
        print(f"  {o.name[:52]:52} dim=({d.x:.3f},{d.y:.3f},{d.z:.3f}) at=({loc.x:.2f},{loc.y:.2f},{loc.z:.2f}) parent={o.parent.name[:26] if o.parent else None}")
