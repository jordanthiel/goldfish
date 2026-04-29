import React from 'react';
import { HOW_IT_WORKS_UNIVERSAL } from '@/utils/landingUtmContent';

/** Universal copy — identical for all UTM / direct traffic variants. */
export function HowItWorksSection() {
  return (
    <section
      className="w-full max-w-2xl mx-auto mb-14"
      aria-labelledby="how-it-works-heading"
    >
      <h2
        id="how-it-works-heading"
        className="text-center text-xl sm:text-2xl font-semibold text-gray-800 mb-8"
      >
        How it works
      </h2>
      <ol className="space-y-6">
        {HOW_IT_WORKS_UNIVERSAL.map((step, i) => (
          <li key={step.title} className="flex gap-4 items-start">
            <span
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center text-white text-sm font-semibold shadow-sm"
              aria-hidden
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {step.title}
              </h3>
              <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
