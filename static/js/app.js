// ============================================
// Main Application Logic
// ============================================

// Application State
const appState = {
  currentNoteId: null,
  currentView: 'dashboard',
  areas: [],
  tags: [],
  selectedArea: null,
  selectedTags: [],
  allNotes: []
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

async function initializeApp() {
  try {
    // Load and apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Wait for TinyMCE to be ready
    await waitForTinyMCE();
    
    // Load areas and tags
    await loadAreas();
    await loadTags();
    
    // Load dashboard by default
    await loadDashboard();
    
    // Setup all event listeners
    setupEventListeners();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showToast('Failed to initialize application', 'error');
  }
}

function waitForTinyMCE() {
  return new Promise((resolve) => {
    const checkTinyMCE = setInterval(() => {
      if (window.editorUtils) {
        clearInterval(checkTinyMCE);
        resolve();
      }
    }, 100);
  });
}

// ============================================
// Dark Mode Toggle
// ============================================
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update TinyMCE theme
  if (window.editorUtils) {
    window.editorUtils.updateTheme(newTheme);
  }
  
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// ============================================
// View Switching
// ============================================
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.add('hidden');
  });
  
  // Remove active state from all buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Update state
  appState.currentView = viewName;
  
  // Show selected view and activate button
  if (viewName === 'dashboard') {
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('view-dashboard-btn').classList.add('active');
    loadDashboard();
  } else if (viewName === 'notes') {
    document.getElementById('notes-list-view').classList.remove('hidden');
    document.getElementById('view-notes-btn').classList.add('active');
    loadNotesList();
  } else if (viewName === 'calendar') {
    document.getElementById('calendar-view').classList.remove('hidden');
    document.getElementById('view-calendar-btn').classList.add('active');
    if (window.calendarUtils) {
      window.calendarUtils.initialize();
    }
  }
}

// ============================================
// Areas Management
// ============================================
async function loadAreas() {
  try {
    const response = await fetch('/api/areas');
    if (!response.ok) throw new Error('Failed to fetch areas');
    
    const data = await response.json();
    appState.areas = Array.isArray(data) ? data : (data.areas || []);
    
    // Populate area select dropdown
    populateAreaSelect();
    
    // Populate area filters
    populateAreaFilters();
    
  } catch (error) {
    console.error('Error loading areas:', error);
    showToast('Failed to load areas', 'error');
  }
}

function populateAreaSelect() {
  const areaSelect = document.getElementById('area-select');
  if (!areaSelect) return;
  
  // Keep "No Area" option
  areaSelect.innerHTML = '<option value="">No Area</option>';
  
  appState.areas.forEach(area => {
    const option = document.createElement('option');
    option.value = area.name;
    option.textContent = area.name;
    areaSelect.appendChild(option);
  });
}

function populateAreaFilters() {
  const filterList = document.getElementById('areas-filter-list');
  if (!filterList) return;
  
  filterList.innerHTML = '';
  
  appState.areas.forEach(area => {
    const label = document.createElement('label');
    label.className = 'filter-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'filter-checkbox';
    checkbox.value = area.name;
    checkbox.addEventListener('change', () => {
      label.classList.toggle('is-checked', checkbox.checked);
      updateFilters();
    });
    
    const colorSwatch = document.createElement('span');
    colorSwatch.className = 'color-swatch';
    colorSwatch.style.backgroundColor = area.color;
    
    const text = document.createTextNode(area.name);
    
    label.appendChild(checkbox);
    label.appendChild(colorSwatch);
    label.appendChild(text);
    filterList.appendChild(label);
  });
}

async function createArea(name, color) {
  try {
    const response = await fetch('/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create area');
    }
    
    await loadAreas();
    showToast('Area created successfully', 'success');
    
    // Refresh areas list in settings modal
    await loadAreasForSettings();
    
  } catch (error) {
    console.error('Error creating area:', error);
    showToast(error.message, 'error');
  }
}

