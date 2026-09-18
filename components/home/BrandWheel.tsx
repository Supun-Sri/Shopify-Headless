'use client';

import React from 'react';

/**
 * A rotating brand wheel intended to be placed in the hero section or a featured area.
 * It uses absolute positioning and CSS animations to create a planetary orbit effect.
 */
export default function BrandWheel() {
  const items = [
    { id: 1, label: 'Sika', icon: '💧' },
    { id: 2, label: 'Mapei', icon: '🧱' },
    { id: 3, label: 'Fosroc', icon: '🛡️' },
    { id: 4, label: 'Laticrete', icon: '✨' },
    { id: 5, label: 'Terraco', icon: '🏗️' },
    { id: 6, label: 'Weber', icon: '🛠️' },
  ];

  // The radius of the orbit in pixels
  const RADIUS = 160;

  return (
    <div className="hero-brand-wheel">
      <style>{`
        .hero-brand-wheel {
          position: relative;
          width: 400px;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          /* Keep the wheel scaled nicely on smaller screens */
          max-width: 100%;
        }

        /* The faint circular orbit path */
        .wheel-orbit-path {
          position: absolute;
          width: ${RADIUS * 2}px;
          height: ${RADIUS * 2}px;
          border-radius: 50%;
          border: 1px dashed rgba(25, 40, 80, 0.15); /* Darker dashed line for light background */
        }

        /* The center hub */
        .wheel-center {
          position: absolute;
          width: 110px;
          height: 110px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-bottom-color: rgba(200, 215, 235, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          box-shadow: 
            inset 0 1px 2px #fff,
            0 8px 24px -4px rgba(7, 27, 70, 0.15);
        }

        .wheel-center-text {
          font-family: var(--font-display, inherit);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: -0.02em;
          color: var(--navy, #071b46);
        }

        /* The rotating container */
        .wheel-rotator {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          animation: spin 45s linear infinite;
        }

        /* 
         * The orbiting nodes.
         * The counter-spin animation exactly counters the spin animation
         * so the items always stay upright while orbiting.
         */
        .wheel-item-content {
          width: 64px;
          height: 64px;
          margin: -32px 0 0 -32px; /* Center perfectly */
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-bottom-color: rgba(200, 215, 235, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 
            inset 0 1px 1px #fff,
            0 4px 12px rgba(0, 0, 0, 0.08);
          animation: counter-spin 45s linear infinite;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
          cursor: pointer;
          color: var(--navy);
          position: relative;
        }

        .wheel-item-content:hover {
          transform: scale(1.15);
          box-shadow: 
            inset 0 1px 1px #fff,
            0 12px 24px -4px rgba(7, 27, 70, 0.2);
          background: #fff;
          z-index: 20;
        }

        /* Tooltip label on hover */
        .wheel-item-label {
          position: absolute;
          bottom: -24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--navy);
          opacity: 0;
          transform: translateY(-4px);
          transition: all 0.2s ease;
          pointer-events: none;
          background: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .wheel-item-content:hover .wheel-item-label {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes counter-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @media (max-width: 500px) {
          .hero-brand-wheel { transform: scale(0.85); }
        }
      `}</style>

      {/* Orbit Line */}
      <div className="wheel-orbit-path" />

      {/* Center Hub */}
      <div className="wheel-center">
        <span className="wheel-center-text">IMPERIAL</span>
      </div>

      {/* Orbiting Nodes */}
      <div className="wheel-rotator">
        {items.map((item, i) => {
          // Calculate even spacing around the 360 degree circle
          const angle = (360 / items.length) * i;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                // Position on the edge of the radius
                transform: `rotate(${angle}deg) translateY(-${RADIUS}px)`,
              }}
            >
              {/* Counter-rotate the static angle so the item starts upright */}
              <div style={{ transform: `rotate(-${angle}deg)` }}>
                {/* The animated content that counter-spins against the wheel-rotator */}
                <div className="wheel-item-content">
                  {/* NOTE: You can replace {item.icon} with an <Image /> component for real brand logos */}
                  <span>{item.icon}</span>
                  <div className="wheel-item-label">{item.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
