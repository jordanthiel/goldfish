# Goldfish

Web app for Goldfish (mental health / therapist matching flows), built with Vite, React, TypeScript, Tailwind CSS, and Supabase.

## Local development

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

The dev server defaults to port 8080 (see `vite.config.ts`).

## Build

```sh
npm run build
npm run preview
```

## Environment

Configure Supabase and any API keys as described in your deployment docs. For local Supabase, see the `supabase/` directory and project `.env` files.

## AI / chatbot

The chatbot uses Supabase Edge Functions and provider API keys stored as Supabase secrets (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, etc.). Model selection in development is available from the in-app developer controls.

## Social preview (Open Graph)

`index.html` references `/brand/goldfish-logo.png` for `og:image` and `twitter:image`. Crawlers resolve this against your deployed site origin. After you set a production URL, confirm link previews on your host.
