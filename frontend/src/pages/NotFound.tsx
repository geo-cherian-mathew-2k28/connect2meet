import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 text-center px-6">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
        <Video className="w-8 h-8 text-white" />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500">Page not found</p>
      </div>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
