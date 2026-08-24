import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Imperial Middle East. Technical support, project inquiries and trade accounts.',
};

export default function ContactPage() {
  return (
    <div className="section" style={{ marginTop: '48px', marginBottom: '80px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '28px', color: 'var(--navy)', marginBottom: '12px' }}>Contact Us</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
            Have a question or inquiry? We&apos;d love to hear from you. Fill out the form below and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
