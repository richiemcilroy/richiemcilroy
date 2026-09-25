import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { PlacedLine } from "../knockout";
import {
  blackMaterial,
  createEnvironment,
  createRenderer,
  filmTexture,
  letterGeometry,
  letterSize,
  screenFilmMaterial,
  setFilmSize,
} from "./film";

// "Say hello" as heavy blocks you can pick up and throw. Physics runs in
// metres-ish units (1 unit = 100px) because the solver is happiest there.

const UNIT = 100;
const FOV = 20;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

type Block = {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  home: CANNON.Vec3;
  order: number;
};

export class PlaygroundScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 1, 50000);
  private film: THREE.VideoTexture;
  private grey: THREE.ShaderMaterial;
  private colour: THREE.ShaderMaterial;
  private black: THREE.MeshPhysicalMaterial;
  private light = new THREE.PointLight(0xffffff, 4, 0, 0);
  private world = new CANNON.World({ gravity: new CANNON.Vec3(0, -32, 0) });
  private walls: CANNON.Body[] = [];
  private blocks: Block[] = [];
  private hand = new CANNON.Body({ type: CANNON.Body.KINEMATIC });
  private grip: CANNON.PointToPointConstraint | null = null;
  private held: Block | null = null;
  private gripPlane = new THREE.Plane();
  private raycaster = new THREE.Raycaster();
  private width = 0;
  private height = 0;
  private droppedAt: number | null = null;
  private lastTime = 0;
  private lightTarget = new THREE.Vector3(0, 0, 500);

  constructor(
    canvas: HTMLCanvasElement,
    private video: HTMLVideoElement,
    lines: PlacedLine[],
  ) {
    this.renderer = createRenderer(canvas);
    this.renderer.setClearColor(0x000000, 1);
    this.film = filmTexture(video);
    this.grey = screenFilmMaterial(this.film);
    this.colour = screenFilmMaterial(this.film);
    this.colour.uniforms.uSaturation.value = 1.2;
    this.colour.uniforms.uContrast.value = 1;
    this.black = blackMaterial(createEnvironment(this.renderer));
    this.scene.add(this.light);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-1, 1.5, 1);
    this.scene.add(rim);

    this.world.allowSleep = true;
    (this.world.solver as CANNON.GSSolver).iterations = 20;
    this.world.defaultContactMaterial.friction = 0.6;
    this.world.defaultContactMaterial.restitution = 0.12;
    this.hand.collisionFilterGroup = 0;
    this.hand.collisionFilterMask = 0;
    this.world.addBody(this.hand);

    for (const line of [...lines.keys()].reverse()) {
      lines[line].line.glyphs.forEach((glyph) => {
        const mesh = new THREE.Mesh(letterGeometry(glyph), [
          this.grey,
          this.black,
        ]);
        mesh.visible = false;
        this.scene.add(mesh);
        const body = new CANNON.Body({
          mass: 1,
          linearDamping: 0.05,
          angularDamping: 0.3,
          sleepSpeedLimit: 0.2,
        });
        this.world.addBody(body);
        this.blocks.push({ mesh, body, home: new CANNON.Vec3(), order: 0 });
      });
    }
  }

  layout(width: number, height: number, lines: PlacedLine[]) {
    // Only a real change of size may rebuild the world; anything else would
    // snap thrown letters back into place.
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.set(0, 0, height / 2 / TAN);
    this.camera.far = this.camera.position.z * 20;
    this.camera.updateProjectionMatrix();
    setFilmSize(this.grey, this.renderer, this.video);
    setFilmSize(this.colour, this.renderer, this.video);

    let i = 0;
    const scale = lines[0].scale;
    for (const line of [...lines.keys()].reverse()) {
      const placed = lines[line];
      for (const glyph of placed.line.glyphs) {
        const block = this.blocks[i++];
        const size = letterSize(glyph);
        const x = placed.x + ((glyph.x1 + glyph.x2) / 2) * placed.scale;
        const y = placed.baseline - placed.height / 2;
        block.home.set((x - width / 2) / UNIT, (height / 2 - y) / UNIT, 0);
        block.mesh.scale.setScalar(placed.scale);
        block.body.shapes = [];
        block.body.shapeOffsets = [];
        block.body.shapeOrientations = [];
        const half = new CANNON.Vec3(
          (size.width * placed.scale) / 2 / UNIT,
          (size.height * placed.scale) / 2 / UNIT,
          (size.depth * placed.scale) / 2 / UNIT,
        );
        block.body.addShape(new CANNON.Box(half));
        block.body.mass = half.x * half.y * half.z * 8;
        block.body.updateMassProperties();
      }
    }

    // A floor at the foot of HELLO, walls at the screen edges, and a thin
    // slab front to back so nothing tumbles into the camera.
    for (const wall of this.walls) this.world.removeBody(wall);
    this.walls = [];
    const helloBase = lines[lines.length - 1].baseline;
    const floor = (height / 2 - helloBase) / UNIT;
    const slab = (letterSize(lines[0].line.glyphs[0]).depth * scale) / UNIT;
    const add = (normal: CANNON.Vec3, point: CANNON.Vec3) => {
      const body = new CANNON.Body({ type: CANNON.Body.STATIC });
      const plane = new CANNON.Plane();
      body.addShape(plane);
      body.quaternion.setFromVectors(new CANNON.Vec3(0, 0, 1), normal);
      body.position.copy(point);
      this.world.addBody(body);
      this.walls.push(body);
    };
    const halfW = width / 2 / UNIT;
    add(new CANNON.Vec3(0, 1, 0), new CANNON.Vec3(0, floor, 0));
    add(new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(-halfW, 0, 0));
    add(new CANNON.Vec3(-1, 0, 0), new CANNON.Vec3(halfW, 0, 0));
    add(new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, -slab * 1.1));
    add(new CANNON.Vec3(0, 0, -1), new CANNON.Vec3(0, 0, slab * 1.1));

    // Kerning tucks letters into each other, which solid blocks can't do.
    // Space each row so no two blocks overlap, then centre it again.
    const rows = new Map<number, Block[]>();
    for (const block of this.blocks) {
      const key = Math.round(block.home.y * 10);
      rows.set(key, [...(rows.get(key) ?? []), block]);
    }
    const gap = 6 / UNIT;
    for (const row of rows.values()) {
      row.sort((a, b) => a.home.x - b.home.x);
      const half = (block: Block) =>
        (block.body.shapes[0] as CANNON.Box).halfExtents.x;
      const before = (row[0].home.x + row[row.length - 1].home.x) / 2;
      for (let i = 1; i < row.length; i++) {
        const min = row[i - 1].home.x + half(row[i - 1]) + half(row[i]) + gap;
        if (row[i].home.x < min) row[i].home.x = min;
      }
      const shift = before - (row[0].home.x + row[row.length - 1].home.x) / 2;
      for (const block of row) block.home.x += shift;
    }

    // Bottom row first, then left to right, so each letter has somewhere
    // to land.
    [...this.blocks]
      .sort((a, b) => a.home.y - b.home.y || a.home.x - b.home.x)
      .forEach((block, rank) => {
        block.order = rank;
      });

    if (this.droppedAt !== null) this.settle();
  }

  // Drops the letters in from above the screen, HELLO first.
  drop(now: number, instant = false) {
    this.droppedAt = now;
    const lift = this.height / UNIT;
    for (const block of this.blocks) {
      const { body, home, order } = block;
      body.position.set(
        home.x,
        instant ? home.y : home.y + lift + order * 0.55,
        home.z,
      );
      body.quaternion.set(0, 0, 0, 1);
      body.velocity.setZero();
      body.angularVelocity.setZero();
      body.wakeUp();
      block.mesh.visible = true;
    }
  }

  // Puts every letter back in place without the fall.
  private settle() {
    for (const block of this.blocks) {
      block.body.position.copy(block.home);
      block.body.quaternion.set(0, 0, 0, 1);
      block.body.velocity.setZero();
      block.body.angularVelocity.setZero();
    }
  }

  // Letters still falling, tumbling, or held.
  get awake() {
    return (
      this.grip !== null ||
      this.blocks.some(
        (block) => block.body.sleepState !== CANNON.Body.SLEEPING,
      )
    );
  }

  get dropped() {
    return this.droppedAt !== null;
  }

  private pick(x: number, y: number) {
    const ndc = new THREE.Vector2(
      (x / this.width) * 2 - 1,
      -(y / this.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.blocks.map((block) => block.mesh),
    );
    if (!hits.length) return null;
    const block = this.blocks.find((b) => b.mesh === hits[0].object) ?? null;
    return block ? { block, point: hits[0].point } : null;
  }

  hovering(x: number, y: number) {
    return this.pick(x, y) !== null;
  }

  grab(x: number, y: number) {
    const hit = this.pick(x, y);
    if (!hit) return false;
    const { block, point } = hit;
    const at = new CANNON.Vec3(point.x / UNIT, point.y / UNIT, point.z / UNIT);
    this.hand.position.copy(at);
    const local = block.body.pointToLocalFrame(at);
    this.grip = new CANNON.PointToPointConstraint(
      block.body,
      local,
      this.hand,
      new CANNON.Vec3(0, 0, 0),
      40,
    );
    this.world.addConstraint(this.grip);
    this.gripPlane.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 0, 1),
      point,
    );
    block.body.wakeUp();
    block.mesh.material = [this.colour, this.black];
    this.held = block;
    return true;
  }

  move(x: number, y: number) {
    if (!this.grip) return;
    const ndc = new THREE.Vector2(
      (x / this.width) * 2 - 1,
      -(y / this.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.gripPlane, target)) {
      this.hand.position.set(target.x / UNIT, target.y / UNIT, target.z / UNIT);
    }
  }

  release() {
    if (this.grip) this.world.removeConstraint(this.grip);
    this.grip = null;
    if (this.held) this.held.mesh.material = [this.grey, this.black];
    this.held = null;
  }

  // A flick for touch screens, where dragging would fight scrolling.
  flick(x: number, y: number) {
    const hit = this.pick(x, y);
    if (!hit) return false;
    const { body } = hit.block;
    body.wakeUp();
    body.applyImpulse(
      new CANNON.Vec3((Math.random() - 0.5) * 4, 14, 0).scale(body.mass),
      new CANNON.Vec3(
        hit.point.x / UNIT,
        hit.point.y / UNIT,
        hit.point.z / UNIT,
      ),
    );
    return true;
  }

  // Returns true while anything is still moving: letters, or the light.
  render(now: number, pointer: { x: number; y: number; active: boolean }) {
    const dt = Math.min(
      0.05,
      this.lastTime ? (now - this.lastTime) / 1000 : 1 / 60,
    );
    this.lastTime = now;
    const awake = this.blocks.some(
      (block) => block.body.sleepState !== CANNON.Body.SLEEPING,
    );
    if (this.droppedAt !== null && (awake || this.grip)) {
      this.world.step(1 / 120, dt, 8);
    }

    for (const block of this.blocks) {
      block.mesh.position.set(
        block.body.position.x * UNIT,
        block.body.position.y * UNIT,
        block.body.position.z * UNIT,
      );
      block.mesh.quaternion.set(
        block.body.quaternion.x,
        block.body.quaternion.y,
        block.body.quaternion.z,
        block.body.quaternion.w,
      );
    }

    if (this.video.videoWidth) {
      this.grey.uniforms.uFilmSize.value.set(
        this.video.videoWidth,
        this.video.videoHeight,
      );
      this.colour.uniforms.uFilmSize.value.copy(
        this.grey.uniforms.uFilmSize.value,
      );
    }

    const ease = 1 - Math.exp(-dt * 8);
    if (pointer.active) {
      this.lightTarget.set(
        pointer.x - this.width / 2,
        this.height / 2 - pointer.y,
        500,
      );
    }
    const lightMoving = this.light.position.distanceTo(this.lightTarget) > 0.5;
    this.light.position.lerp(this.lightTarget, ease);
    this.light.distance = Math.max(this.width, this.height);

    this.renderer.render(this.scene, this.camera);
    return awake || lightMoving || this.grip !== null;
  }

  dispose() {
    this.release();
    this.film.dispose();
    this.grey.dispose();
    this.colour.dispose();
    this.black.envMap?.dispose();
    this.black.dispose();
    this.renderer.dispose();
  }
}
