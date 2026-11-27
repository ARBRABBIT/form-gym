/** Rebuild the workout model from the pinned Z-Anatomy Blender atlas.
 * BLENDER_BIN=/path/to/blender npm run prepare:anatomy
 * npm run prepare:anatomy -- --reuse-export  (reuse this source's cached export)
 * Blender is a build-time conversion tool; the app serves the prepared GLB.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, getBounds, meshopt, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAthleticBuild, athleticBuild } from './athletic-anatomy.mjs';

const revision = '7be0bfc49409b45fda74bf86fc13086fad0f4df2';
const archiveSha256 = 'e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736';
const sourceUrl = `https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/${revision}/Z-Anatomy.zip`;
const upstreamUrl = `https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/${revision}/License.txt`;
const cache = process.env.FORM_ANATOMY_CACHE || join(tmpdir(), 'form-z-anatomy');
const root = new URL('../public/anatomy/', import.meta.url);
const run = promisify(execFile);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(cache, { recursive: true });
const archivePath = join(cache, 'Z-Anatomy.zip');
try { await access(archivePath); }
catch {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Z-Anatomy download failed: ${response.status}`);
  await writeFile(archivePath, new Uint8Array(await response.arrayBuffer()));
}
const archive = await readFile(archivePath);
if (sha256(archive) !== archiveSha256) throw new Error('Source archive checksum mismatch.');
const sourcePath = join(cache, 'workout-source.glb');
const metadataPath = join(cache, 'export-metadata.json');
if (!process.argv.includes('--reuse-export')) {
  await run('unzip', ['-oq', archivePath, 'Z-Anatomy/Startup.blend', '-d', join(cache, 'atlas')]);
  const blender = process.env.BLENDER_BIN || 'blender';
  const { stdout } = await run(blender, ['--background', '--factory-startup', '--disable-autoexec', '--python-exit-code', '1', join(cache, 'atlas/Z-Anatomy/Startup.blend'), '--python', fileURLToPath(new URL('./export-z-anatomy.py', import.meta.url)), '--', sourcePath, metadataPath], { maxBuffer: 8 * 1024 * 1024 });
  console.log(stdout.split('\n').filter(line => /MAPPED_PARTS|SOURCE_OBJECTS|EXPORTED_BYTES/.test(line)).join('\n'));
}
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
const source = new Uint8Array(await readFile(sourcePath));
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const document = await io.readBinary(source);
const scene = document.getRoot().getDefaultScene();
if (!scene) throw new Error('Missing anatomy scene.');
const bounds = getBounds(scene);
const height = bounds.max[1] - bounds.min[1];
if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid anatomy bounds.');
const scale = 2 / height;
const parent = document.createNode('workout_anatomy').setScale([scale, scale, scale]).setTranslation(bounds.min.map((value, index) => -(value+bounds.max[index])/2*scale));
for (const child of scene.listChildren()) { scene.removeChild(child); parent.addChild(child); }
scene.addChild(parent);
const triangleCount = () => document.getRoot().listMeshes().reduce((total, mesh) => total + mesh.listPrimitives().reduce((sum, primitive) => sum + (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount())/3, 0), 0);
document.getRoot().getAsset().copyright = 'Z-Anatomy / Gauthier Kervyn; BodyParts3D / DBCLS / Kousaku Okubo. Model assets: CC BY-SA 4.0.';
const sourceTriangles = triangleCount();
await document.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: .28, error: .002, lockBorder: true }), prune());
await applyAthleticBuild(document);
await document.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
const output = await io.writeBinary(document);
const objects = metadata.objects;
const regions = Object.keys(metadata.groups).map(muscle => ({ muscle, meshNames: objects.filter(object => object.muscle === muscle).map(object => object.name), anatomicalNames: objects.filter(object => object.muscle === muscle).map(object => object.anatomicalName) }));
const namedNodes = new Set(document.getRoot().listNodes().map(node => node.getName()));
for (const region of regions) for (const name of region.meshNames) {
  if (!namedNodes.has(name)) throw new Error(`Named muscle lost during optimization: ${name}`);
}
const manifest = {
  model: { url: '/anatomy/male.glb', title: 'Athletic workout anatomy · Z-Anatomy', author: 'Gauthier Kervyn / Z-Anatomy; Kousaku Okubo / BodyParts3D', source: 'https://github.com/Z-Anatomy/Models-of-human-anatomy', license: 'CC BY-SA 4.0' },
  appearance: athleticBuild,
  mapping: 'Named, authored muscle-part meshes grouped by anatomical name. No position masks or projected region cuts. Muscle and tendon materials remain separate.',
  regions,
  anatomy: objects,
  form: { sourceRevision: revision, archiveSha256, archiveBytes: archive.length, sourceBytes: source.length, bytes: output.length, sourceTriangles, triangles: triangleCount(), regionCount: regions.length, mappedMuscleParts: regions.reduce((count, region) => count+region.meshNames.length, 0), meshes: document.getRoot().listMeshes().length, primitives: document.getRoot().listMeshes().reduce((count, mesh) => count+mesh.listPrimitives().length, 0), renderMeshes: document.getRoot().listNodes().reduce((count, node) => count+(node.getMesh()?.listPrimitives().length ?? 0), 0), blender: metadata.blender, height: 2, changes: 'Muscles and supporting bones, cartilage, teeth and eye geometry selected. Nonselectable supporting structures combined; mapped muscle parts remain separate and named. Materials replaced, world scale centered to 2 units, geometry simplified with bounded error and locked borders, and Meshopt compressed. Inner-ear, kidney and other organ systems are excluded. '+athleticBuild.description },
};
let upstreamLicense;
try { upstreamLicense = await readFile(join(cache, 'UPSTREAM-LICENSE.txt'), 'utf8'); }
catch {
  const response = await fetch(upstreamUrl);
  if (!response.ok) throw new Error('Could not obtain upstream attribution notice.');
  upstreamLicense = await response.text();
  await writeFile(join(cache, 'UPSTREAM-LICENSE.txt'), upstreamLicense);
}
await mkdir(root, { recursive: true });
await writeFile(new URL('male.glb', root), output);
await writeFile(new URL('manifest.json', root), JSON.stringify(manifest, null, 2)+'\n');
await writeFile(new URL('UPSTREAM-LICENSE.txt', root), upstreamLicense);
await writeFile(new URL('LICENSE.txt', root), 'Z-Anatomy-derived workout model assets\n\nCreative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).\nhttps://creativecommons.org/licenses/by-sa/4.0/\n\nAttribution and modification notices must accompany redistributed model assets. Adapted model assets retain the same license. See NOTICE.txt and UPSTREAM-LICENSE.txt.\n');
await writeFile(new URL('NOTICE.txt', root), `Z-Anatomy workout anatomy\n\nZ-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0\nBodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan\n\nKousaku Okubo: original BodyParts3D model.\nGauthier Kervyn: Z-Anatomy design, 3D and anatomy.\nMarcin Zielinski: Blender add-on.\nLluis Vinent: Unity development.\n\nSource: ${manifest.model.source}\nPinned revision: ${revision}\nArchive SHA-256: ${archiveSha256}\n\nForm modifications: ${manifest.form.changes}\n\nThese model assets are distributed under CC BY-SA 4.0.\nhttps://creativecommons.org/licenses/by-sa/4.0/\nFull upstream attribution is preserved in UPSTREAM-LICENSE.txt.\n`);
await writeFile(new URL('FORM-NOTICE.txt', root), `Form workout muscle viewer\n\n${manifest.mapping}\n${manifest.form.changes}\n\nPrimary muscles are green; assisting muscles are lighter green. Planned focus is previewed before any sets are recorded; recorded sets determine the map after training begins. Highlights describe exercise associations, not measured muscle activation or recovery.\n\nRebuild: BLENDER_BIN=/path/to/blender npm run prepare:anatomy\nBlender is only needed to rebuild the model, not to run or deploy the app.\nSee NOTICE.txt, LICENSE.txt and UPSTREAM-LICENSE.txt for source terms.\n`);
console.log(JSON.stringify(manifest.form));
