// src/GlbEditor.tsx
import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  SceneLoader,
  Color4
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { jsx } from "react/jsx-runtime";
var GlbEditor = ({
  glbBlob,
  onMeshSelected,
  className = "glb-canvas",
  style
}) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    engineRef.current = engine;
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);
    sceneRef.current = scene;
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      5,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.01;
    camera.lowerRadiusLimit = 0.1;
    camera.upperRadiusLimit = 100;
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 1.2;
    const url = URL.createObjectURL(glbBlob);
    (async () => {
      try {
        const result = await SceneLoader.ImportMeshAsync("", "", url, scene, void 0, ".glb");
        const meshes = result.meshes;
        console.log("Loaded meshes:", meshes.length);
        const validMeshes = meshes.filter((m) => m && m.getTotalVertices() > 0);
        if (validMeshes.length === 0) {
          console.warn("No valid meshes found in GLB");
          return;
        }
        fitModelInFrustum(validMeshes, camera, scene);
        setupMeshSelection(validMeshes, scene, onMeshSelected);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error loading GLB:", error);
        URL.revokeObjectURL(url);
      }
    })();
    scene.onPointerDown = (_evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        const mesh = pickResult.pickedMesh;
        if (mesh.name && mesh.name !== "__root__") {
          console.log("Mesh clicked:", mesh.name);
          if (onMeshSelected) {
            onMeshSelected(mesh.name);
          }
        }
      }
    };
    engine.runRenderLoop(() => {
      scene.render();
    });
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [glbBlob, onMeshSelected]);
  return /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className, style });
};
function fitModelInFrustum(meshes, camera, _scene) {
  if (meshes.length === 0) return;
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  meshes.forEach((mesh) => {
    const boundingInfo = mesh.getBoundingInfo();
    const meshMin = boundingInfo.boundingBox.minimumWorld;
    const meshMax = boundingInfo.boundingBox.maximumWorld;
    min = Vector3.Minimize(min, meshMin);
    max = Vector3.Maximize(max, meshMax);
  });
  const center = Vector3.Center(min, max);
  const size = max.subtract(min);
  const maxDimension = Math.max(size.x, size.y, size.z);
  camera.target = center;
  const distance = maxDimension * 2.5;
  camera.radius = distance;
  camera.lowerRadiusLimit = maxDimension * 0.5;
  camera.upperRadiusLimit = maxDimension * 10;
  console.log("Model fitted:", {
    center: center.asArray(),
    size: size.asArray(),
    maxDimension,
    cameraDistance: distance
  });
}
function setupMeshSelection(meshes, _scene, _onMeshSelected) {
  meshes.forEach((mesh) => {
    mesh.isPickable = true;
    mesh.actionManager = null;
  });
  console.log("Mesh selection enabled for", meshes.length, "meshes");
}
var GlbEditor_default = GlbEditor;
export {
  GlbEditor_default as GlbEditor
};
//# sourceMappingURL=index.mjs.map