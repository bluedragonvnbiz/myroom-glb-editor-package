"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  GlbEditor: () => GlbEditor_default
});
module.exports = __toCommonJS(index_exports);

// src/GlbEditor.tsx
var import_react = require("react");
var import_core = require("@babylonjs/core");
var import_glTF = require("@babylonjs/loaders/glTF");
var import_jsx_runtime = require("react/jsx-runtime");
var GlbEditor = ({
  glbBlob,
  onMeshSelected,
  className = "glb-canvas",
  style
}) => {
  const canvasRef = (0, import_react.useRef)(null);
  const engineRef = (0, import_react.useRef)(null);
  const sceneRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!canvasRef.current) return;
    const engine = new import_core.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    engineRef.current = engine;
    const scene = new import_core.Scene(engine);
    scene.clearColor = new import_core.Color4(0.1, 0.1, 0.1, 1);
    sceneRef.current = scene;
    const camera = new import_core.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      5,
      import_core.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.01;
    camera.lowerRadiusLimit = 0.1;
    camera.upperRadiusLimit = 100;
    const light = new import_core.HemisphericLight("light", new import_core.Vector3(0, 1, 0), scene);
    light.intensity = 1.2;
    const url = URL.createObjectURL(glbBlob);
    (async () => {
      try {
        const result = await import_core.SceneLoader.ImportMeshAsync("", "", url, scene, void 0, ".glb");
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", { ref: canvasRef, className, style });
};
function fitModelInFrustum(meshes, camera, _scene) {
  if (meshes.length === 0) return;
  let min = new import_core.Vector3(Infinity, Infinity, Infinity);
  let max = new import_core.Vector3(-Infinity, -Infinity, -Infinity);
  meshes.forEach((mesh) => {
    const boundingInfo = mesh.getBoundingInfo();
    const meshMin = boundingInfo.boundingBox.minimumWorld;
    const meshMax = boundingInfo.boundingBox.maximumWorld;
    min = import_core.Vector3.Minimize(min, meshMin);
    max = import_core.Vector3.Maximize(max, meshMax);
  });
  const center = import_core.Vector3.Center(min, max);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlbEditor
});
//# sourceMappingURL=index.js.map