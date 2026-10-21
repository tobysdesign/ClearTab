"use client";

import * as React from "react";
import { useRef, useEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipShortcut,
} from "@cleartab/ui";
import styles from "./ai-shader-button.module.css";

export interface AiShaderButtonProps {
  onClick: () => void;
  className?: string;
  tooltip?: string;
  shortcut?: string;
  /** Liquid-glass base (button body) colour. */
  baseColor?: string;
  /** Accent colour for the glass rim, inner liquid and stars. */
  glassColor?: string;
  /** Animation speed while hovered. */
  hoverSpeed?: number;
  "data-testid"?: string;
  "aria-label"?: string;
}

// Raw-WebGL fullscreen quad: no three.js dependency, just a vertex + fragment pair.
const vertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Liquid-glass circle (quiet until hovered) + particles orbiting OUTSIDE it.
// The canvas is larger than the button so the orbit ring has room beyond the circle.
// Premultiplied-alpha output: circle is opaque, particles glow, everything else clear.
const fragmentShader = `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uHover;   // 0 at rest, 1 hovered (smoothed)
uniform float uClick;
uniform vec3 uBaseColor;
uniform vec3 uGlassColor;
uniform float uCircleRadius; // circle radius in UV (0..0.5), canvas is bigger than circle

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    f += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return f;
}

void main() {
  vec2 c = vUv - 0.5;            // centred, -0.5..0.5
  float d = length(c);
  float R = uCircleRadius;
  float t = uTime;

  // Energy: very subtle at rest, full on hover / click.
  float energy = clamp(uHover + uClick, 0.0, 1.0);

  // ---------- Circle glass (centre) ----------
  // Soft edge so the circle blends into the glow instead of showing a hard rim.
  float circleMask = smoothstep(R + 0.006, R - 0.016, d);
  vec2 luv = (c / R) * 0.5 + 0.5;
  float innerDist = clamp(1.0 - d / max(R, 0.0001), 0.0, 1.0); // 1 centre, 0 edge

  vec2 noiseUv = luv * vec2(2.0, 1.0);
  vec2 warp = vec2(fbm(noiseUv + t * 0.5), fbm(noiseUv + t * 0.5 + 12.34)) * mix(0.03, 0.4, uHover);
  warp -= normalize(c + 0.0001) * uClick * 0.2 * smoothstep(R, 0.0, d);
  float n1 = fbm(noiseUv + warp + vec2(t, 0.0));
  float n2 = fbm(noiseUv + warp + vec2(n1, t * 1.2));

  float theta = atan(c.y, c.x);
  float distOut = max(d - R, 0.0);                       // 0 at edge, grows outward

  // Non-uniform halo: a directional bias (one side clearly stronger) plus big soft
  // lobes, so it never reads as an even ring.
  float bias = mix(0.28, 1.0, 0.5 + 0.5 * cos(theta + 0.5));
  float lobes = mix(0.35, 1.3, fbm(vec2(cos(theta), sin(theta)) * 1.2 + vec2(t * 0.04, -t * 0.03)));
  float angVar = bias * lobes;

  // Streaky filaments radiating outward (gently swirled), like gas wisps.
  float swirl = theta + distOut * 2.2 + t * 0.05;
  float streak = fbm(vec2(swirl * 3.2, distOut * 7.0 - t * 0.12));
  float filaments = 0.4 + 0.6 * smoothstep(0.32, 0.86, streak);

  float innerI = mix(0.05, 1.0, energy);                 // inner liquid: very subtle at rest
  vec3 glass = uBaseColor;
  glass += uGlassColor * smoothstep(0.3, 0.9, n2) * innerDist * 0.35 * innerI;
  glass += uGlassColor * exp(-d * 10.0) * uClick * 0.6;  // centre flash on click

  // Outer glow: coloured light fading outward, broken by filaments, biased to one side.
  float reach = mix(0.14, 0.34, uHover);                 // reaches further on hover
  float outerGlow = exp(-distOut / reach * 2.3) * angVar * filaments * (1.0 - circleMask);
  float glowI = mix(0.32, 1.35, energy);                 // a bit more visible at rest
  float glowA = clamp(outerGlow * glowI, 0.0, 1.0) * (1.0 - circleMask);

  // Thin rim right at the circle edge — brightest where the glow is strongest, so it
  // reads as glowing light (not a drawn bezel).
  float rim = exp(-distOut / 0.014) * (1.0 - circleMask) * angVar;
  float rimA = clamp(rim * mix(0.3, 1.0, energy), 0.0, 1.0) * (1.0 - circleMask);

  // White at rest, warming to the accent (red) on hover.
  vec3 glowTint = mix(vec3(1.0), uGlassColor, uHover);
  vec3 rimTint = mix(vec3(1.0), uGlassColor, uHover * 0.5);
  vec3 glowCol = glowTint * glowA + rimTint * rimA;
  float glowTotalA = clamp(glowA + rimA, 0.0, 1.0);

  // ---------- Orbiting particles (outside the circle) ----------
  float particles = 0.0;
  const int N = 24;
  float activeCount = mix(10.0, 22.0, uHover);            // fewer at rest, more on hover
  float maxR = mix(R + 0.10, 0.48, uHover);               // tighter at rest, spread on hover
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float gate = smoothstep(activeCount, activeCount - 2.0, fi); // extra ones fade in on hover
    float h0 = hash(vec2(fi, 1.7));
    float h1 = hash(vec2(fi, 4.3));
    float h2 = hash(vec2(fi, 9.1));
    float radius = mix(R + 0.025, maxR, h0);
    float dir = mix(-1.0, 1.0, step(0.5, h1));
    // Gentle orbit; hover adds only a touch (keeps the spin calm, not frantic).
    float spd = mix(0.15, 0.28, h2) * dir * (1.0 + uHover * 0.2);
    float pAng = h0 * 6.2831 + t * spd;
    // radial drift so they don't travel on perfect rails
    float rr = radius + sin(t * mix(0.5, 1.1, h1) + fi) * 0.018;
    vec2 pp = vec2(cos(pAng), sin(pAng)) * rr;
    float pd = length(c - pp);
    // Bigger dots; the same size at rest and hover, so hover inherits them.
    float psize = mix(0.013, 0.026, h1);
    float glow = smoothstep(psize, 0.0, pd);
    glow += smoothstep(psize * 2.3, 0.0, pd) * 0.18;      // soft halo
    glow *= 0.74 + 0.26 * sin(t * mix(1.0, 2.4, h2) + fi * 1.7); // gentle twinkle
    particles += max(glow, 0.0) * gate;
  }
  particles *= smoothstep(R - 0.01, R + 0.02, d);         // keep them outside the circle
  float partI = mix(0.6, 1.0, uHover) + uClick * 0.3;
  float pa = clamp(particles * partI, 0.0, 1.0) * (1.0 - circleMask);
  vec3 pc = mix(vec3(1.0), mix(uGlassColor, vec3(1.0), 0.45), uHover); // white at rest

  // ---------- Premultiplied compose ----------
  vec3 outCol = glass * circleMask + glowCol + pc * pa;
  float outA = clamp(circleMask + glowTotalA + pa, 0.0, 1.0);
  gl_FragColor = vec4(outCol, outA);
}
`;

