document.addEventListener('DOMContentLoaded', () => {
    const htmlInput = document.getElementById('htmlInput');
    const extractBtn = document.getElementById('extractBtn');
    const output = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');

    function extractStructuredContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Remove unwanted tags
        doc.querySelectorAll('script, style, noscript, meta, link, iframe').forEach(el => el.remove());
        doc.querySelectorAll('[hidden], [style*="display:none"], [style*="visibility:hidden"]').forEach(el => el.remove());

        // Extract content
        const h1s = Array.from(doc.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean);
        const h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent.trim()).filter(Boolean);
        const h3s = Array.from(doc.querySelectorAll('h3')).map(h => h.textContent.trim()).filter(Boolean);
        const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
        const images = Array.from(doc.querySelectorAll('img')).map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || ''
        })).filter(img => img.src);

        return { h1s, h2s, h3s, paragraphs, images };
    }

    function buildHtmlOutput(data) {
        let html = '<div class="content-box">';
        if (data.h1s.length) {
            html += `<div class='section-content'><h2 class='text-xl font-bold mb-2'>Main Heading (H1)</h2>${data.h1s.map(h => `<h1 class='text-2xl font-bold mb-2'>${h}</h1>`).join('')}</div>`;
        }
        if (data.h2s.length) {
            html += `<div class='section-content'><h2 class='text-lg font-semibold mb-2'>Subheadings (H2)</h2>${data.h2s.map(h => `<h2 class='text-xl font-semibold mb-2'>${h}</h2>`).join('')}</div>`;
        }
        if (data.h3s.length) {
            html += `<div class='section-content'><h2 class='text-lg font-semibold mb-2'>Subheadings (H3)</h2>${data.h3s.map(h => `<h3 class='text-lg font-medium mb-2'>${h}</h3>`).join('')}</div>`;
        }
        if (data.paragraphs.length) {
            html += `<div class='section-content'><h2 class='text-lg font-semibold mb-2'>Paragraphs</h2>${data.paragraphs.map(p => `<p class='mb-4'>${p}</p>`).join('')}</div>`;
        }
        if (data.images.length) {
            html += `<div class='section-content'><h2 class='text-lg font-semibold mb-2'>Images</h2><div class='grid grid-cols-2 gap-4'>${data.images.map(img => `
                <div class='image-container p-2 border rounded'>
                    <img src='${img.src}' alt='${img.alt}' class='w-full h-auto mb-2' />
                    <div class='text-sm text-gray-600'>${img.alt ? `Alt: ${img.alt}` : ''}</div>
                </div>`).join('')}</div></div>`;
        }
        html += '</div>';
        return html;
    }

    function buildTextOutput(data) {
        let text = '';
        if (data.h1s.length) {
            text += 'Main Heading (H1):\n' + data.h1s.join('\n') + '\n\n';
        }
        if (data.h2s.length) {
            text += 'Subheadings (H2):\n' + data.h2s.join('\n') + '\n\n';
        }
        if (data.h3s.length) {
            text += 'Subheadings (H3):\n' + data.h3s.join('\n') + '\n\n';
        }
        if (data.paragraphs.length) {
            text += 'Paragraphs:\n' + data.paragraphs.join('\n\n') + '\n\n';
        }
        if (data.images.length) {
            text += 'Images:\n' + data.images.map(img => img.alt ? `${img.src} (Alt: ${img.alt})` : img.src).join('\n') + '\n';
        }
        return text.trim();
    }

    extractBtn.addEventListener('click', () => {
        const html = htmlInput.value;
        const data = extractStructuredContent(html);
        const htmlOutput = buildHtmlOutput(data);
        const textOutput = buildTextOutput(data);
        output.innerHTML = `
            <h2 class='font-bold text-lg mb-2'>Extracted Content Preview</h2>
            ${htmlOutput}
            <div class='flex gap-4 mt-4'>
                <button id='copyTextBtn' class='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'>Copy as Text</button>
                <button id='copyHtmlBtn' class='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors'>Copy as HTML</button>
            </div>
        `;
        // Copy buttons logic
        const copyTextBtn = document.getElementById('copyTextBtn');
        const copyHtmlBtn = document.getElementById('copyHtmlBtn');
        copyTextBtn.onclick = () => {
            const textarea = document.createElement('textarea');
            textarea.value = textOutput;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            copyTextBtn.textContent = 'Copied!';
            setTimeout(() => { copyTextBtn.textContent = 'Copy as Text'; }, 1200);
        };
        copyHtmlBtn.onclick = () => {
            const fullHtml = `<!DOCTYPE html>\n<html lang='en'>\n<head>\n  <meta charset='UTF-8'>\n  <title>Extracted Content</title>\n  <link href='https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css' rel='stylesheet'>\n</head>\n<body class='bg-gray-100'>\n  <div class='container mx-auto px-4 py-8'>\n    ${htmlOutput}\n  </div>\n</body>\n</html>`;
            const textarea = document.createElement('textarea');
            textarea.value = fullHtml;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            copyHtmlBtn.textContent = 'Copied!';
            setTimeout(() => { copyHtmlBtn.textContent = 'Copy as HTML'; }, 1200);
        };
    });

    copyBtn.style.display = 'none'; // Hide the old copy button
}); 