import { capHeight, type GlyphLine } from "@/lib/glyphs";

// Draws black over a canvas and cuts letterforms out of it, so whatever sits
// behind the canvas (the film) only shows through the type.

export type PlacedLine = {
  line: GlyphLine;
  scale: number;
  x: number;
  baseline: number;
  height: number;
};

type Box = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

export type View = { width: number; height: number; dpr: number };

export type Frame = {
  // Zoom around a point on screen, moving that point towards a destination.
  zoom?: { scale: number; from: Point; to: Point };
  // Portrait screens set the type sideways so it can fill the height.
  rotate?: boolean;
  // 0 hides a glyph below its baseline, 1 settles it in place.
  rise?: (lineIndex: number, glyphIndex: number) => number;
};

const paths = new Map<string, Path2D>();

function pathFor(d: string) {
  let path = paths.get(d);
  if (!path) {
    path = new Path2D(d);
    paths.set(d, path);
  }
  return path;
}

// Justifies each line to the box width, like a poster, then shrinks the whole
// block if it would be taller than the box.
export function placeLines(lines: GlyphLine[], box: Box, gap = 0.1) {
  const widths = lines.map((line) => line.right - line.left);
  let scales = widths.map((width) => box.width / width);
  const blockHeight = (s: number[]) =>
    s.reduce((sum, scale) => sum + capHeight * scale, 0) +
    gap * capHeight * Math.min(...s) * (s.length - 1);

  const fit = Math.min(1, box.height / blockHeight(scales));
  scales = scales.map((scale) => scale * fit);

  const gapPx = gap * capHeight * Math.min(...scales);
  let y = box.y + (box.height - blockHeight(scales)) / 2;

  return lines.map((line, i): PlacedLine => {
    const scale = scales[i];
    const height = capHeight * scale;
    const x = box.x + (box.width - widths[i] * scale) / 2 - line.left * scale;
    const placed = { line, scale, x, baseline: y + height, height };
    y += height + gapPx;
    return placed;
  });
}

// Sets lines end to end on one baseline at the foot of the box, with a word
// space between them, as large as the box allows.
export function placeRow(lines: GlyphLine[], box: Box, space = 0.28) {
  const widths = lines.map((line) => line.right - line.left);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    space * capHeight * (lines.length - 1);
  const scale = Math.min(box.width / total, box.height / capHeight);
  const height = capHeight * scale;
  const baseline = box.y + box.height;
  let x = box.x + (box.width - total * scale) / 2;
  return lines.map((line, i): PlacedLine => {
    const placed = {
      line,
      scale,
      x: x - line.left * scale,
      baseline,
      height,
    };
    x += (widths[i] + space * capHeight) * scale;
    return placed;
  });
}

// A glyph's centre and size on screen, before any zoom is applied.
export function glyphOnScreen(
  placed: PlacedLine,
  index: number,
  view: View,
  rotate = false,
) {
  const glyph = placed.line.glyphs[index];
  const x = placed.x + ((glyph.x1 + glyph.x2) / 2) * placed.scale;
  const y = placed.baseline - placed.height / 2;
  const width = (glyph.x2 - glyph.x1) * placed.scale;
  if (!rotate) return { x, y, width, height: placed.height };
  return { x: y, y: view.height - x, width: placed.height, height: width };
}

function applyFrame(
  ctx: CanvasRenderingContext2D,
  view: View,
  { zoom, rotate }: Frame,
) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  if (zoom) {
    ctx.translate(zoom.to.x, zoom.to.y);
    ctx.scale(zoom.scale, zoom.scale);
    ctx.translate(-zoom.from.x, -zoom.from.y);
  }
  if (rotate) {
    ctx.translate(0, view.height);
    ctx.rotate(-Math.PI / 2);
  }
}

// Visits each glyph with the context positioned at its origin. While letters
// are rising, drawing is clipped to a slot the height of the line.
function eachGlyph(
  ctx: CanvasRenderingContext2D,
  lines: PlacedLine[],
  rise: Frame["rise"],
  draw: (path: Path2D, line: number, glyph: number) => void,
) {
  lines.forEach((placed, lineIndex) => {
    ctx.save();
    if (rise) {
      ctx.beginPath();
      ctx.rect(
        -1e5,
        placed.baseline - placed.height * 1.04,
        2e5,
        placed.height * 1.08,
      );
      ctx.clip();
    }
    placed.line.glyphs.forEach((glyph, glyphIndex) => {
      const settled = rise ? rise(lineIndex, glyphIndex) : 1;
      if (settled <= 0) return;
      ctx.save();
      ctx.translate(
        placed.x + glyph.x * placed.scale,
        placed.baseline + (1 - settled) * placed.height * 1.1,
      );
      ctx.scale(placed.scale, placed.scale);
      draw(pathFor(glyph.d), lineIndex, glyphIndex);
      ctx.restore();
    });
    ctx.restore();
  });
}

export function drawKnockout(
  ctx: CanvasRenderingContext2D,
  view: View,
  lines: PlacedLine[],
  frame: Frame & {
    opacity?: number;
    // A soft light that lets the film glow faintly through the black.
    light?: Point & { radius: number; strength: number };
  } = {},
) {
  const { opacity = 1, light } = frame;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.globalCompositeOperation = "copy";
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";

  applyFrame(ctx, view, frame);
  eachGlyph(ctx, lines, frame.rise, (path) => ctx.fill(path));

  if (light && light.strength > 0.001) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const glow = ctx.createRadialGradient(
      light.x,
      light.y,
      0,
      light.x,
      light.y,
      light.radius,
    );
    glow.addColorStop(0, `rgba(0, 0, 0, ${light.strength})`);
    glow.addColorStop(0.45, `rgba(0, 0, 0, ${light.strength * 0.4})`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(
      light.x - light.radius,
      light.y - light.radius,
      light.radius * 2,
      light.radius * 2,
    );
  }
  ctx.globalCompositeOperation = "source-over";
}

// Paints the film inside a single glyph, positioned exactly like the <video>
// behind it (object-fit: cover), so the two line up frame for frame.
export function drawThroughGlyph(
  ctx: CanvasRenderingContext2D,
  view: View,
  lines: PlacedLine[],
  target: { line: number; glyph: number },
  video: HTMLVideoElement,
  frame: Frame = {},
) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  const settled = frame.rise ? frame.rise(target.line, target.glyph) : 1;
  if (settled <= 0 || video.readyState < 2 || !video.videoWidth) return;

  const placed = lines[target.line];
  const glyph = placed.line.glyphs[target.glyph];
  ctx.save();
  applyFrame(ctx, view, frame);
  if (frame.rise) {
    ctx.beginPath();
    ctx.rect(
      -1e5,
      placed.baseline - placed.height * 1.04,
      2e5,
      placed.height * 1.08,
    );
    ctx.clip();
  }
  ctx.translate(
    placed.x + glyph.x * placed.scale,
    placed.baseline + (1 - settled) * placed.height * 1.1,
  );
  ctx.scale(placed.scale, placed.scale);
  ctx.clip(pathFor(glyph.d));

  // The clip is kept in device space, so the film can be drawn untransformed.
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const cover = Math.max(
    view.width / video.videoWidth,
    view.height / video.videoHeight,
  );
  const w = video.videoWidth * cover;
  const h = video.videoHeight * cover;
  ctx.drawImage(video, (view.width - w) / 2, (view.height - h) / 2, w, h);
  ctx.restore();
}

// Keeps the backing store in step with the element size and device density.
export function sizeCanvas(canvas: HTMLCanvasElement): View {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const w = Math.round(width * dpr);
  const h = Math.round(height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { width, height, dpr };
}
