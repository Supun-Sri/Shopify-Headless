'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BRANDS = [
  {
      id: 'sika',
      name: 'SIKA',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.save();
          ctx.translate(w / 2 - 90, h / 2);
          ctx.fillStyle = '#E2001A';
          ctx.beginPath();
          ctx.moveTo(0, -45);
          ctx.lineTo(40, 45);
          ctx.lineTo(-40, 45);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#FFD100';
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(18, 22);
          ctx.lineTo(-18, 22);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = '#E2001A';
          ctx.font = '900 64px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('SIKA', w / 2 - 30, h / 2 + 2);
      }
  },
  {
      id: 'fosroc',
      name: 'FOSROC',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.save();
          ctx.translate(w / 2 - 130, h / 2 - 25);
          ctx.fillStyle = '#00529C';
          ctx.fillRect(0, 0, 50, 50);
          ctx.fillStyle = '#FFC72C';
          ctx.beginPath();
          ctx.moveTo(50, 0);
          ctx.lineTo(75, 25);
          ctx.lineTo(50, 50);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = '#00529C';
          ctx.font = '900 60px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('FOSROC', w / 2 - 35, h / 2);
      }
  },
  {
      id: 'mapei',
      name: 'MAPEI',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#006DB7';
          ctx.roundRect(w / 2 - 140, h / 2 - 40, 280, 80, 16);
          ctx.fill();

          ctx.fillStyle = '#009246';
          ctx.fillRect(w / 2 - 140, h / 2 + 30, 93, 10);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(w / 2 - 47, h / 2 + 30, 94, 10);
          ctx.fillStyle = '#CE2B37';
          ctx.fillRect(w / 2 + 47, h / 2 + 30, 93, 10);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 56px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('MAPEI', w / 2, h / 2 - 4);
      }
  },
  {
      id: 'jotun',
      name: 'JOTUN',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.save();
          ctx.fillStyle = '#D31145';
          ctx.beginPath();
          ctx.arc(w / 2 - 110, h / 2, 36, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 32px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('J', w / 2 - 110, h / 2);
          ctx.restore();

          ctx.fillStyle = '#002B49';
          ctx.font = '900 60px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('JOTUN', w / 2 - 55, h / 2);
      }
  },
  {
      id: 'hilti',
      name: 'HILTI',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#D8232A';
          ctx.roundRect(w / 2 - 130, h / 2 - 42, 260, 84, 12);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 64px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('HILTI', w / 2, h / 2);
      }
  },
  {
      id: 'masterbuilders',
      name: 'MASTER BUILDERS',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.save();
          ctx.fillStyle = '#FF6B00';
          ctx.beginPath();
          ctx.arc(w / 2 - 120, h / 2, 32, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = '#002855';
          ctx.font = '900 36px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('MASTER', w / 2 - 75, h / 2 - 16);
          ctx.fillStyle = '#FF6B00';
          ctx.font = '800 26px Outfit, system-ui, sans-serif';
          ctx.fillText('BUILDERS', w / 2 - 75, h / 2 + 18);
      }
  },
  {
      id: 'henkel',
      name: 'HENKEL POLYBIT',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#E10A0A';
          ctx.beginPath();
          ctx.ellipse(w / 2 - 100, h / 2, 40, 28, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 20px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Henkel', w / 2 - 100, h / 2);

          ctx.fillStyle = '#0F172A';
          ctx.font = '900 44px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('POLYBIT', w / 2 - 45, h / 2);
      }
  },
  {
      id: 'bostik',
      name: 'BOSTIK',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#00A859';
          ctx.roundRect(w / 2 - 130, h / 2 - 40, 260, 80, 16);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 58px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BOSTIK', w / 2, h / 2);
      }
  },
  {
      id: 'weber',
      name: 'WEBER',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#21409A';
          ctx.font = '900 64px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('weber', w / 2, h / 2 - 10);

          ctx.fillStyle = '#E4002B';
          ctx.fillRect(w / 2 - 80, h / 2 + 28, 160, 8);
      }
  },
  {
      id: 'dowsil',
      name: 'DOWSIL',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#002C6C';
          ctx.font = '900 58px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('DOWSIL', w / 2, h / 2);

          ctx.fillStyle = '#00A3E0';
          ctx.beginPath();
          ctx.arc(w / 2 + 138, h / 2 - 16, 8, 0, Math.PI * 2);
          ctx.fill();
      }
  },
  {
      id: 'basf',
      name: 'BASF',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#004A96';
          ctx.fillRect(w / 2 - 120, h / 2 - 35, 70, 70);
          ctx.fillStyle = '#2196F3';
          ctx.fillRect(w / 2 - 95, h / 2 - 15, 70, 70);

          ctx.fillStyle = '#004A96';
          ctx.font = '900 64px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('BASF', w / 2, h / 2 + 10);
      }
  },
  {
      id: 'gcp',
      name: 'GCP APPLIED',
      drawLogo: function(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = '#1D828C';
          ctx.roundRect(w / 2 - 140, h / 2 - 40, 280, 80, 14);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 48px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('GCP APPLIED', w / 2, h / 2);
      }
  }
];

