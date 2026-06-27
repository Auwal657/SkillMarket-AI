import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-black text-indigo-100 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/" className="btn-primary"><Home size={16} /> Go Home</Link>
    </div>
  );
}
