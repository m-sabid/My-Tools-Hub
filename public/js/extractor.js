document.addEventListener('DOMContentLoaded', () => {
    const htmlInput = document.getElementById('htmlInput');
    const convertBtn = document.getElementById('convertBtn');
    const resultContainer = document.getElementById('resultContainer');

    convertBtn.addEventListener('click', () => {
        const html = htmlInput.value.trim();
        
        if (!html) {
            showError('Please enter some HTML content');
            return;
        }

        try {
            const text = convertHtmlToText(html);
            displayResults(text);
        } catch (error) {
            showError(error.message);
        }
    });

    function convertHtmlToText(html) {
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script and style elements
        const scripts = tempDiv.getElementsByTagName('script');
        const styles = tempDiv.getElementsByTagName('style');
        while (scripts.length > 0) scripts[0].remove();
        while (styles.length > 0) styles[0].remove();

        // Get the text content
        let text = tempDiv.textContent || tempDiv.innerText;

        // Clean up the text
        text = text.replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                  .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
                  .trim();

        return text;
    }

    function showError(message) {
        resultContainer.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                ${message}
            </div>
        `;
    }

    function displayResults(text) {
        resultContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="prose max-w-none mb-4">
                    <pre class="whitespace-pre-wrap">${text}</pre>
                </div>
                <button onclick="copyToClipboard('${text.replace(/'/g, "\\'")}')" 
                        class="w-full px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    Copy to Clipboard
                </button>
            </div>
        `;
    }
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            const button = document.querySelector('#resultContainer button');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('bg-gray-500');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-gray-500');
            }, 2000);
        })
        .catch(err => console.error('Failed to copy text:', err));
} 