export default function BrandWheel() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let brandCarouselGroup: THREE.Group, pedestalGroup: THREE.Group;
    const logoMeshes: THREE.Mesh[] = [];
    
    let autoRotate = true;
    let targetRotationY = 0;
    let currentRotationY = 0;
    let isDragging = false;
    let previousMouseX = 0;
    
    let raycaster: THREE.Raycaster, mouse: THREE.Vector2;
    let hoveredLogo: THREE.Mesh | null = null;
    let animationFrameId: number;

    const container = mountRef.current;

    function createBrandLogoTexture(brand: any) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      brand.drawLogo(ctx, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    function initThreeScene() {
      const width = container.clientWidth;
      const height = container.clientHeight || 500; // Default height if zero

      scene = new THREE.Scene();
      // Changed to null/transparent so it seamlessly blends with the hero section background!
      scene.background = null; 

      // Perspective Camera
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(0, 1.2, 11); // Slightly pulled back for component view

      // WebGL Renderer - alpha: true allows background to show through
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      
      // Clear container and append
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
      mainLight.position.set(5, 12, 10);
      scene.add(mainLight);

      const blueAccentLight = new THREE.PointLight(0x0056B3, 1.5, 20);
      blueAccentLight.position.set(-6, -2, 5);
      scene.add(blueAccentLight);

      const warmRimLight = new THREE.PointLight(0xFFD100, 1.2, 20);
      warmRimLight.position.set(6, 4, -4);
      scene.add(warmRimLight);

      brandCarouselGroup = new THREE.Group();
      scene.add(brandCarouselGroup);

      // Pedestal Floor Ring
      pedestalGroup = new THREE.Group();
      scene.add(pedestalGroup);

      const torusGeo = new THREE.TorusGeometry(4.3, 0.02, 16, 100);
      const torusMat = new THREE.MeshStandardMaterial({
          color: 0x0056B3,
          roughness: 0.2,
          metalness: 0.8
      });
      const ringMesh = new THREE.Mesh(torusGeo, torusMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -1.2;
      pedestalGroup.add(ringMesh);

      // Soft Radial Floor Shadow
      const shadowGeo = new THREE.PlaneGeometry(16, 16);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const shadowCtx = shadowCanvas.getContext('2d');
      if (shadowCtx) {
        const shadowGrad = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
        shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.03)');
        shadowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        shadowCtx.fillStyle = shadowGrad;
        shadowCtx.fillRect(0, 0, 256, 256);
      }

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          opacity: 0.85
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -1.21;
      scene.add(shadowMesh);

      // Floating Ambient Particles
      createFloatingParticles();

      // Populate 12 Floating Pure Logo Planes
      const numBrands = BRANDS.length;
      const radius = 4.3;

      BRANDS.forEach((brand, i) => {
          const angle = (i / numBrands) * Math.PI * 2;
          const logoGeo = new THREE.PlaneGeometry(2.4, 1.2);
          const texture = createBrandLogoTexture(brand);

          const logoMat = new THREE.MeshStandardMaterial({
              map: texture,
              transparent: true,
              alphaTest: 0.05,
              roughness: 0.1,
              metalness: 0.1,
              side: THREE.DoubleSide
          });

          const logoMesh = new THREE.Mesh(logoGeo, logoMat);

          logoMesh.position.x = radius * Math.sin(angle);
          logoMesh.position.z = radius * Math.cos(angle);
          logoMesh.position.y = 0;
          logoMesh.rotation.y = angle;

          logoMesh.userData = {
              index: i,
              brand: brand
          };

          logoMeshes.push(logoMesh);
          brandCarouselGroup.add(logoMesh);
      });

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      setupInteractionListeners();
      animate();
    }

    function createFloatingParticles() {
      const particleCount = 80;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 18;
          positions[i + 1] = (Math.random() - 0.5) * 10;
          positions[i + 2] = (Math.random() - 0.5) * 18;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMat = new THREE.PointsMaterial({
          color: 0x0056B3,
          size: 0.05,
          transparent: true,
          opacity: 0.22
      });

      const particles = new THREE.Points(geometry, particleMat);
      scene.add(particles);
    }

    // Handlers bound locally to component
    function onPointerDown(e: MouseEvent | TouchEvent) {
      isDragging = true;
      if (e instanceof MouseEvent) {
        previousMouseX = e.clientX;
      } else {
        previousMouseX = e.touches[0].clientX;
      }
    }

    function onPointerUp() {
      isDragging = false;
    }

    function onPointerMove(e: MouseEvent | TouchEvent) {
      const rect = container.getBoundingClientRect();
      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      // Map to -1 to +1 for raycaster, relative to the container element
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
          const deltaX = clientX - previousMouseX;
          targetRotationY += deltaX * 0.007;
          previousMouseX = clientX;
      }
    }

    function onWindowResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    function setupInteractionListeners() {
      const dom = renderer.domElement;
      
      dom.addEventListener('mousedown', onPointerDown as any);
      dom.addEventListener('touchstart', onPointerDown as any, { passive: false });
      
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);
      
      window.addEventListener('mousemove', onPointerMove as any);
      window.addEventListener('touchmove', onPointerMove as any, { passive: false });
      
      window.addEventListener('resize', onWindowResize);
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      // Auto-rotation when idle
      if (autoRotate && !isDragging) {
          targetRotationY += 0.0025;
      }

      // Rotational Physics Lerp
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;
      brandCarouselGroup.rotation.y = currentRotationY;

      // Hover elevation raycasting
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(logoMeshes);

      if (hoveredLogo) {
          hoveredLogo.position.y = THREE.MathUtils.lerp(hoveredLogo.position.y, 0, 0.1);
          hoveredLogo.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          hoveredLogo = null;
      }

      if (intersects.length > 0) {
          hoveredLogo = intersects[0].object as THREE.Mesh;
          hoveredLogo.position.y = THREE.MathUtils.lerp(hoveredLogo.position.y, 0.25, 0.15);
          hoveredLogo.scale.lerp(new THREE.Vector3(1.12, 1.12, 1.12), 0.15);
      }

      renderer.render(scene, camera);
    }

    // Initialize!
    initThreeScene();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('mousemove', onPointerMove as any);
      window.removeEventListener('touchmove', onPointerMove as any);
      window.removeEventListener('resize', onWindowResize);
      
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="webgl-brand-carousel"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        cursor: 'grab',
        position: 'relative',
        zIndex: 10
      }}
    />
  );
}
