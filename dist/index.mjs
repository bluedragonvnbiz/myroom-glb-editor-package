// src/GlbEditor.tsx
import { useEffect, useRef } from "react";
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader, Color4, Texture, StandardMaterial, Mesh, VertexBuffer, VertexData } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { jsx } from "react/jsx-runtime";
var GlbEditor = ({ glbBlob, imageURL, onMeshSelected, className = "glb-canvas", style }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const selectedMeshRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    imageURL;
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    engineRef.current = engine;
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);
    sceneRef.current = scene;
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 5, Vector3.Zero(), scene);
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
          selectedMeshRef.current?.setEnabled(true);
          selectedMeshRef.current = mesh;
          applyTextureToMesh(pickResult.faceId, mesh, imageURL ?? "/sample-texture.png", scene);
          selectedMeshRef.current?.setEnabled(false);
          if (onMeshSelected) {
            onMeshSelected(mesh.name, pickResult.faceId);
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
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref: canvasRef,
      className,
      style
    }
  );
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
function createMeshFromPoints(name, points, normal, scene) {
  if (points.length === 0) {
    return;
  }
  normal.normalize();
  let helper = Math.abs(normal.y) > 0.9 ? Vector3.Right() : Vector3.Up();
  let u = Vector3.Cross(normal, helper).normalize();
  let v = Vector3.Cross(normal, u).normalize();
  let minU = Infinity, maxU = -Infinity;
  let minV = Infinity, maxV = -Infinity;
  points.forEach((p) => {
    let dotU = Vector3.Dot(p, u);
    let dotV = Vector3.Dot(p, v);
    minU = Math.min(minU, dotU);
    maxU = Math.max(maxU, dotU);
    minV = Math.min(minV, dotV);
    maxV = Math.max(maxV, dotV);
  });
  let avgDist = 0;
  points.forEach((p) => avgDist += Vector3.Dot(p, normal));
  avgDist /= points.length;
  let planeOffset = normal.scale(avgDist);
  const corners = [
    u.scale(minU).add(v.scale(minV)).add(planeOffset),
    // Bottom-Left
    u.scale(maxU).add(v.scale(minV)).add(planeOffset),
    // Bottom-Right
    u.scale(maxU).add(v.scale(maxV)).add(planeOffset),
    // Top-Right
    u.scale(minU).add(v.scale(maxV)).add(planeOffset)
    // Top-Left
  ];
  const positions = [
    corners[0].x,
    corners[0].y,
    corners[0].z,
    corners[1].x,
    corners[1].y,
    corners[1].z,
    corners[2].x,
    corners[2].y,
    corners[2].z,
    corners[3].x,
    corners[3].y,
    corners[3].z
  ];
  const indices = [0, 1, 2, 0, 2, 3];
  const uvs = [1, 1, 0, 1, 0, 0, 1, 0];
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uvs;
  const normals = [];
  VertexData.ComputeNormals(positions, indices, normals);
  vertexData.normals = normals;
  const customMesh = new Mesh(name, scene);
  vertexData.applyToMesh(customMesh);
  return customMesh;
}
function applyTextureToMesh(faceId, placeHolderMesh, imageURL, scene) {
  const vertices = [];
  const positions = placeHolderMesh.getVerticesData(VertexBuffer.PositionKind) ?? [];
  if (positions) {
    for (let i = 0; i < positions.length; i += 3) {
      vertices.push(Vector3.FromArray(positions, i));
    }
  }
  const indices = placeHolderMesh.getIndices() ?? [];
  const v0 = vertices[indices[faceId * 3]];
  const v1 = vertices[indices[faceId * 3 + 1]];
  const v2 = vertices[indices[faceId * 3 + 2]];
  const normal = Vector3.Cross(v1.subtract(v0), v2.subtract(v0));
  normal.normalize();
  const pointsOnPlane = [];
  for (let i = 0; i < vertices.length; i++) {
    if (Math.abs(vertices[i].subtract(v0).dot(normal)) < 1e-4) {
      pointsOnPlane.push(vertices[i]);
    }
  }
  const existingPlane = scene.getMeshByName(`${placeHolderMesh.name}_thumbnail`);
  if (existingPlane) {
    existingPlane.dispose();
  }
  const targetPlane = createMeshFromPoints(`${placeHolderMesh.name}_thumbnail`, pointsOnPlane, normal, scene);
  if (targetPlane) {
    targetPlane.parent = placeHolderMesh.parent;
    targetPlane.scaling = placeHolderMesh.scaling.clone();
    if (placeHolderMesh.rotationQuaternion) {
      targetPlane.rotationQuaternion = placeHolderMesh.rotationQuaternion.clone();
    } else {
      targetPlane.rotation = placeHolderMesh.rotation.clone();
    }
    const targetPlaneMaterial = new StandardMaterial(`${placeHolderMesh.name}_thumbnail_material`, scene);
    targetPlaneMaterial.backFaceCulling = false;
    if (imageURL) {
      targetPlaneMaterial.diffuseTexture = new Texture(imageURL, scene);
    }
    targetPlane.material = targetPlaneMaterial;
    targetPlane.position = placeHolderMesh.position;
    targetPlane.computeWorldMatrix(true);
    targetPlane.isPickable = false;
  }
}
var GlbEditor_default = GlbEditor;
export {
  GlbEditor_default as GlbEditor
};
