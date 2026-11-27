import { dequantize, getBounds } from '@gltf-transform/functions';
import { BufferAttribute, BufferGeometry, Matrix4, Vector3 } from 'three';

export const athleticBuild = {
  version: 4,
  label: 'Athletic anatomy',
  description: 'A smooth, symmetrical whole-body deformation broadens the shoulder girdle and adds chest, upper-arm, thigh and calf volume. A relaxed A-pose opens the arms by 25 degrees and the legs by 10 degrees from the source stance. All tissues share the same deformation so muscle attachments and authored boundaries remain together. Head and foot shapes are preserved. This is a stylized fitness visualization, not a clinical anatomy reference.',
};

const bell = (value, center, radius) => Math.exp(-(((value-center)/radius)**2));
const smoothstep = (low, high, value) => {
  const t = Math.max(0, Math.min(1, (value-low)/(high-low)));
  return t*t*(3-2*t);
};

// Coordinates are centered and normalized to a two-unit-tall Y-up body.
// One continuous field is used for *every* tissue, including tendons and bone.
// Independently scaling muscle objects would separate their attachment points.
export function athleticPosition([x, y, z]) {
  const envelope = smoothstep(-.94, -.85, y)*(1-smoothstep(.72, .79, y));
  if (!envelope) return [x, y, z];
  const side = Math.abs(x);
  const torso = bell(side, 0, .23);
  const shoulder = bell(y, .58, .15);
  const chest = bell(y, .48, .16) * torso;
  const armCenter = .29 - .16*(y-.25);
  const arm = bell(y, .40, .17) * bell(side, armCenter, .085);
  const thigh = bell(y, -.28, .23) * bell(side, .125, .095);
  const calf = bell(y, -.70, .13) * bell(side, .15, .08);
  const hips = bell(y, .015, .14) * torso;
  const width = 1 + envelope*(.18*shoulder + .07*chest + .08*hips);
  const limbExpansion = envelope*(.32*arm*(side-armCenter) + .27*thigh*(side-.12) + .15*calf*(side-.15));
  const depth = 1 + envelope*(.34*chest + .44*arm + .32*thigh + .18*calf + .16*hips);
  return [x*width + Math.sign(x)*limbExpansion, y, (z+.025)*depth-.025];
}

export function referencePosture([x, y, z]) {
  const side = Math.abs(x);
  const sign = Math.sign(x);
  // Blend only through the shoulder junction; the free arm, hand and fingers
  // undergo one rigid rotation, shared by all tissues, around the shoulder.
  // Below the waist, hands sit well outside the thighs. Move the arm mask
  // outward there so lateral thigh/fascia vertices never rotate as arm tissue.
  const armBoundary = .19 + .015*smoothstep(.42, .60, y) + .04*(1-smoothstep(.02, .22, y));
  const armWeight = smoothstep(armBoundary, armBoundary+.045, side)*(1-smoothstep(.64, .71, y));
  const armAngle = 25*Math.PI/180;
  const dx = side-.265, dy = y-.59;
  const armX = .265 + Math.cos(armAngle)*dx-Math.sin(armAngle)*dy;
  const armY = .59 + Math.sin(armAngle)*dx+Math.cos(armAngle)*dy;
  const legWeight = (1-smoothstep(-.12, .03, y))*smoothstep(0, .07, side)*(1-smoothstep(.22, .29, side));
  const legAngle = 10*Math.PI/180;
  const legX = .105+Math.cos(legAngle)*(side-.105)-Math.sin(legAngle)*y;
  const legY = Math.sin(legAngle)*(side-.105)+Math.cos(legAngle)*y;
  return [sign*(side+(armX-side)*armWeight+(legX-side)*legWeight), y+(armY-y)*armWeight+(legY-y)*legWeight, z];
}

export async function applyAthleticBuild(document) {
  if (document.getRoot().getAsset().extras?.formAthleticBuild) throw new Error('Athletic shape is already applied. Rebuild from an unmodified source.');
  await document.transform(dequantize());
  const buffer = document.getRoot().listBuffers()[0];
  const point = new Vector3();
  // Mirrored source nodes may share meshes. Clone per instance before shaping
  // in world coordinates, otherwise the second side would be deformed twice.
  for (const node of document.getRoot().listNodes()) {
    const original = node.getMesh();
    if (!original) continue;
    const matrix = new Matrix4().fromArray(node.getWorldMatrix());
    const inverse = matrix.clone().invert();
    const mesh = document.createMesh(original.getName());
    for (const source of original.listPrimitives()) {
      const primitive = source.clone();
      const positions = source.getAttribute('POSITION');
      const array = new Float32Array(positions.getCount()*3);
      for (let index=0; index<positions.getCount(); index++) {
        positions.getElement(index, pointArray);
        point.fromArray(pointArray).applyMatrix4(matrix);
        point.fromArray(referencePosture(athleticPosition(point.toArray()))).applyMatrix4(inverse);
        point.toArray(array, index*3);
      }
      primitive.setAttribute('POSITION', document.createAccessor().setType('VEC3').setBuffer(buffer).setArray(array));
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(array, 3));
      if (source.getIndices()) geometry.setIndex(new BufferAttribute(source.getIndices().getArray(), 1));
      geometry.computeVertexNormals();
      primitive.setAttribute('NORMAL', document.createAccessor().setType('VEC3').setBuffer(buffer).setArray(new Float32Array(geometry.getAttribute('normal').array)));
      geometry.dispose();
      mesh.addPrimitive(primitive);
    }
    node.setMesh(mesh);
  }
  const scene = document.getRoot().getDefaultScene();
  const bounds = getBounds(scene);
  const scale = 2/(bounds.max[1]-bounds.min[1]);
  const centered = document.createNode('athletic_shape').setScale([scale,scale,scale]).setTranslation(bounds.min.map((value, axis) => -(value+bounds.max[axis])/2*scale));
  for (const child of scene.listChildren()) { scene.removeChild(child); centered.addChild(child); }
  scene.addChild(centered);
  document.getRoot().getAsset().extras = { ...document.getRoot().getAsset().extras, formAthleticBuild: athleticBuild.version };
}

const pointArray = [0, 0, 0];
