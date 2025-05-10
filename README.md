# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1d677141-3ea7-4fea-82a5-5348346903c0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1d677141-3ea7-4fea-82a5-5348346903c0) and start prompting.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1d677141-3ea7-4fea-82a5-5348346903c0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Development

To start the development environment:

1. Make sure all ports 4200-4210 are available
2. Run the development server with the proxy:

```bash
# Run both the Vite dev server and proxy server together
./start-dev.sh

# Alternatively, you can run them separately:
# Terminal 1: Start proxy server
npm run proxy

# Terminal 2: Start Vite dev server
npm run dev
```

The application will be available at:
- Vite dev server: http://localhost:4210 (or another available port)
- Proxy server: http://localhost:4201 (fixed port)

### Proxy Server

The application uses a proxy server to handle API requests to external services like OpenRouter. The proxy server helps avoid CORS issues and provides a consistent API endpoint for the frontend.

The proxy server handles these routes:
- `/api/chat`: Proxies requests to OpenRouter's AI chat completions API
