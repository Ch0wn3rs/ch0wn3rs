import { animate } from 'animejs';

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Polyline = {
  points: Vec3[];
  closed?: boolean;
  width?: number;
  alpha?: number;
};

type IconGeometry = {
  polylines: Polyline[];
  anchors: Vec3[];
};

type ScenePreset = {
  scale: number;
  extrude: number;
  rotation: {
    x: [number, number];
    xDuration: number;
    yDuration: number;
    z: [number, number];
    zDuration: number;
  };
  pulseDuration: number;
  build(detail: number): IconGeometry;
};

export type SkillScenePreset = 'crypto' | 'web' | 'forensic' | 'adversarial-ml';

export type SkillSceneOptions = {
  reducedMotion?: boolean;
  reducedFidelity?: boolean;
};

const TAU = Math.PI * 2;
const RED = '#dc143c';
const RED_LIGHT = '#ff6b8a';
const RED_GLOW = 'rgba(220, 20, 60, 0.28)';
const RED_HAZE = 'rgba(220, 20, 60, 0.12)';
const RED_BACK = 'rgba(120, 8, 28, 0.72)';
const RED_CONNECTOR = 'rgba(255, 132, 156, 0.42)';

function rotateX(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
}

function rotateY(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.z * sin,
    y: point.y,
    z: point.x * sin + point.z * cos,
  };
}

function rotateZ(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  };
}

function line(points: Array<[number, number]>, z = 0, width = 1, alpha = 1): Polyline {
  return {
    points: points.map(([x, y]) => ({ x, y, z })),
    width,
    alpha,
  };
}

function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  start = 0,
  end = TAU,
  steps = 24,
  z = 0,
  width = 1,
  alpha = 1
): Polyline {
  const points: Vec3[] = [];
  const total = Math.max(4, steps);
  for (let i = 0; i <= total; i += 1) {
    const t = start + ((end - start) * i) / total;
    points.push({
      x: cx + Math.cos(t) * rx,
      y: cy + Math.sin(t) * ry,
      z,
    });
  }
  return {
    points,
    closed: Math.abs(end - start) >= TAU - 0.001,
    width,
    alpha,
  };
}

function roundedRect(
  cx: number,
  cy: number,
  width: number,
  height: number,
  radius: number,
  steps = 6,
  z = 0,
  strokeWidth = 1,
  alpha = 1
): Polyline {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const r = Math.min(radius, hw, hh);
  const corners = [
    { x: cx + hw - r, y: cy - hh + r, start: -Math.PI / 2, end: 0 },
    { x: cx + hw - r, y: cy + hh - r, start: 0, end: Math.PI / 2 },
    { x: cx - hw + r, y: cy + hh - r, start: Math.PI / 2, end: Math.PI },
    { x: cx - hw + r, y: cy - hh + r, start: Math.PI, end: Math.PI * 1.5 },
  ];

  const points: Vec3[] = [];
  for (const corner of corners) {
    for (let i = 0; i <= steps; i += 1) {
      const t = corner.start + ((corner.end - corner.start) * i) / steps;
      points.push({
        x: corner.x + Math.cos(t) * r,
        y: corner.y + Math.sin(t) * r,
        z,
      });
    }
  }

  return {
    points,
    closed: true,
    width: strokeWidth,
    alpha,
  };
}

