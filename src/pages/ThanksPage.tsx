import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { BrandAppIcon } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ThanksPage = () => {
  const [searchParams] = useSearchParams();
  const pageSlug = searchParams.get('page');

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandAppIcon size="sm" className="rounded-lg" />
            <span className="text-lg font-bold text-gray-800">Goldfish</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Thank you</h1>
          <p className="text-gray-600 leading-relaxed">
            You&apos;re on our list. We&apos;re hand-picking matches right now and will be in touch within 48 hours.
          </p>
          {pageSlug && (
            <p className="text-xs text-gray-400">We&apos;ll use what you shared in this conversation.</p>
          )}
          <Button asChild className="w-full bg-therapy-purple hover:bg-therapy-purple/90 mt-2 text-base py-6">
            <Link to="/">Take me home</Link>
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default ThanksPage;
