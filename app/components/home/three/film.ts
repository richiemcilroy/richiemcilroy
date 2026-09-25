import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { capHeight, type Glyph } from "@/lib/glyphs";

// Shared pieces for the WebGL scenes: a renderer, the film as a texture, and
// letters extruded from the same outlines the 2D pages use.

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  // The film is 1080p and the scenes are big and soft-edged, so drawing at
  // more than 1.5× density costs fill rate without looking any sharper.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  return renderer;
}

// A dim studio to reflect in, so black metal still reads as metal.
export function createEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

export function filmTexture(video: HTMLVideoElement) {
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

// Samples the film by screen position rather than by UV, so every face that
// uses it acts as a window onto one flat film behind everything.
export function screenFilmMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFilm: { value: texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uFilmSize: { value: new THREE.Vector2(16, 9) },
      uSaturation: { value: 0 },
      uContrast: { value: 1.12 },
      uLift: { value: 0 },
    },
    vertexShader: /* glsl */ `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uFilm;
      uniform vec2 uResolution;
      uniform vec2 uFilmSize;
      uniform float uSaturation;
      uniform float uContrast;
      uniform float uLift;

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        float screenAspect = uResolution.x / uResolution.y;
        float filmAspect = uFilmSize.x / uFilmSize.y;
        vec2 fit = screenAspect > filmAspect
          ? vec2(1.0, filmAspect / screenAspect)
          : vec2(screenAspect / filmAspect, 1.0);
        uv = (uv - 0.5) * fit + 0.5;

        vec3 colour = texture2D(uFilm, uv).rgb;
        float grey = dot(colour, vec3(0.2126, 0.7152, 0.0722));
        colour = mix(vec3(grey), colour, uSaturation);
        colour = (colour - 0.18) * uContrast + 0.18 + uLift;
        gl_FragColor = vec4(max(colour, 0.0), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// Polished black, like obsidian: nearly no colour of its own, so all you see
// on the sides of a letter are the highlights.
export function blackMaterial(envMap: THREE.Texture) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x060606,
    metalness: 0.15,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMap,
    envMapIntensity: 0.22,
  });
}

// Parses an outline from lib/glyphs (font units, y-down) into shapes; three
// works out which contours are holes by containment.
function glyphShapes(d: string) {
  const path = new THREE.ShapePath();
  let x = 0;
  let y = 0;
  for (const [, command, args] of d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
    const n = args.trim() ? args.trim().split(/\s+/).map(Number) : [];
    for (let i = 1; i < n.length; i += 2) n[i] = -n[i];
    const endX = n[n.length - 2];
    const endY = n[n.length - 1];
    // Zero-length segments break the bevel, so skip repeated points.
    if (command !== "M" && command !== "Z" && endX === x && endY === y)
      continue;
    if (command === "M") path.moveTo(n[0], n[1]);
    else if (command === "L") path.lineTo(n[0], n[1]);
    else if (command === "Q") path.quadraticCurveTo(n[0], n[1], n[2], n[3]);
    else if (command === "C")
      path.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]);
    if (command !== "Z") {
      x = endX;
      y = endY;
    }
  }
  return path.toShapes();
}

export const LETTER_DEPTH = 150;
const geometries = new Map<string, THREE.ExtrudeGeometry>();

// An extruded letter in font units, centred on its own middle so it can spin
// in place. Group 0 is the front and back faces, group 1 the sides.
export function letterGeometry(glyph: Glyph) {
  let geometry = geometries.get(glyph.d);
  if (geometry) return geometry;
  geometry = new THREE.ExtrudeGeometry(glyphShapes(glyph.d), {
    depth: LETTER_DEPTH,
    bevelEnabled: true,
    bevelThickness: 14,
    bevelSize: 9,
    bevelSegments: 4,
    curveSegments: 1,
  });
  const cx = (glyph.x1 + glyph.x2) / 2 - glyph.x;
  geometry.translate(-cx, -capHeight / 2, -LETTER_DEPTH / 2);
  geometry.computeVertexNormals();
  geometries.set(glyph.d, geometry);
  return geometry;
}

// Size of a letter block in font units, for physics.
export function letterSize(glyph: Glyph) {
  return {
    width: glyph.x2 - glyph.x1 + 18,
    height: capHeight + 18,
    depth: LETTER_DEPTH + 28,
  };
}

export function setFilmSize(
  material: THREE.ShaderMaterial,
  renderer: THREE.WebGLRenderer,
  video: HTMLVideoElement,
) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  material.uniforms.uResolution.value.copy(size);
  if (video.videoWidth) {
    material.uniforms.uFilmSize.value.set(video.videoWidth, video.videoHeight);
  }
}
