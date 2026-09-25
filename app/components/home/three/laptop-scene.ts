import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createEnvironment, createRenderer, filmTexture } from "./film";

// The film was a recording of a laptop; at the end of the intro it turns out
// to be playing on one. The screen starts exactly where the 2D window was,
// facing the camera, then the camera swings round and the lid closes.
//
// Model: "macbook pro M3 16 inch 2024" by jackbaeten
// (https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4),
// CC BY 4.0. Compressed, recoloured to Space Black, and the Apple logo
// replaced with Cap's mark.

const MODEL = "/models/macbook-pro.glb";
const LID = "VCQqxpxkUlzqcJI_62";
const DISPLAY = "Object_123";
const LOGO = "Object_125";
// Where the lid meets the base, and how far the modelled lid leans back.
const HINGE = new THREE.Vector3(0, 0, -12.1);
const UPRIGHT = 0.349;

const FOV = 20;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export type Window = {
  width: number;
  height: number;
  // Screen-space centre of the window, in px from the top of the viewport.
  centerY: number;
  radius: number;
};

export type LaptopFrame = {
  // 0 = so close the display fills the viewport, 1 = the display at the
  // size of the window. The film is on the laptop the whole time.
  reveal: number;
  // 0 = facing the camera flat, 1 = three-quarter view.
  orbit: number;
  // 0 = open, 1 = closed.
  close: number;
  pointer: { x: number; y: number; active: boolean };
};

