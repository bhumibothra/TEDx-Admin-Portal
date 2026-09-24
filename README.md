# TEDx Admin Portal

An administration portal for managing TEDx event operations.

## Features

- Admin dashboard
- Event and content management
- Secure environment-based configuration
- Production-ready frontend structure

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm, pnpm, or yarn

### Installation

```bash
git clone https://github.com/bhumibothra/TEDx-Admin-Portal.git
cd TEDx-Admin-Portal
npm install
```

### Environment variables

Create a local environment file from the public template:

```bash
cp .env .env.local
```

Replace the example values in `.env.local` with your local or production configuration. Never commit real secrets, API keys, passwords, database URLs, or private tokens.

### Run locally

```bash
npm run dev
```

Open the local URL printed by the development server.

### Build for production

```bash
npm run build
```

## Project safety

Private environment files are excluded by `.gitignore`. Before making the repository public, check that no credentials or private files are present in the commit history.

## License

Add the license you want to use for this project before distributing it publicly.
