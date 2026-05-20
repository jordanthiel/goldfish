# Goldfish

Monorepo for the Goldfish product: a consumer-facing web app and a separate internal dashboard (intended for a subdomain such as `internal.yourdomain.com`).

## Repository layout

| Path | Package | Description |
|------|---------|-------------|
| `apps/web` | `@goldfish/web` | Public marketing, chat, therapist/patient flows |
| `apps/internal` | `@goldfish/internal` | Internal CMS: conversations, analytics, waitlist, share links |
| `packages/shared` | `@goldfish/shared` | Shared Supabase client, auth, UI primitives, brand assets |
| `supabase/` | — | Migrations and edge functions (shared backend) |

## Local development

Requirements: Node.js and npm.

```sh
npm install
```

Consumer app (port **8080**):

```sh
npm run dev:web
# or: npm run dev
```

Internal dashboard (port **8081**):

```sh
npm run dev:internal
```

## Build

```sh
npm run build          # both apps
npm run build:web
npm run build:internal
```

Outputs:

- `apps/web/dist` — deploy to your public site
- `apps/internal/dist` — deploy to your internal subdomain

## Environment

Place `.env` at the **repository root** (both apps load it via `envDir`). Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_APP_URL` (optional, internal app only — link to consumer site, e.g. `https://goldfish.app`)

For local Supabase, see the `supabase/` directory.

## Deploying on a subdomain

1. Build `@goldfish/internal` and host `apps/internal/dist` on the internal hostname (e.g. `internal.example.com`).
2. Build `@goldfish/web` and host `apps/web/dist` on the public hostname.
3. Use the same Supabase project and root `.env` values for both deployments.
4. Internal routes live at the site root (`/`, `/funnel`, `/conversation/:id`, etc.) — no `/internal` prefix.

Internal users sign in at `/login` on the internal host. Access requires `is_internal` on their `user_roles` row.

## AI / chatbot

The chatbot uses Supabase Edge Functions and provider API keys stored as Supabase secrets (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, etc.). Model selection for internal testing is under **Developer Settings** in the internal app.

## Social preview (Open Graph)

The consumer `apps/web/index.html` references `/brand/goldfish-logo.png` for `og:image` and `twitter:image`. Crawlers resolve this against your deployed public site origin.
