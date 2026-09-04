'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    <section className="hero">
      <div className="hero-grid">
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

        {/* Stage with architectural arch backdrop and line drawing */}
        <div className="hero-stage">
          <div className="hero-arch" aria-hidden="true" />
          <svg className="hero-art" viewBox="0 0 420 380" role="img" aria-label="Technical line drawing of materials">
            <defs>
              <g id="art-sack">
                <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M112 122c0-5 4-9 9-9h68c5 0 9 4 9 9l10 190c0 7-5 12-12 12h-82c-7 0-12-5-12-12z" />
                <path fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".45" d="M119 134h72" />
                <path fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".45" d="M105 288h110" />
                <rect fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" x="130" y="180" width="60" height="56" rx="2" />
                <path fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".45" d="M139 197h42M139 209h32M139 221h22" />
              </g>
              <g id="art-pail">
                <ellipse fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" cx="298" cy="200" rx="50" ry="12" />
                <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M248 202l9 108c.4 7 6 12 13 12h56c7 0 12.6-5 13-12l9-108" />
                <path fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".45" d="M255 234c28 8 58 8 86 0" />
                <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M254 196c6-32 82-32 88 0" />
              </g>
            </defs>
            <path fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".45" d="M42 324h336" />
            
            {activeIdx === 0 && (
              <g>
                <use href="#art-sack" />
                <use href="#art-pail" />
              </g>
            )}
            {activeIdx === 1 && (
              <g>
                <use href="#art-pail" transform="translate(-133 -12) scale(1.15)" />
                <use href="#art-sack" transform="translate(60 -12) scale(0.9)" />
              </g>
            )}
            {activeIdx === 2 && (
              <g>
                <use href="#art-sack" transform="translate(32 -12) scale(1.15)" />
                <use href="#art-pail" transform="translate(-100 10) scale(0.9)" />
              </g>
            )}
          </svg>
          <div className="hero-inset" aria-hidden="true">
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <p className="hero-note">{slide.note}</p>
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
