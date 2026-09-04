import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="imp-footer">
      {/* Statement banner */}
      <div className="footer-statement">
        <div>
          <div className="eyebrow on-dark">Imperial Middle East</div>
          <h2>Built for the projects<br />shaping tomorrow.</h2>
        </div>
        <Link href="/rfq" className="btn-primary" style={{ textDecoration: 'none' }}>
          Request a project quote
          <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Columns */}
      <div className="footer-columns">
        {/* Shop */}
        <div className="col imp-footer-col">
          <h6>Shop</h6>
          <Link href="/products?collection=construction-chemicals">Construction Chemicals</Link>
          <Link href="/products?collection=building-materials">Building Materials</Link>
          <Link href="/products?collection=tools">Tools &amp; Equipment</Link>
          <Link href="/products?collection=paints">Paints &amp; Decorating</Link>
        </div>

        {/* Trade */}
        <div className="col imp-footer-col">
          <h6>Trade</h6>
          <Link href="/rfq">Request a Quote</Link>
          <Link href="/bulk-inquiries">Bulk Order Terms</Link>
          <Link href="/company">The Company</Link>
          <div>Project Credit</div>
        </div>

        {/* Support */}
        <div className="col imp-footer-col">
          <h6>Support</h6>
          <Link href="/rfq">Send Inquiry</Link>
          <Link href="/products">Product Specialists</Link>
          <div>Documents &amp; Downloads</div>
          <div>Technical Support</div>
        </div>

        {/* Imperial */}
        <div className="col imp-footer-col">
          <h6>Imperial</h6>
          <div>info@imperial.ae</div>
          <div>Al Quoz, Dubai, UAE</div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#637b9c' }}>
            Secured checkout · UAE based
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom imp-footer-bottom">
        <span>© {year} Imperial Middle East. All Rights Reserved.</span>
        <span>UAE Built · Project Ready</span>
      </div>
    </footer>
  );
}
