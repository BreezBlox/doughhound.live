# Dough Hound - Tactical Finance

A personal finance tracking app that stores your data in your own Google Sheet.

## Features

- 📊 Track bills, paychecks, and purchases
- 📈 Visualize your financial forecast
- 🔐 Google OAuth authentication
- 📝 Your data stays in your own Google Sheet
- 🔄 Recurring transaction support

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Google OAuth 2.0
- Google Sheets API

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with your Google Client ID
cp .env.example .env.local
# Edit .env.local with your VITE_GOOGLE_CLIENT_ID

# Start dev server
npm run dev
```

## Deployment

Deploy to Vercel:

1. Import this repo in Vercel
2. Add environment variable: `VITE_GOOGLE_CLIENT_ID`
3. Deploy

## Google Cloud Setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials (Web application)
4. Add your domains to Authorized JavaScript origins

---

Built by [BreezBlox](https://breezblox.com)
