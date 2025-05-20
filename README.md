# Web Scraper Tool

A web scraping tool that extracts and displays webpage content, built with Node.js and Express. Supports both local development and Vercel deployment.

## Features

- Extract webpage content including title, headings, paragraphs, and images
- Copy content as plain text or HTML
- Responsive design with Tailwind CSS
- Supports both local development and Vercel deployment

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

## Project Structure

- `server.js` - Express server for local development
- `api/scrape.js` - Vercel serverless function for production
- `public/` - Static files and frontend code
  - `index.html` - Main HTML file
  - `scraper.js` - Frontend JavaScript
  - `extractor.js` - HTML to text extractor

## Technologies Used

- Node.js
- Express
- Puppeteer
- Tailwind CSS
- Vercel
