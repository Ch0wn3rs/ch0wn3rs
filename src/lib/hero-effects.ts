import { animate } from 'animejs';

type GlobeOptions = {
  tiltDegrees?: number;
};

export function initMatrixCanvas(canvasId = 'matrix'): (() => void) | undefined {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return undefined;

  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const fontSize = 14;
  let columns = 0;
  let drops: number[] = [];

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () => Math.floor(Math.random() * (canvas.height / fontSize)));
  };

  let frameHandle = 0;

  const draw = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px "Share Tech Mono", monospace`;

    for (let i = 0; i < drops.length; i += 1) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      if (Math.random() > 0.98) {
        ctx.fillStyle = '#ffffff';
      } else if (Math.random() > 0.9) {
        ctx.fillStyle = '#ff1744';
      } else {
        ctx.fillStyle = 'rgba(220, 20, 60, 0.85)';
      }

      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 1;
    }

    frameHandle = requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize);

  return () => {
    window.removeEventListener('resize', resize);
    if (frameHandle) cancelAnimationFrame(frameHandle);
  };
}

export function initGlobe(canvasId: string, options: GlobeOptions = {}): (() => void) | undefined {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return undefined;

  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  const tiltDegrees = options.tiltDegrees ?? 0;

  const state = {
    rotation: 0,
    routesStartMs: typeof performance === 'undefined' ? 0 : performance.now(),
    routeAppearMs: 720,
    routeHoldMs: 280,
    routeDisappearMs: 720,
    routeStaggerMs: 180,
    routeCooldownMs: 1100,
  };

  const routes = [
    { start: [40.7, -74.0], end: [51.5, -0.1] },
    { start: [51.5, -0.1], end: [35.6, 139.7] },
    { start: [19.4, -99.1], end: [-34.6, -58.4] },
    { start: [1.3, 103.8], end: [52.5, 13.4] },
    { start: [28.6, 77.2], end: [55.7, 37.6] },
    { start: [-23.5, -46.6], end: [6.5, 3.4] },
    { start: [35.6, 139.7], end: [-33.8, 151.2] },
  ];

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const toUnitVector = (latitude: number, longitude: number) => {
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;
    return {
      x: Math.cos(lat) * Math.cos(lon),
      y: Math.sin(lat),
      z: Math.cos(lat) * Math.sin(lon),
    };
  };

  const normalize = (v: { x: number; y: number; z: number }) => {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  };

  const rotateY = (v: { x: number; y: number; z: number }, degrees: number) => {
    const theta = (degrees * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return {
      x: v.x * cos - v.z * sin,
      y: v.y,
      z: v.x * sin + v.z * cos,
    };
  };

  const rotateX = (v: { x: number; y: number; z: number }, degrees: number) => {
    const theta = (degrees * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return {
      x: v.x,
      y: v.y * cos - v.z * sin,
      z: v.y * sin + v.z * cos,
    };
  };

  const applyViewTilt = (v: { x: number; y: number; z: number }) => {
    if (!tiltDegrees) return v;
    return rotateX(v, tiltDegrees);
  };

  const slerpUnit = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, t: number) => {
    const tt = clamp(t, 0, 1);
    const dot = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1);

    if (dot > 0.9995) {
      return normalize({
        x: a.x + (b.x - a.x) * tt,
        y: a.y + (b.y - a.y) * tt,
        z: a.z + (b.z - a.z) * tt,
      });
    }

    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);
    const s0 = Math.sin((1 - tt) * omega) / sinOmega;
    const s1 = Math.sin(tt * omega) / sinOmega;
    return {
      x: a.x * s0 + b.x * s1,
      y: a.y * s0 + b.y * s1,
      z: a.z * s0 + b.z * s1,
    };
  };

  const baseRouteVectors = routes.map((route) => ({
    start: toUnitVector(route.start[0], route.start[1]),
    end: toUnitVector(route.end[0], route.end[1]),
  }));

  const routeStates = routes.map(() => ({
    phase: 'waiting' as 'waiting' | 'appearing' | 'holding' | 'disappearing',
    phaseStartMs: 0,
    nextEligibleMs: 0,
  }));

  const rotationAnimation = animate(state, {
    rotation: [0, 360],
    duration: 26000,
    ease: 'linear',
    loop: true,
  });

  let frameHandle = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width));
    canvas.height = Math.max(320, Math.floor(rect.height));
  };

  const projectPoint = (
    latitude: number,
    longitude: number,
    rotationDegrees: number,
    depth: number,
    radius: number,
    centerX: number,
    centerY: number
  ) => {
    const lat = (latitude * Math.PI) / 180;
    const lon = ((longitude + rotationDegrees) * Math.PI) / 180;

    const point = applyViewTilt({
      x: radius * Math.cos(lat) * Math.cos(lon),
      y: radius * Math.sin(lat),
      z: radius * Math.cos(lat) * Math.sin(lon),
    });

    const perspective = depth / (depth - point.z);

    return {
      x: centerX + point.x * perspective,
      y: centerY - point.y * perspective,
      z: point.z,
    };
  };

  const projectXYZ = (point: { x: number; y: number; z: number }, depth: number, centerX: number, centerY: number) => {
    const tiltedPoint = applyViewTilt(point);
    const perspective = depth / (depth - tiltedPoint.z);
    return {
      x: centerX + tiltedPoint.x * perspective,
      y: centerY - tiltedPoint.y * perspective,
      z: tiltedPoint.z,
    };
  };

  const draw = () => {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.34;
    const depth = radius * 3;
    const backCutoff = -radius * 0.18;

    const sphereGradient = ctx.createRadialGradient(
      centerX - radius * 0.28,
      centerY - radius * 0.3,
      radius * 0.2,
      centerX,
      centerY,
      radius * 1.2
    );
    sphereGradient.addColorStop(0, 'rgba(255, 60, 100, 0.16)');
    sphereGradient.addColorStop(1, 'rgba(255, 60, 100, 0.02)');
    ctx.fillStyle = sphereGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    const drawMeshLine = (points: { x: number; y: number; z: number }[]) => {
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const curr = points[i];
        const visible = prev.z > -radius * 0.28 && curr.z > -radius * 0.28;
        if (!visible) continue;

        const alpha = 0.12 + ((prev.z + radius) / (radius * 2)) * 0.45;
        ctx.strokeStyle = `rgba(255, 70, 110, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
    };

    for (let lat = -75; lat <= 75; lat += 15) {
      const points: { x: number; y: number; z: number }[] = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        points.push(projectPoint(lat, lon, state.rotation, depth, radius, centerX, centerY));
      }
      drawMeshLine(points);
    }

    for (let lon = -180; lon < 180; lon += 15) {
      const points: { x: number; y: number; z: number }[] = [];
      for (let lat = -90; lat <= 90; lat += 4) {
        points.push(projectPoint(lat, lon, state.rotation, depth, radius, centerX, centerY));
      }
      drawMeshLine(points);
    }

    for (let index = 0; index < routes.length; index += 1) {
      const route = baseRouteVectors[index];
      const start3d = rotateY({ x: route.start.x * radius, y: route.start.y * radius, z: route.start.z * radius }, state.rotation);
      const end3d = rotateY({ x: route.end.x * radius, y: route.end.y * radius, z: route.end.z * radius }, state.rotation);
      const start = projectXYZ(start3d, depth, centerX, centerY);
      const end = projectXYZ(end3d, depth, centerX, centerY);

      const now = typeof performance === 'undefined' ? Date.now() : performance.now();
      const elapsed = Math.max(0, now - state.routesStartMs);
      const scheduled = elapsed - index * state.routeStaggerMs;

      const routeState = routeStates[index];
      if (routeState.phase === 'waiting' && now >= routeState.nextEligibleMs && scheduled >= 0 && start.z >= backCutoff) {
        routeState.phase = 'appearing';
        routeState.phaseStartMs = now;
      }

      if (routeState.phase === 'waiting') continue;

      let segmentStartT = 0;
      let segmentEndT = 0;
      let dotT: number | null = null;

      if (routeState.phase === 'appearing') {
        const t = clamp((now - routeState.phaseStartMs) / state.routeAppearMs, 0, 1);
        segmentStartT = 0;
        segmentEndT = t;
        dotT = t;
        if (t >= 1) {
          routeState.phase = 'holding';
          routeState.phaseStartMs = now;
        }
      }

      if (routeState.phase === 'holding') {
        segmentStartT = 0;
        segmentEndT = 1;
        if (now - routeState.phaseStartMs >= state.routeHoldMs) {
          routeState.phase = 'disappearing';
          routeState.phaseStartMs = now;
        }
      }

      if (routeState.phase === 'disappearing') {
        const t = clamp((now - routeState.phaseStartMs) / state.routeDisappearMs, 0, 1);
        if (t >= 1) {
          routeState.phase = 'waiting';
          routeState.phaseStartMs = 0;
          routeState.nextEligibleMs = now + state.routeCooldownMs;
          continue;
        }
        segmentStartT = t;
        segmentEndT = 1;
        dotT = t;
      }

      const segmentLen = segmentEndT - segmentStartT;
      if (segmentLen <= 0) continue;

      const arcAlpha = 0.08 + Math.min(1, segmentLen) * 0.62;
      ctx.strokeStyle = `rgba(255, 23, 68, ${arcAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.6;
      const arcHeight = radius * (0.18 + (index % 3) * 0.04);
      const steps = Math.max(14, Math.ceil(90 * segmentLen));

      ctx.beginPath();
      let penDown = false;

      for (let i = 0; i <= steps; i += 1) {
        const t = segmentStartT + (i / steps) * segmentLen;
        const unit = slerpUnit(route.start, route.end, t);
        const lift = Math.sin(Math.PI * t) * arcHeight;
        const point3d = rotateY({ x: unit.x * (radius + lift), y: unit.y * (radius + lift), z: unit.z * (radius + lift) }, state.rotation);
        const point2d = projectXYZ(point3d, depth, centerX, centerY);

        if (point2d.z < backCutoff) {
          penDown = false;
          continue;
        }

        if (!penDown) {
          ctx.moveTo(point2d.x, point2d.y);
          penDown = true;
        } else {
          ctx.lineTo(point2d.x, point2d.y);
        }
      }
      ctx.stroke();

      if (dotT !== null && dotT > 0 && dotT < 1) {
        const unit = slerpUnit(route.start, route.end, dotT);
        const lift = Math.sin(Math.PI * dotT) * arcHeight;
        const dot3d = rotateY({ x: unit.x * (radius + lift), y: unit.y * (radius + lift), z: unit.z * (radius + lift) }, state.rotation);
        const dot = projectXYZ(dot3d, depth, centerX, centerY);
        if (dot.z >= backCutoff) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = 'rgba(255, 60, 110, 0.85)';
      ctx.beginPath();
      if (segmentStartT <= 0.001 && start.z >= backCutoff) ctx.arc(start.x, start.y, 2.2, 0, Math.PI * 2);
      if (end.z >= backCutoff) ctx.arc(end.x, end.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    frameHandle = requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize);

  return () => {
    window.removeEventListener('resize', resize);
    if (frameHandle) cancelAnimationFrame(frameHandle);
    rotationAnimation.pause?.();
  };
}
