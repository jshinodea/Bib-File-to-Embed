let publications = [];
let currentSort = 'time';
let currentGroup = 'year';
let sortDirection = 'desc';
let groupDirection = 'desc';
let searchTerm = '';

document.querySelectorAll('.dropdown').forEach(dropdown => {
    const button = dropdown.querySelector('.btn');
    const content = dropdown.querySelector('.dropdown-content');
    
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-content').forEach(dc => {
            if (dc !== content) dc.style.display = 'none';
        });
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-content').forEach(content => {
        content.style.display = 'none';
    });
});

// Prevent dropdown from closing when clicking inside
document.querySelectorAll('.dropdown-content').forEach(content => {
    content.addEventListener('click', (e) => e.stopPropagation());
});

function renderPublications() {
    const container = document.getElementById('publications-list');
    container.innerHTML = '';

    // Filter publications based on search
    let filteredPubs = publications.filter(pub => {
        const searchLower = searchTerm.toLowerCase();
        return pub.title.toLowerCase().includes(searchLower) ||
               pub.authors.toLowerCase().includes(searchLower) ||
               pub.journal.toLowerCase().includes(searchLower);
    });

    // Sort publications
    if (currentSort === 'time') {
        // For date sorting, create a new array and reverse if ascending
        filteredPubs = [...filteredPubs];
        if (sortDirection === 'asc') {
            filteredPubs.reverse();
        }
    } else {
        // For other sort types, use comparison
        filteredPubs.sort((a, b) => {
            let comparison = 0;
            switch (currentSort) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'author':
                    comparison = a.authors.localeCompare(b.authors);
                    break;
                case 'citations':
                    comparison = b.citations - a.citations;
                    break;
            }
            return sortDirection === 'asc' ? comparison * -1 : comparison;
        });
    }

    // Group publications if needed
    if (currentGroup === 'year') {
        const groupedPubs = {};
        filteredPubs.forEach(pub => {
            if (!groupedPubs[pub.year]) {
                groupedPubs[pub.year] = [];
            }
            groupedPubs[pub.year].push(pub);
        });

        // Sort years and render groups
        Object.keys(groupedPubs)
            .sort((a, b) => groupDirection === 'asc' ? a - b : b - a)
            .forEach(year => {
                const yearGroup = document.createElement('div');
                yearGroup.className = 'year-group';
                yearGroup.innerHTML = `
                    <div class="year-header" onclick="toggleGroup(this)">
                        ${year}
                        <span>${groupedPubs[year].length} publications</span>
                    </div>
                    <div class="publications-container">
                        ${groupedPubs[year].map(pub => renderPublicationCard(pub)).join('')}
                    </div>
                `;
                container.appendChild(yearGroup);
            });
    } else {
        // Render without groups
        filteredPubs.forEach(pub => {
            container.innerHTML += renderPublicationCard(pub);
        });
    }
}

