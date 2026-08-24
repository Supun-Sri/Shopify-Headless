import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="imp-footer">
      {/* Shop */}
      <div className="imp-footer-col">
        <h6>Shop</h6>
        <Link href="/products?collection=construction-chemicals">Construction Chemicals</Link>
        <Link href="/products?collection=building-materials">Building Materials</Link>
        <Link href="/products?collection=tools">Tools &amp; Equipment</Link>
        <Link href="/products?collection=paints">Paints &amp; Decorating</Link>
      </div>

      {/* Trade */}
      <div className="imp-footer-col">
        <h6>Trade</h6>
        <Link href="/rfq">Request a Quote</Link>
        <div>Bulk Order Terms</div>
        <div>Project Accounts</div>
        <div>Trade Credit</div>
      </div>

      {/* Support */}
      <div className="imp-footer-col">
        <h6>Support</h6>
        <div>Chat Now</div>
        <Link href="/rfq">Send Inquiry</Link>
        <div>Documents &amp; Downloads</div>
        <div>Technical Support</div>
      </div>

      {/* Imperial */}
      <div className="imp-footer-col">
        <h6>Imperial</h6>
        <div>info@imperial.ae</div>
        <div>+971 4 XXX XXXX</div>
        <div>Al Quoz Industrial, Dubai</div>
        <div style={{ marginTop: '12px', fontSize: '10px', color: '#637b9c' }}>
          Secured checkout · UAE based
        </div>
      </div>

      {/* Bottom bar */}
      <div className="imp-footer-bottom">
        <span>© {year} Imperial Middle East. All Rights Reserved.</span>
        <span>UAE Built · Project Ready</span>
      </div>
    </footer>
  );
}
