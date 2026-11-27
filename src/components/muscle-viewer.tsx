"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { ArrowLeft, ArrowRight, RotateCcw } from "./icons";
import { muscleLabels, type MuscleActivity, type MuscleGroup } from "@/lib/workout-muscles";
import { addMuscleFiberCoordinates, createMuscleSurface, matchHeadSurface } from "./muscle-surface";

type Region = { muscle: MuscleGroup; meshNames: string[] };
type ViewerApi = { view: (back: boolean) => void; frame: (upper: boolean) => void; rotate: (angle: number) => void; paint: () => void };

export default function MuscleViewer({ muscles, selected, onSelect }: { muscles: MuscleActivity[]; selected: MuscleGroup | null; onSelect: (group: MuscleGroup) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ViewerApi | null>(null);
  const current = useRef({ muscles, selected, onSelect });
  current.current = { muscles, selected, onSelect };
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [view, setView] = useState("front");
  const [framing, setFraming] = useState("full");
  const descriptionId = useId();

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { setState("unavailable"); return; }
    let disposed = false;
    const controller = new AbortController();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 30);
    camera.position.set(0, 0, 4.1);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "Rotatable 3D anatomical muscle model. Green highlights show primary and assisting muscle focus. The workout summary identifies planned or completed status.");
    renderer.domElement.setAttribute("aria-describedby", descriptionId);
    element.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minZoom = .8;
    controls.maxZoom = 3;
    controls.minPolarAngle = Math.PI * .3;
    controls.maxPolarAngle = Math.PI * .7;
    scene.add(new THREE.HemisphereLight(0xf4f5f7, 0x98949b, 1.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(-3, 3, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -1.5; key.shadow.camera.right = 1.5; key.shadow.camera.top = 1.5; key.shadow.camera.bottom = -1.5; key.shadow.normalBias = .008;
    key.shadow.camera.updateProjectionMatrix();
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc5e5e3, 1.2); fill.position.set(3, 1, -3); scene.add(fill);
    // Equal neutral softboxes avoid a dark or cool-tinted half of the face.
    const portraitFill = new THREE.DirectionalLight(0xffffff, 1.3); portraitFill.position.set(3, 3, 5); scene.add(portraitFill);
    const front = new THREE.DirectionalLight(0xffffff, .8); front.position.set(0, 1, 4); scene.add(front);
    const meshes: THREE.Mesh[] = [];
    let upperBody = false;
    const render = () => { if (!disposed) renderer.render(scene, camera); };
    const resize = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const frameHeight = upperBody ? 1.34 : 2.32;
      camera.top = frameHeight/2;
      camera.bottom = -frameHeight/2;
      camera.left = -frameHeight/2*width/height;
      camera.right = frameHeight/2*width/height;
      camera.updateProjectionMatrix();
      render();
    };
    const paint = () => {
      const groups = new Map(current.current.muscles.map(group => [group.id, group]));
      let highlighted = 0;
      meshes.forEach(mesh => {
        const group = mesh.userData.muscle as MuscleGroup | undefined;
        const load = group ? groups.get(group) : undefined;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (load && materials.some(material => material.userData.tissue)) highlighted++;
        materials.forEach(base => {
          const material = base as THREE.MeshStandardMaterial;
          if (!material.color) return;
          const tissue = material.userData.tissue;
          material.color.set(load && tissue ? (load.primarySets ? "#20cf60" : "#9aebb4") : material.userData.neutral);
          material.emissive.set(load && tissue ? (load.primarySets ? "#12ad45" : "#79d998") : "#000000");
          material.emissiveIntensity = load && tissue ? (group === current.current.selected ? (load.primarySets ? .58 : .3) : load.primarySets ? .38 : .12) : 0;
        });
      });
      element.dataset.highlightedCount = String(highlighted);
      render();
    };
    const rotate = (angle: number) => {
      const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(controls.target).add(offset);
      controls.update(); setView("free"); render();
    };
    const setCamera = (back: boolean) => {
      const targetHeight = upperBody ? .5 : 0;
      camera.up.set(0, 1, 0);
      camera.zoom = 1;
      camera.position.set(0, targetHeight, back ? -4.1 : 4.1);
      controls.target.set(0, targetHeight, 0);
      controls.update(); resize();
    };
    api.current = {
      paint, rotate,
      view: back => { setCamera(back); setView(back ? "back" : "front"); },
      frame: upper => { upperBody = upper; setFraming(upper ? "upper" : "full"); setCamera(camera.position.z < 0); },
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); rotate(event.key === "ArrowLeft" ? -.3 : .3); }
      if (event.key === "Home") { event.preventDefault(); api.current?.frame(false); api.current?.view(false); }
    };
    let pointerStart = { x: 0, y: 0 };
    const pointerdown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const pointerup = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) { setView("free"); return; }
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const group = ray.intersectObjects(meshes, false)[0]?.object.userData.muscle as MuscleGroup | undefined;
      if (group && current.current.muscles.some(load => load.id === group)) current.current.onSelect(group);
    };
    const contextLost = (event: Event) => { event.preventDefault(); setState("unavailable"); };
    renderer.domElement.addEventListener("keydown", keydown);
    renderer.domElement.addEventListener("pointerdown", pointerdown);
    renderer.domElement.addEventListener("pointerup", pointerup);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    controls.addEventListener("change", render);
    const observer = new ResizeObserver(resize); observer.observe(element); resize();

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    Promise.all([
      fetch("/anatomy/male.glb", { signal: controller.signal }).then(response => { if (!response.ok) throw new Error("Model unavailable"); return response.arrayBuffer(); }),
      fetch("/anatomy/manifest.json", { signal: controller.signal }).then(response => { if (!response.ok) throw new Error("Muscle regions unavailable"); return response.json() as Promise<{ regions: Region[] }>; }),
    ]).then(async ([buffer, manifest]) => {
      const gltf = await loader.parseAsync(buffer, "/anatomy/");
      if (disposed) { disposeModel(gltf.scene); return; }
      const surface = createMuscleSurface(renderer.capabilities.getMaxAnisotropy());
      const sourceGeometries = new Set<THREE.BufferGeometry>();
      const sourceMaterials = new Set<THREE.Material>();
      const groups = new Map(manifest.regions.flatMap(region => region.meshNames.map(name => [name, region.muscle] as const)));
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse(object => {
        if (!(object as THREE.Mesh).isMesh) return;
        const mesh = object as THREE.Mesh;
        let node: THREE.Object3D | null = mesh;
        while (node && !groups.has(node.name)) node = node.parent;
        mesh.userData.muscle = node ? groups.get(node.name) : undefined;
        sourceGeometries.add(mesh.geometry);
        mesh.geometry = mesh.geometry.clone();
        if (mesh.userData.muscle) {
          addMuscleFiberCoordinates(mesh, mesh.userData.muscle);
        }
        mesh.castShadow = true; mesh.receiveShadow = true;
        const original = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const materials = original.map(base => {
          sourceMaterials.add(base);
          const material = base.clone() as THREE.MeshStandardMaterial;
          const tissue = /muscle/i.test(base.name);
          material.userData = { tissue, neutral: tissue ? "#ae5c53" : material.color ? `#${material.color.getHexString()}` : "#e9e1d3" };
          if (material.color) { material.color.set(material.userData.neutral); material.roughness = tissue ? .48 : .55; material.metalness = 0; }
          if (mesh.userData.muscle) {
            if (tissue) material.map = surface.map;
            material.bumpMap = surface.bump;
            material.bumpScale = tissue ? .0012 : .00025;
          }
          return material;
        });
        matchHeadSurface(mesh, materials);
        mesh.material = materials.length === 1 ? materials[0] : materials;
        meshes.push(mesh);
      });
      sourceGeometries.forEach(geometry => geometry.dispose());
      sourceMaterials.forEach(material => material.dispose());
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const group = new THREE.Group(); group.add(gltf.scene); gltf.scene.position.sub(center);
      scene.add(group);
      setCamera(false);
      element.dataset.meshCount = String(meshes.length);
      element.dataset.surfaceDetail = "muscle-fibers";
      setState("ready"); paint();
    }).catch(() => { if (!disposed) setState("unavailable"); });

    return () => {
      disposed = true; controller.abort(); observer.disconnect(); controls.dispose(); api.current = null;
      renderer.domElement.removeEventListener("keydown", keydown);
      renderer.domElement.removeEventListener("pointerdown", pointerdown);
      renderer.domElement.removeEventListener("pointerup", pointerup);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      disposeModel(scene); key.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [descriptionId]);

  useEffect(() => { api.current?.paint(); }, [muscles, selected]);
  return <div className="muscle-viewer" data-view={view} data-framing={framing}>
    <div className="muscle-framing-controls" aria-label="Model framing"><button type="button" disabled={state !== "ready"} aria-pressed={framing === "full"} onClick={() => api.current?.frame(false)}>Full body</button><button type="button" disabled={state !== "ready"} aria-pressed={framing === "upper"} onClick={() => api.current?.frame(true)}>Upper body</button></div>
    <div ref={host} className="muscle-stage" data-model-state={state}>
      {state === "loading" && <div className="muscle-viewer-loading" role="status">Loading 3D anatomy…</div>}
      {state === "unavailable" && <div className="muscle-viewer-fallback"><img src="/images/anatomy-front.png" alt="Front anatomy reference" /><p>3D is unavailable on this device. Your trained muscles are listed alongside.</p></div>}
    </div>
    <div className="muscle-view-controls" aria-label="Model view controls">
      <button type="button" aria-label="Rotate model left" disabled={state !== "ready"} onClick={() => api.current?.rotate(-.35)}><ArrowLeft size={17} /></button>
      <button type="button" aria-pressed={view === "front"} disabled={state !== "ready"} onClick={() => api.current?.view(false)}>Front</button>
      <button type="button" aria-pressed={view === "back"} disabled={state !== "ready"} onClick={() => api.current?.view(true)}>Back</button>
      <button type="button" aria-label="Reset model view" disabled={state !== "ready"} onClick={() => { api.current?.frame(false); api.current?.view(false); }}><RotateCcw size={17} /></button>
      <button type="button" aria-label="Rotate model right" disabled={state !== "ready"} onClick={() => api.current?.rotate(.35)}><ArrowRight size={17} /></button>
    </div>
    <p className="muscle-view-hint" id={descriptionId}>Drag to rotate · Pinch or scroll to zoom · Arrow keys to turn · Home to reset{selected ? ` · ${muscleLabels[selected]}` : ""}</p>
  </div>;
}

function disposeModel(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh; mesh.geometry.dispose();
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
      materials.add(material);
      Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    });
  });
  textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose());
}
