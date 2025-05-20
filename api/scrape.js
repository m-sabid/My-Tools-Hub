const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  console.log('API received request');
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    let url;
    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        console.error('Invalid Content-Type', contentType);
        return res.status(400).json({ error: 'Content-Type must be application/json' });
      }
      let body = '';
      await new Promise(resolve => {
        req.on('data', chunk => { body += chunk; });
        req.on('end', resolve);
      });
      try {
        const parsed = JSON.parse(body);
        url = parsed.url;
        console.log('Parsed URL from body:', url);
      } catch (e) {
        console.error('JSON Parse Error:', e);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    } else if (req.method === 'GET') {
      url = req.query.url;
      console.log('Parsed URL from query:', url);
    } else {
      console.error('Method not allowed', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!url) {
      console.error('URL is missing');
      return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
      console.log('Launching browser');
      const executablePath = await chromium.executablePath;
      console.log('Chromium executable path:', executablePath);
      
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      console.log('Browser launched successfully');
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

      console.log('Navigating to url:', url);
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
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

      if (!content || !content.mainHtml) {
        throw new Error('No content found on the page');
      }

      return res.status(200).json(content);
    } catch (error) {
      console.error('Scraping error caught in try block:', error);
      return res.status(500).json({ 
        error: 'Failed to scrape the webpage', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      if (browser) {
        console.log('Closing browser');
        await browser.close();
      }
    }
  } catch (err) {
    console.error('Unexpected error caught in outer try block:', err);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}; 