'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BrandWheel from './BrandWheel';

const HERO_SLIDES = [
  {
    l1: 'Construction chemicals & systems',
    l2: 'Stocked in Al Quoz, Dubai',
    title: 'Materials. Systems.',
    titleLine2: 'Project confidence.',
    description: 'Technical products, responsive support and reliable UAE supply for demanding construction environments.',
    note: 'Over 900 lines held in UAE stock.',
    artType: 0,
  },
  {
    l1: 'Waterproofing & tanking',
    l2: 'Sika · Mapei · Fosroc',
    title: 'Sealed once.',
    titleLine2: 'Signed off once.',
    description: 'Membranes, primers and tapes specified as one system, so the detail passes inspection the first time.',
    note: 'Compatibility checked before dispatch.',
    artType: 1,
  },
  {
    l1: 'Tile adhesives & grouts',
    l2: 'C2TE and C2TES1 classes',
    title: 'Large format,',
    titleLine2: 'zero lippage.',
    description: 'Flexible adhesives for porcelain and natural stone, with coverage figures printed on every bag.',
    note: 'Coverage calculator on every product.',
    artType: 2,
  },
];

export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const slide = HERO_SLIDES[activeIdx];

  const handleStep = (delta: number) => {
    setActiveIdx((prev) => (prev + delta + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Immersive Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image 
          src="/Gemini_Generated_Image_s18lxes18lxes18l.jpg" 
          alt="Imperial Construction Projects" 
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Soft gradient mask: Solid light on the left for text readability, fading to transparent on the right to show the image */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(90deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.85) 45%, rgba(248, 250, 252, 0.1) 100%)' 
        }} />
      </div>

      <div className="hero-grid" style={{ position: 'relative', zIndex: 10 }}>
        {/* Left rail marker */}
        <div className="hero-rail" aria-hidden="true">
          <svg className="mark ic" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span className="rule" />
        </div>

        {/* Text copy */}
        <div className="hero-text" key={activeIdx}>
          <div className="hero-flag" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="hero-meta">
            <span className="l1">{slide.l1}</span>
            <span className="l2">{slide.l2}</span>
          </div>
          <h1>
            {slide.title}
            <br />
            {slide.titleLine2}
          </h1>
          <p>{slide.description}</p>
          <div className="hero-actions">
            <Link href="/rfq" className="btn line">
              Request a quote
            </Link>
            <Link href="/products" className="hero-link">
              Browse the catalogue
              <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="hero-nav">
            <button onClick={() => handleStep(-1)} aria-label="Previous slide">
              <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="sep" aria-hidden="true" />
            <button onClick={() => handleStep(1)} aria-label="Next slide">
              <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stage with dynamic rotating brand wheel */}
        <div className="hero-stage">
          <BrandWheel />
          <p className="hero-note" style={{ position: 'relative', zIndex: 20 }}>{slide.note}</p>
        </div>

        {/* Right dots */}
        <div className="hero-dots" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((_, i) => (
            <i
              key={i}
              className={i === activeIdx ? 'on' : ''}
              role="tab"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
