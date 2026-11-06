# Builds the Digital Evidence Lab workstation from the user's models in "3d models /".
# Run inside Blender. Each run starts clean, so the result is repeatable.
import math
import os
import bpy, bmesh
from mathutils import Euler, Matrix, Quaternion, Vector

MODELS = '/Users/mosesjeremiah/digital evidence /3d models /'
TOP = 0.762          # table surface height, measured from office_table.glb
OBJECTS = {}


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.actions, bpy.data.cameras, bpy.data.lights, bpy.data.curves):
        for item in list(block):
            block.remove(item)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def import_model(filename, root_name):
    """Imports a GLB under one empty, so the whole model moves and scales as a unit."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS, filename))
    new = [o for o in bpy.data.objects if o not in before]
    collection = bpy.data.collections.new(root_name)
    bpy.context.scene.collection.children.link(collection)
    root = bpy.data.objects.new(root_name, None)
    collection.objects.link(root)
    for o in new:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        collection.objects.link(o)
        if o.parent is None:
            o.parent = root
    bpy.context.view_layer.update()
    OBJECTS[root_name] = root
    return root


def descendants(o):
    out = [o]
    for c in o.children:
        out += descendants(c)
    return out


def bounds(objects):
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in objects:
        if o.type == 'MESH':
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c)
                lo = Vector(map(min, lo, w))
                hi = Vector(map(max, hi, w))
    return lo, hi


def remove_tree(o):
    for d in reversed(descendants(o)):
        bpy.data.objects.remove(d)


def place(root, x, y, z=TOP, scale=None, width=None, axis=0, turn=0):
    """Scales to a real size, turns, then sits the model's base on z with its centre over x, y."""
    if width is not None:
        lo, hi = bounds(descendants(root))
        scale = width / (hi - lo)[axis]
    if scale is not None:
        root.scale = (scale,) * 3
    root.rotation_euler = (0, 0, math.radians(turn))
    lo, hi = bounds(descendants(root))
    centre = (lo + hi) / 2
    root.location += Vector((x - centre.x, y - centre.y, z - lo.z))
    bpy.context.view_layer.update()


def rename(old, new):
    o = bpy.data.objects[old]
    o.name = new
    return o


def detach(o):
    world = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = world
    return o


def stage_import():
    clear_scene()
    # Table: centred on the origin with its legs on the floor.
    desk = import_model('office_table.glb', 'Desk')
    place(desk, 0, 0, 0)

    # Computer pack: one scale for everything, so the monitor and keyboard stay in proportion.
    pack = import_model('desktop_computer_pack_-_free_low_poly.glb', 'Computer')
    pack.scale = (.66,) * 3
    rename('Monitor_Cube', 'Monitor_Body')
    rename('Monitor_Cube_Screen_0', 'Monitor_Screen')
    rename('Computer_Cube', 'PC_Tower')
    rename('Keyboard_Plane', 'Keyboard')
    rename('Mouse_Plane', 'Mouse')
    lo, hi = bounds([bpy.data.objects['Monitor_Screen']])
    pack.location = Vector((MONITOR_X - (lo.x + hi.x) / 2, .12, TOP))

    # Recorder: keep the deck and one cassette. The cassette inside the door goes, so the learner loads the real one.
    deck = import_model('early_90s_cassette-corder_radio_free.glb', 'TapePlayer')
    bpy.context.scene.frame_set(0)
    for o in descendants(deck):
        o.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    # Remember where the deck holds a cassette before that one is removed.
    bpy.context.view_layer.update()
    interior = bpy.data.objects['cassetteInterior_GEO_cassette_material_06_0']
    OBJECTS['seat_local'] = deck.matrix_world.inverted() @ interior.matrix_world
    OBJECTS['seat_centre_local'] = deck.matrix_world.inverted() @ (sum(bounds([interior]), Vector()) / 2)
    OBJECTS['tape_mesh_local'] = bpy.data.objects['cassettedeluxe_GEO_cassette_material01_0'].matrix_world.copy()
    for name in ('cassettecase_GRP', 'cassettecase_GRP1', 'cassettecase_GRP2', 'cassettedeluxe_GRP', 'songyInteriorCassette_GRP'):
        remove_tree(bpy.data.objects[name])
    place(deck, -.54, .13, turn=0)
    tape = detach(rename('cassettedeluxe_GRP1', 'Microcassette'))
    OBJECTS['tape_root_to_mesh'] = tape.matrix_world.inverted() @ bpy.data.objects['cassettedeluxe_GEO_cassette_material01_0'].matrix_world
    tape.location = Vector((-.3, -.24, TOP + .0085)) + (tape.location - bounds(descendants(tape))[0] - (bounds(descendants(tape))[1] - bounds(descendants(tape))[0]) / 2)
    place(deck, -.54, .13, turn=0)
    rename('songyDoorold_GRP', 'Tape_Door')
    rename('songyPlaybutton_GEO', 'Tape_Play')
    rename('songyStopbutton_GEO', 'Tape_Stop')

    # Audio interface and headphones, at real size.
    place(import_model('focusrite_scarlett_solo_4th_gen.glb', 'AudioInterface'), -.54, -.15, turn=0)
    # The stand sits just behind the recorder, its tripod clear of the deck. Its own coiled cord goes:
    # one cable, added below, runs from the left earcup to the interface.
    place(import_model('headphone_with_stand.glb', 'HeadphoneSet'), -.46, .312, scale=.62, turn=0)
    remove_tree(next(o for o in descendants(bpy.data.objects['HeadphoneSet']) if o.name.startswith('cables_') and o.type == 'EMPTY'))

    # Drive and dock: the stray ground plane goes, then the 3.5-inch drive is scaled to its real size.
    drive = import_model('very_low-poly_external_hard_drive_28_faces.glb', 'EvidenceDrive')
    remove_tree(bpy.data.objects['Plane_0'].parent)
    place(drive, .71, -.13, scale=.45, turn=0)

    # Keyboard centred under the monitor, mouse beside it.
    for name, shift in (('Keyboard', .086), ('Mouse', .03)):
        o = detach(bpy.data.objects[name])
        o.matrix_world.translation.x += shift

    # Tower squared to the desk, on the right.
    tower = detach(bpy.data.objects['PC_Tower'])
    frame = Frame(bpy.data.objects['Computer_Cube_Computer_0'])
    angle = math.atan2(frame.front_dir.x, -frame.front_dir.y)
    pivot = sum(bounds(descendants(tower)), Vector()) / 2
    tower.matrix_world = Matrix.Translation(pivot) @ Matrix.Rotation(-angle, 4, 'Z') @ Matrix.Translation(-pivot) @ tower.matrix_world
    bpy.context.view_layer.update()
    lo, hi = bounds(descendants(tower))
    tower.matrix_world.translation += Vector((.52 - (lo.x + hi.x) / 2, .16 - (lo.y + hi.y) / 2, 0))
    bpy.context.view_layer.update()
    return tower


