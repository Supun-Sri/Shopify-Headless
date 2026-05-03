'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sanitizeInput, validateEmail } from '@/lib/utils';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const sanitized = sanitizeInput(email.trim());
    if (!validateEmail(sanitized)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // In production, this would call an API endpoint
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-col">
          <Link href="/" className="footer-logo">
            MZILLA
          </Link>
          <p className="footer-tagline">
            Architectural silhouettes and noble materials. Designed in Paris, crafted by artisans across the globe.
          </p>
        </div>

        {/* Links */}
        <div className="footer-col">
          <span className="footer-heading">Client Service</span>
          <Link href="/story" className="footer-link">Story</Link>
          <Link href="/products" className="footer-link">Collections</Link>
          <a href="#" className="footer-link">Shipping</a>
          <a href="#" className="footer-link">Contact</a>
        </div>

        {/* Newsletter */}
        <div className="footer-col">
          <span className="footer-heading">The Correspondence</span>
          {subscribed ? (
            <p className="footer-subscribed">Thank you for subscribing.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="footer-newsletter" noValidate>
              <div className="footer-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL ADDRESS"
                  className="footer-input"
                  aria-label="Email address for newsletter"
                  id="newsletter-email"
                  autoComplete="email"
                />
                <button type="submit" className="footer-submit" aria-label="Subscribe">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
              {emailError && <p className="footer-error">{emailError}</p>}
            </form>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">© {new Date().getFullYear()} MZILLA. All Rights Reserved.</p>
        <p className="footer-copyright"> <a href="https://www.magnific.com/free-ai-image/confident-businessman-luxury-suit-holds-garment-generated-by-ai_41305721.htm#fromView=keyword&page=1&position=17&uuid=7a65b1ca-e0d7-4b35-b82c-f5550df7de68&query=Men+luxury+clothing">Image by vecstock on Magnific</a>.</p>
        <p className="footer-copyright"></p>
      </div>
    </footer>
  );
}
