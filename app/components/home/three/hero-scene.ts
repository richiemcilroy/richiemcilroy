import * as THREE from "three";
import { capHeight } from "@/lib/glyphs";
import type { PlacedLine } from "../knockout";
import {
  blackMaterial,
  createEnvironment,
  createRenderer,
  filmTexture,
  LETTER_DEPTH,
  letterGeometry,
  screenFilmMaterial,
  setFilmSize,
} from "./film";

// The name as a row of black metal slabs. Each front face is a window onto
// the film; the camera dives into the I while the other letters scatter.

type Letter = {
  mesh: THREE.Mesh;
  line: number;
  glyph: number;
  // Resting position inside the name group, and on screen.
  home: THREE.Vector3;
  screen: THREE.Vector2;
  // Where the letter flies when the name breaks apart.
  scatter: THREE.Vector3;
  spin: THREE.Vector3;
  tilt: THREE.Vector3;
  isDoor: boolean;
};

export type HeroFrame = {
  now: number;
  // 0 at rest, 1 once the camera is inside the I.
  zoom: number;
  rise: (line: number, glyph: number) => number;
  pointer: { x: number; y: number; active: boolean };
  reduced: boolean;
};

const FOV = 20;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export class HeroScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 1, 50000);
  private film: THREE.VideoTexture;
  private grey: THREE.ShaderMaterial;
  private door: THREE.ShaderMaterial;
  private metal: THREE.MeshPhysicalMaterial;
  private tiltGroup = new THREE.Group();
  private nameGroup = new THREE.Group();
  private light = new THREE.PointLight(0xffffff, 0, 0, 0);
  private rim = new THREE.DirectionalLight(0xffffff, 0.6);
  private letters: Letter[] = [];
  private width = 1;
  private height = 1;
  private distance = 1;
  private doorWorld = new THREE.Vector3();
  private doorSize = new THREE.Vector2(1, 1);
  private lightPos = new THREE.Vector3(0, 0, 400);
  private lastTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    private video: HTMLVideoElement,
    lines: PlacedLine[],
    doorAt: { line: number; glyph: number },
  ) {
    this.renderer = createRenderer(canvas);
    this.renderer.setClearColor(0x000000, 1);
    this.film = filmTexture(video);
    this.grey = screenFilmMaterial(this.film);
    this.door = screenFilmMaterial(this.film);
    this.door.uniforms.uContrast.value = 1;
    this.metal = blackMaterial(createEnvironment(this.renderer));

    this.scene.add(this.tiltGroup);
    this.tiltGroup.add(this.nameGroup);
    this.scene.add(this.light);
    this.rim.position.set(-1, 1.4, 1.2);
    this.scene.add(this.rim);

    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    lines.forEach((placed, line) => {
      placed.line.glyphs.forEach((glyph, index) => {
        const isDoor = line === doorAt.line && index === doorAt.glyph;
        const mesh = new THREE.Mesh(letterGeometry(glyph), [
          isDoor ? this.door : this.grey,
          this.metal,
        ]);
        mesh.visible = false;
        this.nameGroup.add(mesh);
        this.letters.push({
          mesh,
          line,
          glyph: index,
          home: new THREE.Vector3(),
          screen: new THREE.Vector2(),
          scatter: new THREE.Vector3(
            random() - 0.5,
            random() - 0.5,
            0.6 + random() * 0.8,
          ),
          spin: new THREE.Vector3(
            (random() - 0.5) * 5,
            (random() - 0.5) * 5,
            (random() - 0.5) * 3,
          ),
          tilt: new THREE.Vector3(),
          isDoor,
        });
      });
    });
  }

  layout(width: number, height: number, lines: PlacedLine[], rotate: boolean) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.distance = height / 2 / TAN;
    this.camera.far = this.distance * 20;
    this.camera.updateProjectionMatrix();
    setFilmSize(this.grey, this.renderer, this.video);
    setFilmSize(this.door, this.renderer, this.video);

    // Layout space is the screen, or the screen turned on its side.
    const along = rotate ? height : width;
    const across = rotate ? width : height;
    this.nameGroup.rotation.z = rotate ? Math.PI / 2 : 0;

    for (const letter of this.letters) {
      const placed = lines[letter.line];
      const glyph = placed.line.glyphs[letter.glyph];
      const x = placed.x + ((glyph.x1 + glyph.x2) / 2) * placed.scale;
      const y = placed.baseline - placed.height / 2;
      letter.home.set(
        x - along / 2,
        across / 2 - y,
        -(LETTER_DEPTH / 2 + 14) * placed.scale,
      );
      letter.mesh.scale.setScalar(placed.scale);

      const world = letter.home.clone().applyEuler(this.nameGroup.rotation);
      letter.screen.set(world.x + width / 2, height / 2 - world.y);

      if (letter.isDoor) {
        this.doorWorld.set(world.x, world.y, 0);
        const w = (glyph.x2 - glyph.x1) * placed.scale;
        const h = capHeight * placed.scale;
        this.doorSize.set(rotate ? h : w, rotate ? w : h);
      }
    }
  }

  // True once the film has a frame to show.
  get ready() {
    return this.video.readyState >= 2;
  }

  // Returns true while pointer-driven motion is still settling, so the page
  // knows to keep drawing; otherwise it only redraws for new film frames.
  render(frame: HeroFrame) {
    const { now, zoom, pointer, reduced } = frame;
    const dt = Math.min(0.05, this.lastTime ? (now - this.lastTime) / 1000 : 0);
    this.lastTime = now;
    const ease = 1 - Math.exp(-dt * 7);
    let settling = false;
    const spring = (current: number, target: number, epsilon = 1e-4) => {
      const delta = target - current;
      if (Math.abs(delta) > epsilon) settling = true;
      return current + delta * ease;
    };
    const width = this.width;
    const height = this.height;
    if (this.video.videoWidth) {
      this.grey.uniforms.uFilmSize.value.set(
        this.video.videoWidth,
        this.video.videoHeight,
      );
      this.door.uniforms.uFilmSize.value.copy(
        this.grey.uniforms.uFilmSize.value,
      );
    }

    // The I is richer while it is the only colour, easing to the film's own.
    const handoff = THREE.MathUtils.smoothstep(zoom, 0.4, 0.95);
    this.door.uniforms.uSaturation.value = THREE.MathUtils.lerp(
      1.45,
      1,
      handoff,
    );
    this.door.uniforms.uLift.value = THREE.MathUtils.lerp(0.015, 0, handoff);

    // Whole-name tilt towards the pointer, gone by the time we reach the I.
    const calm = 1 - zoom;
    const px = pointer.active ? pointer.x / width - 0.5 : 0;
    const py = pointer.active ? pointer.y / height - 0.5 : 0;
    const idle = reduced ? 0 : 1;
    this.tiltGroup.rotation.x = spring(
      this.tiltGroup.rotation.x,
      py * 0.14 * calm * idle,
    );
    this.tiltGroup.rotation.y = spring(
      this.tiltGroup.rotation.y,
      px * 0.22 * calm * idle,
    );

    const reach = Math.min(width, height) * 0.38;
    const angle = -this.nameGroup.rotation.z;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const burst = zoom * zoom;
    const span = Math.max(width, height);

    for (const [i, letter] of this.letters.entries()) {
      const { mesh } = letter;
      const risen = frame.rise(letter.line, letter.glyph);
      mesh.visible = risen > 0;
      if (!mesh.visible) continue;

      // Letters near the pointer tip away from it, like pressing on glass.
      let tx = 0;
      let ty = 0;
      let tz = 0;
      if (pointer.active && !reduced) {
        const wx = letter.screen.x - pointer.x;
        const wy = pointer.y - letter.screen.y;
        const d = Math.hypot(wx, wy) || 1;
        const pull = Math.exp(-((d / reach) ** 2)) * calm;
        const lx = (wx * cos - wy * sin) / d;
        const ly = (wx * sin + wy * cos) / d;
        tx = ly * pull * 0.6;
        ty = -lx * pull * 0.6;
        tz = -pull * 90;
      } else if (!reduced) {
        ty = Math.sin(now / 1600 + i * 0.55) * 0.05 * calm;
        tx = Math.cos(now / 2100 + i * 0.4) * 0.03 * calm;
      }
      if (letter.isDoor) {
        tx *= calm;
        ty *= calm;
      }
      letter.tilt.x = spring(letter.tilt.x, tx);
      letter.tilt.y = spring(letter.tilt.y, ty);
      letter.tilt.z = spring(letter.tilt.z, tz, 0.05);

      // Flip up out of the dark on arrival.
      const fall = 1 - risen;
      mesh.rotation.set(letter.tilt.x - fall * 1.45, letter.tilt.y, 0);
      mesh.position.set(
        letter.home.x,
        letter.home.y - fall * capHeight * mesh.scale.x * 0.7,
        letter.home.z + letter.tilt.z - fall * 260,
      );

      // Everything but the I breaks apart and flies past the camera.
      if (!letter.isDoor && burst > 0 && !reduced) {
        const away = letter.home.clone().sub(this.localDoor());
        away.z = 0;
        away
          .normalize()
          .add(letter.scatter.clone().setZ(0).multiplyScalar(0.7));
        mesh.position.x += away.x * burst * span * 1.1;
        mesh.position.y += away.y * burst * span * 1.1;
        mesh.position.z += letter.scatter.z * burst * this.distance * 0.9;
        mesh.rotation.x += letter.spin.x * burst;
        mesh.rotation.y += letter.spin.y * burst;
        mesh.rotation.z += letter.spin.z * burst;
      }
    }

    // A light that follows the pointer and rakes across the bevels.
    const lx = pointer.active
      ? pointer.x - width / 2
      : Math.sin(now / 2600) * width * 0.3;
    const ly = pointer.active
      ? height / 2 - pointer.y
      : Math.cos(now / 3100) * height * 0.2;
    this.lightPos.x = spring(this.lightPos.x, lx, 0.5);
    this.lightPos.y = spring(this.lightPos.y, ly, 0.5);
    this.light.position.set(this.lightPos.x, this.lightPos.y, 420);
    this.light.intensity = 5 * calm;
    this.light.distance = span * 0.9;

    // Dive into the I: fly towards it, getting close enough to fill the view.
    const fill = Math.min(
      this.doorSize.x / (2.3 * TAN * this.camera.aspect),
      this.doorSize.y / (2.3 * TAN),
    );
    const t = reduced ? 0 : zoom;
    this.camera.position.set(
      this.doorWorld.x * t,
      this.doorWorld.y * t,
      this.distance * (fill / this.distance) ** t,
    );
    this.camera.rotation.set(0, 0, Math.sin(t * Math.PI) * 0.07);

    this.renderer.render(this.scene, this.camera);
    // Idle drift has no end, so it rides along with the film's frames.
    return pointer.active && settling;
  }

  private localDoor() {
    return (
      this.letters.find((letter) => letter.isDoor)?.home ?? new THREE.Vector3()
    );
  }

  dispose() {
    this.film.dispose();
    this.grey.dispose();
    this.door.dispose();
    this.metal.envMap?.dispose();
    this.metal.dispose();
    this.renderer.dispose();
  }
}
