"""Run inside Blender, with auto-execution disabled. Exports authored muscle objects."""
import bpy, json, re, sys
from pathlib import Path
from collections import Counter

args = sys.argv[sys.argv.index('--') + 1:]
out, metadata_path = map(Path, args[:2])
patterns = [
 ('chest', r'pectoralis major'),
 ('front-shoulders', r'(clavicular|acromial) part of deltoid'),
 ('rear-shoulders', r'scapular spinal part of deltoid'),
 ('biceps', r'biceps brachii'), ('triceps', r'triceps brachii'),
 ('forearms', r'brachioradialis|pronator teres|supinator muscle|palmaris longus|flexor carpi|extensor carpi|flexor digitorum (superficialis|profundus)|extensor digitorum\.'),
 ('lats', r'latissimus dorsi'), ('traps', r'descending part of trapezius'),
 ('traps-middle', r'(ascending|transverse) part of trapezius'),
 ('lowerback', r'iliocostalis lumborum|longissimus thoracis|multifidus lumborum'),
 ('abdominals', r'rectus abdominis'), ('obliques', r'(external|internal) abdominal oblique'),
 ('glutes', r'gluteus (maximus|medius|minimus)'),
 ('quads', r'rectus femoris|vastus (medialis|lateralis|intermedius)'),
 ('hamstrings', r'biceps femoris|semitendinosus|semimembranosus'),
 ('calves', r'gastrocnemius|soleus'), ('adductors', r'adductor (longus|brevis|magnus|minimus)|gracilis|pectineus'),
 ('tibialis', r'tibialis anterior'),
]
def muscle_group(name):
 return next((key for key, pattern in patterns if re.search(pattern, name.lower())), None)

def linear(hex_color):
 channels = [int(hex_color[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in channels) + (1,)

palette = {'Muscle tissue':'b56858', 'Tendon tissue':'e9ddc8', 'Bone':'e9e1d3', 'Cartilage':'c8d7d5', 'Teeth':'f4ead5', 'Eye':'eee8dc', 'Iris':'423a32'}
materials = {}
for name, color in palette.items():
 mat = bpy.data.materials.new('Form '+name)
 mat.use_nodes = True
 mat.diffuse_color = linear(color)
 shader = mat.node_tree.nodes.get('Principled BSDF')
 shader.inputs['Base Color'].default_value = linear(color)
 shader.inputs['Roughness'].default_value = .65 if name == 'Muscle tissue' else .48
 materials[name] = mat

def tissue(old, muscle):
 name = old.name.lower() if old else ''
 if 'tendon' in name or 'fascia' in name or 'aponeuro' in name: return 'Tendon tissue'
 if 'cartilage' in name: return 'Cartilage'
 if 'bone' in name or 'suture' in name: return 'Bone'
 if 'teeth' in name or 'dentine' in name: return 'Teeth'
 if name in ['iris', 'black']: return 'Iris'
 if name == 'eye': return 'Eye'
 return 'Muscle tissue' if muscle else 'Tendon tissue'

source_objects = list(bpy.data.objects)
# Bake source modifiers per object before joining. Keeping a source object's
# subdivision/mirror stack on a joined support mesh would affect the whole body.
for source in source_objects:
 for modifier in source.modifiers:
  if modifier.type == 'SUBSURF':
   modifier.show_viewport = False
   modifier.show_render = False
depsgraph = bpy.context.evaluated_depsgraph_get()
depsgraph.update()
scene = bpy.data.scenes.new('Form Z-Anatomy muscles')
records, support, kept = [], {}, []
for source in source_objects:
 if source.type != 'MESH': continue
 collections = [c.name for c in source.users_collection]
 muscle = 'Muscles' in collections
 bone = '1: Skeletal system' in collections and any(m and any(w in m.name.lower() for w in ['bone', 'teeth','cartilage']) for m in source.data.materials)
 nasal = 'cartilage' in source.name.lower() and any(w in source.name.lower() for w in ['nasal','alar'])
 eye = source.name.lower().startswith(('anterior segment of eyeball.', 'posterior segment of eyeball.', 'iris.', 'eyelashes.', 'hairs of eyebrow.'))
 if not (muscle or bone or nasal or eye): continue
 group = muscle_group(source.name) if muscle else None
 evaluated = source.evaluated_get(depsgraph)
 mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
 mesh.validate(clean_customdata=False)
 obj = bpy.data.objects.new('Form anatomy part', mesh)
 obj.matrix_world = evaluated.matrix_world.copy()
 safe_name = 'anatomy_'+re.sub(r'[^a-z0-9]+','_',source.name.lower()).strip('_')
 obj.name = safe_name
 obj.data.name = safe_name+'_geometry'
 for index, old in enumerate(list(obj.data.materials)):
  obj.data.materials[index] = materials[tissue(old, muscle)]
 if not len(obj.data.materials): obj.data.materials.append(materials['Muscle tissue' if muscle else 'Bone'])
 for polygon in obj.data.polygons: polygon.use_smooth = True
 obj.hide_viewport = False
 obj.hide_render = False
 scene.collection.objects.link(obj)
 obj.hide_set(False)
 obj['anatomicalName'] = source.name
 obj['source'] = 'Z-Anatomy / BodyParts3D'
 if group: obj['muscleGroup'] = group
 record = {'name':safe_name,'anatomicalName':source.name,'muscle':group,'tissue':'muscle' if muscle else 'support','sourceFaces':len(source.data.polygons)}
 records.append(record)
 if group: kept.append(obj)
 else: support.setdefault('other_muscles' if muscle else 'support_anatomy', []).append(obj)

bpy.context.window.scene = scene
# Keep every mapped muscle part separate. Combine only nonselectable supporting
# structures; the source names remain in the manifest for attribution/audit.
for bucket, objects in support.items():
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects: obj.select_set(True)
 bpy.context.view_layer.objects.active = objects[0]
 bpy.ops.object.join()
 joined = bpy.context.view_layer.objects.active
 joined.name = 'anatomy_'+bucket
 joined.data.name = joined.name+'_geometry'
 for key in list(joined.keys()): del joined[key]
 joined['source'] = 'Z-Anatomy / BodyParts3D'
 kept.append(joined)

bpy.ops.object.select_all(action='DESELECT')
for obj in kept: obj.select_set(True)
bpy.context.view_layer.objects.active = kept[0]
counts = Counter(record['muscle'] for record in records if record['muscle'])
missing = [key for key,_ in patterns if not counts[key]]
if missing: raise RuntimeError('Missing muscle groups: '+str(missing))
print('MAPPED_PARTS',sum(counts.values()),'GROUPS',dict(counts),flush=True)
print('SOURCE_OBJECTS',len(records),'EXPORT_OBJECTS',len(kept),flush=True)
metadata_path.write_text(json.dumps({'objects':records,'exportObjects':len(kept),'groups':dict(counts),'blender':bpy.app.version_string},indent=2))
bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_materials='EXPORT', export_extras=True, export_animations=False, export_cameras=False, export_lights=False, export_texcoords=False)
print('EXPORTED_BYTES',out.stat().st_size,flush=True)
