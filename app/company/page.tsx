import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Company | Imperial ',
  description: 'Learn about our company, our history, and our commitment to providing top-quality construction materials and chemicals.',
};

export default function CompanyPage() {
  return (
    <div className="store-frame" style={{ padding: '40px 28px', minHeight: '60vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--navy)', marginBottom: '24px', fontSize: '32px' }}>The Company</h1>
        
        <div style={{ position: 'relative', width: '100%', height: '300px', marginBottom: '32px', borderRadius: 'var(--r-panel)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
             {/* Placeholder for a company banner or office image */}
             <span style={{ opacity: 0.5 }}>Company Office / Banner Placeholder</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7, color: 'var(--text)', fontSize: '15px' }}>
          <p>
            Welcome to <strong> Imperial Middle East</strong>, your trusted partner in the construction and building materials sector. With years of experience and a deep understanding of the regional market, we have established ourselves as a premier supplier of high-quality construction chemicals, tools, and industrial materials.
          </p>

          <p>
            Our mission is to empower contractors, builders, and developers with the resources they need to execute projects safely, efficiently, and to the highest standards. We source our products from globally recognized brands, ensuring that every item in our inventory meets rigorous quality control benchmarks.
          </p>

          <h2 style={{ color: 'var(--navy)', marginTop: '16px', fontSize: '22px' }}>Our Core Values</h2>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Quality Assurance:</strong> We never compromise on the standards of the materials we supply.</li>
            <li><strong>Reliability:</strong> Timely deliveries and consistent stock availability to keep your projects on track.</li>
            <li><strong>Customer Success:</strong> We work closely with our clients to provide technical support and tailored solutions.</li>
            <li><strong>Innovation:</strong> Continuously updating our product lines with the latest advancements in construction technology.</li>
          </ul>

          <h2 style={{ color: 'var(--navy)', marginTop: '16px', fontSize: '22px' }}>Why Choose Us?</h2>
          <p>
            Whether you are managing a massive infrastructure project or specialized commercial builds, our team is equipped to handle your requirements. We offer dedicated B2B services, flexible credit options, and comprehensive logistics support across the UAE and the broader Middle East.
          </p>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
            <Link href="/bulk-inquiries" className="btn">
              Contact our Sales Team
            </Link>
            <Link href="/products" className="btn secondary">
              Browse our Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