function buildCrypto(detail: number): IconGeometry {
  const polylines: Polyline[] = [
    ellipse(0, -0.42, 0.34, 0.34, Math.PI, TAU, detail + 10, 0, 0.95, 1),
    line([
      [-0.22, -0.08],
      [-0.22, -0.28],
    ], 0, 0.95),
    line([
      [0.22, -0.08],
      [0.22, -0.28],
    ], 0, 0.95),
    roundedRect(0, 0.18, 1.18, 0.92, 0.14, detail, 0, 1.05, 1),
    ellipse(0, 0.14, 0.08, 0.11, 0, TAU, detail + 6, 0.02, 0.72, 0.95),
    line([
      [0, 0.23],
      [0, 0.42],
    ], 0.02, 0.72, 0.95),
    line([
      [-0.92, -0.02],
      [-0.6, -0.02],
    ], 0, 0.52, 0.8),
    line([
      [-0.92, 0.3],
      [-0.46, 0.3],
      [-0.46, 0.16],
    ], 0, 0.52, 0.8),
    line([
      [0.92, -0.02],
      [0.6, -0.02],
    ], 0, 0.52, 0.8),
    line([
      [0.92, 0.3],
      [0.46, 0.3],
      [0.46, 0.16],
    ], 0, 0.52, 0.8),
    ellipse(-0.92, -0.02, 0.05, 0.05, 0, TAU, detail + 4, 0.04, 0.5, 0.8),
    ellipse(-0.92, 0.3, 0.05, 0.05, 0, TAU, detail + 4, 0.04, 0.5, 0.8),
    ellipse(0.92, -0.02, 0.05, 0.05, 0, TAU, detail + 4, 0.04, 0.5, 0.8),
    ellipse(0.92, 0.3, 0.05, 0.05, 0, TAU, detail + 4, 0.04, 0.5, 0.8),
  ];

  const anchors = [
    { x: -0.59, y: -0.28, z: 0 },
    { x: 0.59, y: -0.28, z: 0 },
    { x: -0.59, y: 0.64, z: 0 },
    { x: 0.59, y: 0.64, z: 0 },
  ];

  return { polylines, anchors };
}

function buildWeb(detail: number): IconGeometry {
  const polylines: Polyline[] = [
    ellipse(0, 0, 0.78, 0.78, 0, TAU, detail + 14, 0, 1.02, 1),
    ellipse(0, 0, 0.34, 0.78, 0, TAU, detail + 12, 0, 0.82, 0.94),
    ellipse(0, 0, 0.58, 0.78, 0, TAU, detail + 12, 0, 0.72, 0.72),
    ellipse(0, 0, 0.78, 0.4, 0, TAU, detail + 12, 0, 0.82, 0.92),
    ellipse(0, 0, 0.78, 0.18, 0, TAU, detail + 12, 0, 0.72, 0.8),
    line([
      [-0.78, 0],
      [0.78, 0],
    ], 0, 0.75, 0.82),
    line([
      [0, -0.78],
      [0, 0.78],
    ], 0, 0.75, 0.82),
  ];

  const anchors = [
    { x: -0.78, y: 0, z: 0 },
    { x: 0.78, y: 0, z: 0 },
    { x: 0, y: -0.78, z: 0 },
    { x: 0, y: 0.78, z: 0 },
  ];

  return { polylines, anchors };
}

function buildForensic(detail: number): IconGeometry {
  const polylines: Polyline[] = [
    ellipse(-0.12, -0.06, 0.52, 0.72, Math.PI * 0.1, Math.PI * 1.86, detail + 18, 0, 1, 1),
    ellipse(-0.12, 0.02, 0.36, 0.54, Math.PI * 0.18, Math.PI * 1.8, detail + 14, 0.03, 0.86, 0.92),
    ellipse(-0.1, 0.09, 0.22, 0.34, Math.PI * 0.22, Math.PI * 1.74, detail + 10, 0.05, 0.72, 0.88),
    line([
      [-0.08, 0.1],
      [-0.08, -0.1],
    ], 0.08, 0.64, 0.78),
    line([
      [-0.08, 0.22],
      [-0.08, 0.28],
    ], 0.08, 0.64, 0.78),
    ellipse(0.48, 0.42, 0.28, 0.28, 0, TAU, detail + 10, 0.12, 0.94, 0.98),
    line([
      [0.67, 0.62],
      [0.92, 0.87],
    ], 0.12, 0.88, 0.96),
  ];

  const anchors = [
    { x: -0.64, y: -0.52, z: 0 },
    { x: -0.2, y: 0.7, z: 0.05 },
    { x: 0.48, y: 0.14, z: 0.1 },
    { x: 0.92, y: 0.87, z: 0.12 },
  ];

  return { polylines, anchors };
}