export class LaptopScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 1, 50000);
  private film: THREE.VideoTexture;
  private screenMaterial: THREE.MeshBasicMaterial;
  private shadow: THREE.Mesh;
  private model = new THREE.Group();
  private pivot: THREE.Group | null = null;
  private display: THREE.Mesh | null = null;
  private target: Window | null = null;
  private width = 1;
  private height = 1;
  private distance = 1;
  private centre = new THREE.Vector3();
  private look = new THREE.Vector3();
  private tilt = new THREE.Vector2();

  constructor(
    canvas: HTMLCanvasElement,
    private video: HTMLVideoElement,
  ) {
    this.renderer = createRenderer(canvas);
    this.renderer.setClearColor(0x000000, 0);
    this.scene.environment = createEnvironment(this.renderer);
    this.film = filmTexture(video);
    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: this.film,
      toneMapped: false,
    });

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-0.5, 1, 0.7);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(1, 0.4, -1);
    this.scene.add(rim);

    // A soft contact shadow to sit the laptop on the page.
    const canvasShadow = document.createElement("canvas");
    canvasShadow.width = 256;
    canvasShadow.height = 256;
    const ctx = canvasShadow.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(0,0,0,0.5)");
      gradient.addColorStop(0.55, "rgba(0,0,0,0.16)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(canvasShadow),
        transparent: true,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    this.scene.add(this.model);
  }

  private loading = false;

  // The model is about 1MB, so it's fetched once the visitor starts
  // scrolling through the intro rather than with the page.
  load() {
    if (this.loading) return;
    this.loading = true;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader
      .loadAsync(MODEL)
      .then((gltf) => this.setup(gltf.scene))
      .catch(() => {});
  }

  get ready() {
    return this.pivot !== null;
  }

  private setup(root: THREE.Group) {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of [object.material].flat()) {
        // Silver aluminium becomes Space Black.
        const standard = material as THREE.MeshStandardMaterial;
        if (
          standard.color &&
          !standard.map &&
          standard.color.r > 0.4 &&
          standard.color.g > 0.4
        ) {
          standard.color.setRGB(0.045, 0.045, 0.05);
          standard.metalness = 0.85;
          standard.roughness = 0.42;
        }
      }
    });

    const lid = root.getObjectByName(LID);
    const display = root.getObjectByName(DISPLAY);
    const logo = root.getObjectByName(LOGO);
    if (!lid || !(display instanceof THREE.Mesh)) return;

    // Hinge the lid: re-parent it under a pivot on the hinge line.
    const pivot = new THREE.Group();
    pivot.position.copy(HINGE);
    root.add(pivot);
    root.updateMatrixWorld(true);
    pivot.attach(lid);
    pivot.rotation.x = UPRIGHT;
    root.updateMatrixWorld(true);

    display.material = this.screenMaterial;

    // Cap's mark in place of Apple's, in the same mirror finish.
    if (logo instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(logo, true);
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.min(size.x, size.y) * 0.46;
      const ring = new THREE.Shape().absarc(0, 0, radius, 0, Math.PI * 2);
      ring.holes.push(
        new THREE.Path().absarc(0, 0, radius * 0.78, 0, Math.PI * 2, true),
      );
      const mark = new THREE.Group();
      mark.add(
        new THREE.Mesh(new THREE.ShapeGeometry(ring, 64), logo.material),
      );
      mark.add(
        new THREE.Mesh(
          new THREE.CircleGeometry(radius * 0.6, 64),
          logo.material,
        ),
      );
      const centre = box.getCenter(new THREE.Vector3());
      mark.position.set(centre.x, centre.y, box.min.z - 0.005);
      mark.rotation.y = Math.PI;
      root.add(mark);
      pivot.attach(mark);
      logo.visible = false;
    }

    this.model.add(root);
    this.pivot = pivot;
    this.display = display;
    if (this.target) this.fit(this.target);
  }

  layout(width: number, height: number, target: Window) {
    this.width = width;
    this.height = height;
    this.target = target;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.distance = height / 2 / TAN;
    // A near plane well away from the camera keeps depth precise.
    this.camera.near = this.distance * 0.05;
    this.camera.far = this.distance * 6;
    this.camera.updateProjectionMatrix();
    this.fitFilm(target);
    this.fit(target);
  }

  // Scale and place the laptop so its upright display sits exactly over the
  // window: its centre on screen, its surface on z = 0, one unit per pixel.
  private fit(target: Window) {
    if (!this.pivot || !this.display) return;
    this.pivot.rotation.x = UPRIGHT;
    this.model.scale.setScalar(1);
    this.model.position.set(0, 0, 0);
    this.model.updateMatrixWorld(true);

    const screen = new THREE.Box3().setFromObject(this.display, true);
    const scale = target.width / (screen.max.x - screen.min.x);
    const middle = screen.getCenter(new THREE.Vector3());
    const centreY = this.height / 2 - target.centerY;
    this.model.scale.setScalar(scale);
    this.model.position.set(
      -middle.x * scale,
      centreY - middle.y * scale,
      -screen.max.z * scale,
    );
    this.model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    this.shadow.scale.set(size.x * 1.3, size.z * 1.5, 1);
    this.shadow.position.set(
      0,
      box.min.y - 0.5,
      (box.min.z + box.max.z) / 2 + size.z * 0.1,
    );
    this.centre.set(0, centreY - target.height * 0.25, box.max.z * 0.35);
  }

  // Crop the film the same way the 2D window does: covered to the whole
  // viewport, then trimmed top and bottom to the window's height.
  private fitFilm(target: Window) {
    const vw = this.video.videoWidth || 1920;
    const vh = this.video.videoHeight || 1080;
    const cover = Math.max(this.width / vw, this.height / vh);
    const shownW = this.width / (vw * cover);
    const scale = target.width / this.width;
    const shownH = target.height / scale / (vh * cover);
    this.film.repeat.set(shownW, shownH);
    this.film.offset.set((1 - shownW) / 2, (1 - shownH) / 2);
  }

  // Returns true while the pointer tilt is still settling.
  render(frame: LaptopFrame) {
    if (!this.pivot || !this.target) return false;
    const { reveal, orbit: t, close, pointer } = frame;

    // Lid: upright to start, leaning back as the camera moves, then shut.
    const open = UPRIGHT - 0.3 * t;
    this.pivot.rotation.x = THREE.MathUtils.lerp(
      open,
      UPRIGHT + Math.PI / 2 - 0.004,
      close,
    );

    // Camera: straight on at the start, so the display lines up with the 2D
    // window, then up and round to a three-quarter view.
    const tx = pointer.active ? pointer.x / this.width - 0.5 : 0;
    const ty = pointer.active ? pointer.y / this.height - 0.5 : 0;
    const settling =
      Math.abs(tx - this.tilt.x) > 1e-4 || Math.abs(ty - this.tilt.y) > 1e-4;
    this.tilt.x += (tx - this.tilt.x) * 0.06;
    this.tilt.y += (ty - this.tilt.y) * 0.06;
    const yaw = THREE.MathUtils.lerp(0, -0.5, t) + this.tilt.x * 0.25 * t;
    const pitch = THREE.MathUtils.lerp(0, 0.4, t) + this.tilt.y * 0.12 * t;
    // A three-quarter view is wider than a straight-on one; pull back more
    // on narrow screens so the laptop still fits.
    const back = this.width < this.height ? 1.8 : 1.15;
    const distance = this.distance * THREE.MathUtils.lerp(1, back, t);

    if (reveal < 1) {
      // Pull back from the display, keeping it as wide as the shrinking
      // window at every step: at 0 it spans the viewport and shows the
      // film exactly as the full-screen video did; at 1 it's the window.
      // Its centre follows the same path the window's did.
      const target = this.target;
      const size = THREE.MathUtils.lerp(this.width / target.width, 1, reveal);
      const centreY = this.height / 2 - target.centerY;
      this.camera.position.set(
        0,
        centreY - (centreY * reveal) / size,
        this.distance / size,
      );
      this.camera.rotation.set(0, 0, 0);
    } else {
      this.look.lerpVectors(new THREE.Vector3(0, 0, 0), this.centre, t);
      this.camera.position.set(
        this.look.x + Math.sin(yaw) * Math.cos(pitch) * distance,
        this.look.y + Math.sin(pitch) * distance,
        this.look.z + Math.cos(yaw) * Math.cos(pitch) * distance,
      );
      this.camera.lookAt(this.look);
    }

    this.renderer.render(this.scene, this.camera);
    return settling;
  }

  dispose() {
    this.model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        for (const material of [object.material].flat()) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          material.dispose();
        }
      }
    });
    this.film.dispose();
    this.screenMaterial.dispose();
    this.shadow.geometry.dispose();
    const material = this.shadow.material as THREE.MeshBasicMaterial;
    material.map?.dispose();
    material.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
