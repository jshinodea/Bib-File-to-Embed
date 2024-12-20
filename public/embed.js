// Publications viewer code
(function() {
    console.log('Publications viewer initializing...');

    // Global variables
    let publications = window.__INITIAL_DATA__ || [];
    let currentSort = 'time';
    let currentGroup = 'year';
    let sortDirection = 'desc';
    let groupDirection = 'desc';
    let searchTerm = '';
    let isHydrated = false;

    // Create and inject required styles
    function injectStyles() {
        console.log('Injecting styles...');
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --ucd-navy: #002855;
                --ucd-gold: #FDB515;
                --light-gray: #f8f9fa;
                --border-gray: #e5e7eb;
            }

            .publications-viewer-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: white;
                padding: 8px 20px 20px 20px;
                margin: 0 auto;
                max-width: 1200px;
                width: 100%;
            }

            .controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                background-color: white;
                padding: 16px 20px;
                border: 1px solid var(--border-gray);
                border-radius: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            }

            .search-input {
                padding: 10px 16px;
                border: 1px solid var(--border-gray);
                border-radius: 6px;
                width: 300px;
                font-size: 14px;
                transition: all 0.2s;
                background-color: var(--light-gray);
            }

            .search-input:focus {
                outline: none;
                border-color: var(--ucd-navy);
                background-color: white;
                box-shadow: 0 0 0 3px rgba(0,40,85,0.1);
            }

            .buttons-group {
                display: flex;
                gap: 16px;
                align-items: center;
            }

            .button-group-label {
                color: #495057;
                font-size: 14px;
                font-weight: 500;
                margin-right: 8px;
            }

            .dropdown {
                position: relative;
                display: flex;
                align-items: center;
            }

            .btn {
                background-color: white;
                color: var(--ucd-navy);
                border: 1px solid var(--border-gray);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 80px;
                justify-content: space-between;
                transition: all 0.2s;
            }

            .btn:hover {
                border-color: var(--ucd-navy);
                background-color: var(--light-gray);
            }

            .direction-btn {
                background: white;
                border: 1px solid var(--border-gray);
                color: var(--ucd-navy);
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
                margin-left: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                height: 35px;
                width: 35px;
            }

            .direction-btn:hover {
                border-color: var(--ucd-navy);
                background-color: var(--light-gray);
            }

            .direction-btn svg {
                width: 16px;
                height: 16px;
                transition: transform 0.2s ease;
            }

            .direction-btn[data-direction="asc"] svg {
                transform: rotate(180deg);
            }

            .year-group {
                margin-bottom: 32px;
                border: 1px solid var(--border-gray);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            }

            .year-header {
                background-color: var(--ucd-navy);
                color: white;
                padding: 12px 24px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 15px;
                font-weight: 500;
                user-select: none;
                transition: background-color 0.2s;
            }

            .year-header:hover {
                background-color: #003366;
            }

            .publication-card {
                background-color: white;
                padding: 24px;
                margin: 16px;
                border: 1px solid var(--border-gray);
                border-radius: 8px;
                position: relative;
                transition: all 0.2s;
            }

            .publication-card:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border-color: #d1d5db;
            }

            .publication-link {
                position: absolute;
                top: 24px;
                right: 24px;
                color: var(--ucd-navy);
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                background-color: var(--light-gray);
                transition: all 0.2s;
            }

            .publication-link:hover {
                background-color: var(--ucd-gold);
            }

            .bibtex-toggle {
                background: none;
                border: none;
                color: var(--ucd-navy);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                font-size: 13px;
                white-space: nowrap;
                transition: color 0.2s;
            }

            .bibtex-toggle:hover {
                color: var(--ucd-gold);
            }

            .dropdown-content {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background-color: white;
                min-width: 120px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 6px;
                border: 1px solid var(--border-gray);
                margin-top: 4px;
                z-index: 1000;
                font-size: 13px;
            }

            .dropdown-content a {
                color: #495057;
                padding: 8px 12px;
                text-decoration: none;
                display: block;
                transition: all 0.2s;
            }

            .dropdown-content a:hover {
                background-color: var(--light-gray);
                color: var(--ucd-navy);
            }

            .dropdown.active .dropdown-content {
                display: block;
            }

            .year-group {
                margin-bottom: 32px;
                border: 1px solid var(--border-gray);
                border-radius: 8px;
                overflow: hidden;
            }

            .year-group.collapsed .publications-container {
                display: none;
            }

            .year-header {
                background-color: #002855;
                color: white;
                padding: 12px 24px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 15px;
                font-weight: 500;
                user-select: none;
            }

            .year-header:hover {
                background-color: #003366;
            }

            .publication-card {
                background-color: white;
                padding: 24px;
                margin-bottom: 16px;
                border: 1px solid #e0e0e0;
                position: relative;
            }

            .publication-title {
                color: #002855;
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
                padding-right: 140px;
                line-height: 1.4;
            }

            .publication-authors {
                color: #555;
                line-height: 1.4;
                margin-bottom: 8px;
                padding-right: 140px;
                font-size: 14px;
            }

            .publication-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #666;
                font-size: 14px;
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px solid #e0e0e0;
                gap: 16px;
            }

            .meta-left {
                display: flex;
                align-items: center;
                gap: 24px;
                flex: 1;
                min-width: 0;
            }

            .meta-left span {
                white-space: nowrap;
                line-height: 1.2;
            }

            .citation-count {
                color: #666;
                font-size: 13px;
                position: relative;
                padding-left: 24px;
                border-left: 1px solid #e0e0e0;
            }

            .publication-link {
                position: absolute;
                top: 24px;
                right: 24px;
                color: #002855;
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                background-color: #f5f5f5;
                transition: all 0.2s;
            }

            .publication-link:hover {
                background-color: #FDB515;
            }

            .bibtex-toggle {
                background: none;
                border: none;
                color: #002855;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                font-size: 13px;
                white-space: nowrap;
            }

            .bibtex-section {
                display: none;
                margin-top: 16px;
                border-top: 1px solid #e0e0e0;
                padding-top: 16px;
            }

            .bibtex-content {
                background-color: #f5f5f5;
                padding: 16px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                white-space: pre-wrap;
                color: #444;
                overflow-x: auto;
                line-height: 1.4;
            }

            .publications-container {
                padding: 16px;
            }

            .dropdown-content {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background-color: white;
                min-width: 160px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-radius: 6px;
                border: 1px solid #e0e0e0;
                margin-top: 4px;
                z-index: 1000;
            }

            .dropdown.active .dropdown-content {
                display: block;
            }

            .year-header .chevron {
                transition: transform 0.2s ease;
            }

            .year-group.collapsed .year-header .chevron {
                transform: rotate(-180deg);
            }
        `;
        document.head.appendChild(style);
        console.log('Styles injected');
    }

    // Progressive hydration of interactive features
    function hydrateInteractiveFeatures() {
        if (isHydrated) return;
        
        const container = document.getElementById('publications-viewer');
        if (!container) return;

        // Hydrate search
        const searchInput = container.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value.toLowerCase();
                renderPublications();
            });
        }

        // Hydrate sort buttons
        const sortOptions = container.querySelectorAll('.sort-options a');
        sortOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                currentSort = e.target.dataset.sort;
                updateButtonText('sort', currentSort);
                renderPublications();
            });
        });

        // Hydrate direction button
        const directionBtn = container.querySelector('.direction-btn');
        if (directionBtn) {
            directionBtn.addEventListener('click', () => {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                directionBtn.dataset.direction = sortDirection;
                renderPublications();
            });
        }

        // Hydrate year group headers
        const yearHeaders = container.querySelectorAll('.year-header');
        yearHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const group = header.closest('.year-group');
                const list = group.querySelector('.publications-list');
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            });
        });

        isHydrated = true;
    }

    // Initialize the viewer
    async function init() {
        try {
            // If we don't have initial data, fetch it
            if (!window.__INITIAL_DATA__) {
                const response = await fetch('/publications');
                if (!response.ok) throw new Error('Failed to fetch publications');
                publications = await response.json();
                
                // Render initial view
                const container = document.createElement('div');
                container.id = 'publications-viewer';
                container.className = 'publications-viewer-container';
                document.currentScript.parentNode.insertBefore(container, document.currentScript);
                renderPublications();
            }

            // Inject styles and hydrate interactive features
            injectStyles();
            hydrateInteractiveFeatures();

        } catch (error) {
            console.error('Failed to initialize publications viewer:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 