const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint to scrape webpage content
app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    console.log('Received request for URL:', url);
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        // Set a real browser user-agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log('Navigating to URL:', url);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000 // 60 seconds
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Extract content
        const content = await page.evaluate(() => {
            // Helper: clean and normalize text
            const cleanText = (text) => {
                return text ? text.replace(/\s+/g, ' ').trim() : '';
            };

            // Try to find the main content area
            let mainEl = document.querySelector('main, article, .post, .content, #main, .main');
            if (!mainEl) {
                // Fallback: find the largest div with text content
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
            }

            // Get HTML and plain text
            const mainHtml = mainEl.innerHTML;
            const mainText = cleanText(mainEl.textContent);

            // Also extract title for display
            const title = cleanText(document.title);

            return {
                title,
                mainHtml,
                mainText
            };
        });

        res.json(content);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ 
            error: 'Failed to scrape the webpage',
            details: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 