// ============================================
// Tags Management
// ============================================
async function loadTags() {
  try {
    const response = await fetch('/api/tags');
    if (!response.ok) throw new Error('Failed to fetch tags');
    
    const data = await response.json();
    appState.tags = Array.isArray(data) ? data : (data.tags || []);
    
    // Populate tag filters
    populateTagFilters();
    
    // Update tag picker dropdown
    updateTagPickerDropdown();
    
  } catch (error) {
    console.error('Error loading tags:', error);
    showToast('Failed to load tags', 'error');
  }
}

function populateTagFilters() {
  const filterList = document.getElementById('tags-filter-list');
  if (!filterList) return;
  
  filterList.innerHTML = '';
  
  appState.tags.forEach(tag => {
    const label = document.createElement('label');
    label.className = 'filter-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'filter-checkbox';
    checkbox.value = tag.name;
    checkbox.addEventListener('change', () => {
      label.classList.toggle('is-checked', checkbox.checked);
      updateFilters();
    });
    
    const colorSwatch = document.createElement('span');
    colorSwatch.className = 'color-swatch';
    colorSwatch.style.backgroundColor = tag.color;
    
    const text = document.createTextNode(tag.name);
    
    label.appendChild(checkbox);
    label.appendChild(colorSwatch);
    label.appendChild(text);
    filterList.appendChild(label);
  });
}

async function createTag(name, color) {
  try {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create tag');
    }
    
    await loadTags();
    showToast('Tag created successfully', 'success');
    
    // Refresh tags list in settings modal
    await loadTagsForSettings();
    
  } catch (error) {
    console.error('Error creating tag:', error);
    showToast(error.message, 'error');
  }
}

// ============================================
// Filters
// ============================================
function updateFilters() {
  // Get selected areas
  const areaCheckboxes = document.querySelectorAll('#areas-filter-list input[type="checkbox"]:checked');
  appState.selectedArea = areaCheckboxes.length > 0 ? Array.from(areaCheckboxes).map(cb => cb.value).join(',') : null;
  
  // Get selected tags
  const tagCheckboxes = document.querySelectorAll('#tags-filter-list input[type="checkbox"]:checked');
  appState.selectedTags = Array.from(tagCheckboxes).map(cb => cb.value);
  
  // Refresh current view
  if (appState.currentView === 'notes') {
    loadNotesList();
  } else if (appState.currentView === 'dashboard') {
    loadDashboard();
  }
}

// ============================================
// Note CRUD Operations
// ============================================
function createNewNote() {
  // Clear editor
  if (window.editorUtils) {
    window.editorUtils.clearEditor();
  }
  
  // Reset area select
  const areaSelect = document.getElementById('area-select');
  if (areaSelect) {
    areaSelect.value = '';
  }
  
  // Clear selected tags
  clearSelectedTags();
  
  // Reset current note ID
  appState.currentNoteId = null;
  
  // Update title display
  const titleDisplay = document.getElementById('note-title-display');
  if (titleDisplay) {
    titleDisplay.textContent = 'New Note';
  }
  
  // Clear timestamp
  const timestamp = document.getElementById('note-timestamp');
  if (timestamp) {
    timestamp.textContent = '';
  }
  
  showToast('Ready to create new note', 'info');
}

