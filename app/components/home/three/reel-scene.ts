import * as THREE from "three";
import { createRenderer } from "./film";

// The chapters as a strip of film wound over a drum. Scrolling winds the
// reel; the frame facing you is in colour, the rest curl away into grey.

export type ReelFrame = {
  image: string;
  // Screenshots are shown whole rather than cropped to fill the frame.
  fit?: "contain";
  label: string;
};

// Frame artwork, in canvas pixels. The strip is taller than one frame so
// neighbouring frames butt up against each other.
const ART_W = 960;
const ART_H = 630;
const SIDE = 108;
const IMAGE = { x: SIDE, y: 34, w: ART_W - SIDE * 2, h: ART_H - 68 };
const STRIP_WIDTH = ART_W / ART_H;
const RADIUS = 1.55;
const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

const vertexShader = /* glsl */ `
  uniform float uCenter;
  uniform float uOffset;
  uniform float uRadius;
  uniform float uTwist;
  uniform float uBend;
  varying vec2 vUv;
  varying float vTheta;

  void main() {
    vUv = uv;
    float s = uCenter + position.y + uOffset;
    float theta = s / uRadius;
    float twist = theta * uTwist;

    // Round the drum, then twist the ribbon about its own centre line.
    vec3 normal = vec3(0.0, sin(theta), cos(theta));
    vec3 p = vec3(
      position.x * cos(twist),
      uRadius * sin(theta),
      uRadius * cos(theta) - uRadius
    );
    p += normal * position.x * sin(twist);
    p.x += sin(theta * 1.7) * uBend;

    vTheta = theta;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  varying float vTheta;

  void main() {
    vec4 texel = texture2D(uMap, vUv);
    if (texel.a < 0.5) discard;

    float focus = 1.0 - smoothstep(0.05, 0.5, abs(vTheta));
    float grey = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 colour = mix(vec3(grey), texel.rgb, focus);
    colour *= mix(0.22, 1.0, pow(max(cos(vTheta), 0.0), 1.6));
    // A glint where the film crests the top of the drum.
    colour += pow(max(sin(vTheta + 0.35), 0.0), 18.0) * 0.18;
    if (!gl_FrontFacing) colour *= 0.12;

    float fade = 1.0 - smoothstep(1.35, 1.9, abs(vTheta));
    // Anything faded out must not write depth, or it blocks what's behind.
    if (fade < 0.02) discard;
    gl_FragColor = vec4(colour, fade);
    #include <colorspace_fragment>
  }
`;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: ReelFrame,
  index: number,
  image?: HTMLImageElement,
) {
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = "#1c1c1f";
  ctx.fillRect(0, 0, ART_W, ART_H);

  // The photo, cropped to fill the frame. Until it loads, unexposed film.
  ctx.save();
  roundRect(ctx, IMAGE.x, IMAGE.y, IMAGE.w, IMAGE.h, 10);
  ctx.clip();
  ctx.fillStyle = "#0a0a0b";
  ctx.fillRect(IMAGE.x, IMAGE.y, IMAGE.w, IMAGE.h);
  if (image) {
    const place = (scale: number) => {
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(
        image,
        IMAGE.x + (IMAGE.w - w) / 2,
        IMAGE.y + (IMAGE.h - h) / 2,
        w,
        h,
      );
    };
    const cover = Math.max(
      IMAGE.w / image.naturalWidth,
      IMAGE.h / image.naturalHeight,
    );
    if (frame.fit === "contain") {
      // Screenshots sit whole over a dimmed, blurred copy of themselves.
      ctx.filter = "blur(18px) brightness(0.45)";
      place(cover * 1.1);
      ctx.filter = "none";
      place(
        Math.min(IMAGE.w / image.naturalWidth, IMAGE.h / image.naturalHeight) *
          0.9,
      );
    } else {
      place(cover);
    }
  }
  ctx.restore();

  // Sprocket holes, punched right through.
  ctx.globalCompositeOperation = "destination-out";
  const holes = 5;
  for (let i = 0; i < holes; i++) {
    const y = (ART_H / holes) * (i + 0.5) - 26;
    roundRect(ctx, SIDE / 2 - 34, y, 38, 52, 7);
    ctx.fill();
    roundRect(ctx, ART_W - SIDE / 2 - 4, y, 38, 52, 7);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  // Edge print along the margin, like the codes on real stock.
  ctx.save();
  ctx.fillStyle = "#6b6b70";
  ctx.font = `500 20px ui-monospace, monospace`;
  ctx.translate(SIDE - 16, ART_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(
    `${String(index + 1).padStart(2, "0")}  ▸  ${frame.label}`,
    0,
    0,
  );
  ctx.restore();
}

export class ReelScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  private drum = new THREE.Group();
  private geometry = new THREE.PlaneGeometry(STRIP_WIDTH, 1, 1, 40);
  private materials: THREE.ShaderMaterial[] = [];
  private frames: { mesh: THREE.Mesh; index: number }[] = [];
  private textures: THREE.CanvasTexture[] = [];
  private offset = 0;
  private velocity = 0;
  private lastTime = 0;
  private tilt = new THREE.Vector2();

  constructor(canvas: HTMLCanvasElement, frames: ReelFrame[]) {
    this.renderer = createRenderer(canvas);
    this.renderer.setClearColor(0x000000, 0);
    this.scene.add(this.drum);
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    frames.forEach((frame, index) => {
      const art = document.createElement("canvas");
      art.width = ART_W;
      art.height = ART_H;
      const ctx = art.getContext("2d");
      if (!ctx) return;
      drawFrame(ctx, frame, index);
      const texture = new THREE.CanvasTexture(art);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      this.textures.push(texture);

      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        drawFrame(ctx, frame, index, image);
        texture.needsUpdate = true;
      };
      image.src = frame.image;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: texture },
          uCenter: { value: -index },
          uOffset: { value: 0 },
          uRadius: { value: RADIUS },
          uTwist: { value: 0.1 },
          uBend: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
      });
      this.materials.push(material);
      const mesh = new THREE.Mesh(this.geometry, material);
      this.frames.push({ mesh, index });
      this.drum.add(mesh);
    });
  }

  layout(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // Fit about two frames tall, and never clip the strip's width.
    const tall = 2.05;
    const wide = (STRIP_WIDTH * 1.08) / this.camera.aspect;
    this.camera.position.set(0, 0, Math.max(tall, wide) / (2 * TAN));
    this.camera.updateProjectionMatrix();
  }

  render(
    now: number,
    progress: number,
    pointer: { x: number; y: number; active: boolean },
    reduced: boolean,
  ) {
    const dt = Math.min(
      0.05,
      this.lastTime ? (now - this.lastTime) / 1000 : 1 / 60,
    );
    this.lastTime = now;
    const ease = 1 - Math.exp(-dt * (reduced ? 30 : 6));

    // Wind towards the scroll position; the speed bends the ribbon.
    const previous = this.offset;
    this.offset += (progress - this.offset) * ease;
    const speed = dt > 0 ? (this.offset - previous) / dt : 0;
    this.velocity += (speed - this.velocity) * Math.min(1, dt * 10);
    const bend = reduced
      ? 0
      : THREE.MathUtils.clamp(this.velocity * 0.1, -0.22, 0.22);
    const twist = reduced
      ? 0
      : 0.1 + THREE.MathUtils.clamp(this.velocity * 0.05, -0.14, 0.14);

    // Only frames near the front are drawn; the drum is round, so frames far
    // enough away would otherwise wrap all the way back to the front.
    for (const { mesh, index } of this.frames) {
      mesh.visible = Math.abs(index - this.offset) < 4.5;
    }
    for (const material of this.materials) {
      material.uniforms.uOffset.value = this.offset;
      material.uniforms.uBend.value = bend;
      material.uniforms.uTwist.value = twist;
    }

    const tx = pointer.active && !reduced ? pointer.x : 0;
    const ty = pointer.active && !reduced ? pointer.y : 0;
    const settling =
      Math.abs(progress - this.offset) > 1e-4 ||
      Math.abs(this.velocity) > 1e-3 ||
      Math.abs(tx - this.tilt.x) > 1e-4 ||
      Math.abs(ty - this.tilt.y) > 1e-4;
    this.tilt.x += (tx - this.tilt.x) * ease;
    this.tilt.y += (ty - this.tilt.y) * ease;
    this.drum.rotation.y = this.tilt.x * 0.45;
    this.drum.rotation.x = this.tilt.y * 0.25;

    this.renderer.render(this.scene, this.camera);
    // Nothing moves on its own, so once settled there is nothing to draw.
    return settling;
  }

  dispose() {
    for (const texture of this.textures) texture.dispose();
    for (const material of this.materials) material.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
  }
}
