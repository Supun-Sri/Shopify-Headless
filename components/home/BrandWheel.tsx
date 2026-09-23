'use client';

import React, { useEffect, useRef } from 'react';

import Image from 'next/image';

// Brand data styled to match the minimalist, bold aesthetic of the uploaded reference
const BRANDS = [
  { id: 'sika', bg: '#E2001A', color: '#FFD100', text: 'SIKA' },
  { id: 'fosroc', bg: '#00529C', color: '#FFC72C', text: 'FOS' },
  { id: 'mapei', bg: '#006DB7', color: '#fff', text: 'MAPEI' },
  { id: 'jotun', bg: '#002B49', color: '#fff', text: 'J' }, 
  { id: 'hilti', bg: '#D8232A', color: '#fff', text: 'HILTI' },
  { id: 'master', bg: '#002855', color: '#FF6B00', text: 'MB' },
  { id: 'henkel', bg: '#E10A0A', color: '#fff', text: 'POLY' },
  { id: 'bostik', bg: '#00A859', color: '#fff', text: 'BOS' },
  { id: 'weber', bg: '#21409A', color: '#fff', text: 'web' },
  { id: 'dowsil', bg: '#002C6C', color: '#00A3E0', text: 'DOW' },
  { id: 'basf', bg: '#004A96', color: '#fff', text: 'BASF' },
  { id: 'gcp', bg: '#1D828C', color: '#fff', text: 'GCP' }
];

export default function BrandWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Strict index-based tracking for "1 at a time" snapping
  const activeIndex = useRef(0);
  const currentRot = useRef(0);
  
  // Interaction state
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const lastInteractionTime = useRef(typeof Date !== 'undefined' ? Date.now() : 0);
  const lastAutoStepTime = useRef(typeof Date !== 'undefined' ? Date.now() : 0);

  const STEP = 360 / BRANDS.length;
  // Expanded radius to prevent the orbiting items from overlapping the center logo
  const RADIUS_X = 180; 
  const RADIUS_Y = 240;

  useEffect(() => {
    let rafId: number;

    const loop = () => {
      const now = Date.now();
      
      // Auto-play slowly if no recent interaction
      if (now - lastInteractionTime.current > 4000) {
        if (now - lastAutoStepTime.current > 2500) {
          activeIndex.current--;
          lastAutoStepTime.current = now;
        }
      }

      // Smooth, slow lerp to the active index
      const targetRot = activeIndex.current * STEP;
      currentRot.current += (targetRot - currentRot.current) * 0.035; // Slow spring

      // Render loop: Update DOM directly for maximum 60fps performance
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        
        // 0 degrees is the 3 o'clock position (Right edge)
        const angleDeg = i * STEP - currentRot.current;
        const angleRad = (angleDeg * Math.PI) / 180;
        
        const x = Math.cos(angleRad) * RADIUS_X;
        const y = Math.sin(angleRad) * RADIUS_Y;
        
        // Normalized X gives us a value from 0 (Left edge) to 1 (Right edge).
        const normalizedX = (Math.cos(angleRad) + 1) / 2;
        
        // Use a power curve so the single front-most item pops significantly 
        // compared to its immediate neighbors.
        const scaleCurve = Math.pow(normalizedX, 6);
        
        // Scaled up min and max for an overall larger appearance
        const minScale = 0.35;
        const maxScale = 1.95;
        const scale = minScale + (scaleCurve * (maxScale - minScale));
        
        const minOpacity = 0.05;
        const maxOpacity = 1;
        const opacity = minOpacity + (normalizedX * (maxOpacity - minOpacity));
        
        const zIndex = Math.round(normalizedX * 100);

        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        el.style.zIndex = zIndex.toString();
        el.style.opacity = opacity.toString();
        // Dynamic shadow to physically elevate the highlighted item
        el.style.boxShadow = `0 ${12 + scaleCurve * 18}px ${25 + scaleCurve * 25}px rgba(0,0,0,${0.1 + scaleCurve * 0.15})`;
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [STEP]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isSwiping.current = true;
    touchStartY.current = e.clientY;
    lastInteractionTime.current = Date.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwiping.current) return;
    
    const deltaY = touchStartY.current - e.clientY;
    
    // Threshold to trigger a 1-item snap
    if (Math.abs(deltaY) > 40) {
      if (deltaY > 0) {
        activeIndex.current--; // Drag up
      } else {
        activeIndex.current++; // Drag down
      }
      // Reset interaction so it doesn't trigger multiple times in one swipe
      isSwiping.current = false;
      lastInteractionTime.current = Date.now();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isSwiping.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    lastInteractionTime.current = now;
    
    // Throttle wheel events to ensure strict 1-by-1 snapping
    if (now - lastAutoStepTime.current < 500) return;
    
    if (e.deltaY > 0) activeIndex.current--;
    else activeIndex.current++;
    
    lastAutoStepTime.current = now;
  };

  return (
    <div 
      ref={containerRef}
      className="dial-carousel-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <style>{`
        .dial-carousel-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: grab;
          touch-action: none;
          z-index: 10;
        }

        .dial-carousel-container:active {
          cursor: grabbing;
        }

        .dial-center-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          pointer-events: none;
          /* Add a soft glow behind the logo */
          border-radius: 50%;
          box-shadow: 0 0 60px 20px rgba(255, 255, 255, 0.4);
          background: #fff;
          display: grid;
          place-items: center;
          padding: 4px;
        }

        .dial-origin {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
        }

        .dial-item {
          position: absolute;
          top: 0;
          left: 0;
          width: 90px;
          height: 90px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-family: var(--font-display, inherit);
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.02em;
          box-shadow: 0 10px 25px rgba(0,0,0,0.12);
          transform-origin: center;
          user-select: none;
          will-change: transform, opacity;
        }
      `}</style>

      <div className="dial-center-text">
        <Image
          src="/logo.png"
          alt="Imperial Logo"
          width={90}
          height={90}
          priority
          style={{ 
            objectFit: 'cover', 
            height: '90px', 
            width: '90px',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      <div className="dial-origin">
        {BRANDS.map((brand, i) => (
          <div
            key={brand.id}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            className="dial-item"
            style={{
              background: brand.bg,
              color: brand.color,
            }}
          >
            {brand.text}
          </div>
        ))}
      </div>
    </div>
  );
}
