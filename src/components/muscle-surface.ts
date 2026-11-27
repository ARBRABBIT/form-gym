import * as THREE from "three";

// The atlas exposes pale skull/fascia surfaces between facial muscles. Give
// those head surfaces a cohesive warm anatomical finish, rather than changing
// the body's tendon/bone palette or treating the head as a workout muscle.
export function matchHeadSurface(mesh: THREE.Mesh, materials: THREE.MeshStandardMaterial[]) {
  if (materials.length !== 1) return false;
  const material = materials[0];
  if (!/bone|cartilage|tendon/i.test(material.name)) return false;
  const positions = mesh.geometry.getAttribute("position");
  const point = new THREE.Vector3();
  let hasHead = false;
  for (let index=0; index<positions.count; index++) {
    point.fromBufferAttribute(positions,index).applyMatrix4(mesh.matrixWorld);
    if (point.y > .76) { hasHead = true; break; }
  }
  if (!hasHead) return false;
  const colors = new Float32Array(positions.count*3).fill(1);
  const tissue = new THREE.Color("#ae665b");
  const connective = new THREE.Color("#bf8878");
  for (let index=0; index<positions.count; index++) {
    point.fromBufferAttribute(positions,index).applyMatrix4(mesh.matrixWorld);
    const blend = THREE.MathUtils.smoothstep(point.y,.735,.775);
    if (!blend) continue;
    const crown = THREE.MathUtils.smoothstep(point.y,.93,.985);
    const target = tissue.clone().lerp(connective,crown);
    colors[index*3] = THREE.MathUtils.lerp(1,target.r/material.color.r,blend);
    colors[index*3+1] = THREE.MathUtils.lerp(1,target.g/material.color.g,blend);
    colors[index*3+2] = THREE.MathUtils.lerp(1,target.b/material.color.b,blend);
  }
  mesh.geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  material.vertexColors = true;
  material.roughness = .5;
  return true;
}

// A reusable, tileable fiber surface. Color remains neutral so workout green
// can replace the tissue color without losing its surface detail.
export function createMuscleSurface(anisotropy: number) {
  const size = 512;
  const colorCanvas = document.createElement("canvas");
  const heightCanvas = document.createElement("canvas");
  colorCanvas.width = heightCanvas.width = size;
  colorCanvas.height = heightCanvas.height = size;
  const colorContext = colorCanvas.getContext("2d")!;
  const heightContext = heightCanvas.getContext("2d")!;
  const color = colorContext.createImageData(size, size);
  const height = heightContext.createImageData(size, size);
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
    const along = y/size*Math.PI*2;
    const across = x/size*Math.PI*2;
    const strand = Math.sin(across*58 + .65*Math.sin(along*2) + .25*Math.sin(along*5+across*3));
    const fine = Math.sin(across*119 + .35*Math.sin(along*3));
    const bundles = Math.sin(across*11 + .3*Math.sin(along));
    const grain = Math.sin(across*181+along*73)*Math.sin(across*43-along*127);
    const tone = 225 + 13*strand + 4*fine + 6*bundles + 2*grain;
    const relief = 128 + 48*strand + 16*fine + 13*bundles;
    const offset = (y*size+x)*4;
    for (let channel=0; channel<3; channel++) {
      color.data[offset+channel] = tone;
      height.data[offset+channel] = relief;
    }
    color.data[offset+3] = height.data[offset+3] = 255;
  }
  colorContext.putImageData(color, 0, 0);
  heightContext.putImageData(height, 0, 0);
  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(heightCanvas);
  for (const texture of [map, bump]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(4, anisotropy);
  }
  return { map, bump };
}

// Fiber coordinates are built independently for each named muscle, in model
// space. Long muscles follow their major axis; pectoral fibers fan toward the
// humeral attachment rather than running vertically across the chest.
export function addMuscleFiberCoordinates(mesh: THREE.Mesh, muscle: string) {
  const geometry = mesh.geometry;
  const positions = geometry.getAttribute("position");
  const points: THREE.Vector3[] = [];
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  for (let index=0; index<positions.count; index++) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
    points.push(point); box.expandByPoint(point); center.add(point);
  }
  center.divideScalar(points.length);
  const size = box.getSize(new THREE.Vector3());
  // Power iteration finds the direction of the elongated muscle belly.
  const axis = new THREE.Vector3(0, 1, .15).normalize();
  const covariance = new Array<number>(9).fill(0);
  for (const point of points) {
    const values = [point.x-center.x,point.y-center.y,point.z-center.z];
    for (let row=0; row<3; row++) for (let column=0; column<3; column++) covariance[row*3+column] += values[row]*values[column];
  }
  for (let iteration=0; iteration<10; iteration++) {
    const next = new THREE.Vector3(covariance[0]*axis.x+covariance[1]*axis.y+covariance[2]*axis.z, covariance[3]*axis.x+covariance[4]*axis.y+covariance[5]*axis.z, covariance[6]*axis.x+covariance[7]*axis.y+covariance[8]*axis.z);
    if (next.lengthSq() > 1e-12) axis.copy(next.normalize());
  }
  const across = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0,0,1)).normalize();
  if (across.lengthSq() < .1) across.set(1,0,0);
  const width = Math.max(.02, Math.min(size.x, size.y)*.9);
  const length = Math.max(.03, size.length());
  const uv = new Float32Array(positions.count*2);
  const side = center.x < 0 ? -1 : 1;
  const attachment = new THREE.Vector3(side*(Math.max(Math.abs(box.min.x),Math.abs(box.max.x))+.018), box.max.y-.015, center.z);
  for (const [index, point] of points.entries()) {
    const delta = point.clone().sub(center);
    if (muscle === "chest") {
      const fan = point.clone().sub(attachment);
      uv[index*2] = Math.atan2(fan.y, -side*fan.x)/1.8;
      uv[index*2+1] = fan.length()/length;
    } else {
      uv[index*2] = delta.dot(across)/width;
      uv[index*2+1] = delta.dot(axis)/length;
    }
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
