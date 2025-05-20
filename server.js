const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API endpoint for scraping
app.post('/scrape', async (req, res) => {
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
      
      page.on('console', (msg) => {
        console.log('Browser Console:', msg.text());
      });

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      console.log('Navigation complete');

      // Extract CSS content from stylesheets and style tags
      const cssContent = await page.evaluate(async () => {
        const styleSheets = Array.from(document.styleSheets)
          .filter(sheet => !sheet.href || sheet.href.startsWith(window.location.origin)); // Only include same-origin stylesheets
        
        let cssText = '';

        for (const sheet of styleSheets) {
          try {
            // For linked stylesheets, fetch the CSS rules
            if (sheet.cssRules) {
              cssText += Array.from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n') + '\n';
            } else if (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE') {
              // For inline style tags
              cssText += sheet.ownerNode.textContent + '\n';
            }
          } catch (e) {
            console.warn('Browser Console: Could not read stylesheet:', sheet.href, e);
          }
        }

        return cssText;
      });

      await page.waitForTimeout(2000);
      console.log('Waited for 2 seconds');

      console.log('Starting page evaluation');
      const content = await page.evaluate(() => {
        console.log('Inside page.evaluate - Start');
        const cleanText = (text) => {
          return text ? text.replace(/\s+/g, ' ').trim() : '';
        };

        // More comprehensive selectors for main content, ordered by likelihood/specificity
        const mainContentSelectors = [
            'article[role="main"]',
            'main',
            'article',
            '.entry-content',
            '.article-body',
            '[itemprop="articleBody"]',
            '.post-content', // Another common class
            '.story', // Common in news sites
            '#main-content',
            '#article-content',
            '#content',
            '.main-content',
            '.content',
            '.post',
            '.article',
            'div[class*="content"]',
            'div[id*="content"]',
            'div.body',
        ];

        let mainEl = null;
        for (const selector of mainContentSelectors) {
            mainEl = document.querySelector(selector);
            if (mainEl) {
                console.log(`Browser Console: Main content found with selector: ${selector}`);
                break;
            }
        }

        // Fallback: Find element with significant text content if initial selectors fail
        if (!mainEl) {
            console.log('Browser Console: Main content selectors failed. Falling back to finding element with significant text.');
            let maxLen = 0;
            let bestEl = document.body; // Default to body if nothing else is found

            // Look for elements with at least 150 characters of text (excluding likely non-content tags)
            document.querySelectorAll('p, div, section, article, aside').forEach(el => {
                 // Avoid elements that are likely navigation, footers, headers, etc.
                 const isLikelyContent = !el.closest('nav, footer, header, aside, form, .sidebar, .ad, .advertisement');

                const text = cleanText(el.textContent);
                if (isLikelyContent && text.length > maxLen && text.length >= 150) { // Increased minimum text length
                    maxLen = text.length;
                    bestEl = el;
                }
            });
            mainEl = bestEl;
            console.log('Browser Console: Fallback element selected:', mainEl ? mainEl.tagName : 'Not Found', 'Content Length:', cleanText(mainEl.textContent).length);
        }

        // If still no main element found or it's the body with little content, default to body
         if (!mainEl || (mainEl.tagName === 'BODY' && cleanText(mainEl.textContent).length < 300)) { // Increased minimum body content length
             console.log('Browser Console: Final fallback: Using document.body.');
             mainEl = document.body;
         }


        // Remove unwanted elements from the selected main content
        const elementsToRemove = mainEl.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .banner, .sidebar, .menu, .navigation, .social-share, .comments, .related-posts'); // Removed iframe
        elementsToRemove.forEach(el => el.remove());

        const mainHtml = mainEl.innerHTML;
        const mainText = cleanText(mainEl.textContent);
        const title = cleanText(document.title);
        
        console.log('Browser Console: Extracted Title:', title);
        console.log('Browser Console: Extracted Main Text Length:', mainText.length);
        console.log('Browser Console: Extracted Main HTML Length:', mainHtml.length);
        console.log('Browser Console: Inside page.evaluate - End');

        return {
          title,
          mainHtml,
          mainText
        };
      });
      
      // Combine HTML and CSS (from previous step)
      let finalHtml = content.mainHtml;
      // cssContent extraction logic remains here (from previous edit)
      // ... existing cssContent extraction ...

      if (cssContent) {
          finalHtml = `<style>${cssContent}</style>\n${content.mainHtml}`;
      }

      console.log('Server Log: Page evaluation complete.');
      console.log('Server Log: Preparing to send response.');
      console.log('Server Log: Sent Title:', content.title);
      console.log('Server Log: Sent Main Text Length:', content.mainText?.length);
      console.log('Server Log: Sent Final HTML Length:', finalHtml?.length);

      // Check if final HTML content is empty and log if it is
      if (!finalHtml || finalHtml.trim() === '') {
          console.log('Server Log: Warning: Final HTML content is empty or null.');
      }

      return res.status(200).json({ title: content.title, mainHtml: finalHtml, mainText: content.mainText });
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