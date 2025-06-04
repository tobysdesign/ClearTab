/*
        Installed from https://reactbits.dev/ts/tailwind/
*/

import React, { forwardRef, useMemo, useRef, useLayoutEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type NormalizedRGB = [number, number, number];

const hexToNormalizedRGB = (hex: string): NormalizedRGB => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
};

interface SilkUniforms {
  uSpeed: { value: number };
  uScale: { value: number };
  uNoiseIntensity: { value: number };
  uColor: { value: THREE.Color };
  uRotation: { value: number };
  uTime: { value: number };
  [uniform: string]: { value: any };
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

interface SilkPlaneProps {
  uniforms: SilkUniforms;
}

const SilkPlane = forwardRef<THREE.Mesh, SilkPlaneProps>(function SilkPlane(
  { uniforms },
  ref
) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    try {
      const mesh = ref as React.MutableRefObject<THREE.Mesh | null>;
      if (mesh.current) {
        mesh.current.scale.set(viewport.width, viewport.height, 1);
      }
    } catch (error) {
      console.error('Error setting mesh scale:', error);
    }
  }, [ref, viewport]);

  useFrame((_state, delta: number) => {
    try {
      const mesh = ref as React.MutableRefObject<THREE.Mesh | null>;
      if (mesh.current && mesh.current.material) {
        const material = mesh.current.material as THREE.ShaderMaterial;
        if (material.uniforms && material.uniforms.uTime) {
          material.uniforms.uTime.value += 0.1 * delta;
        }
      }
    } catch (error) {
      console.error('Error updating shader uniforms:', error);
    }
  });

  try {
    return (
      <mesh ref={ref}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    );
  } catch (error) {
    console.error('Error rendering SilkPlane:', error);
    return null;
  }
});
SilkPlane.displayName = "SilkPlane";

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
  children?: React.ReactNode;
}

// WebGL capability detection
const isWebGLSupported = (): boolean => {
  try {
    // Check if we're in a Replit environment or if there are context issues
    if (typeof window !== 'undefined') {
      // Check for Replit-specific environment indicators
      const isReplit = window.location.hostname.includes('replit.dev') || 
                      window.location.hostname.includes('repl.co') ||
                      document.querySelector('script[src*="replit"]') !== null;
      
      if (isReplit) {
        console.warn('Replit environment detected, using fallback background for stability');
        return false;
      }
    }
    
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

// CSS fallback background component
const FallbackBackground: React.FC<{ color: string; className: string; children: React.ReactNode }> = ({ 
  color, 
  className, 
  children 
}) => {
  const [r, g, b] = hexToNormalizedRGB(color);
  const rgbColor = `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
  
  return (
    <div className={`relative ${className}`}>
      <div 
        className="fixed inset-0 -z-10 animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(${rgbColor}, 0.15) 0%, rgba(${rgbColor}, 0.05) 50%, transparent 100%), 
                      linear-gradient(45deg, rgba(${rgbColor}, 0.08) 0%, rgba(${rgbColor}, 0.03) 100%)`,
          animation: 'pulse 8s ease-in-out infinite alternate'
        }}
      />
      {children}
    </div>
  );
};

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
  className = "",
  children
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [webglError, setWebglError] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const uniforms = useMemo<SilkUniforms>(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new THREE.Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 },
    }),
    [speed, scale, noiseIntensity, color, rotation]
  );

  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    setContextLost(true);
    console.warn('WebGL context lost, switching to fallback background');
  }, []);

  const handleContextRestored = useCallback(() => {
    setContextLost(false);
    console.log('WebGL context restored');
  }, []);

  const handleWebGLError = useCallback((error: any) => {
    console.error('WebGL error:', error);
    setWebglError(true);
  }, []);

  // Check WebGL support and environment on component mount
  React.useEffect(() => {
    const webglSupported = isWebGLSupported();
    if (!webglSupported) {
      setWebglError(true);
      console.warn('WebGL not supported, using fallback background');
    }
  }, []);

  // Early return for Replit environment or WebGL issues
  const webglSupported = isWebGLSupported();
  if (!webglSupported || webglError || contextLost) {
    return <FallbackBackground color={color} className={className} children={children} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="fixed inset-0 -z-10">
        <Canvas 
          dpr={[1, 2]} 
          frameloop="always"
          onCreated={({ gl }) => {
            try {
              gl.setClearColor('#0a0a0a');
              // Add context loss/restore listeners
              gl.domElement.addEventListener('webglcontextlost', handleContextLost);
              gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
            } catch (error) {
              handleWebGLError(error);
            }
          }}
          onError={handleWebGLError}
        >
          <SilkPlane ref={meshRef} uniforms={uniforms} />
        </Canvas>
      </div>
      {children}
    </div>
  );
};

export default Silk;