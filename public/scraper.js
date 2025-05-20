document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const convertBtn = document.getElementById('convertBtn');
    const resultContainer = document.getElementById('resultContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    // Helper function to show/hide loading spinner
    const toggleLoading = (show) => {
        loadingSpinner.style.display = show ? 'block' : 'none';
        convertBtn.disabled = show;
    };

    // Helper function to show error message
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        resultContainer.innerHTML = '';
    };

    // Helper function to clear previous results
    const clearResults = () => {
        errorMessage.style.display = 'none';
        resultContainer.innerHTML = '';
    };

    // Helper function to copy text to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied successfully');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    // Function to display the scraped content
    const displayContent = (data) => {
        clearResults();
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'space-y-6';
        
        // Display title
        const titleSection = document.createElement('div');
        titleSection.className = 'bg-white p-4 rounded-lg shadow';
        titleSection.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Page Title</h2>
            <p class="text-gray-700">${data.title || 'No title found'}</p>
        `;
        contentDiv.appendChild(titleSection);

        // Display main content as HTML
        const mainContentSection = document.createElement('div');
        mainContentSection.className = 'bg-white p-4 rounded-lg shadow';
        mainContentSection.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Main Content</h2>
            <div class="prose max-w-none">${data.mainHtml || 'No content found'}</div>
        `;
        contentDiv.appendChild(mainContentSection);

        // Copy buttons
        const copyBtnContainer = document.createElement('div');
        copyBtnContainer.className = 'flex gap-4';

        const copyTextBtn = document.createElement('button');
        copyTextBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
        copyTextBtn.textContent = 'Copy as Text';
        copyTextBtn.onclick = () => {
            copyToClipboard(data.mainText || '');
            copyTextBtn.textContent = 'Copied!';
            setTimeout(() => { copyTextBtn.textContent = 'Copy as Text'; }, 1500);
        };

        const copyHtmlBtn = document.createElement('button');
        copyHtmlBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors';
        copyHtmlBtn.textContent = 'Copy as HTML';
        copyHtmlBtn.onclick = () => {
            copyToClipboard(data.mainHtml || '');
            copyHtmlBtn.textContent = 'Copied!';
            setTimeout(() => { copyHtmlBtn.textContent = 'Copy as HTML'; }, 1500);
        };

        copyBtnContainer.appendChild(copyTextBtn);
        copyBtnContainer.appendChild(copyHtmlBtn);
        contentDiv.appendChild(copyBtnContainer);

        resultContainer.appendChild(contentDiv);
    };

    // Handle convert button click
    convertBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a URL');
            return;
        }

        try {
            toggleLoading(true);
            clearResults();

            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            displayContent(data);
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while scraping the webpage');
        } finally {
            toggleLoading(false);
        }
    });

    // Handle Enter key press
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            convertBtn.click();
        }
    });
}); 