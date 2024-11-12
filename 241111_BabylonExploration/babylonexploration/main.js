document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");

  const startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
      if (sceneToRender && sceneToRender.activeCamera) {
        sceneToRender.render();
      }
    });
  };

  let engine = null;
  let scene = null;
  let sceneToRender = null;

  engine.setHardwareScalingLevel(1);

  const createDefaultEngine = function () {
    return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
  };

  const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    // Setup environment
    const light0 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 2, 8), scene);
    const camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 20, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    // Sphere around emitter
    const sphere = BABYLON.MeshBuilder.CreateCylinder("sphere", { height: 1, diameter: 2 }, scene);
    sphere.material = new BABYLON.StandardMaterial("mat", scene);
    sphere.material.wireframe = true;

    // Create a particle system
    const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);

    // Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", scene);

    // Where the particles come from
    particleSystem.emitter = BABYLON.Vector3.Zero(); // the starting location

    // Colors of all particles
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // Size of each particle (random between)
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;

    // Life time of each particle (random between)
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;

    // Emission rate
    particleSystem.emitRate = 1000;

    // Emission Space
    particleSystem.createCylinderEmitter(1, 1, 0, 0);

    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.005;

    // Start the particle system
    particleSystem.start();

    return scene;
  };

  window.initFunction = async function () {
    const asyncEngineCreation = async function () {
      try {
        return createDefaultEngine();
      } catch (e) {
        console.log("The available createEngine function failed. Creating the default engine instead.");
        return createDefaultEngine();
      }
    };

    engine = await asyncEngineCreation();
    if (!engine) throw "Engine should not be null.";
    startRenderLoop(engine, canvas);
    scene = createScene();
  };

  initFunction().then(() => {
    sceneToRender = scene;
  });

  // Resize
  window.addEventListener("resize", function () {
    engine.resize();
  });
});