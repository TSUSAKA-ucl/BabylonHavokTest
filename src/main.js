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
  const groundMat = new BABYLON.StandardMaterial('gmat', scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
  ground.material = groundMat;

  // 箱
  const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
  box.position.y = 3;
  const boxAggregate = new BABYLON.PhysicsAggregate(
    box,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 1, restitution: 0.7 },
    scene
  );
  const boxMat = new BABYLON.StandardMaterial('bmat', scene);
  boxMat.diffuseColor = new BABYLON.Color3(0.95, 0.0, 0.0);
  box.material = boxMat;

  // XR (VR) エクスペリエンス
  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [ground]
  });

  // VR コントローラ追従サンプル（右手に箱を追従させる）
  xr.input.onControllerAddedObservable.add((controller) => {
    console.log('Controller added:', controller.uniqueId);
    controller.onMotionControllerInitObservable.add((motionController) => {
      // motionController.onMeshLoadedObservable.add((model) => {});
      // const xr_ids = motionController.getComponentIds();
      // for (let i=0;i<xr_ids.length;i++){
      // 	console.log(controller.uniqueId + "::"+xr_ids[i]);
      // }
      if (controller.uniqueId === 'controller-0-tracked-pointer-right') {
	const squeezeComponent = motionController.getComponent("xr-standard-squeeze");
	console.log('squeezeComponent:'+squeezeComponent);
	if (squeezeComponent.isButton()) {
	  console.log('squeezeComponent has a button value');
	}
	if (squeezeComponent.isAxes()) {
	  console.log('squeezeComponent has axes data');
	}
	
	const controllerMesh = BABYLON.MeshBuilder.CreateSphere('ctrl-'+controller.uniqueId,
								{diameter: 1.2}, scene);
	// attach to grip if present
	controllerMesh.parent = controller.grip || controller.pointer;
	controllerMesh.position = new BABYLON.Vector3(0,0,0);

	if (controller.inputSource && controller.inputSource.hand) {
	  console.log("Hand tracking controller detected!");
	}
	// 将来的に掴み/放す処理を追加可能
	// box をコントローラに追従させる
	scene.onBeforeRenderObservable.add(() => {
	  // console.log('squeeze button value:'+squeezeComponent.value);
	  if (squeezeComponent.value > 0.75) {
	    if (controller.grip) {
	      box.position.copyFrom(controller.grip.position);
	      box.rotationQuaternion = controller.grip.rotationQuaternion;
	    }
 // else if (controller.pointer) {
 // 	      box.position.copyFrom(controller.pointer.position);
 // 	      box.rotationQuaternion = controller.pointer.rotationQuaternion;
 // 	    }
	  }
	});
      }
    });
  });

  engine.runRenderLoop(() => scene.render());
}

initScene();
