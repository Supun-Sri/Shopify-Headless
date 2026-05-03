import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-page">
      <h1>404</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
