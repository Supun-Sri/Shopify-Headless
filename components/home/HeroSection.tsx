import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="imp-hero">
      {/* Full-bleed hero banner image */}
      <Image
        src="/hero_banner_1786348994479.jpg"
        alt="Imperial Middle East — construction chemicals and building materials"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
      
      {/* Container for the copy block to center it properly */}
      <div className="imp-hero-content-wrapper">
        <div className="imp-hero-copy">
          <div className="imp-hero-eyebrow">UAE built · Project ready</div>
          <h1>Materials. Systems.<br />Project confidence.</h1>
          <p>
            Technical products, responsive support and reliable UAE supply
            for demanding construction environments.
          </p>
          <Link href="/rfq" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Request a project quote →
          </Link>
        </div>
      </div>
    </section>
  );
}
