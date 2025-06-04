import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface SilkBackgroundProps {
  className?: string
  children?: React.ReactNode
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < 5; ++i) {
      v += a * snoise(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 st = vUv;
    vec3 color = vec3(0.0);
    
    vec3 q = vec3(0.0);
    q.x = fbm(vec3(st * 4.0, time * 0.1));
    q.y = fbm(vec3(st * 4.0 + vec2(1.0), time * 0.1));

    vec3 r = vec3(0.0);
    r.x = fbm(vec3(st * 4.0 + 1.0 * q + vec2(1.7, 9.2), time * 0.15));
    r.y = fbm(vec3(st * 4.0 + 1.0 * q + vec2(8.3, 2.8), time * 0.15));

    float f = fbm(vec3(st * 4.0 + r, time * 0.1));

    color = mix(vec3(0.02, 0.02, 0.03),
                vec3(0.05, 0.05, 0.08),
                clamp((f*f)*4.0, 0.0, 1.0));

    color = mix(color,
                vec3(0.08, 0.08, 0.12),
                clamp(length(q), 0.0, 1.0));

    color = mix(color,
                vec3(0.12, 0.12, 0.16),
                clamp(length(r.x), 0.0, 1.0));

    // Add silk-like highlights
    float highlight = pow(max(dot(normalize(vec3(r, 0.1)), normalize(vec3(1.0, 1.0, 1.0))), 0.0), 2.0);
    color += vec3(0.05, 0.05, 0.08) * highlight;

    gl_FragColor = vec4(color, 1.0);
  }
`

export default function SilkBackground({ className = "", children }: SilkBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.Camera
    renderer: THREE.WebGLRenderer
    material: THREE.ShaderMaterial
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      }
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    camera.position.z = 1

    let startTime = Date.now()
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      material.uniforms.time.value = elapsed
      
      renderer.render(scene, camera)
      const animationId = requestAnimationFrame(animate)
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    sceneRef.current = { scene, camera, renderer, material, animationId: 0 }
    animate()

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      renderer.setSize(width, height)
      material.uniforms.resolution.value.set(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement)
        }
        
        sceneRef.current.renderer.dispose()
        sceneRef.current = null
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mountRef} 
        className="fixed inset-0 -z-10"
        style={{ 
          width: '100vw', 
          height: '100vh',
          pointerEvents: 'none'
        }} 
      />
      {children}
    </div>
  )
}