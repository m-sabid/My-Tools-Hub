const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  const url = req.body?.url || req.query?.url;
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(2000);

    const content = await page.evaluate(() => {
      const cleanText = (text) => {
        return text ? text.replace(/\s+/g, ' ').trim() : '';
      };
      let mainEl = document.querySelector('main, article, .post, .content, #main, .main');
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
      }
      const mainHtml = mainEl.innerHTML;
      const mainText = cleanText(mainEl.textContent);
      const title = cleanText(document.title);
      return {
        title,
        mainHtml,
        mainText
      };
    });

    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape the webpage', details: error.message });
  } finally {
    if (browser) await browser.close();
  }
}; 