(function() {
    async function loadPublicationsSSR() {
        try {
            // Get base URL from script src
            const baseUrl = document.currentScript.src.split('/embed-ssr.js')[0];
            
            // Fetch the pre-rendered HTML
            const response = await fetch(`${baseUrl}/embed-ssr`);
            if (!response.ok) throw new Error('Failed to fetch pre-rendered content');
            
            const html = await response.text();
            
            // Create a container and insert the pre-rendered HTML
            const container = document.createElement('div');
            container.innerHTML = html;
            
            // Insert the container before the script tag
            document.currentScript.parentNode.insertBefore(container.firstElementChild, document.currentScript);
            
            // Load the main script for interactivity
            const script = document.createElement('script');
            script.src = `${baseUrl}/embed.js`;
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('Failed to load publications:', error);
            const errorContainer = document.createElement('div');
            errorContainer.className = 'publications-viewer-container';
            errorContainer.innerHTML = `
                <div style="color: red; padding: 20px;">
                    Error loading publications: ${error.message}
                </div>
            `;
            document.currentScript.parentNode.insertBefore(errorContainer, document.currentScript);
        }
    }
    
    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPublicationsSSR);
    } else {
        loadPublicationsSSR();
    }
})(); 