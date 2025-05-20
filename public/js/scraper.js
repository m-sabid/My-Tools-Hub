document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const convertBtn = document.getElementById('convertBtn');
    const resultContainer = document.getElementById('resultContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    convertBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a URL');
            return;
        }

        try {
            showLoading();
            const response = await fetch('/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            displayResults(data);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    });

    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        convertBtn.disabled = true;
        errorMessage.classList.add('hidden');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
        convertBtn.disabled = false;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        resultContainer.innerHTML = '';
    }

    function displayResults(data) {
        resultContainer.innerHTML = '';
        errorMessage.classList.add('hidden');

        // Add Whole Page Copy Buttons (Keep these at the top)
        const wholePageCopyButtons = document.createElement('div');
        wholePageCopyButtons.className = 'flex flex-wrap gap-4 mb-6 bg-white rounded-lg shadow-md p-4';

        const copyWholeHtmlBtn = document.createElement('button');
        copyWholeHtmlBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm flex items-center justify-center';
        copyWholeHtmlBtn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy Whole Page HTML (with styles)'; // Clearer label
        copyWholeHtmlBtn.onclick = () => {
            navigator.clipboard.writeText(data.mainHtml)
                .then(() => showCopySuccess(copyWholeHtmlBtn))
                .catch(err => console.error('Failed to copy whole HTML:', err));
        };

        const copyWholeProgramTextBtn = document.createElement('button');
        copyWholeProgramTextBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center justify-center';
        copyWholeProgramTextBtn.innerHTML = '<i class="fas fa-clipboard-text mr-1"></i> Copy Whole Page Text'; // Clearer label
        copyWholeProgramTextBtn.onclick = () => {
            navigator.clipboard.writeText(data.mainText)
                .then(() => showCopySuccess(copyWholeProgramTextBtn))
                .catch(err => console.error('Failed to copy whole text:', err));
        };

        wholePageCopyButtons.appendChild(copyWholeHtmlBtn);
        wholePageCopyButtons.appendChild(copyWholeProgramTextBtn);
        resultContainer.appendChild(wholePageCopyButtons);

        // --- Start Structured Content Display with element-specific buttons ---
        
        // Create a container for the main content body
        const mainContentContainer = document.createElement('div');
        mainContentContainer.className = 'space-y-4'; // Add spacing between elements
        resultContainer.appendChild(mainContentContainer);

        // --- Start Displaying Full HTML Content ---
        const fullHtmlDisplay = document.createElement('div');
        // Add some padding and background to the display area
        fullHtmlDisplay.className = 'bg-white rounded-lg shadow-md p-6 mb-6 prose max-w-none';
        // Set the innerHTML directly to render the content with bundled styles
        fullHtmlDisplay.innerHTML = data.mainHtml;
        mainContentContainer.appendChild(fullHtmlDisplay);
        // --- End Displaying Full HTML Content ---

    }

    function showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        // Use a different color temporarily for success feedback
        const originalClass = button.className;
        button.className = button.className.replace(/(bg-(?:yellow|teal|green|blue)-\d+)/, 'bg-gray-500');

        setTimeout(() => {
            button.textContent = originalText;
            // Restore original color
            button.className = originalClass;
        }, 2000);
    }
}); 