function renderPublicationCard(pub) {
    return `
        <div class="publication-card">
            <h3 class="publication-title">${pub.title}</h3>
            <div class="publication-authors">${pub.authors}</div>
            <div class="publication-meta">
                <div class="meta-left">
                    <span>${pub.journal}</span>
                    <span class="citation-count">${pub.citations} citations</span>
                </div>
                <div class="meta-right">
                    <button class="bibtex-toggle" onclick="toggleBibtex('${pub.id}')">
                        <span>BibTeX</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>
            </div>
            <a href="${pub.url}" target="_blank" class="publication-link">View Publication</a>
            <div id="bibtex-${pub.id}" class="bibtex-section">
                <div class="bibtex-content">${escapeHtml(pub.bibtex)}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleGroup(header) {
    header.parentElement.classList.toggle('collapsed');
}

function fetchPublications() {
    fetch('/publications')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch publications');
            }
            return response.json();
        })
        .then(data => {
            publications = data;
            renderPublications();
        })
        .catch(error => {
            console.error('Error fetching publications:', error);
            document.getElementById('publications-list').innerHTML = 
                '<div class="publication-card">Error loading publications. Please try again later.</div>';
        });
}

// Add this function to handle BibTeX toggle globally
window.toggleBibtex = function(pubId) {
    const bibtexSection = document.getElementById(`bibtex-${pubId}`);
    const button = bibtexSection.parentElement.querySelector('.bibtex-toggle');
    const isVisible = bibtexSection.style.display === 'block';
    bibtexSection.style.display = isVisible ? 'none' : 'block';
    button.classList.toggle('active');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderPublications();
    });

    document.querySelectorAll('[data-sort]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const field = e.target.dataset.sort;
            if (currentSort === field) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = field;
                sortDirection = 'asc';
            }
            renderPublications();
        });
    });

    document.querySelectorAll('[data-group]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            currentGroup = e.target.dataset.group;
            renderPublications();
        });
    });

    // Initial fetch
    fetchPublications();
});

// Add direction button handlers
document.querySelectorAll('.direction-btn').forEach(btn => {
    const isSort = btn.closest('.dropdown').querySelector('[data-sort]');
    btn.addEventListener('click', () => {
        if (isSort) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            updateDirectionButton(btn, sortDirection);
        } else {
            groupDirection = groupDirection === 'asc' ? 'desc' : 'asc';
            updateDirectionButton(btn, groupDirection);
        }
        renderPublications();
    });
});

function updateDirectionButton(btn, direction) {
    btn.setAttribute('data-direction', direction);
    btn.setAttribute('title', `Currently ${direction}ending`);
}

function sortPublications(pubs) {
    if (currentSort === 'time') {
        // For date sorting, just reverse the current order
        return sortDirection === 'asc' ? [...pubs].reverse() : pubs;
    }

    // For other sort types, use comparison
    return pubs.sort((a, b) => {
        let comparison = 0;
        switch (currentSort) {
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'author':
                comparison = a.authors.localeCompare(b.authors);
                break;
            case 'citations':
                comparison = b.citations - a.citations;
                break;
        }
        return sortDirection === 'asc' ? comparison * -1 : comparison;
    });
}

function groupPublications(pubs) {
    if (currentGroup === 'none') return { 'All Publications': pubs };
    
    const groups = pubs.reduce((acc, pub) => {
        const key = pub.year;
        if (!acc[key]) acc[key] = [];
        acc[key].push(pub);
        return acc;
    }, {});
    
    // Sort the groups
    const sortedGroups = {};
    Object.keys(groups)
        .sort((a, b) => groupDirection === 'asc' ? a - b : b - a)
        .forEach(key => {
            sortedGroups[key] = sortPublications(groups[key]);
        });
    
    return sortedGroups;
}

// Add function to update button text
function updateButtonText(type, value) {
    const button = document.querySelector(`.dropdown:has([data-${type}]) .btn span`);
    if (button) {
        let displayText = value;
        if (type === 'sort') {
            displayText = value === 'time' ? 'Date' : 
                         value.charAt(0).toUpperCase() + value.slice(1);
        } else if (type === 'group') {
            displayText = value === 'none' ? 'None' : 'Year';
        }
        button.textContent = displayText;
    }
}

// Update click handlers for sort and group options
document.querySelectorAll('.dropdown-content a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        if (link.dataset.sort) {
            currentSort = link.dataset.sort;
            updateButtonText('sort', currentSort);
        } else if (link.dataset.group) {
            currentGroup = link.dataset.group;
            updateButtonText('group', currentGroup);
        }
        renderPublications();
    });
});

// Initialize button text on page load
function initializeButtonText() {
    updateButtonText('sort', currentSort);
    updateButtonText('group', currentGroup);
}

// Initialize direction buttons
function initializeDirectionButtons() {
    const sortBtn = document.querySelector('.dropdown:has([data-sort]) .direction-btn');
    const groupBtn = document.querySelector('.dropdown:has([data-group]) .direction-btn');
    
    if (sortBtn) updateDirectionButton(sortBtn, sortDirection);
    if (groupBtn) updateDirectionButton(groupBtn, groupDirection);
}

// Call this after fetching publications
fetch('/publications')
    .then(response => response.json())
    .then(data => {
        publications = data;
        initializeButtonText();
        initializeDirectionButtons(); // Initialize direction indicators
        renderPublications();
    })
    .catch(error => {
        console.error('Error fetching publications:', error);
    });