def material(name, colour, rough=.5, metal=0.0, emit=None, strength=0.0, image=None):
    m = bpy.data.materials.new(name)
    tree = m.node_tree if m.use_nodes else None
    if tree is None:
        m.use_nodes = True
        tree = m.node_tree
    b = next(n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*colour, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    if image:
        tex = tree.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(image)
        tree.links.new(tex.outputs['Color'], b.inputs['Base Color'])
    return m


def mesh_object(name, verts, faces, mat=None, parent=None, uvs=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    if mat:
        mesh.materials.append(mat)
    o = bpy.data.objects.new(name, mesh)
    (bpy.data.collections.get('Added') or new_collection('Added')).objects.link(o)
    o.parent = parent
    for p in mesh.polygons:
        p.use_smooth = True
    return o


def new_collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def box(name, size, mat=None, parent=None, location=(0, 0, 0), rounded=0.0, flat=True):
    """A box. rounded chamfers the vertical edges, enough to catch a highlight."""
    sx, sy, sz = (v / 2 for v in size)
    r = rounded
    if r:
        ring = [(sx - r, -sy), (sx, -sy + r), (sx, sy - r), (sx - r, sy), (-sx + r, sy), (-sx, sy - r), (-sx, -sy + r), (-sx + r, -sy)]
    else:
        ring = [(sx, -sy), (sx, sy), (-sx, sy), (-sx, -sy)]
    n = len(ring)
    verts = [(x, y, -sz) for x, y in ring] + [(x, y, sz) for x, y in ring]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    o = mesh_object(name, verts, faces, mat, parent)
    o.location = location
    if flat:
        for p in o.data.polygons:
            p.use_smooth = False
    return o


def cylinder(name, radius, length, mat=None, parent=None, location=(0, 0, 0), steps=16, flat_caps=True):
    verts, faces = [], []
    for z in (-length / 2, length / 2):
        for i in range(steps):
            a = 2 * math.pi * i / steps
            verts.append((radius * math.cos(a), radius * math.sin(a), z))
    faces.append(tuple(reversed(range(steps))))
    faces.append(tuple(range(steps, 2 * steps)))
    faces += [(i, (i + 1) % steps, steps + (i + 1) % steps, steps + i) for i in range(steps)]
    o = mesh_object(name, verts, faces, mat, parent)
    o.location = location
    return o


def face_axis(o, direction):
    """Turns an object so its +Z points along direction."""
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized())


class Frame:
    """A box-shaped object's faces in world space: u runs left to right, h is metres up from its base."""

    def __init__(self, mesh, back=False):
        bpy.context.view_layer.update()
        R = mesh.matrix_world.to_3x3().normalized()
        axes = [(R @ Vector(v)).normalized() for v in ((1, 0, 0), (0, 1, 0), (0, 0, 1))]
        forward = max(axes, key=lambda a: abs(a.y))
        self.front_dir = forward if forward.y < 0 else -forward
        self.front_dir.z = 0
        self.front_dir.normalize()
        self.right = Vector((-self.front_dir.y, self.front_dir.x, 0)).normalized()
        self.right = self.right if self.right.x > 0 else -self.right
        pts = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
        self.f = (min(p.dot(self.front_dir) for p in pts), max(p.dot(self.front_dir) for p in pts))
        self.r = (min(p.dot(self.right) for p in pts), max(p.dot(self.right) for p in pts))
        self.z = (min(p.z for p in pts), max(p.z for p in pts))

    def point(self, u, h, depth):
        return self.right * (self.r[0] + u * (self.r[1] - self.r[0])) + self.front_dir * depth + Vector((0, 0, self.z[0] + h))

    def front(self, u, h, out=0.0):
        return self.point(u, h, self.f[1] + out)

    def rear(self, u, h, out=0.0):
        return self.point(u, h, self.f[0] - out)


# ---- Animation helpers. Every clip is one named NLA track, so it exports as one glTF animation.
FPS = 24


def push(owner_data, clip, name):
    ad = owner_data.animation_data
    action = ad.action
    action.name = f'{clip}.{name}'
    track = ad.nla_tracks.new()
    track.name = clip
    track.strips.new(action.name, 0, action)
    ad.action = None


def animate(clip, o, keys):
    """keys: [(frame, location, quaternion, scale)], with None to hold a channel at rest."""
    o.rotation_mode = 'QUATERNION'
    rest = (o.location.copy(), o.rotation_quaternion.copy(), o.scale.copy())
    o.animation_data_create()
    for frame, loc, rot, scl in keys:
        o.location = loc if loc is not None else rest[0]
        o.rotation_quaternion = rot if rot is not None else rest[1]
        o.scale = scl if scl is not None else rest[2]
        o.keyframe_insert('location', frame=frame)
        o.keyframe_insert('rotation_quaternion', frame=frame)
        o.keyframe_insert('scale', frame=frame)
    push(o, clip, o.name)
    o.location, o.rotation_quaternion, o.scale = rest


def animate_shape(clip, o, keys):
    """keys: [(frame, lifted, seated)], or (frame, lifted, seated, worn) for the headphone lead."""
    k = o.data.shape_keys
    k.animation_data_create()
    names = [b.name for b in k.key_blocks[1:]]
    for frame, *values in keys:
        for name, value in zip(names, values):
            k.key_blocks[name].value = value
            k.key_blocks[name].keyframe_insert('value', frame=frame)
    push(k, clip, o.name)
    for name in names:
        k.key_blocks[name].value = 0


# ---- Cables: one tube with three stored shapes, so it reaches a port exactly with no physics.
def spline(points, count):
    pts = [Vector(p) for p in points]
    pts = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    dense = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1:i + 3]
        for j in range(24):
            t = j / 24
            dense.append(.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3))
    dense.append(pts[-2])
    lengths = [0.0]
    for a, b in zip(dense, dense[1:]):
        lengths.append(lengths[-1] + (b - a).length)
    out, j = [], 0
    for i in range(count):
        target = lengths[-1] * i / (count - 1)
        while j < len(lengths) - 2 and lengths[j + 1] < target:
            j += 1
        t = (target - lengths[j]) / max(lengths[j + 1] - lengths[j], 1e-9)
        out.append(dense[j].lerp(dense[j + 1], t))
    return out


