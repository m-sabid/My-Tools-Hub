const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API endpoint for scraping
app.post('/api/scrape', async (req, res) => {
  console.log('API received request');
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
      console.log('Launching browser');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

      console.log('Navigating to url:', url);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      console.log('Navigation complete');
      await page.waitForTimeout(2000);
      console.log('Waited for 2 seconds');

      console.log('Starting page evaluation');
      const content = await page.evaluate(() => {
        console.log('Inside page.evaluate');
        const cleanText = (text) => {
          return text ? text.replace(/\s+/g, ' ').trim() : '';
        };
        let mainEl = document.querySelector('main, article, .post, .content, #main, .main');
        console.log('Initial mainEl selector result:', mainEl ? mainEl.tagName : 'Not Found');
        if (!mainEl) {
          let maxLen = 0;
          let bestDiv = null;
          document.querySelectorAll('div').forEach(div => {
            const text = cleanText(div.textContent);
            if (text.length > maxLen) {
              maxLen = text.length;
              bestDiv = div;
            }
          });
          mainEl = bestDiv || document.body;
          console.log('Fallback mainEl selector result:', mainEl ? mainEl.tagName : 'Not Found', 'Content Length:', cleanText(mainEl.textContent).length);
        }
        const mainHtml = mainEl.innerHTML;
        const mainText = cleanText(mainEl.textContent);
        const title = cleanText(document.title);
        
        console.log('Extracted Title:', title);
        console.log('Extracted Main Text Length:', mainText.length);
        console.log('Extracted Main HTML Length:', mainHtml.length);

        return {
          title,
          mainHtml,
          mainText
        };
      });
      console.log('Page evaluation complete, extracted content object:', content ? {title: content.title, mainTextLength: content.mainText?.length, mainHtmlLength: content.mainHtml?.length} : 'null');

      return res.status(200).json(content);
    } catch (error) {
      console.error('Scraping error caught in try block:', error);
      return res.status(500).json({ error: 'Failed to scrape the webpage', details: error.message });
    } finally {
      if (browser) {
        console.log('Closing browser');
        await browser.close();
      }
    }
  } catch (err) {
    console.error('Unexpected error caught in outer try block:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 