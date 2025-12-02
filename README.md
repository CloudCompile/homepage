# Homepage - Glassmorphic Dashboard

A beautiful, modern dashboard with AI integration built with React and deployed to GitHub Pages.

## Features

- Real-time Analog & Digital Clock
- Weather Widget (OpenWeatherMap API)
- Google Search with Voice Support
- AI Chat Widget (Pollinations/OpenAI)
- Experimental AI Web Search
- Quick Notes (Auto-saved)
- Wallpaper Switcher with AI Generation
- Smart Greetings
- Daily Quotes
- Persisted Settings (LocalStorage)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/CloudCompile/homepage.git
cd homepage
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Deployment

This project is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

The deployment is handled by a GitHub Actions workflow that:
1. Installs dependencies
2. Builds the project using Vite
3. Deploys the built files to GitHub Pages

### Manual Deployment

To trigger a manual deployment, go to the Actions tab in GitHub and run the "Deploy to GitHub Pages" workflow.

### Configuration

Make sure GitHub Pages is enabled in your repository settings:
1. Go to Settings → Pages
2. Set Source to "GitHub Actions"

## Project Structure

```
homepage/
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions workflow
├── src/
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Technologies

- React 18
- Vite
- Lucide React (icons)
- Tailwind CSS (via CDN)
- GitHub Pages
- GitHub Actions

## License

MIT
