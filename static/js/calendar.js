// ============================================
// Calendar View Integration
// ============================================

// Calendar instance
let calendar = null;
let calendarInitialized = false;

// ============================================
// Initialize Calendar
// ============================================
function initializeCalendar() {
  if (calendarInitialized && calendar) {
    // Calendar already exists, just refetch events
    calendar.refetchEvents();
    return;
  }
  
  const calendarEl = document.getElementById('calendar-container');
  if (!calendarEl) {
    console.error('Calendar container not found');
    return;
  }
  
  // Check if FullCalendar is loaded
  if (typeof FullCalendar === 'undefined') {
    console.error('FullCalendar library not loaded');
    if (window.showToast) {
      window.showToast('Calendar library not loaded', 'error');
    }
    return;
  }
  
  // Detect screen size for responsive view
  const isMobile = window.innerWidth < 768;
  const initialView = isMobile ? 'listWeek' : 'dayGridMonth';
  
  // Initialize FullCalendar
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: initialView,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,listWeek'
    },
    height: 'auto',
    events: loadCalendarEvents,
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    eventDisplay: 'block',
    displayEventTime: false,
    eventTextColor: '#ffffff',
    eventBorderColor: 'transparent',
    
    // View-specific options
    views: {
      dayGridMonth: {
        dayMaxEventRows: 3
      }
    },
    
    // Responsive behavior
    windowResize: function(view) {
      if (window.innerWidth < 768 && calendar.view.type !== 'listWeek') {
        calendar.changeView('listWeek');
      } else if (window.innerWidth >= 768 && calendar.view.type === 'listWeek') {
        calendar.changeView('dayGridMonth');
      }
    }
  });
  
  calendar.render();
  calendarInitialized = true;
  
  console.log('Calendar initialized successfully');
}

// ============================================
// Load Calendar Events
// ============================================
async function loadCalendarEvents(fetchInfo, successCallback, failureCallback) {
  try {
    // Extract year and month from fetchInfo.start
    const startDate = new Date(fetchInfo.start);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Fetch calendar data
    const response = await fetch(`/api/calendar?year=${year}&month=${month}`);
    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }
    
    const data = await response.json();
    
    // Transform calendar data to FullCalendar event format
    const events = [];
    
    if (data.calendar_data) {
      for (const [date, notes] of Object.entries(data.calendar_data)) {
        for (const note of notes) {
          events.push({
            id: note.id,
            title: note.title,
            start: date,
            backgroundColor: getAreaColor(note.area),
            borderColor: getAreaColor(note.area),
            extendedProps: {
              area: note.area,
              tags: note.tags || []
            }
          });
        }
      }
    }
    
    successCallback(events);
    
  } catch (error) {
    console.error('Error loading calendar events:', error);
    if (window.showToast) {
      window.showToast('Failed to load calendar events', 'error');
    }
    failureCallback(error);
  }
}

// ============================================
// Get Area Color
// ============================================
function getAreaColor(areaName) {
  if (!areaName) return '#3b82f6'; // Default blue
  
  // Get areas from app state
  const appState = window.appUtils ? window.appUtils.getState() : { areas: [] };
  const area = appState.areas.find(a => a.name === areaName);
  
  return area ? area.color : '#3b82f6';
}

// ============================================
// Event Click Handler
// ============================================
function handleEventClick(info) {
  info.jsEvent.preventDefault();
  
  const noteId = parseInt(info.event.id);
  
  if (noteId && window.appUtils) {
    // Load the note
    window.appUtils.loadNote(noteId);
    
    // Switch to notes view to show the editor
    const notesListView = document.getElementById('notes-list-view');
    const dashboardView = document.getElementById('dashboard-view');
    const calendarView = document.getElementById('calendar-view');
    
    if (notesListView && dashboardView && calendarView) {
      // Keep calendar view visible but scroll to editor
      // Or switch to notes view - based on preference
      // For now, let's switch to notes view
      calendarView.classList.add('hidden');
      notesListView.classList.remove('hidden');
      dashboardView.classList.add('hidden');
      
      // Update view buttons
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById('view-notes-btn')?.classList.add('active');
    }
  }
}

// ============================================
// Date Click Handler
// ============================================
async function handleDateClick(info) {
  // Filter notes by the clicked date
  const clickedDate = info.dateStr;
  
  try {
    // Fetch notes for this date
    const response = await fetch(`/api/notes?limit=100&offset=0`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    
    const data = await response.json();
    const notes = data.notes || [];
    
    // Filter notes that were created on this date
    const notesOnDate = notes.filter(note => {
      const noteDate = new Date(note.created_at);
      const noteDateStr = noteDate.toISOString().split('T')[0];
      return noteDateStr === clickedDate;
    });
    
    if (notesOnDate.length === 0) {
      if (window.showToast) {
        window.showToast(`No notes found for ${clickedDate}`, 'info');
      }
      return;
    }
    
    // Render filtered notes in notes list view
    renderDateFilteredNotes(notesOnDate, clickedDate);
    
    // Switch to notes view
    const notesListView = document.getElementById('notes-list-view');
    const dashboardView = document.getElementById('dashboard-view');
    const calendarView = document.getElementById('calendar-view');
    
    if (notesListView && dashboardView && calendarView) {
      calendarView.classList.add('hidden');
      notesListView.classList.remove('hidden');
      dashboardView.classList.add('hidden');
      
      // Update view buttons
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById('view-notes-btn')?.classList.add('active');
    }
    
  } catch (error) {
    console.error('Error loading notes for date:', error);
    if (window.showToast) {
      window.showToast('Failed to load notes for this date', 'error');
    }
  }
}

// ============================================
// Render Date Filtered Notes
// ============================================
function renderDateFilteredNotes(notes, date) {
  const container = document.getElementById('notes-list');
  if (!container) return;
  
  const appState = window.appUtils ? window.appUtils.getState() : { areas: [], tags: [] };
  
  const formattedDate = new Date(date).toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  container.innerHTML = `
    <div class="search-info">
      <div class="search-info-text">
        Notes from ${formattedDate} (${notes.length} note${notes.length !== 1 ? 's' : ''})
      </div>
      <button class="btn btn-secondary btn-sm" onclick="window.calendarUtils.clearDateFilter()">Show All Notes</button>
    </div>
  `;
  
  container.innerHTML += notes.map(note => {
    const areaObj = appState.areas.find(a => a.name === note.area);
    const areaColor = areaObj ? areaObj.color : '#3b82f6';
    
    const tags = (note.tags || []).map(tagName => {
      const tagObj = appState.tags.find(t => t.name === tagName);
      const color = tagObj ? tagObj.color : '#10b981';
      return `<span class="tag-badge" style="background-color: ${color};">${escapeHtml(tagName)}</span>`;
    }).join('');
    
    // Create snippet
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.html_content || '';
    const snippet = (tempDiv.textContent || tempDiv.innerText || '').substring(0, 150) + '...';
    
    return `
      <div class="note-list-item" data-note-id="${note.id}" onclick="window.appUtils.loadNote(${note.id})">
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
// Clear Date Filter
// ============================================
function clearDateFilter() {
  if (window.appUtils) {
    window.appUtils.refreshView();
  }
}

// ============================================
// Refresh Calendar
// ============================================
function refreshCalendar() {
  if (calendar) {
    calendar.refetchEvents();
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
window.calendarUtils = {
  initialize: initializeCalendar,
  refresh: refreshCalendar,
  clearDateFilter: clearDateFilter
};

// Log initialization
console.log('Calendar module loaded');
