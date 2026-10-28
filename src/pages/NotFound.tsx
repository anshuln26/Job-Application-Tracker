import { Link } from 'react-router';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist or was moved.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
}
