import bpy, sys
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[sys.argv.index('--') + 1])
a = bpy.data.actions[0]
print('RANGE', a.frame_range, 'fps', bpy.context.scene.render.fps)
fcurves = []
try:
    for layer in a.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                fcurves += list(bag.fcurves)
except Exception as e:
    fcurves = list(getattr(a, 'fcurves', []))
print('fcurves', len(fcurves))
seen = {}
for fc in fcurves:
    k = [(round(p.co.x), round(p.co.y, 3)) for p in fc.keyframe_points]
    vals = [v for _, v in k]
    if max(vals) - min(vals) < 1e-4:
        continue
    print('  ', fc.data_path[:60], fc.array_index, len(k), k[:9])
for n in ['songyDoorold_GRP', 'songyInteriorCassette_GRP', 'songyDoor_GEO', 'songyPlaybutton_GEO', 'songyStopbutton_GEO', 'songyRecbutton_GEO', 'songyRadiobody_GEO1']:
    o = bpy.data.objects.get(n)
    if o: print(n, 'parent', o.parent.name if o.parent else None, 'loc', tuple(round(v, 4) for v in o.matrix_world.translation), 'rot', tuple(round(v, 3) for v in o.rotation_quaternion), 'children', [c.name for c in o.children][:6])
