/** Import the supplied anatomy mesh and derive approximate workout regions.
 * The source is a single welded surface: these are traced surface annotations, not
 * separately authored anatomical muscles. The source geometry is preserved.
 */
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { regionAt, sectionKey } from './anatomy-contours.mjs';

if (!process.argv[2]) throw new Error('Usage: npm run prepare:anatomy -- /path/to/male_muscular_anatomy__3d_model.glb');
const input = await readFile(process.argv[2]);
const sourceSha256 = createHash('sha256').update(input).digest('hex');
if (sourceSha256 !== '7032210a4e6c5d35c931f15feeaf4e6dcb4c1d30afb396c1660efb7b70f8d53e') {
  throw new Error('These contours are traced for the supplied male muscular anatomy GLB. A different model requires its own contours or named muscle meshes.');
}
const gltf = await new GLTFLoader().parseAsync(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength), '');
gltf.scene.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(gltf.scene);
const center = bounds.getCenter(new THREE.Vector3());
const scale = 2 / bounds.getSize(new THREE.Vector3()).y;

const regions = new Map(), trianglesToMap = [], depths = new Map();
const vertex = new THREE.Vector3(), normal = new THREE.Vector3();
let triangles = 0;
gltf.scene.traverse(object => {
  if (!object.isMesh) return;
  const geometry = object.geometry, position = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal'), index = geometry.index;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    const positions = [], directions = [];
    for (let j = 0; j < 3; j++) {
      const n = index ? index.getX(i + j) : i + j;
      vertex.fromBufferAttribute(position, n).applyMatrix4(object.matrixWorld).sub(center).multiplyScalar(scale);
      positions.push(vertex.x, vertex.y, vertex.z);
      normal.fromBufferAttribute(normals, n).applyNormalMatrix(normalMatrix);
      directions.push(normal.x, normal.y, normal.z);
    }
    trianglesToMap.push({ positions, directions });
    for (let j = 0; j < 9; j += 3) {
      const key = sectionKey(positions[j], positions[j+1]);
      const range = depths.get(key) ?? [Infinity, -Infinity];
      range[0] = Math.min(range[0], positions[j+2]);
      range[1] = Math.max(range[1], positions[j+2]);
      depths.set(key, range);
    }
    triangles++;
  }
});
function label(point) {
  const [x, y, z] = point;
  const range = depths.get(sectionKey(x, y));
  return regionAt(x, y, z, range ? (range[0]+range[1])/2 : 0);
}
const midpoint = (a, b) => a.map((value, i) => (value+b[i])/2);
let mappedTriangles = 0;
function partition(points, normals, depth = 0) {
  const center = points[0].map((value, i) => (value+points[1][i]+points[2][i])/3);
  const muscle = label(center);
  const edge = Math.max(...points.map((point, i) => Math.hypot(...point.map((value,j)=>value-points[(i+1)%3][j]))));
  // Refine only annotation boundaries. Interpolated points stay on the source
  // triangle: no bulging, overlapping overlay, or floating highlight geometry.
  if (depth < 3 && edge > .0025 && points.some(point => label(point) !== muscle)) {
    const ab = midpoint(points[0], points[1]), bc = midpoint(points[1], points[2]), ca = midpoint(points[2], points[0]);
    const nab = midpoint(normals[0], normals[1]), nbc = midpoint(normals[1], normals[2]), nca = midpoint(normals[2], normals[0]);
    partition([points[0], ab, ca], [normals[0], nab, nca], depth+1);
    partition([ab, points[1], bc], [nab, normals[1], nbc], depth+1);
    partition([ca, bc, points[2]], [nca, nbc, normals[2]], depth+1);
    partition([ab, bc, ca], [nab, nbc, nca], depth+1);
    return;
  }
  if (!regions.has(muscle)) regions.set(muscle, { positions: [], normals: [] });
  const region = regions.get(muscle);
  points.forEach(point => region.positions.push(...point));
  normals.forEach(direction => {
    const length = Math.hypot(...direction);
    region.normals.push(...direction.map(value => value/length));
  });
  mappedTriangles++;
}
for (const { positions, directions } of trianglesToMap) {
  partition([positions.slice(0,3), positions.slice(3,6), positions.slice(6,9)], [directions.slice(0,3), directions.slice(3,6), directions.slice(6,9)]);
}
const document = new Document(), buffer = document.createBuffer(), scene = document.createScene('Supplied muscular anatomy');
const material = document.createMaterial('Muscle surface').setBaseColorFactor([.7, .73, .72, 1]).setRoughnessFactor(.6).setDoubleSided(true);
for (const [name, data] of regions) {
  const primitive = document.createPrimitive().setAttribute('POSITION', document.createAccessor().setType('VEC3').setArray(new Float32Array(data.positions)).setBuffer(buffer)).setAttribute('NORMAL', document.createAccessor().setType('VEC3').setArray(new Float32Array(data.normals)).setBuffer(buffer)).setMaterial(material);
  scene.addChild(document.createNode(name).setMesh(document.createMesh(name).addPrimitive(primitive)));
}
const source = gltf.asset.extras ?? {};
document.getRoot().getAsset().extras = { ...source, form: 'Normalized and partitioned using traced surface contours for workout illustration.' };
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
const output = await io.writeBinary(document);
const root = new URL('../public/anatomy/', import.meta.url);
await writeFile(new URL('male.glb', root), output);
const manifest = {
  model: { url: '/anatomy/male.glb', title: source.title, author: source.author, source: source.source, license: source.license },
  mapping: 'Manually traced bilateral muscle contours on a single continuous surface, with local limb depth. Surface annotations are not artist-authored anatomical segmentation.',
  regions: [...regions.keys()].filter(name => name !== 'neutral').map(muscle => ({ muscle, meshNames: [muscle] })),
  form: { sourceSha256, sourceBytes: input.length, bytes: output.length, sourceTriangles: triangles, triangles: mappedTriangles, regionCount: regions.size - 1, changes: 'World transforms baked; centered at origin and normalized to 2 units tall; source surface preserved; annotation boundary triangles subdivided for smooth edges; partitioned by traced muscle contours with fascia and joints left neutral; Meshopt compressed.' },
};
await writeFile(new URL('manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(new URL('NOTICE.txt', root), `${source.title}\nAuthor: ${source.author}\nSource: ${source.source}\nLicense indicated by supplied GLB: ${source.license}\n\nUser-supplied model. Original file is unchanged. Form bakes world transforms, normalizes scale, partitions triangles using manually traced muscle contours, and compresses the result with Meshopt. Regions illustrate exercise associations and are not precise muscle segmentation.\n\nSource SHA-256: ${manifest.form.sourceSha256}\n`);
await writeFile(new URL('LICENSE.txt', root), `License indicated in the user-supplied model metadata:\n${source.license}\n\nAuthor: ${source.author}\nSource: ${source.source}\n\nSee NOTICE.txt for Form's processing details.\n`);
await writeFile(new URL('FORM-NOTICE.txt', root), `Form workout muscle viewer\n\nActive model: ${source.title}\nSource SHA-256: ${manifest.form.sourceSha256}\n\n${manifest.mapping}\n${manifest.form.changes}\n\nPrimary muscles are green; assisting muscles are lighter green. Planned focus is previewed before any sets are recorded; completed sets determine the map after recording begins. Planned previews never count as completed sets.\nSee NOTICE.txt and LICENSE.txt for the supplied model attribution.\n`);
console.log(JSON.stringify(manifest.form));
