import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with MAISON. We\'d love to hear from you.',
};

export default function ContactPage() {
  return (
    <div className="section" style={{ marginTop: '80px', marginBottom: '128px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 className="text-headline-lg" style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>Contact Us</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-grey)', textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 1.8, maxWidth: '480px', margin: '0 auto' }}>
            Have a question or inquiry? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