def tube_verts(path, radius, sides):
    verts = []
    ref = Vector((.0, 0, 1))
    for i, p in enumerate(path):
        t = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]).normalized()
        if abs(t.dot(ref)) > .98:
            ref = Vector((1, 0, 0))
        a = t.cross(ref).normalized()
        b = t.cross(a).normalized()
        for j in range(sides):
            angle = 2 * math.pi * j / sides
            verts.append(p + (a * math.cos(angle) + b * math.sin(angle)) * radius)
    return verts


def centreline(path, step=3):
    """The cable's centre as glTF (Y-up) points, kept in the export's extras for the line animations."""
    pts = path[::step] + ([path[-1]] if (len(path) - 1) % step else [])
    return [round(c, 4) for p in pts for c in (p.x, p.z, -p.y)]


def cable(name, rest, lifted, seated, radius, mat, count=44, sides=8, keys=True, worn=None):
    paths = [spline(p, count) for p in (rest, lifted, seated)]
    verts = [tuple(v) for v in tube_verts(paths[0], radius, sides)]
    faces = [(i * sides + j, i * sides + (j + 1) % sides, (i + 1) * sides + (j + 1) % sides, (i + 1) * sides + j) for i in range(count - 1) for j in range(sides)]
    o = mesh_object(name, verts, faces, mat)
    o['line_rest'] = centreline(paths[0])
    if not keys:
        return o
    o['line_seated'] = centreline(paths[2])
    o.shape_key_add(name='Basis')
    shapes = [('Lifted', paths[1]), ('Seated', paths[2])]
    if worn:
        shapes.append(('Worn', spline(worn, count)))
    for label, path in shapes:
        key = o.shape_key_add(name=label)
        for v, co in zip(key.data, tube_verts(path, radius, sides)):
            v.co = co
    return o


