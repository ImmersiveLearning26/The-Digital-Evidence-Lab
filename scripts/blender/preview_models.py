# Renders each source model from the front and from behind so orientation and ports can be judged.
import bpy, math, os, sys
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:]
FOLDER, OUT = args[0], args[1]
for name in sorted(os.listdir(FOLDER)):
    if not name.endswith('.glb'):
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(FOLDER, name))
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH' and o.dimensions.y < 1e-4 and 'Plane' in o.name and 'hard' in name:
            bpy.data.objects.remove(o)
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c)
                lo = Vector(min(a, b) for a, b in zip(lo, w)); hi = Vector(max(a, b) for a, b in zip(hi, w))
    centre, r = (lo + hi) / 2, (hi - lo).length / 2
    s = bpy.context.scene
    s.render.engine = 'CYCLES'; s.cycles.samples = 12; s.cycles.device = 'CPU'
    s.render.resolution_x, s.render.resolution_y = 520, 390
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.8, .82, .85, 1); bg.inputs[1].default_value = 1.2
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); s.collection.objects.link(cam); s.camera = cam
    for tag, d in (('front', Vector((.45, -1, .5))), ('back', Vector((-.5, 1, .5)))):
        cam.location = centre + d.normalized() * r * 3.0
        cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()
        s.render.filepath = os.path.join(OUT, f"{name[:10]}_{tag}.png")
        bpy.ops.render.render(write_still=True)
    if 'hard' in name:
        for img in bpy.data.images:
            if img.size[0]:
                img.filepath_raw = os.path.join(OUT, f"drivetex_{img.name[:20]}.png"); img.file_format = 'PNG'; img.save()
                print('TEX', img.name, img.size[0], img.size[1])