// Canvas is this many times bigger than the circular button, giving the orbit ring
// room to live outside the circle. Circle radius (UV) = 0.5 / SCALE.
const CANVAS_SCALE = 2.2;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const int = parseInt(full, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("AiShaderButton shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function AiShaderButton({
  onClick,
  className,
  tooltip,
  shortcut,
  baseColor = "#0b0b0d",
  glassColor = "#ff3346",
  hoverSpeed = 0.6,
  "data-testid": testId,
  "aria-label": ariaLabel,
}: AiShaderButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(0);
  const clickRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("AiShaderButton link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Premultiplied-alpha blending so the circle is opaque, particles glow and the
    // rest of the (oversized) canvas stays transparent.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Fullscreen quad (triangle strip).
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(program, "uTime"),
      hover: gl.getUniformLocation(program, "uHover"),
      click: gl.getUniformLocation(program, "uClick"),
      base: gl.getUniformLocation(program, "uBaseColor"),
      glass: gl.getUniformLocation(program, "uGlassColor"),
      circle: gl.getUniformLocation(program, "uCircleRadius"),
    };
    gl.uniform3fv(u.base, hexToRgb(baseColor));
    gl.uniform3fv(u.glass, hexToRgb(glassColor));
    gl.uniform1f(u.circle, 0.5 / CANVAS_SCALE);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
    );
    intersectionObserver.observe(canvas);

    let raf = 0;
    let acc = 0;
    let last = performance.now();
    let curHover = 0;
    let curClick = 0;

    const drawFrame = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.time, acc);
      gl.uniform1f(u.hover, curHover);
      gl.uniform1f(u.click, curClick);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if (reduceMotion) {
      // One static frame, no loop.
      acc = 2.0;
      curHover = 0.25;
      drawFrame();
    } else {
      const loop = (time: number) => {
        raf = requestAnimationFrame(loop);
        if (!visible) {
          last = time;
          return;
        }
        const delta = Math.min((time - last) / 1000, 0.05);
        last = time;

        curHover += (hoverRef.current - curHover) * delta * 4;
        if (clickRef.current > 0) {
          curClick = clickRef.current;
          clickRef.current = 0;
        }
        curClick += (0 - curClick) * delta * 6;

        const speed = 0.15 + (hoverSpeed - 0.15) * curHover;
        acc += delta * speed;

        drawFrame();
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [baseColor, glassColor, hoverSpeed]);

  const onEnter = useCallback(() => {
    hoverRef.current = 1;
  }, []);
  const onLeave = useCallback(() => {
    hoverRef.current = 0;
  }, []);
  const onDown = useCallback(() => {
    clickRef.current = 1;
  }, []);

  const button = (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onPointerDown={onDown}
      data-testid={testId}
      aria-label={ariaLabel ?? tooltip ?? "AI chat"}
      className={`${styles.button} ${className || ""}`}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="11"
        fill="none"
        viewBox="0 0 150 83"
        className={styles.face}
        aria-hidden="true"
      >
        <path
          d="M84.4709 33.8098C84.4709 25.3554 86.6074 18.7971 90.8805 14.1347C95.1535 9.4724 99.383 7.14124 107.009 7.14124C114.635 7.14124 120.584 9.4724 124.857 14.1347C129.13 18.7971 131.267 25.3554 131.267 33.8098V48.3563C131.267 57.0593 129.13 63.6798 124.857 68.2179C120.584 72.7559 116.355 75.0249 108.729 75.0249C101.103 75.0249 95.1535 72.7559 90.8805 68.2179C86.6074 63.6798 84.4709 57.0593 84.4709 48.3563V33.8098ZM108.729 67.9381C114.054 67.9381 116.311 66.1975 118.941 62.7163C121.636 59.1729 122.983 54.1998 122.983 47.7968V34.3693C122.983 31.3854 122.655 28.6812 121.997 26.2568C121.34 23.7702 120.321 21.6566 118.941 19.916C117.626 18.1133 115.949 16.7146 113.911 15.7199C111.939 14.7253 109.638 14.228 107.009 14.228C104.313 14.228 103.7 14.7253 101.727 15.7199C99.7553 16.7146 98.0789 18.1133 96.6984 19.916C95.3836 21.6566 94.3975 23.7702 93.7401 26.2568C93.0827 28.6812 92.754 31.3854 92.754 34.3693V47.7968C92.754 54.1998 94.0688 59.1729 96.6984 62.7163C99.3937 66.1975 103.404 67.9381 108.729 67.9381Z"
          fill="currentColor"
        />
        <path
          d="M20.555 33.1277C20.555 24.5278 22.6915 17.8565 26.9646 13.1139C31.2377 8.3713 35.4671 6 43.0929 6C50.7187 6 56.6681 8.3713 60.9412 13.1139C65.2142 17.8565 67.3508 24.5278 67.3508 33.1277V47.9246C67.3508 56.7775 65.2142 63.512 60.9412 68.1281C56.6681 72.7442 52.4386 75.0523 44.8128 75.0523C37.1871 75.0523 31.2377 72.7442 26.9646 68.1281C22.6915 63.512 20.555 56.7775 20.555 47.9246V33.1277ZM44.8128 67.8435C50.1377 67.8435 52.3951 66.073 55.0246 62.5318C57.7199 58.9274 59.0676 53.8687 59.0676 47.3555V33.6968C59.0676 30.6615 58.7389 27.9108 58.0815 25.4447C57.4241 22.9153 56.4052 20.7653 55.0246 18.9947C53.7098 17.1609 52.0335 15.7381 49.9956 14.7264C48.0234 13.7146 45.7225 13.2088 43.0929 13.2088C40.3976 13.2088 39.7838 13.7146 37.8116 14.7264C35.8394 15.7381 34.1631 17.1609 32.7825 18.9947C31.4677 20.7653 30.4817 22.9153 29.8243 25.4447C29.1669 27.9108 28.8382 30.6615 28.8382 33.6968V47.3555C28.8382 53.8687 30.153 58.9274 32.7825 62.5318C35.4778 66.073 39.488 67.8435 44.8128 67.8435Z"
          fill="currentColor"
        />
        <path
          d="M71.916 37.8128C71.916 35.449 73.8323 33.5327 76.1961 33.5327C78.5599 33.5327 80.4762 35.449 80.4762 37.8128V72.6243C80.4762 74.9881 78.5599 76.9044 76.1961 76.9044C73.8323 76.9044 71.916 74.9881 71.916 72.6243V37.8128Z"
          fill="currentColor"
        />
        <path
          d="M15.4188 39.593C15.4188 39.593 12.5654 41.8642 12.5654 43.8731C12.5654 45.8819 15.4188 48.1532 15.4188 48.1532C15.4188 56.7451 8 48.78 8 43.8731C8 38.9661 15.4188 31.001 15.4188 39.593Z"
          fill="currentColor"
        />
        <path
          d="M135.496 48.1535C135.496 48.1535 138.349 45.8822 138.349 43.8734C138.349 41.8645 135.496 39.5933 135.496 39.5933C135.496 31.0013 142.915 38.9664 142.915 43.8734C142.915 48.7803 135.496 56.7454 135.496 48.1535Z"
          fill="currentColor"
        />
        <ellipse fill="currentColor" cx="43.9529" cy="43.0061" rx="7.21779" ry="7.21779">
          <animate
            attributeName="cx"
            keyTimes="0; 0.076; 0.229; 0.326; 0.472; 0.547; 0.696; 0.762; 0.908; 1"
            values="43.95;38.63;38.63;49.46;49.46;43.95;43.95;43.95;43.95;43.95"
            dur="4s"
            calcMode="spline"
            keySplines="0 0 1 1;0 0 .58 1;0 0 .58 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            keyTimes="0; 0.076; 0.229; 0.326; 0.472; 0.547; 0.696; 0.762; 0.908; 1"
            values="43;43.26;43.26;40.22;40.22;33.87;33.87;53.48;53.48;43"
            dur="4s"
            calcMode="spline"
            keySplines="0 0 1 1;0 0 .58 1;0 0 .58 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse fill="currentColor" cx="107.869" cy="43.006" rx="7.21779" ry="7.21779">
          <animate
            attributeName="cx"
            keyTimes="0; 0.076; 0.229; 0.326; 0.472; 0.547; 0.696; 0.762; 0.908; 1"
            values="107.87;103.17;102.99;112.68;112.94;107.87;107.87;107.87;107.87;107.87"
            dur="4s"
            calcMode="spline"
            keySplines="0 0 .58 1;0 0 .58 1;0 0 .58 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            keyTimes="0; 0.076; 0.229; 0.326; 0.472; 0.547; 0.696; 0.762; 0.908; 1"
            values="43;43;43;40.22;40.22;33.87;33.87;53.48;53.48;43"
            dur="4s"
            calcMode="spline"
            keySplines="0 0 .58 1;0 0 .58 1;0 0 .58 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1;0 0 1 1"
            repeatCount="indefinite"
          />
        </ellipse>
      </svg>
    </button>
  );

  if (!tooltip && !shortcut) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <span>{tooltip}</span>
        {shortcut ? <TooltipShortcut>{shortcut}</TooltipShortcut> : null}
      </TooltipContent>
    </Tooltip>
  );
}