def plug(name, kind, mats):
    """Built along +Z with the tip at the origin, so seating is a straight move along the port axis."""
    root = bpy.data.objects.new(name, None)
    bpy.data.collections['Added'].objects.link(root)
    if kind == 'usb':
        box(name + '_Tip', (.012, .0045, .012), mats['metal'], root, (0, 0, -.006))
        box(name + '_Body', (.016, .0085, .03), mats['rubber'], root, (0, 0, -.027), rounded=.002)
    else:
        cylinder(name + '_Tip', .0018, .016, mats['metal'], root, (0, 0, -.008), steps=10)
        cylinder(name + '_Body', .0046, .03, mats['rubber'], root, (0, 0, -.031), steps=12)
    return root


def seat_plug(clip, o, keys, rest_dir, seat_dir):
    """keys: [(frame, position, direction)] with the tip at position."""
    quat = lambda d: Vector((0, 0, 1)).rotation_difference(Vector(d).normalized())
    o.location = keys[0][1]
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = quat(rest_dir)
    animate(clip, o, [(f, p, quat(d), None) for f, p, d in keys])


def build_additions():
    mats = {
        'rubber': material('Cable_Rubber', (.012, .012, .014), .55),
        'metal': material('Plug_Metal', (.78, .78, .8), .28, 1.0),
        'blocker': material('Blocker_Body', (.05, .055, .065), .42, .6),
        'switch': material('Blocker_Switch', (.75, .13, .1), .4),
        'led': material('LED_Green', (.03, .6, .12), .3, emit=(.02, 1, .12), strength=2.2),
        'led_off': material('LED_Off', (.02, .05, .03), .35),
        'power': material('Power_Lit', (.5, .75, 1), .3, emit=(.3, .62, 1), strength=2.6),
        'button': material('Power_Button_Face', (.72, .72, .74), .35, .7),
        'port': material('Port_Dark', (.008, .008, .009), .6),
        'hit': material('Hit_Invisible', (0, 0, 0), 1),
    }
    mats['hit'].surface_render_method = 'BLENDED'
    next(n for n in mats['hit'].node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Alpha'].default_value = 0
    new_collection('Added')

    # Write-blocker: top plate, ports, switch and LED.
    pos = Vector((.5, -.14, TOP + .019))
    blocker = box('WriteBlocker', (.128, .096, .036), mats['blocker'], location=pos, rounded=.006)
    plate = mesh_object('WriteBlocker_Top', [(-.058, -.044, .0185), (.058, -.044, .0185), (.058, .044, .0185), (-.058, .044, .0185)], [(0, 1, 2, 3)], material('Blocker_Top', (1, 1, 1), .45, image=bpy.path.abspath(TEX + 'blocker_top.png')), blocker)
    plate.data.uv_layers.new(name='UV')
    for loop, uv in zip(plate.data.uv_layers[0].data, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop.uv = uv
    for name, x, y in (('Blocker_In_Socket', .03, -.0485), ('Blocker_Out_Socket', .045, .0485)):
        box(name, (.016, .0025, .009), mats['port'], blocker, (x, y, 0))
    OBJECTS['blocker_in'] = pos + Vector((.03, -.05, 0))
    OBJECTS['blocker_out'] = pos + Vector((.045, .05, 0))
    switch = box('WriteBlocker_Switch', (.012, .022, .007), mats['switch'], blocker, (-.03, -.012, .0215))
    switch.rotation_mode = 'QUATERNION'
    switch.rotation_quaternion = Euler((math.radians(-16), 0, 0)).to_quaternion()
    box('Blocker_LED_Off', (.009, .009, .0016), mats['led_off'], blocker, (.031, -.012, .0194))
    led = box('Blocker_LED', (.0095, .0095, .002), mats['led'], blocker, (.031, -.012, .0197))
    led.scale = (.001, .001, .001)
    for name, anchor in (('Blocker_In', OBJECTS['blocker_in']), ('Blocker_Out', OBJECTS['blocker_out'])):
        e = bpy.data.objects.new(name, None)
        bpy.data.collections['Added'].objects.link(e)
        e.location = anchor

    # Tower: a real power button over the one painted on the model, plus its light.
    tower = Frame(bpy.data.objects['Computer_Cube_Computer_0'])
    OBJECTS['tower'] = tower
    button_at = tower.front(POWER_U, POWER_H, .0012)
    button = cylinder('Power_Button', .0072, .004, mats['button'], location=button_at)
    face_axis(button, tower.front_dir)
    ring = cylinder('Power_LED', .0088, .002, mats['power'], location=tower.front(POWER_U, POWER_H, -.0002), steps=20)
    face_axis(ring, tower.front_dir)
    ring.scale = (.001, .001, .001)
    usb = bpy.data.objects.new('PC_USB_Port', None)
    bpy.data.collections['Added'].objects.link(usb)
    usb.location = tower.front(USB_U, USB_H, .001)
    OBJECTS['hit_button'] = button_at
    return mats


def fixed_plug(name, kind, tip, direction, mats):
    """A plug that is always seated: tip in the port, direction pointing into it."""
    o = plug(name, kind, mats)
    o.location = tip
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized())
    return o


def run(*points):
    """Cable path on the desk surface: (x, y) lies flat, (x, y, z) sets a height."""
    return [Vector((p[0], p[1], TOP + .0035 if len(p) == 2 else p[2])) if not isinstance(p, Vector) else p for p in points]


def tail(tip, direction, reach=.075):
    """The last two path points, so the cable leaves the back of a plug in a straight line."""
    d = Vector(direction).normalized()
    return [tip - d * reach, tip - d * .04]


def fixed_cable(name, points, mats, radius=.0027, count=90):
    return cable(name, points, points, points, radius, mats['rubber'], count=count, keys=False)


def build_cables(mats):
    tower = OBJECTS['tower']
    into_y = Vector((0, 1, 0))
    flat = TOP + .0068

    # Dock to blocker: leaves the dock's front USB port and loops round to the blocker's source input.
    dock = bpy.data.objects['EvidenceDrive']
    lo, hi = bounds(descendants(dock))
    dock_port = Vector((lo.x + DOCK_USB[0] * (hi.x - lo.x), lo.y - .0004, TOP + DOCK_USB[1]))
    fixed_plug('Plug_Drive', 'usb', dock_port, into_y, mats)
    tip = OBJECTS['blocker_in']
    rest_tip = Vector((tip.x, tip.y - .082, flat))
    lift_tip = tip - into_y * .062
    start = dock_port - into_y * .04
    rest = [start, start + Vector((0, -.03, -.012)), Vector((start.x - .012, -.29, TOP + .0035)), Vector((start.x - .05, -.335, TOP + .0035)), Vector((tip.x + .03, -.345, TOP + .0035))] + tail(rest_tip, into_y)
    seat = [start, start + Vector((0, -.03, -.012)), Vector((start.x - .012, -.255, TOP + .0035)), Vector((start.x - .05, -.28, TOP + .0035)), Vector((tip.x + .03, -.285, TOP + .0035))] + tail(tip, into_y)
    mid = [a.lerp(b, .55) for a, b in zip(rest, seat)][:-2] + tail(lift_tip, into_y)
    Cable_Drive = cable('Cable_Drive', rest, mid, seat, .0027, mats['rubber'], count=60)
    Plug_BlockerIn = plug('Plug_BlockerIn', 'usb', mats)
    seat_plug('Drive_Connect', Plug_BlockerIn, [(0, rest_tip, into_y), (12, lift_tip, into_y), (24, tip, into_y)], into_y, into_y)
    animate_shape('Drive_Connect', Cable_Drive, [(0, 0, 0), (12, 1, 0), (24, 0, 1)])

    # Blocker to PC: permanently wired, straight up into the tower's front USB port.
    out = OBJECTS['blocker_out']
    pc = bpy.data.objects['PC_USB_Port'].location.copy()
    fixed_plug('Plug_BlockerOut', 'usb', out, -into_y, mats)
    fixed_plug('Plug_PC', 'usb', pc, into_y, mats)
    a, b = out + into_y * .04, pc - into_y * .04
    fixed_cable('Cable_BlockerPC', [a, a + Vector((0, .03, .002)), Vector(((a.x + b.x) / 2, b.y - .07, (a.z + b.z) / 2 - .02)), b - into_y * .03, b], mats, count=40)

    # Recorder line out, round the left of the interface, into its front input.
    deck = bpy.data.objects['TapePlayer']
    iface = bpy.data.objects['AudioInterface']
    left = Vector((-1, 0, 0))
    out = deck.matrix_world @ Vector((-.1655, 0, .045))
    box('Tape_Out', (.0015, .014, .014), mats['port'], deck, (-.1652, 0, .045))
    fixed_plug('Plug_TapeOut', 'jack', out, -left, mats)
    jack = iface.matrix_world @ Vector(INPUT_JACK)
    rest_tip = Vector((jack.x, jack.y - .082, TOP + .0052))
    lift_tip = jack - into_y * .06
    start = out + left * .045
    rest = [start, start + Vector((-.012, -.05, -.03))] + run((-.745, -.13), (-.72, -.29), (-.665, -.345)) + tail(rest_tip, into_y)
    seat = [start, start + Vector((-.012, -.05, -.03))] + run((-.745, -.13), (-.715, -.235), (-.665, -.29)) + tail(jack, into_y)
    mid = [a.lerp(b, .55) for a, b in zip(rest, seat)][:-2] + tail(lift_tip, into_y)
    Cable_Audio = cable('Cable_Audio', rest, mid, seat, .0022, mats['rubber'], count=60)
    Plug_InterfaceIn = plug('Plug_InterfaceIn', 'jack', mats)
    seat_plug('Interface_Connect', Plug_InterfaceIn, [(0, rest_tip, into_y), (12, lift_tip, into_y), (24, jack, into_y)], into_y, into_y)
    animate_shape('Interface_Connect', Cable_Audio, [(0, 0, 0), (12, 1, 0), (24, 0, 1)])

    # Interface USB to the PC: permanently wired, along the back edge of the desk behind the monitor.
    usb = iface.matrix_world @ Vector(INTERFACE_USB)
    fixed_plug('Plug_InterfaceUSB', 'usb', usb, -into_y, mats)
    rear_usb = tower.rear(.42, .15)
    fixed_plug('Plug_InterfacePC', 'usb', rear_usb, -into_y, mats)
    start = usb + into_y * .04
    fixed_cable('Cable_InterfacePC', [start] + run((start.x + .012, start.y + .03), (-.37, -.03), (-.345, .03), (-.345, .3), (-.3, .385), (.32, .385), (.43, .385), (rear_usb.x, .392, TOP + .02)) + [rear_usb + into_y * .04], mats)

    # Monitor to PC: down behind the stand and into the same run along the back edge.
    screen = bpy.data.objects['Monitor_Screen']
    centre = sum(bounds([screen]), Vector()) / 2
    socket = Vector((centre.x + .07, .2972, centre.z - .05))
    fixed_plug('Plug_Monitor', 'usb', socket, -into_y, mats)
    rear_video = tower.rear(.62, .19)
    fixed_plug('Plug_MonitorPC', 'usb', rear_video, -into_y, mats)
    start = socket + into_y * .04
    fixed_cable('Cable_Display', [start, start + Vector((.01, .03, -.03)), Vector((centre.x + .1, .365, TOP + .05))] + run((centre.x + .13, .376), (.33, .376), (.42, .376), (rear_video.x, .388, TOP + .05)) + [rear_video + into_y * .04], mats, count=70)

    # PC power: rear panel to the desk's cable grommet.
    rear_power = tower.rear(.5, .06)
    fixed_plug('Plug_Power', 'usb', rear_power, -into_y, mats)
    fixed_cable('Cable_Power', [rear_power + into_y * .04, rear_power + Vector((.03, .055, -.02))] + run((.62, .365), (GROMMET[0] - .05, GROMMET[1] + .03)) + [Vector((GROMMET[0], GROMMET[1], TOP + .002)), Vector((GROMMET[0], GROMMET[1], TOP - .1))], mats, radius=.0034, count=50)

    # Headphones: from the stand, alongside the USB run, round to the interface's headphone jack.
    jack = iface.matrix_world @ Vector(PHONES_JACK)
    rest_tip = Vector((jack.x, jack.y - .082, TOP + .0052))
    lift_tip = jack - into_y * .06
    anchor = Vector((-.348, .262, TOP + .0035))
    head = Vector((-.26, -.78, 1.38))
    # From the bottom of the left earcup, down beside the stand and round behind the recorder.
    cup = Vector((-.488, .302, .862))
    start = [cup, cup + Vector((.004, -.006, -.045)), Vector((-.47, .29, TOP + .006)), Vector((-.405, .272, TOP + .0035))]
    common = start + [anchor] + run((-.35, .2), (-.356, .02), (-.385, -.06))
    rest = common + run((-.405, -.27), (-.44, -.345)) + tail(rest_tip, into_y)
    seat = common + run((-.405, -.21), (-.44, -.285)) + tail(jack, into_y)
    mid = [a.lerp(b, .55) for a, b in zip(rest, seat)][:-2] + tail(lift_tip, into_y)
    worn = [head, head.lerp(anchor, .5) + Vector((0, 0, .1)), anchor + Vector((.012, -.1, .1))] + seat[len(start) + 2:]
    Cable_Headphone = cable('Cable_Headphone', rest, mid, seat, .0019, mats['rubber'], count=60, worn=worn)
    Headphone_Plug = plug('Headphone_Plug', 'jack', mats)
    seat_plug('Headphones_Lift', Headphone_Plug, [(0, rest_tip, into_y), (10, lift_tip, into_y), (20, jack, into_y)], into_y, into_y)
    animate_shape('Headphones_Lift', Cable_Headphone, [(0, 0, 0), (10, 1, 0), (20, 0, 1, 0), (26, 0, 1, 0), (44, 0, 0, 1)])
    e = bpy.data.objects.new('Headphone_Port', None)
    bpy.data.collections['Added'].objects.link(e)
    e.location = jack


POWER_U, POWER_H = .5, .141
USB_U, USB_H = .82, .19
MONITOR_X = .03
DOCK_USB = (.17, .0165)
GROMMET = (.7, .26)
INPUT_JACK = (-.0605, -.0425, .0155)
PHONES_JACK = (.0445, -.0425, .0125)
INTERFACE_USB = (.058, .042, .0145)
TEX = '/Users/mosesjeremiah/digital evidence /digital-evidence-lab/assets/models/tex/'


def ease(t):
    return t * t * (3 - 2 * t)


def build_motion(mats):
    tower = OBJECTS['tower']
    button = bpy.data.objects['Power_Button']
    at = button.location.copy()
    animate('Power_Press', button, [(0, at, None, None), (3, at - tower.front_dir * .0032, None, None), (7, at, None, None)])
    ring = bpy.data.objects['Power_LED']
    animate('Power_Press', ring, [(0, None, None, None), (3, None, None, None), (5, None, None, (1, 1, 1))])

    switch = bpy.data.objects['WriteBlocker_Switch']
    animate('Blocker_Enable', switch, [(0, None, None, None), (6, None, Euler((math.radians(16), 0, 0)).to_quaternion(), None)])
    led = bpy.data.objects['Blocker_LED']
    animate('Blocker_Enable', led, [(0, None, None, None), (6, None, None, None), (8, None, None, (1, 1, 1))])

    # Cassette: the door opens, the tape rises off the desk, turns upright and seats, and the door closes with it.
    deck = bpy.data.objects['TapePlayer']
    door = bpy.data.objects['Tape_Door']
    tape = bpy.data.objects['Microcassette']
    door.rotation_mode = 'QUATERNION'
    closed = door.rotation_quaternion.copy()
    closed_world = door.matrix_world.copy()

    def door_at(angle):
        door.rotation_quaternion = closed @ Euler((angle, 0, 0)).to_quaternion()
        bpy.context.view_layer.update()
        return door.matrix_world @ closed_world.inverted()

    # Choose the direction that tips the door's top edge towards the learner.
    OPEN = math.radians(DOOR_OPEN) * DOOR_SIGN
    hinge = door_at(OPEN)
    door.rotation_quaternion = closed
    bpy.context.view_layer.update()
    seat = deck.matrix_world @ OBJECTS['seat_local'] @ OBJECTS['tape_root_to_mesh'].inverted()
    tape.rotation_mode = 'QUATERNION'
    start = tape.matrix_world.copy()
    # The two cassette meshes have different origins, so line them up by their true centres.
    centre_in_tape = start.inverted() @ (sum(bounds(descendants(tape)), Vector()) / 2)
    seat.translation += (deck.matrix_world @ OBJECTS['seat_centre_local']) - (seat @ centre_in_tape)
    tape_keys, door_keys = [], []
    for f in range(0, 13, 2):
        door_keys.append((f, None, closed @ Euler((OPEN * ease(f / 12), 0, 0)).to_quaternion(), None))
    door_keys.append((42, None, closed @ Euler((OPEN, 0, 0)).to_quaternion(), None))
    for f in range(44, 57, 2):
        door_keys.append((f, None, closed @ Euler((OPEN * (1 - ease((f - 42) / 14)), 0, 0)).to_quaternion(), None))
    normal = (seat.to_3x3() @ Vector((0, 1, 0))).normalized()
    if normal.y > 0:
        normal = -normal
    held = hinge @ seat
    above = Matrix.Translation(Vector((0, -.05, .075))) @ held
    lifted = start.copy()
    lifted.translation += Vector((0, -.02, .1))

    def key(frame, m):
        loc, rot, _ = m.decompose()
        tape_keys.append((frame, loc, rot, None))

    key(0, start)
    key(12, start)
    for f in range(14, 35, 2):
        t = ease((f - 12) / 22)
        a = lifted.to_quaternion() if t < .5 else above.to_quaternion()
        loc = start.translation.lerp(lifted.translation, min(1, t * 2)).lerp(above.translation, max(0, t * 2 - 1))
        rot = start.to_quaternion().slerp(above.to_quaternion(), t)
        tape_keys.append((f, loc, rot, None))
    key(42, held)
    for f in range(44, 57, 2):
        key(f, door_at(OPEN * (1 - ease((f - 42) / 14))) @ seat)
    door.rotation_quaternion = closed
    bpy.context.view_layer.update()
    animate('Tape_Insert', door, door_keys)
    animate('Tape_Insert', tape, tape_keys)

    # Headphones leave the stand towards the viewer and pass out of frame: the learner has put them on.
    hs = bpy.data.objects['HeadphoneSet']
    set_empty = bpy.data.objects.new('Headphones', None)
    hs.users_collection[0].objects.link(set_empty)
    set_empty.parent = hs
    bpy.context.view_layer.update()
    for name in ('header', 'driverL', 'driverR'):
        o = bpy.data.objects[name]
        world = o.matrix_world.copy()
        o.parent = set_empty
        o.matrix_world = world
    rename('stand', 'Headphone_Stand')
    bpy.context.view_layer.update()
    to_local = hs.matrix_world.to_3x3().inverted()
    rise = to_local @ Vector((0, -.04, .09))
    away = to_local @ Vector((.2, -1.08, .52))
    tilt = Euler((math.radians(-14), 0, 0)).to_quaternion()
    animate('Headphones_Lift', set_empty, [(20, Vector((0, 0, 0)), None, None), (28, rise, tilt, None), (44, away, tilt, None)])


def build_views():
    def camera(name, location, target, fov):
        data = bpy.data.cameras.new(name)
        data.sensor_fit = 'VERTICAL'
        data.angle_y = math.radians(fov)
        data.clip_start, data.clip_end = .02, 30
        o = bpy.data.objects.new(name, data)
        bpy.data.collections['Added'].objects.link(o)
        o.location = location
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y')
        return o

    screen = bpy.data.objects['Monitor_Screen']
    corners = [screen.matrix_world @ v.co for v in screen.data.vertices]
    centre = sum(corners, Vector()) / 4
    camera('Camera_Overview', (.0, -2.12, 1.72), (.0, .0, .88), 31)
    camera('Camera_Monitor', centre + Vector((0, -.66, 0)), centre, 30)
    camera('Camera_Drive', (.6, -.86, 1.2), (.58, -.1, .82), 30)
    camera('Camera_Tape', (-.5, -.92, 1.24), (-.5, -.05, .83), 30)
    for name, x, z in (('Screen_TL', -1, 1), ('Screen_TR', 1, 1), ('Screen_BR', 1, -1), ('Screen_BL', -1, -1)):
        p = min(corners, key=lambda c: (c - (centre + Vector((x, 0, z)))).length)
        e = bpy.data.objects.new(name, None)
        bpy.data.collections['Added'].objects.link(e)
        e.location = p + Vector((0, -.0012, 0))
        e.empty_display_size = .02


def build_hits(mats):
    def hit(target, padding):
        lo, hi = bounds(descendants(bpy.data.objects[target]))
        o = box('Hit_' + target, tuple((hi - lo) + Vector((padding,) * 3)), mats['hit'], location=(lo + hi) / 2)
        o.hide_render = True
    for name, padding in (('Power_Button', .05), ('WriteBlocker_Switch', .03), ('EvidenceDrive', .02), ('Plug_BlockerIn', .03), ('Microcassette', .03), ('AudioInterface', .015), ('Plug_InterfaceIn', .03), ('Headphones', .02)):
        hit(name, padding)


def clean_drive_label():
    new = bpy.data.images.load(TEX + 'drive_clean.png')
    new.name = 'drive_clean'
    for o in descendants(bpy.data.objects['EvidenceDrive']):
        if o.type == 'MESH':
            for slot in o.material_slots:
                for n in slot.material.node_tree.nodes:
                    if n.type == 'TEX_IMAGE' and n.image and n.image.size[0] == 1024:
                        for link in n.outputs['Color'].links:
                            if link.to_socket.name == 'Base Color':
                                n.image = new


def clean_brands():
    """No real company's name or logo on the bench: textures from scripts/clean_brand_textures.py replace the
    originals, and the headphones' raised model-name letters are removed."""
    import re
    folder = TEX + 'clean/'
    for f in sorted(os.listdir(folder)):
        name = re.sub(r'^(Image_\d+)_(\d{3})$', r'\1.\2', f[:-4])
        old = bpy.data.images[name]
        new = bpy.data.images.load(folder + f)
        new.name = 'clean_' + f[:-4]
        old.user_remap(new)
    lo, hi = (115 / 768, 1 - 764 / 768), (455 / 768, 1 - 680 / 768)
    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.name.startswith(('driverL_', 'driverR_')):
            continue
        bm = bmesh.new()
        bm.from_mesh(o.data)
        uv = bm.loops.layers.uv.active
        doomed = [f for f in bm.faces if all(lo[0] <= l[uv].uv.x <= hi[0] and lo[1] <= l[uv].uv.y <= hi[1] for l in f.loops)]
        bmesh.ops.delete(bm, geom=doomed, context='FACES')
        bm.to_mesh(o.data)
        bm.free()
        print('removed', len(doomed), 'letter faces from', o.name)


def solid_materials():
    for m in bpy.data.materials:
        if m.name == 'Hit_Invisible' or not m.use_nodes:
            continue
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b and b.inputs['Alpha'].is_linked:
            for link in list(b.inputs['Alpha'].links):
                m.node_tree.links.remove(link)
            b.inputs['Alpha'].default_value = 1.0
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'DITHERED'


def shrink_images():
    for img in list(bpy.data.images):
        if img.users == 0:
            bpy.data.images.remove(img)
            continue
        limit = 1024 if ('Scarlett' in img.name or 'Monitor' in img.name or 'songy' in img.name) else 768
        w, h = img.size
        if max(w, h) > limit:
            k = limit / max(w, h)
            img.scale(max(1, int(w * k)), max(1, int(h * k)))
        img.pack()


def build():
    stage_import()
    mats = build_additions()
    build_cables(mats)
    build_motion(mats)
    build_views()
    build_hits(mats)
    clean_drive_label()
    clean_brands()
    solid_materials()
    bpy.context.scene.frame_set(0)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = 0, 60
    return mats


DOOR_OPEN, DOOR_SIGN = 38, 1


def export(folder):
    shrink_images()
    os.makedirs(folder, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(folder, 'workstation.blend'))
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(folder, 'workstation.glb'), export_format='GLB', use_selection=False,
        export_cameras=True, export_lights=False, export_extras=True, export_yup=True, export_apply=False,
        export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_step=1,
        export_morph=True, export_morph_normal=False, export_image_format='WEBP', export_image_quality=78,
        export_materials='EXPORT', export_tangents=False)
