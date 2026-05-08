import React from 'react';
import { MessageCircle, ScanSearch, Mailbox } from 'lucide-react';
import { HOW_IT_WORKS_UNIVERSAL } from '@/utils/landingUtmContent';

const ICONS = [MessageCircle, ScanSearch, Mailbox] as const;

/** Universal copy — identical for all UTM / direct traffic variants. */
export function HowItWorksSection() {
  return (
    <section
      className="w-full max-w-4xl mx-auto mb-0"
      aria-labelledby="how-it-works-heading"
    >
      <h2
        id="how-it-works-heading"
        className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-therapy-purple mb-4"
      >
        How it works
      </h2>
      <p className="text-center text-xl sm:text-2xl font-serif font-semibold text-gray-900 mb-10 max-w-lg mx-auto leading-snug">
        Three steps — then you're in charge of what's next.
      </p>

      <ul className="grid sm:grid-cols-3 gap-5 sm:gap-4 lg:gap-6 list-none p-0 m-0">
        {HOW_IT_WORKS_UNIVERSAL.map((step, i) => {
          const Icon = ICONS[i] ?? MessageCircle;
          return (
            <li
              key={step.title}
              className="rounded-2xl bg-white/75 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_-12px_rgba(124,58,237,0.18)] px-5 py-7 sm:px-6 flex flex-col items-center text-center sm:items-start sm:text-left transition-transform hover:-translate-y-0.5 duration-200"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-therapy-purple to-therapy-pink text-white shadow-md shadow-purple-500/25"
                aria-hidden
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900/55 mb-1.5">
                Step {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">{step.title}</h3>
              <p className="text-[15px] text-gray-600 leading-relaxed m-0">{step.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