function buildAdversarialMl(detail: number): IconGeometry {
  const polylines: Polyline[] = [
    roundedRect(0, 0, 1.16, 1.16, 0.12, detail, 0, 1.02, 1),
    line([
      [-0.22, 0.3],
      [0, -0.28],
      [0.22, 0.3],
    ], 0.04, 0.92, 1),
    line([
      [-0.13, 0.04],
      [0.13, 0.04],
    ], 0.04, 0.76, 0.92),
    line([
      [0.42, -0.26],
      [0.42, 0.3],
    ], 0.04, 0.92, 1),
  ];

  const pins = [-0.34, 0, 0.34];
  for (const value of pins) {
    polylines.push(line([[value, -0.78], [value, -0.58]], 0, 0.52, 0.82));
    polylines.push(line([[value, 0.58], [value, 0.78]], 0, 0.52, 0.82));
    polylines.push(line([[-0.78, value], [-0.58, value]], 0, 0.52, 0.82));
    polylines.push(line([[0.58, value], [0.78, value]], 0, 0.52, 0.82));
  }

  const anchors = [
    { x: -0.58, y: -0.58, z: 0 },
    { x: 0.58, y: -0.58, z: 0 },
    { x: -0.58, y: 0.58, z: 0 },
    { x: 0.58, y: 0.58, z: 0 },
  ];

  return { polylines, anchors };
}

const PRESETS: Record<SkillScenePreset, ScenePreset> = {
  crypto: {
    scale: 0.96,
    extrude: 0.16,
    rotation: {
      x: [-18, 18],
      xDuration: 8600,
      yDuration: 18000,
      z: [-10, 12],
      zDuration: 10400,
    },
    pulseDuration: 2400,
    build: buildCrypto,
  },
  web: {
    scale: 1,
    extrude: 0.14,
    rotation: {
      x: [-14, 16],
      xDuration: 9200,
      yDuration: 16500,
      z: [-18, 10],
      zDuration: 11200,
    },
    pulseDuration: 2800,
    build: buildWeb,
  },
  forensic: {
    scale: 0.98,
    extrude: 0.16,
    rotation: {
      x: [-12, 16],
      xDuration: 7800,
      yDuration: 17200,
      z: [-12, 14],
      zDuration: 9800,
    },
    pulseDuration: 2200,
    build: buildForensic,
  },
  'adversarial-ml': {
    scale: 0.98,
    extrude: 0.18,
    rotation: {
      x: [-20, 22],
      xDuration: 9800,
      yDuration: 17600,
      z: [-16, 18],
      zDuration: 12000,
    },
    pulseDuration: 2600,
    build: buildAdversarialMl,
  },
};

function project(
  point: Vec3,
  centerX: number,
  centerY: number,
  radius: number,
  depth: number,
  state: { rotationX: number; rotationY: number; rotationZ: number }
) {
  const rotated = rotateZ(rotateY(rotateX(point, state.rotationX), state.rotationY), state.rotationZ);
  const perspective = depth / (depth - rotated.z * radius);
  return {
    x: centerX + rotated.x * radius * perspective,
    y: centerY + rotated.y * radius * perspective,
    z: rotated.z,
    perspective,
  };
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  polyline: Polyline,
  zShift: number,
  centerX: number,
  centerY: number,
  radius: number,
  depth: number,
  state: { rotationX: number; rotationY: number; rotationZ: number },
  color: string,
  glowColor: string,
  opacity: number,
  blurMultiplier: number
) {
  const projected = polyline.points.map((point) =>
    project({ x: point.x, y: point.y, z: point.z + zShift }, centerX, centerY, radius, depth, state)
  );

  if (projected.length < 2) return;

  const avgPerspective = projected.reduce((sum, point) => sum + point.perspective, 0) / projected.length;
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity * (polyline.alpha ?? 1);
  ctx.lineWidth = (polyline.width ?? 1) * avgPerspective * radius * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = ctx.lineWidth * blurMultiplier;
  ctx.shadowColor = glowColor;
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  for (let i = 1; i < projected.length; i += 1) {
    ctx.lineTo(projected[i].x, projected[i].y);
  }
  if (polyline.closed) ctx.closePath();
  ctx.stroke();
}

function drawConnectors(
  ctx: CanvasRenderingContext2D,
  anchors: Vec3[],
  extrude: number,
  centerX: number,
  centerY: number,
  radius: number,
  depth: number,
  state: { rotationX: number; rotationY: number; rotationZ: number },
  opacity: number
) {
  for (const anchor of anchors) {
    const front = project(anchor, centerX, centerY, radius, depth, state);
    const back = project({ x: anchor.x, y: anchor.y, z: anchor.z - extrude }, centerX, centerY, radius, depth, state);
    const width = radius * 0.04 * ((front.perspective + back.perspective) * 0.5);
    ctx.strokeStyle = RED_CONNECTOR;
    ctx.globalAlpha = opacity * 0.7;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.shadowBlur = width * 1.8;
    ctx.shadowColor = RED_GLOW;
    ctx.beginPath();
    ctx.moveTo(back.x, back.y);
    ctx.lineTo(front.x, front.y);
    ctx.stroke();
  }
}

