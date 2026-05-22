import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import LandingPageHeader from '@/components/landing/LandingPageHeader';
import { LEGAL_LAST_UPDATED } from '@/constants/legal';
import termsMarkdown from '@/content/terms-of-service.md?raw';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingPageHeader />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <p className="text-sm text-gray-500 mb-6">
          Last updated: {LEGAL_LAST_UPDATED}.{' '}
          <Link to="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
        <article className="prose prose-gray max-w-none prose-headings:scroll-mt-20 prose-a:text-primary">
          <ReactMarkdown>{termsMarkdown}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
};

export default TermsOfService;
