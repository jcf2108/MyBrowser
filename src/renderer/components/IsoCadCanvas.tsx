import React, { useEffect, useRef, useState } from 'react';

interface IsoCadCanvasProps {
  compact?: boolean;
}

export const IsoCadCanvas: React.FC<IsoCadCanvasProps> = ({ compact = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState(0.62);
  const [pitch, setPitch] = useState(0.38);
  const [autoRotate, setAutoRotate] = useState(false);
  const [renderMode, setRenderMode] = useState<'iso-wire' | 'shaded-cad'>('iso-wire');
  const [gpuInfo, setGpuInfo] = useState({
    renderer: 'Chromium ANGLE / Hardware GPU',
    webgl2: true,
    webgpu: true,
    maxTexture: 16384,
  });

  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')) as WebGLRenderingContext | null;
      const dbg = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
      setGpuInfo({
        renderer:
          dbg && gl
            ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 48)
            : 'Chromium ANGLE / Hardware Pipeline',
        webgl2: Boolean(testCanvas.getContext('webgl2')),
        webgpu: 'gpu' in navigator,
        maxTexture: gl ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) : 16384,
      });
    } catch {
      // Keep default GPU info
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let currentYaw = yaw;

    const drawFrame = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(240, rect.width);
      const h = Math.max(160, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Slate drafting ground
      ctx.fillStyle = '#121519';
      ctx.fillRect(0, 0, w, h);

      // Technical 24px ISO grid
      ctx.strokeStyle = 'rgba(42, 49, 60, 0.55)';
      ctx.lineWidth = 1;
      const step = 24;
      for (let x = step; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
      }
      for (let y = step; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
      }

      // 3D Projection helper
      const cx = w * 0.5;
      const cy = h * 0.53;
      const scale = Math.min(w, h) * (compact ? 0.27 : 0.29);

      const cosY = Math.cos(currentYaw);
      const sinY = Math.sin(currentYaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const project = (x: number, y: number, z: number): [number, number, number] => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;
        const perspective = 3.6 / (3.6 + z2 * 0.35);
        return [cx + x1 * scale * perspective, cy - y2 * scale * perspective, z2];
      };

      // Draw coordinate axes X, Y, Z
      const origin = project(0, 0, 0);
      const axisX = project(1.45, 0, 0);
      const axisY = project(0, 1.35, 0);
      const axisZ = project(0, 0, 1.45);

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ff5a26';
      ctx.beginPath();
      ctx.moveTo(origin[0], origin[1]);
      ctx.lineTo(axisX[0], axisX[1]);
      ctx.stroke();

      ctx.strokeStyle = '#2ea043';
      ctx.beginPath();
      ctx.moveTo(origin[0], origin[1]);
      ctx.lineTo(axisY[0], axisY[1]);
      ctx.stroke();

      ctx.strokeStyle = '#9ba9bb';
      ctx.beginPath();
      ctx.moveTo(origin[0], origin[1]);
      ctx.lineTo(axisZ[0], axisZ[1]);
      ctx.stroke();

      ctx.font = '500 10px "Azeret Mono", monospace';
      ctx.fillStyle = '#ff5a26';
      ctx.fillText('X+ [127.0.0.1]', axisX[0] + 4, axisX[1] + 3);
      ctx.fillStyle = '#2ea043';
      ctx.fillText('Y+ [WEBGPU]', axisY[0] + 4, axisY[1]);
      ctx.fillStyle = '#9ba9bb';
      ctx.fillText('Z+ [ISO-01]', axisZ[0] + 4, axisZ[1] + 3);

      // Outer structural prism (Chromium Sandbox Frame)
      const vertices: Array<[number, number, number]> = [
        [-1, -0.65, -0.8],
        [1, -0.65, -0.8],
        [1, 0.65, -0.8],
        [-1, 0.65, -0.8],
        [-1, -0.65, 0.8],
        [1, -0.65, 0.8],
        [1, 0.65, 0.8],
        [-1, 0.65, 0.8],
      ];

      // Inner core (Split-View Dual Engine Module)
      const innerVertices: Array<[number, number, number]> = [
        [-0.55, -0.35, -0.45],
        [0.55, -0.35, -0.45],
        [0.55, 0.35, -0.45],
        [-0.55, 0.35, -0.45],
        [-0.55, -0.35, 0.45],
        [0.55, -0.35, 0.45],
        [0.55, 0.35, 0.45],
        [-0.55, 0.35, 0.45],
      ];

      const edges: Array<[number, number]> = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];

      const projectedOuter = vertices.map(([x, y, z]) => project(x, y, z));
      const projectedInner = innerVertices.map(([x, y, z]) => project(x, y, z));

      if (renderMode === 'shaded-cad') {
        const faces = [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [0, 1, 5, 4],
          [2, 3, 7, 6],
        ];
        ctx.fillStyle = 'rgba(26, 31, 38, 0.64)';
        for (const f of faces) {
          ctx.beginPath();
          ctx.moveTo(projectedOuter[f[0]][0], projectedOuter[f[0]][1]);
          for (let i = 1; i < f.length; i++) {
            ctx.lineTo(projectedOuter[f[i]][0], projectedOuter[f[i]][1]);
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw outer edges
      ctx.strokeStyle = '#e6edf3';
      ctx.lineWidth = 1.15;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(projectedOuter[a][0], projectedOuter[a][1]);
        ctx.lineTo(projectedOuter[b][0], projectedOuter[b][1]);
        ctx.stroke();
      }

      // Draw inner core edges in Rotring Vermilion
      ctx.strokeStyle = '#ff5a26';
      ctx.lineWidth = 1.25;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(projectedInner[a][0], projectedInner[a][1]);
        ctx.lineTo(projectedInner[b][0], projectedInner[b][1]);
        ctx.stroke();
      }

      // Draw diagonal tension lines between outer and inner frame
      ctx.strokeStyle = 'rgba(155, 169, 187, 0.35)';
      ctx.setLineDash([3, 3]);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(projectedOuter[i][0], projectedOuter[i][1]);
        ctx.lineTo(projectedInner[i][0], projectedInner[i][1]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw vertex nodes
      for (const [px, py] of projectedOuter) {
        ctx.fillStyle = '#e6edf3';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
      for (const [px, py] of projectedInner) {
        ctx.fillStyle = '#ff5a26';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }

      // Technical corner registration marks
      ctx.strokeStyle = '#384252';
      ctx.lineWidth = 1;
      const m = 10;
      const len = 12;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(m, m + len);
      ctx.lineTo(m, m);
      ctx.lineTo(m + len, m);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(w - m - len, h - m);
      ctx.lineTo(w - m, h - m);
      ctx.lineTo(w - m, h - m - len);
      ctx.stroke();

      ctx.restore();

      if (autoRotate) {
        currentYaw += 0.008;
        animId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();

    const onResize = () => drawFrame();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [yaw, pitch, autoRotate, renderMode, compact]);

  return (
    <div className="border border-iso-line bg-iso-bg flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-iso-panel border-b border-iso-line text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-iso-ink font-semibold">BANC 3D // PIPELINE CHROMIUM</span>
          <span className="text-iso-signal">
            {gpuInfo.webgl2 ? 'WEBGL2 ACTIF' : 'WEBGL1'} · {gpuInfo.webgpu ? 'WEBGPU PRÊT' : 'SW'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRenderMode(renderMode === 'iso-wire' ? 'shaded-cad' : 'iso-wire')}
            className="px-2 py-0.5 border border-iso-line bg-iso-bg text-iso-ink hover:border-iso-accent text-[11px]"
          >
            MODE : {renderMode === 'iso-wire' ? 'FILAIRE ISO' : 'FACES CAD'}
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-0.5 border text-[11px] font-medium ${
              autoRotate
                ? 'bg-iso-accent text-[#0d1014] border-iso-accent'
                : 'bg-iso-bg text-iso-ink border-iso-line hover:border-iso-accent'
            }`}
          >
            {autoRotate ? 'ROTATION : ACTIVE' : 'ANIMER 3D'}
          </button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full block cursor-crosshair ${compact ? 'h-48' : 'h-80'}`}
          onClick={() => setYaw((y) => Number((y + 0.25).toFixed(2)))}
          title="Cliquer ou utiliser les curseurs d'angle pour orienter le prisme 3D"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-iso-line bg-iso-panel text-xs font-mono">
        <label className="flex items-center justify-between gap-2 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-iso-line">
          <span className="text-iso-inkSecondary">AZIMUT (YAW)</span>
          <input
            type="range"
            min="0"
            max="6.28"
            step="0.05"
            value={yaw}
            onChange={(e) => setYaw( parseFloat(e.target.value) )}
            className="w-24 accent-iso-accent"
          />
          <span className="text-iso-ink tabular-nums">{yaw.toFixed(2)}r</span>
        </label>
        <label className="flex items-center justify-between gap-2 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-iso-line">
          <span className="text-iso-inkSecondary">INCLINAISON</span>
          <input
            type="range"
            min="-1.2"
            max="1.2"
            step="0.05"
            value={pitch}
            onChange={(e) => setPitch( parseFloat(e.target.value) )}
            className="w-24 accent-iso-accent"
          />
          <span className="text-iso-ink tabular-nums">{pitch.toFixed(2)}r</span>
        </label>
        <div className="flex items-center justify-between px-3 py-1.5 text-iso-inkSecondary truncate">
          <span>TEX MAX : {gpuInfo.maxTexture}px</span>
          <span className="text-iso-ink truncate ml-2" title={gpuInfo.renderer}>
            {gpuInfo.renderer}
          </span>
        </div>
      </div>
    </div>
  );
};
