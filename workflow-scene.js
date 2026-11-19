import {
  BoxGeometry, Color, DirectionalLight, ExtrudeGeometry, Group, HemisphereLight,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera, Scene, Shape,
  ShapeGeometry, WebGLRenderer
} from "./vendor/three-renderer-r186.js";

function cardGeometry() {
  const shape = new Shape();
  const x = .77;
  const y = .31;
  const radius = .12;
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  return new ExtrudeGeometry(shape, {
    depth: .09, bevelThickness: .04, bevelSize: .035, bevelSegments: 2, curveSegments: 5
  });
}

function attachIcon(stage, index, material, unitBar, triangle) {
  function stroke(x, y, width, lengthwiseAngle = 0) {
    const bar = new Mesh(unitBar, material);
    bar.position.set(x, y, .153);
    bar.scale.set(width, .046, .026);
    bar.rotation.z = lengthwiseAngle;
    stage.add(bar);
  }

  if (index === 0) {
    stroke(-.03, .12, .58);
    stroke(-.09, 0, .46);
    stroke(-.16, -.12, .32);
  } else if (index === 1) {
    const play = new Mesh(triangle, material);
    play.position.z = .153;
    stage.add(play);
  } else {
    stroke(-.08, -.05, .5);
    stroke(.07, .046, .27, -.78);
    stroke(.07, -.146, .27, .78);
  }
}

export function mountWorkflowScene(host, canvas, context, selected, reducedMotion) {
  const renderer = new WebGLRenderer({ canvas, context, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 30);
  camera.position.set(2.4, 1.65, 5.7);
  camera.lookAt(0, -.02, 0);
  const stack = new Group();
  scene.add(stack);
  scene.add(new HemisphereLight(0xe9f2ff, 0x354976, 2.25));
  const keyLight = new DirectionalLight(0xdeebff, 2.1);
  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);

  const plate = cardGeometry();
  const unitBar = new BoxGeometry(1, 1, 1);
  const triangleShape = new Shape();
  triangleShape.moveTo(-.16, -.17);
  triangleShape.lineTo(.19, 0);
  triangleShape.lineTo(-.16, .17);
  triangleShape.closePath();
  const triangle = new ShapeGeometry(triangleShape);
  const ink = new MeshBasicMaterial({ color: 0xe3edff });
  const resting = new Color(0x243858);
  const chosen = new Color(0x366aff);
  const stages = Array.from({ length: 3 }, (_, index) => {
    const node = new Group();
    const finish = new MeshStandardMaterial({ color: resting, roughness: .44, metalness: .16 });
    const card = new Mesh(plate, finish);
    node.add(card);
    node.position.set((index - 1) * .29, (1 - index) * .77, (index - 1) * .23);
    node.rotation.z = .075;
    attachIcon(node, index, ink, unitBar, triangle);
    stack.add(node);
    return { node, finish, progress: index === selected ? 1 : 0, depth: node.position.z };
  });

  let frame = null;
  let tilt = 0;
  let pointer = null;
  let previousX = 0;
  let disposed = false;
  const events = new AbortController();
  const options = { signal: events.signal };

  function draw() {
    frame = null;
    const blend = reducedMotion.matches ? 1 : .22;
    let moving = Math.abs(stack.rotation.y - tilt) > .001;
    stack.rotation.y += (tilt - stack.rotation.y) * blend;
    for (const [index, stage] of stages.entries()) {
      const target = index === selected ? 1 : 0;
      const difference = target - stage.progress;
      if (Math.abs(difference) > .001) {
        stage.progress += difference * blend;
        moving = true;
      } else {
        stage.progress = target;
      }
      stage.node.position.z = stage.depth + stage.progress * .44;
      stage.node.scale.setScalar(1 + stage.progress * .065);
      stage.finish.color.lerpColors(resting, chosen, stage.progress);
    }
    renderer.render(scene, camera);
    if (moving && !reducedMotion.matches) invalidate();
  }

  function invalidate() {
    if (frame === null && !disposed) frame = requestAnimationFrame(draw);
  }

  function fit() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = Math.max(1.52, 1.33 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  fit();
  draw();
  host.dataset.rendered = "true";
  const observer = "ResizeObserver" in window ? new ResizeObserver(() => {
    fit();
    invalidate();
  }) : null;
  if (observer) observer.observe(host);
  else window.addEventListener("resize", () => {
    fit();
    invalidate();
  }, options);

  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = event.pointerId;
    previousX = event.clientX;
    canvas.setPointerCapture(pointer);
  }, options);
  canvas.addEventListener("pointermove", event => {
    if (event.pointerId !== pointer) return;
    tilt = Math.max(-.66, Math.min(.66, tilt + (event.clientX - previousX) * .012));
    previousX = event.clientX;
    invalidate();
  }, options);
  canvas.addEventListener("lostpointercapture", event => {
    if (event.pointerId === pointer) pointer = null;
  }, options);
  canvas.addEventListener("webglcontextlost", () => {
    disposed = true;
    delete host.dataset.rendered;
    events.abort();
    observer?.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    for (const item of [plate, unitBar, triangle, ink, ...stages.map(stage => stage.finish)]) item.dispose();
    renderer.dispose();
  }, options);

  return {
    select(index) {
      selected = index;
      invalidate();
    }
  };
}
