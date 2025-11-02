"use client";

import React, { useRef, useEffect } from "react";
import styles from "./charcoal-wave.module.css";

type Circle = {
  x: number;
  y: number;
  radius: number;
  color: readonly [number, number, number];
  vx: number;
  vy: number;
  interactive: boolean;
};

export function CharcoalWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
      depth: false,
      stencil: false,
      desynchronized: true,
    });
    if (!gl) return;

    // Tunables
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let targetFps = reduceMotion ? 12 : 20;
    const MAX_CIRCLES = reduceMotion ? 4 : 6;
    const DPR_CLAMP = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // State
    let cssW = 0;
    let cssH = 0;
    let bufW = 0;
    let bufH = 0;
    let scale = 0.5;
    let rafId = 0;

    // Timing set up-front
    let startTime = performance.now();
    let lastRenderTime = startTime;
    let frameInterval = 1000 / targetFps;
    let movingAvg = 50;
    let isVisible = true;
    let isIntersecting = true;

    // Mouse (throttled)
    const mouse = { x: 0, y: 0 };
    let lastMouseEvt: { x: number; y: number } | null = null;
    let lastUserMove = performance.now();

    // Circles
    const circleColors: readonly [number, number, number][] = [
      [0.12, 0.12, 0.12],
      [0.18, 0.18, 0.18],
      [0.25, 0.25, 0.25],
      [0.1, 0.1, 0.1],
      [0.3, 0.3, 0.3],
      [0.2, 0.2, 0.2],
    ];
    let circles: Circle[] = [];
    const circlesColorArray = new Float32Array(MAX_CIRCLES * 3);
    const circlesPosRadArray = new Float32Array(MAX_CIRCLES * 3);

    // Sizing
    function sizeCanvas() {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      bufW = Math.max(1, Math.floor(cssW * DPR_CLAMP * scale));
      bufH = Math.max(1, Math.floor(cssH * DPR_CLAMP * scale));
      canvas.width = bufW;
      canvas.height = bufH;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      gl.viewport(0, 0, bufW, bufH);
    }

    // Debounce
    const debounce = (fn: () => void, wait: number) => {
      let t: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (t) clearTimeout(t);
        t = setTimeout(fn, wait);
      };
    };

    // Init circles
    function initCircles() {
      circles = [];
      const baseRadius = (cssW + cssH) * 0.2 * scale;
      for (let i = 0; i < MAX_CIRCLES - 1; i++) {
        circles.push({
          x: Math.random() * bufW,
          y: Math.random() * bufH,
          radius: baseRadius,
          color: circleColors[i],
          vx: (Math.random() - 0.5) * (Math.random() * 2 + 0.5),
          vy: (Math.random() - 0.5) * (Math.random() * 2 + 0.5),
          interactive: false,
        });
      }
      circles.push({
        x: bufW / 2,
        y: bufH / 2,
        radius: (cssW + cssH) * 0.1 * scale,
        color: circleColors[MAX_CIRCLES - 1],
        vx: 0,
        vy: 0,
        interactive: true,
      });
    }

    // Shaders
    const vertSrc = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragSrc = `
      precision mediump float;
      varying vec2 v_uv;

      uniform vec2 u_resolution;
      uniform int u_circleCount;
      uniform vec3 u_circlesColor[${MAX_CIRCLES}];
      uniform vec3 u_circlesPosRad[${MAX_CIRCLES}];
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform float u_sigmaScale;
      uniform sampler2D u_noise;
      uniform float u_noiseScale;

      void main() {
        vec2 st = v_uv * u_resolution;
        vec3 bg = vec3(0.06);

        float fieldSum = 0.0;
        vec3 colorSum = vec3(0.0);

        for (int i = 0; i < ${MAX_CIRCLES}; i++) {
          if (i >= u_circleCount) break;
          vec3 pr = u_circlesPosRad[i];
          vec2 c = pr.xy;
          float r = pr.z;

          float d = distance(st, c);
          if (d > r * 1.6) continue;

          float s = r * u_sigmaScale;
          float invDen = 2.0 * s * s;
          float v = exp2(- (d * d) / invDen * 1.442695) * 1.4;

          fieldSum += v;
          colorSum += u_circlesColor[i] * v;
        }

        vec3 circ = fieldSum > 1e-3 ? colorSum / fieldSum : vec3(0.0);
        float x = fieldSum;
        float intensity = smoothstep(0.12, 0.9, x * x);
        vec3 col = mix(bg, circ, intensity);

        float n = texture2D(u_noise, (st / u_resolution) * u_noiseScale).r;
        col += (n - 0.5) * 0.02;

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;

    function makeShader(type: number, src: string) {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        if (log) console.error(log);
      }
      return s;
    }

    const vs = makeShader(gl.VERTEX_SHADER, vertSrc);
    const fs = makeShader(gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const programLog = gl.getProgramInfoLog(program);
      if (programLog) console.error(programLog);
      return;
    }
    gl.useProgram(program);

    // Geometry
    const quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const a_position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    // Uniform handles declared early to avoid TDZ
    let u_resolution: WebGLUniformLocation | null = null;
    let u_circleCount: WebGLUniformLocation | null = null;
    let u_circlesColor: WebGLUniformLocation | null = null;
    let u_circlesPosRad: WebGLUniformLocation | null = null;
    let u_mouse: WebGLUniformLocation | null = null;
    let u_time: WebGLUniformLocation | null = null;
    let u_sigmaScale: WebGLUniformLocation | null = null;
    let u_noise: WebGLUniformLocation | null = null;
    let u_noiseScale: WebGLUniformLocation | null = null;

    // Lookup uniforms
    u_resolution = gl.getUniformLocation(program, "u_resolution");
    u_circleCount = gl.getUniformLocation(program, "u_circleCount");
    u_circlesColor = gl.getUniformLocation(program, "u_circlesColor");
    u_circlesPosRad = gl.getUniformLocation(program, "u_circlesPosRad");
    u_mouse = gl.getUniformLocation(program, "u_mouse");
    u_time = gl.getUniformLocation(program, "u_time");
    u_sigmaScale = gl.getUniformLocation(program, "u_sigmaScale");
    u_noise = gl.getUniformLocation(program, "u_noise");
    u_noiseScale = gl.getUniformLocation(program, "u_noiseScale");

    // Noise texture
    function makeNoiseTex() {
      const N = 256;
      const data = new Uint8Array(N * N);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 255) | 0;
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        N,
        N,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      return tex;
    }
    const noiseTex = makeNoiseTex();

    // Fixed GL state
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.STENCIL_TEST);

    // Helpers
    function applyMouse() {
      if (!lastMouseEvt) return;
      const sx = bufW / cssW;
      const sy = bufH / cssH;
      const tx = lastMouseEvt.x * sx;
      const ty = lastMouseEvt.y * sy;
      mouse.x += (tx - mouse.x) * 0.35;
      mouse.y += (ty - mouse.y) * 0.35;
    }

    function updateCircles() {
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        if (!c.interactive) {
          c.x += c.vx;
          c.y += c.vy;
          if (c.x - c.radius > bufW) c.x = -c.radius;
          if (c.x + c.radius < 0) c.x = bufW + c.radius;
          if (c.y - c.radius > bufH) c.y = -c.radius;
          if (c.y + c.radius < 0) c.y = bufH + c.radius;
        } else {
          c.x += (mouse.x - c.x) * 0.08;
          c.y += (mouse.y - c.y) * 0.08;
        }
      }
    }

    function adaptQuality(dt: number) {
      movingAvg = movingAvg * 0.9 + dt * 0.1;
      const idle = performance.now() - lastUserMove > 3000;
      targetFps = idle ? (reduceMotion ? 8 : 10) : reduceMotion ? 12 : 20;
      frameInterval = 1000 / targetFps;

      if (movingAvg > 55 && scale > 0.33) {
        scale = Math.max(0.33, scale - 0.02);
        sizeCanvas();
        initCircles();
      } else if (movingAvg < 40 && scale < 0.7) {
        scale = Math.min(0.7, scale + 0.02);
        sizeCanvas();
        initCircles();
      }
    }

    // Event handlers defined now, attached later
    const onMouseMove = (e: MouseEvent) => {
      lastUserMove = performance.now();
      lastMouseEvt = { x: e.clientX, y: e.clientY };
    };

    const onResize = debounce(() => {
      sizeCanvas();
      initCircles();
    }, 120);

    const onVis = () => {
      isVisible = !document.hidden;
      if (isVisible && isIntersecting) rafId = requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(([entry]) => {
      isIntersecting = !!entry?.isIntersecting;
      if (isIntersecting && isVisible) rafId = requestAnimationFrame(render);
    });

    // Render defined after uniforms exist
    function render(now: number) {
      if (!(isVisible && isIntersecting)) return;
      if (!u_circleCount || !u_resolution) return; // uniforms not ready

      if (now - lastRenderTime < frameInterval) {
        rafId = requestAnimationFrame(render);
        return;
      }
      const dt = now - lastRenderTime || frameInterval;
      lastRenderTime = now;
      adaptQuality(dt);

      applyMouse();
      updateCircles();

      gl.useProgram(program);
      gl.viewport(0, 0, bufW, bufH);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const elapsed = (now - startTime) / 1000;

      gl.uniform1i(u_circleCount, circles.length);
      gl.uniform2f(u_resolution, bufW, bufH);
      gl.uniform2f(u_mouse, mouse.x, mouse.y);
      gl.uniform1f(u_time, elapsed);

      const sigmaScale = 0.45 * (0.9 + 0.1 * Math.sin(elapsed * 0.5));
      gl.uniform1f(u_sigmaScale, sigmaScale);

      for (let i = 0; i < MAX_CIRCLES; i++) {
        const c = circles[i];
        const b = i * 3;
        if (c) {
          circlesColorArray[b] = c.color[0];
          circlesColorArray[b + 1] = c.color[1];
          circlesColorArray[b + 2] = c.color[2];
          circlesPosRadArray[b] = c.x;
          circlesPosRadArray[b + 1] = c.y;
          circlesPosRadArray[b + 2] = c.radius;
        } else {
          circlesColorArray[b] = 0;
          circlesColorArray[b + 1] = 0;
          circlesColorArray[b + 2] = 0;
          circlesPosRadArray[b] = 0;
          circlesPosRadArray[b + 1] = 0;
          circlesPosRadArray[b + 2] = 0;
        }
      }
      gl.uniform3fv(u_circlesColor, circlesColorArray);
      gl.uniform3fv(u_circlesPosRad, circlesPosRadArray);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, noiseTex);
      gl.uniform1i(u_noise, 0);
      gl.uniform1f(u_noiseScale, 2.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    }

    // Init sequence. Nothing can call render before this.
    function init() {
      sizeCanvas();
      initCircles();
      mouse.x = bufW / 2;
      mouse.y = bufH / 2;

      // Kick off first frame
      rafId = requestAnimationFrame(render);

      // Attach observers and listeners after everything is ready
      io.observe(canvas);
      document.addEventListener("visibilitychange", onVis, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    init();

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVis as any);
      window.removeEventListener("resize", onResize as any);
      window.removeEventListener("mousemove", onMouseMove as any);
      io.disconnect();
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
