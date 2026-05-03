'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeroSectionProps {
  imageUrl: string;
}

export default function HeroSection({ imageUrl }: HeroSectionProps) {
  return (
    <section className="hero">
      <div className="hero-parallax-wrapper">
        <Image
          src={imageUrl}
          alt="Fashion editorial featuring structured charcoal wool overcoat"
          fill
          priority
          className="hero-image"
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="hero-gradient" />
      <div className="hero-content">
        <span className="hero-subtitle">Autumn Winter 1956</span>
        <h1 className="hero-title">The Silence of Excellence</h1>
        <Link href="/products" className="hero-cta">
          Discover Collection
        </Link>
      </div>
    </section>
  );
}
