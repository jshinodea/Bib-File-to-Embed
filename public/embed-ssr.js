(function() {
    async function loadPublicationsSSR(scriptElement) {
        try {
            // Get base URL from script src
            const baseUrl = scriptElement.src.split('/embed-ssr.js')[0];
            console.log('Base URL:', baseUrl);
            
            // Show loading state immediately
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'publications-viewer-container';
            loadingContainer.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    Loading publications...
                </div>
            `;
            scriptElement.parentNode.insertBefore(loadingContainer, scriptElement);
            
            // Fetch the pre-rendered HTML with CORS mode
            console.log('Fetching from:', `${baseUrl}/embed-ssr`);
            const response = await fetch(`${baseUrl}/embed-ssr`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'text/html'
                }
            });
            
            if (!response.ok) {
                console.error('Server response:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error details:', errorText);
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            console.log('Received HTML length:', html.length);
            
            // Create a container and insert the pre-rendered HTML
            const container = document.createElement('div');
            container.innerHTML = html;
            
            // Replace loading container with actual content
            loadingContainer.replaceWith(container.firstElementChild);
            
            // Load the main script for interactivity
            const script = document.createElement('script');
            script.src = `${baseUrl}/embed.js`;
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('Failed to load publications:', error);
            console.error('Error stack:', error.stack);
            const errorContainer = document.createElement('div');
            errorContainer.className = 'publications-viewer-container';
            errorContainer.innerHTML = `
                <div style="color: red; padding: 20px;">
                    Error loading publications: ${error.message}
                    <br>
                    <small style="color: #666;">Please check the browser console for more details.</small>
                </div>
            `;
            scriptElement.parentNode.insertBefore(errorContainer, scriptElement);
        }
    }
    
    // Store reference to current script
    const currentScript = document.currentScript;
    
    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => loadPublicationsSSR(currentScript));
    } else {
        loadPublicationsSSR(currentScript);
    }
})(); 