async function saveNote() {
  try {
    // Disable save button during save
    const saveBtn = document.getElementById('save-note-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '💾 Saving...';
    }
    
    // Get content from editor
    const content = window.editorUtils.getContent();
    
    // Get area
    const areaSelect = document.getElementById('area-select');
    const area = areaSelect ? areaSelect.value : '';
    
    // Get tags
    const selectedTags = getSelectedTags();
    
    // Extract title from content (first line or "Untitled")
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content.html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const title = text.trim().split('\n')[0].substring(0, 100) || 'Untitled Note';
    
    // Build request
    const noteData = {
      title: title,
      html_content: content.html,
      markdown_content: content.markdown,
      area: area || null,
      tags: selectedTags
    };
    
    let response;
    if (appState.currentNoteId) {
      // Update existing note
      response = await fetch(`/api/notes/${appState.currentNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    } else {
      // Create new note
      response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save note');
    }
    
    const savedNote = await response.json();
    appState.currentNoteId = savedNote.id;
    
    // Update title display
    const titleDisplay = document.getElementById('note-title-display');
    if (titleDisplay) {
      titleDisplay.textContent = savedNote.title;
    }
    
    // Update timestamp
    updateTimestamp(savedNote);
    
    showToast('Note saved successfully', 'success');
    
    // Refresh current view
    refreshCurrentView();
    
    // Refresh calendar if available
    if (window.calendarUtils) {
      window.calendarUtils.refresh();
    }
    
  } catch (error) {
    console.error('Error saving note:', error);
    showToast(error.message, 'error');
  } finally {
    // Re-enable save button
    const saveBtn = document.getElementById('save-note-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save';
    }
  }
}

async function loadNote(noteId) {
  try {
    const response = await fetch(`/api/notes/${noteId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Note not found');
      }
      throw new Error('Failed to load note');
    }
    
    const note = await response.json();
    appState.currentNoteId = note.id;
    
    // Update title display
    const titleDisplay = document.getElementById('note-title-display');
    if (titleDisplay) {
      titleDisplay.textContent = note.title;
    }
    
    // Update timestamp
    updateTimestamp(note);
    
    // Set area
    const areaSelect = document.getElementById('area-select');
    if (areaSelect) {
      areaSelect.value = note.area || '';
    }
    
    // Set tags
    setSelectedTags(note.tags || []);
    
    // Set content in editor
    if (window.editorUtils) {
      window.editorUtils.setContent(note.html_content, note.markdown_content);
    }
    
    // Switch to notes view if not already there
    if (appState.currentView !== 'notes') {
      switchView('notes');
    }
    
  } catch (error) {
    console.error('Error loading note:', error);
    showToast(error.message, 'error');
  }
}

async function deleteNote() {
  if (!appState.currentNoteId) {
    showToast('No note selected to delete', 'warning');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Disable delete button
    const deleteBtn = document.getElementById('delete-note-btn');
    if (deleteBtn) {
      deleteBtn.disabled = true;
    }
    
    const response = await fetch(`/api/notes/${appState.currentNoteId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete note');
    }
    
    showToast('Note deleted successfully', 'success');
    
    // Clear editor
    createNewNote();
    
    // Refresh current view
    refreshCurrentView();
    
    // Refresh calendar if available
    if (window.calendarUtils) {
      window.calendarUtils.refresh();
    }
    
  } catch (error) {
    console.error('Error deleting note:', error);
    showToast(error.message, 'error');
  } finally {
    // Re-enable delete button
    const deleteBtn = document.getElementById('delete-note-btn');
    if (deleteBtn) {
      deleteBtn.disabled = false;
    }
  }
}

// ============================================
// Export Functionality
// ============================================
function exportNote(format) {
  if (!appState.currentNoteId) {
    showToast('Please save the note before exporting', 'warning');
    return;
  }
  
  window.location.href = `/api/notes/${appState.currentNoteId}/export?format=${format}`;
  showToast(`Exporting as ${format.toUpperCase()}...`, 'info');
}

// ============================================
// Dashboard View
// ============================================
async function loadDashboard() {
  try {
    // Load statistics
    const statsResponse = await fetch('/api/statistics');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      renderStatistics(stats);
    }
    
    // Load recent notes
    const notesResponse = await fetch('/api/notes?limit=10&offset=0');
    if (notesResponse.ok) {
      const notesData = await notesResponse.json();
      renderRecentNotes(notesData.notes || []);
    }
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Failed to load dashboard', 'error');
  }
}

function renderStatistics(stats) {
  const container = document.getElementById('dashboard-stats');
  if (!container) return;
  
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.total_notes || 0}</div>
      <div class="stat-label">Total Notes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.notes_this_week || 0}</div>
      <div class="stat-label">This Week</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.notes_this_month || 0}</div>
      <div class="stat-label">This Month</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Notes by Area</div>
      <div class="stat-breakdown">
        ${Object.entries(stats.notes_by_area || {}).map(([area, count]) => {
          const areaObj = appState.areas.find(a => a.name === area);
          const color = areaObj ? areaObj.color : '#3b82f6';
          return `
            <div class="stat-item">
              <span class="color-swatch" style="background-color: ${color};"></span>
              <span>${area}: ${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Top Tags</div>
      <div class="tag-cloud">
        ${Object.entries(stats.top_tags || {}).slice(0, 10).map(([tag, count]) => {
          const tagObj = appState.tags.find(t => t.name === tag);
          const color = tagObj ? tagObj.color : '#10b981';
          return `<span class="tag-badge" style="background-color: ${color};">${tag} (${count})</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderRecentNotes(notes) {
  const container = document.getElementById('recent-notes-list');
  if (!container) return;
  
  if (notes.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No notes yet. Create your first note!</p></div>';
    return;
  }
  
  container.innerHTML = notes.map(note => {
    const areaObj = appState.areas.find(a => a.name === note.area);
    const areaColor = areaObj ? areaObj.color : '#3b82f6';
    
    const tags = (note.tags || []).map(tagName => {
      const tagObj = appState.tags.find(t => t.name === tagName);
      const color = tagObj ? tagObj.color : '#10b981';
      return `<span class="tag-badge" style="background-color: ${color};">${tagName}</span>`;
    }).join('');
    
    return `
      <div class="note-card" data-note-id="${note.id}" onclick="window.appUtils.loadNote(${note.id})">
        <div class="note-card-title">${escapeHtml(note.title)}</div>
        ${note.area ? `<span class="area-badge" style="background-color: ${areaColor};">${escapeHtml(note.area)}</span>` : ''}
        <div class="note-card-tags">${tags}</div>
        <div class="note-card-timestamp">${formatDate(note.created_at)}</div>
      </div>
    `;
  }).join('');
}

// ============================================
// Notes List View
// ============================================
async function loadNotesList() {
  try {
    // Build query params
    const params = new URLSearchParams({
      limit: '50',
      offset: '0'
    });
    
    if (appState.selectedArea) {
      params.append('area', appState.selectedArea);
    }
    
    if (appState.selectedTags.length > 0) {
      params.append('tags', appState.selectedTags.join(','));
    }
    
    const response = await fetch(`/api/notes?${params}`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    
    const data = await response.json();
    renderNotesList(data.notes || []);
    
  } catch (error) {
    console.error('Error loading notes list:', error);
    showToast('Failed to load notes', 'error');
  }
}

function renderNotesList(notes) {
  const container = document.getElementById('notes-list');
  if (!container) return;
  
  if (notes.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No notes found. Try adjusting your filters or create a new note.</p></div>';
    return;
  }
  
  container.innerHTML = notes.map(note => {
    const areaObj = appState.areas.find(a => a.name === note.area);
    const areaColor = areaObj ? areaObj.color : '#3b82f6';
    
    const tags = (note.tags || []).map(tagName => {
      const tagObj = appState.tags.find(t => t.name === tagName);
      const color = tagObj ? tagObj.color : '#10b981';
      return `<span class="tag-badge" style="background-color: ${color};">${tagName}</span>`;
    }).join('');
    
    // Create snippet
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.html_content || '';
    const snippet = (tempDiv.textContent || tempDiv.innerText || '').substring(0, 150) + '...';
    
    const isActive = appState.currentNoteId === note.id;
    return `
      <div class="note-list-item${isActive ? ' is-active' : ''}" data-note-id="${note.id}" onclick="window.appUtils.loadNote(${note.id})">
        <div class="note-list-item-header">
          <div class="note-list-item-title">${escapeHtml(note.title)}</div>
          ${note.area ? `<span class="area-badge" style="background-color: ${areaColor};">${escapeHtml(note.area)}</span>` : ''}
        </div>
        <div class="note-list-item-snippet">${escapeHtml(snippet)}</div>
        <div class="note-list-item-footer">
          <div class="note-list-item-tags">${tags}</div>
          <div class="note-list-item-timestamp">${formatDate(note.created_at)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// Tag Picker
// ============================================
function setupTagPicker() {
  const searchInput = document.getElementById('tag-search-input');
  const dropdown = document.getElementById('tag-dropdown');
  
  if (!searchInput || !dropdown) return;
  
  // Show dropdown on focus
  searchInput.addEventListener('focus', () => {
    updateTagPickerDropdown();
    dropdown.classList.remove('hidden');
  });
  
  // Filter tags on input
  searchInput.addEventListener('input', (e) => {
    updateTagPickerDropdown(e.target.value);
  });
  
  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#tag-picker-container')) {
      dropdown.classList.add('hidden');
    }
  });
}

function updateTagPickerDropdown(filter = '') {
  const dropdown = document.getElementById('tag-dropdown');
  if (!dropdown) return;
  
  const selectedTags = getSelectedTags();
  const filterLower = filter.toLowerCase();
  
  const availableTags = appState.tags.filter(tag => 
    !selectedTags.includes(tag.name) && 
    tag.name.toLowerCase().includes(filterLower)
  );
  
  if (availableTags.length === 0) {
    dropdown.innerHTML = '<div class="tag-dropdown-empty">No tags found</div>';
    return;
  }
  
  dropdown.innerHTML = availableTags.map(tag => `
    <div class="tag-dropdown-item" onclick="window.appUtils.addTag('${escapeHtml(tag.name)}')">
      <span class="color-swatch" style="background-color: ${tag.color};"></span>
      ${escapeHtml(tag.name)}
    </div>
  `).join('');
}

function addTag(tagName) {
  const selectedTags = getSelectedTags();
  if (selectedTags.includes(tagName)) return;
  
  selectedTags.push(tagName);
  setSelectedTags(selectedTags);
  
  // Clear search input
  const searchInput = document.getElementById('tag-search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Update dropdown
  updateTagPickerDropdown();
}

function removeTag(tagName) {
  const selectedTags = getSelectedTags();
  const index = selectedTags.indexOf(tagName);
  if (index > -1) {
    selectedTags.splice(index, 1);
    setSelectedTags(selectedTags);
  }
  
  // Update dropdown
  updateTagPickerDropdown();
}

function getSelectedTags() {
  const input = document.getElementById('tags-select');
  if (!input) return [];
  
  try {
    return JSON.parse(input.value || '[]');
  } catch (e) {
    return [];
  }
}

function setSelectedTags(tags) {
  const input = document.getElementById('tags-select');
  if (input) {
    input.value = JSON.stringify(tags);
  }
  
  renderSelectedTags(tags);
}

function clearSelectedTags() {
  setSelectedTags([]);
}

function renderSelectedTags(tags) {
  const container = document.getElementById('selected-tags');
  if (!container) return;
  
  if (tags.length === 0) {
    container.innerHTML = '<span class="selected-tags-empty">No tags selected</span>';
    return;
  }
  
  container.innerHTML = tags.map(tagName => {
    const tagObj = appState.tags.find(t => t.name === tagName);
    const color = tagObj ? tagObj.color : '#10b981';
    
    return `
      <span class="selected-tag-badge" style="background-color: ${color};">
        ${escapeHtml(tagName)}
        <button class="remove-tag-btn" onclick="window.appUtils.removeTag('${escapeHtml(tagName)}')" aria-label="Remove ${escapeHtml(tagName)}">×</button>
      </span>
    `;
  }).join('');
}

// ============================================
// Settings Modal
// ============================================
function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('hidden');
    
    // Load areas and tags
    loadAreasForSettings();
    loadTagsForSettings();
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function setupSettingsModal() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchSettingsTab(tabName);
    });
  });
  
  // Add area form
  const addAreaForm = document.getElementById('add-area-form');
  if (addAreaForm) {
    addAreaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('area-name-input');
      const colorInput = document.getElementById('area-color-input');
      
      if (nameInput && colorInput) {
        await createArea(nameInput.value, colorInput.value);
        nameInput.value = '';
        colorInput.value = '#3b82f6';
      }
    });
  }
  
  // Add tag form
  const addTagForm = document.getElementById('add-tag-form');
  if (addTagForm) {
    addTagForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('tag-name-input');
      const colorInput = document.getElementById('tag-color-input');
      
      if (nameInput && colorInput) {
        await createTag(nameInput.value, colorInput.value);
        nameInput.value = '';
        colorInput.value = '#10b981';
      }
    });
  }
}

function switchSettingsTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  // Remove active from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
  }
  
  // Activate button
  const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
}

async function loadAreasForSettings() {
  const container = document.getElementById('areas-list');
  if (!container) return;
  
  container.innerHTML = appState.areas.map(area => `
    <div class="settings-list-item">
      <span class="color-swatch" style="background-color: ${area.color};"></span>
      <span>${escapeHtml(area.name)}</span>
    </div>
  `).join('');
}

async function loadTagsForSettings() {
  const container = document.getElementById('tags-list');
  if (!container) return;
  
  container.innerHTML = appState.tags.map(tag => `
    <div class="settings-list-item">
      <span class="color-swatch" style="background-color: ${tag.color};"></span>
      <span>${escapeHtml(tag.name)}</span>
    </div>
  `).join('');
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.log(`Toast [${type}]: ${message}`);
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Override global showToast
window.showToast = showToast;

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
  // New note button
  const newNoteBtn = document.getElementById('new-note-btn');
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', createNewNote);
  }
  
  // Save note button
  const saveNoteBtn = document.getElementById('save-note-btn');
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', saveNote);
  }
  
  // Delete note button
  const deleteNoteBtn = document.getElementById('delete-note-btn');
  if (deleteNoteBtn) {
    deleteNoteBtn.addEventListener('click', deleteNote);
  }
  
  // Export buttons
  const exportHtmlBtn = document.getElementById('export-html-btn');
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', () => exportNote('html'));
  }
  
  const exportMarkdownBtn = document.getElementById('export-markdown-btn');
  if (exportMarkdownBtn) {
    exportMarkdownBtn.addEventListener('click', () => exportNote('markdown'));
  }
  
  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }
  
  // Settings modal close buttons
  const settingsModalClose = document.getElementById('settings-modal-close');
  if (settingsModalClose) {
    settingsModalClose.addEventListener('click', closeSettingsModal);
  }
  
  const settingsModalCloseBtn = document.getElementById('settings-modal-close-btn');
  if (settingsModalCloseBtn) {
    settingsModalCloseBtn.addEventListener('click', closeSettingsModal);
  }
  
  // View buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) {
        switchView(view);
      }
    });
  });
  
  // Close modal when clicking outside
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
  }
  
  // Setup tag picker
  setupTagPicker();
  
  // Setup settings modal
  setupSettingsModal();
}

// ============================================
// Utility Functions
// ============================================
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

function updateTimestamp(note) {
  const timestamp = document.getElementById('note-timestamp');
  if (!timestamp) return;
  
  const created = formatDate(note.created_at);
  const modified = formatDate(note.modified_at);
  
  if (created === modified) {
    timestamp.textContent = `Created ${created}`;
  } else {
    timestamp.textContent = `Modified ${modified}`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function refreshCurrentView() {
  if (appState.currentView === 'dashboard') {
    loadDashboard();
  } else if (appState.currentView === 'notes') {
    loadNotesList();
  }
}

// ============================================
// Export API for other modules
// ============================================
window.appUtils = {
  loadNote,
  saveNote,
  deleteNote,
  refreshView: refreshCurrentView,
  getState: () => appState,
  addTag,
  removeTag
};

// Log initialization
console.log('App module loaded');