export function mountSkillScene(
  container: HTMLElement,
  presetId: SkillScenePreset,
  options: SkillSceneOptions = {}
) {
  const preset = PRESETS[presetId];
  const existingCanvas = container.querySelector('canvas');
  const canvas = existingCanvas instanceof HTMLCanvasElement ? existingCanvas : document.createElement('canvas');

  if (!(existingCanvas instanceof HTMLCanvasElement)) {
    canvas.className = 'skills-dialog-globe';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const reducedMotion = options.reducedMotion ?? false;
  const reducedFidelity = options.reducedFidelity ?? false;
  const detail = reducedFidelity ? 8 : 14;
  const geometry = preset.build(detail);
  const state = {
    rotationX: (preset.rotation.x[0] * Math.PI) / 180,
    rotationY: 0,
    rotationZ: (preset.rotation.z[0] * Math.PI) / 180,
    pulse: 0.7,
    opacity: 0,
    zoom: 0.8,
  };

  const animations = [
    animate(state, {
      opacity: [0, 1],
      zoom: [0.8, 1],
      duration: reducedMotion ? 420 : 760,
      ease: 'outExpo',
    }),
    animate(state, {
      rotationY: [0, TAU],
      duration: preset.rotation.yDuration * (reducedMotion ? 1.8 : 1),
      ease: 'linear',
      loop: true,
    }),
    animate(state, {
      rotationX: [(preset.rotation.x[0] * Math.PI) / 180, (preset.rotation.x[1] * Math.PI) / 180],
      duration: preset.rotation.xDuration * (reducedMotion ? 1.7 : 1),
      ease: 'inOutSine',
      alternate: true,
      loop: true,
    }),
    animate(state, {
      rotationZ: [(preset.rotation.z[0] * Math.PI) / 180, (preset.rotation.z[1] * Math.PI) / 180],
      duration: preset.rotation.zDuration * (reducedMotion ? 1.7 : 1),
      ease: 'inOutSine',
      alternate: true,
      loop: true,
    }),
    animate(state, {
      pulse: [0.64, 1],
      duration: preset.pulseDuration * (reducedMotion ? 1.5 : 1),
      ease: 'inOutSine',
      alternate: true,
      loop: true,
    }),
  ];

  let frameHandle = 0;
  let resizeObserver: ResizeObserver | undefined;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, reducedFidelity ? 1.35 : 1.8);
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(320, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const render = () => {
    const width = canvas.clientWidth || 480;
    const height = canvas.clientHeight || 480;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.34 * preset.scale * state.zoom;
    const depth = radius * (reducedFidelity ? 2.35 : 2.8);

    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.22);
    glow.addColorStop(0, RED_GLOW);
    glow.addColorStop(0.58, RED_HAZE);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.24, 0, TAU);
    ctx.fill();

    ctx.save();
    drawConnectors(ctx, geometry.anchors, preset.extrude, centerX, centerY, radius, depth, state, state.opacity);
    for (const polyline of geometry.polylines) {
      drawStroke(ctx, polyline, -preset.extrude, centerX, centerY, radius, depth, state, RED_BACK, RED_GLOW, state.opacity * 0.72, 1.2);
    }
    for (const polyline of geometry.polylines) {
      drawStroke(
        ctx,
        polyline,
        0,
        centerX,
        centerY,
        radius,
        depth,
        state,
        RED,
        RED_GLOW,
        state.opacity * (0.78 + state.pulse * 0.22),
        reducedFidelity ? 1.4 : 2
      );
    }
    for (const polyline of geometry.polylines) {
      drawStroke(
        ctx,
        polyline,
        0.01,
        centerX,
        centerY,
        radius,
        depth,
        state,
        RED_LIGHT,
        'rgba(255, 107, 138, 0.18)',
        state.opacity * 0.22,
        0.4
      );
    }
    ctx.restore();

    frameHandle = requestAnimationFrame(render);
  };

  resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  window.addEventListener('resize', resize);
  render();

  return () => {
    animations.forEach((animation) => animation.pause());
    if (frameHandle) cancelAnimationFrame(frameHandle);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
