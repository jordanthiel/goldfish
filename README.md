# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ed835f1d-d79e-4cc6-b435-e49a5004c552

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ed835f1d-d79e-4cc6-b435-e49a5004c552) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Edge Functions)

## AI Model Configuration

This project supports multiple AI providers for the chatbot feature:

### Supported Providers
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash

### Development Mode Model Selection

In development mode, you can select which AI model to use via a dropdown selector in the chatbot interface. The selection is saved to localStorage and persists across sessions.

### Environment Variables

For the chatbot to work, you need to set up API keys in your Supabase project:

1. **OpenAI API Key** (required for OpenAI models):
   - Set `OPENAI_API_KEY` in your Supabase project secrets

2. **Gemini API Key** (required for Gemini models):
   - Set `GEMINI_API_KEY` in your Supabase project secrets
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Setting Environment Variables in Supabase

For local development:
- Add to `supabase/.env` or your local environment

For production:
- Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Add the required API keys

**Note**: In production, the default model (GPT-4o Mini) is used. Model selection is only available in development mode.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ed835f1d-d79e-4cc6-b435-e49a5004c552) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
