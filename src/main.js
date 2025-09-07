import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/materials";

// npm 側で import しても、Vite はバンドルしない
import HavokPhysics from "@babylonjs/havok";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

async function initScene() {
  const scene = new BABYLON.Scene(engine);

  // Havok 初期化
  const havokInstance = await HavokPhysics();
  globalThis.HK = havokInstance;
  const plugin = new BABYLON.HavokPlugin(true, havokInstance);
  scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), plugin);

  // カメラ・ライト
  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI/2, Math.PI/3, 6, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 床
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundAggregate = new BABYLON.PhysicsAggregate(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.5 },
    scene
  );

  // 箱
  const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
  box.position.y = 3;
  const boxAggregate = new BABYLON.PhysicsAggregate(
    box,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 1, restitution: 0.7 },
    scene
  );

  // XR (VR) エクスペリエンス
  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [ground]
  });

  // VR コントローラ追従サンプル（右手に箱を追従させる）
  xr.input.onControllerAddedObservable.add((controller) => {
    if (controller.inputSource.handedness === "right") {
      controller.grip.position = box.position.clone();
      controller.grip.rotationQuaternion = box.rotationQuaternion?.clone() ?? BABYLON.Quaternion.Identity();
      // 将来的に掴み/放す処理を追加可能
    }
  });

  engine.runRenderLoop(() => scene.render());
}

initScene();
