// ============================================
// Search Functionality
// ============================================

// Search state
const searchState = {
  currentQuery: '',
  isSearchActive: false
};

// Debounce timer
let searchDebounceTimer = null;

// ============================================
// Initialize Search
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  setupSearchListeners();
});

function setupSearchListeners() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchInput) {
    // Debounced search on input
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      } else {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          if (searchInput.value.trim().length > 0) {
            performSearch();
          }
        }, 300);
      }
    });
    
    // Clear search when input is empty
    searchInput.addEventListener('input', (e) => {
      if (e.target.value.trim().length === 0) {
        clearSearch();
      }
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
}

// ============================================
// Perform Search
// ============================================
async function performSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  
  const keyword = searchInput.value.trim();
  
  if (keyword.length === 0) {
    clearSearch();
    return;
  }
  
  try {
    searchState.currentQuery = keyword;
    searchState.isSearchActive = true;
    
    // Get filter state from app
    const appState = window.appUtils ? window.appUtils.getState() : {};
    
    // Build search request
    const searchRequest = {
      keyword: keyword,
      area: appState.selectedArea || null,
      tags: appState.selectedTags || [],
      search_in: ['title', 'content']
    };
    
    // Perform search
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchRequest)
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const results = await response.json();
    
    // Render results
    renderSearchResults(results.results || [], keyword);
    
    // Switch to notes view
    if (window.appUtils) {
      // Manually switch view without clearing search
      const notesListView = document.getElementById('notes-list-view');
      const dashboardView = document.getElementById('dashboard-view');
      const calendarView = document.getElementById('calendar-view');
      
      if (notesListView && dashboardView && calendarView) {
        dashboardView.classList.add('hidden');
        calendarView.classList.add('hidden');
        notesListView.classList.remove('hidden');
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        document.getElementById('view-notes-btn')?.classList.add('active');
      }
    }
    
  } catch (error) {
    console.error('Search error:', error);
    if (window.showToast) {
      window.showToast('Search failed. Please try again.', 'error');
    }
  }
}

// ============================================
// Render Search Results
// ============================================
function renderSearchResults(results, keyword) {
  const container = document.getElementById('notes-list');
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No results found</h3>
        <p>No notes match your search for "${escapeHtml(keyword)}"</p>
        <button class="btn btn-primary" onclick="window.searchUtils.clearSearch()">Clear Search</button>
      </div>
    `;
    return;
  }
  
  // Get areas and tags for rendering
  const appState = window.appUtils ? window.appUtils.getState() : { areas: [], tags: [] };
  
  container.innerHTML = results.map(note => {
    const areaObj = appState.areas.find(a => a.name === note.area);
    const areaColor = areaObj ? areaObj.color : '#3b82f6';
    
    const tags = (note.tags || []).map(tagName => {
      const tagObj = appState.tags.find(t => t.name === tagName);
      const color = tagObj ? tagObj.color : '#10b981';
      return `<span class="tag-badge" style="background-color: ${color};">${escapeHtml(tagName)}</span>`;
    }).join('');
    
    // Highlight keyword in title
    const highlightedTitle = highlightKeyword(note.title, keyword);
    
    // Create snippet with keyword context
    const snippet = createSearchSnippet(note.html_content, keyword);
    
    return `
      <div class="note-list-item search-result" data-note-id="${note.id}" onclick="window.appUtils.loadNote(${note.id})">
        <div class="note-list-item-header">
          <div class="note-list-item-title">${highlightedTitle}</div>
          ${note.area ? `<span class="area-badge" style="background-color: ${areaColor};">${escapeHtml(note.area)}</span>` : ''}
        </div>
        <div class="note-list-item-snippet search-snippet">${snippet}</div>
        <div class="note-list-item-footer">
          <div class="note-list-item-tags">${tags}</div>
          <div class="note-list-item-timestamp">${formatDate(note.created_at)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add search info header
  const searchInfo = document.createElement('div');
  searchInfo.className = 'search-info';
  searchInfo.innerHTML = `
    <div class="search-info-text">
      Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${escapeHtml(keyword)}"
    </div>
    <button class="btn btn-secondary btn-sm" onclick="window.searchUtils.clearSearch()">Clear Search</button>
  `;
  container.insertBefore(searchInfo, container.firstChild);
}

// ============================================
// Highlight Keyword
// ============================================
function highlightKeyword(text, keyword) {
  if (!text || !keyword) return escapeHtml(text);
  
  const escapedText = escapeHtml(text);
  const escapedKeyword = escapeHtml(keyword);
  
  // Case-insensitive replacement
  const regex = new RegExp(`(${escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

// ============================================
// Create Search Snippet
// ============================================
function createSearchSnippet(htmlContent, keyword, maxLength = 200) {
  if (!htmlContent) return '';
  
  // Extract plain text from HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Find keyword position
  const keywordPos = text.toLowerCase().indexOf(keyword.toLowerCase());
  
  if (keywordPos === -1) {
    // Keyword not found, return beginning of text
    const snippet = text.substring(0, maxLength);
    return escapeHtml(snippet) + (text.length > maxLength ? '...' : '');
  }
  
  // Calculate context window around keyword
  const contextStart = Math.max(0, keywordPos - Math.floor(maxLength / 2));
  const contextEnd = Math.min(text.length, contextStart + maxLength);
  
  // Extract snippet
  let snippet = text.substring(contextStart, contextEnd);
  
  // Add ellipsis
  if (contextStart > 0) snippet = '...' + snippet;
  if (contextEnd < text.length) snippet = snippet + '...';
  
  // Highlight keyword in snippet
  return highlightKeyword(snippet, keyword);
}

// ============================================
// Clear Search
// ============================================
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  
  searchState.currentQuery = '';
  searchState.isSearchActive = false;
  
  // Reload notes list if in notes view
  if (window.appUtils) {
    const appState = window.appUtils.getState();
    if (appState.currentView === 'notes') {
      window.appUtils.refreshView();
    }
  }
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // Format as date
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// ============================================
// Export API
// ============================================
window.searchUtils = {
  performSearch,
  clearSearch,
  getState: () => searchState
};

// Log initialization
console.log('Search module loaded');
