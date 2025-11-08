// ============================================
// TinyMCE Editor Initialization and Management
// ============================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  initializeTinyMCE();
  setupMarkdownToggle();
});

/**
 * Initialize TinyMCE editor with configuration
 */
function initializeTinyMCE() {
  // Get current theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  tinymce.init({
    selector: '#tinymce-editor',
    height: 600,
    menubar: true,
    
    // Essential plugins (all free/open source)
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
      'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
      'fullscreen', 'insertdatetime', 'media', 'table', 'help',
      'wordcount', 'codesample'
    ],
    
    // Toolbar configuration
    toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
             'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
             'bullist numlist outdent indent | link image media table codesample | ' +
             'removeformat code fullscreen help',
    
    // Code sample languages for syntax highlighting
    codesample_languages: [
      { text: 'Python', value: 'python' },
      { text: 'JavaScript', value: 'javascript' },
      { text: 'HTML/XML', value: 'markup' },
      { text: 'CSS', value: 'css' },
      { text: 'SQL', value: 'sql' },
      { text: 'Bash', value: 'bash' },
      { text: 'Go', value: 'go' },
      { text: 'Rust', value: 'rust' },
      { text: 'Java', value: 'java' },
      { text: 'TypeScript', value: 'typescript' },
      { text: 'JSON', value: 'json' },
      { text: 'YAML', value: 'yaml' },
      { text: 'C', value: 'c' },
      { text: 'C++', value: 'cpp' },
      { text: 'C#', value: 'csharp' },
      { text: 'PHP', value: 'php' },
      { text: 'Ruby', value: 'ruby' }
    ],
    
    // Image upload handler
    images_upload_handler: function(blobInfo, progress) {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        
        fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          return response.json();
        })
        .then(result => {
          resolve(result.location);
        })
        .catch(error => {
          reject('Image upload failed: ' + error.message);
        });
      });
    },
    
    // Auto-save configuration
    autosave_interval: '30s',
    autosave_retention: '30m',
    autosave_restore_when_empty: true,
    
    // Content styling
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: ${currentTheme === 'dark' ? '#f9fafb' : '#111827'};
        padding: 10px;
      }
      pre {
        background: ${currentTheme === 'dark' ? '#374151' : '#f4f4f4'};
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }
      code {
        background: ${currentTheme === 'dark' ? '#374151' : '#f4f4f4'};
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      pre code {
        background: none;
        padding: 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
      }
      table td, table th {
        border: 1px solid ${currentTheme === 'dark' ? '#4b5563' : '#e5e7eb'};
        padding: 0.5rem;
      }
      table th {
        background-color: ${currentTheme === 'dark' ? '#374151' : '#f3f4f6'};
        font-weight: 600;
      }
      blockquote {
        border-left: 4px solid ${currentTheme === 'dark' ? '#60a5fa' : '#3b82f6'};
        padding-left: 1rem;
        margin-left: 0;
        color: ${currentTheme === 'dark' ? '#d1d5db' : '#6b7280'};
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `,
    
    // Theme based on dark mode
    skin: currentTheme === 'dark' ? 'oxide-dark' : 'oxide',
    content_css: currentTheme === 'dark' ? 'dark' : 'default',
    
    // Additional settings
    branding: false,
    promotion: false,
    resize: true,
    statusbar: true,
    elementpath: true,
    
    // Link settings
    link_assume_external_targets: true,
    link_default_protocol: 'https',
    
    // Paste settings
    paste_as_text: false,
    smart_paste: true,
    
    // Setup callback
    setup: function(editor) {
      editor.on('init', function() {
        console.log('TinyMCE initialized successfully');
      });
      
      // Auto-save notification
      editor.on('AutosaveRestore', function() {
        console.log('Auto-saved content restored');
        if (window.showToast) {
          window.showToast('Content restored from auto-save', 'info');
        }
      });
    }
  });
}

/**
 * Update TinyMCE theme when dark mode toggles
 * @param {string} theme - 'light' or 'dark'
 */
function updateTinyMCETheme(theme) {
  if (tinymce.activeEditor) {
    // Check if markdown mode is active
    const markdownToggle = document.getElementById('markdown-mode-toggle');
    const isMarkdownMode = markdownToggle && markdownToggle.checked;
    const markdownEditor = document.getElementById('markdown-editor');
    
    // Capture content before destroying
    let capturedHTMLContent = '';
    let capturedMarkdownContent = '';
    
    if (isMarkdownMode && markdownEditor) {
      // In markdown mode: capture markdown textarea content
      capturedMarkdownContent = markdownEditor.value;
    } else {
      // In HTML mode: capture TinyMCE content
      capturedHTMLContent = tinymce.activeEditor.getContent();
    }
    
    // Destroy current editor
    tinymce.activeEditor.destroy();
    
    // Reinitialize with new theme
    setTimeout(() => {
      initializeTinyMCE();
      
      // Restore content after reinit
      setTimeout(() => {
        if (isMarkdownMode && markdownEditor) {
          // Restore markdown mode state and content
          markdownEditor.value = capturedMarkdownContent;
        } else {
          // Restore HTML content in TinyMCE
          if (tinymce.activeEditor) {
            tinymce.activeEditor.setContent(capturedHTMLContent);
          }
        }
      }, 100);
    }, 100);
  }
}

/**
 * Setup markdown mode toggle handler
 */
function setupMarkdownToggle() {
  const markdownToggle = document.getElementById('markdown-mode-toggle');
  const tinyMCEContainer = document.getElementById('tinymce-container');
  const markdownContainer = document.getElementById('markdown-container');
  const markdownEditor = document.getElementById('markdown-editor');
  
  if (!markdownToggle || !tinyMCEContainer || !markdownContainer || !markdownEditor) {
    console.error('Required markdown toggle elements not found');
    return;
  }
  
  markdownToggle.addEventListener('change', function() {
    if (this.checked) {
      // Switch to Markdown mode
      switchToMarkdownMode(tinyMCEContainer, markdownContainer, markdownEditor);
    } else {
      // Switch to HTML mode
      switchToHTMLMode(tinyMCEContainer, markdownContainer, markdownEditor);
    }
  });
}

/**
 * Switch from HTML editor to Markdown editor
 */
function switchToMarkdownMode(tinyMCEContainer, markdownContainer, markdownEditor) {
  // Get HTML content from TinyMCE
  let htmlContent = '';
  if (tinymce.activeEditor) {
    htmlContent = tinymce.activeEditor.getContent();
  }
  
  // Convert HTML to Markdown using Turndown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
    strongDelimiter: '**'
  });
  
  // Add custom rules for better conversion
  turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: function(content) {
      return '~~' + content + '~~';
    }
  });
  
  const markdownContent = turndownService.turndown(htmlContent);
  
  // Hide TinyMCE, show markdown textarea
  tinyMCEContainer.classList.add('hidden');
  markdownContainer.classList.remove('hidden');
  markdownEditor.value = markdownContent;
  
  // Focus on markdown editor
  markdownEditor.focus();
}

/**
 * Switch from Markdown editor to HTML editor
 */
function switchToHTMLMode(tinyMCEContainer, markdownContainer, markdownEditor) {
  // Get Markdown content
  const markdownContent = markdownEditor.value;
  
  // Configure marked.js options
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  });
  
  // Convert Markdown to HTML using marked
  const htmlContent = marked.parse(markdownContent);
  
  // Show TinyMCE, hide markdown textarea
  markdownContainer.classList.add('hidden');
  tinyMCEContainer.classList.remove('hidden');
  
  // Set content in TinyMCE
  if (tinymce.activeEditor) {
    tinymce.activeEditor.setContent(htmlContent);
  }
}

/**
 * Get current editor content (HTML or Markdown)
 * @returns {Object} - { html: string, markdown: string, isMarkdown: boolean }
 */
function getCurrentContent() {
  const markdownToggle = document.getElementById('markdown-mode-toggle');
  const isMarkdownMode = markdownToggle && markdownToggle.checked;
  
  if (isMarkdownMode) {
    // Get markdown content
    const markdownEditor = document.getElementById('markdown-editor');
    const markdownContent = markdownEditor ? markdownEditor.value : '';
    
    // Convert to HTML for storage
    const htmlContent = marked.parse(markdownContent);
    
    return {
      html: htmlContent,
      markdown: markdownContent,
      isMarkdown: true
    };
  } else {
    // Get HTML content from TinyMCE
    const htmlContent = tinymce.activeEditor ? tinymce.activeEditor.getContent() : '';
    
    // Convert to markdown for storage
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    const markdownContent = turndownService.turndown(htmlContent);
    
    return {
      html: htmlContent,
      markdown: markdownContent,
      isMarkdown: false
    };
  }
}

/**
 * Set editor content
 * @param {string} htmlContent - HTML content to set
 * @param {string} markdownContent - Markdown content to set
 */
function setEditorContent(htmlContent, markdownContent) {
  const markdownToggle = document.getElementById('markdown-mode-toggle');
  const isMarkdownMode = markdownToggle && markdownToggle.checked;
  
  if (isMarkdownMode) {
    // Set markdown content
    const markdownEditor = document.getElementById('markdown-editor');
    if (markdownEditor) {
      markdownEditor.value = markdownContent || '';
    }
  } else {
    // Set HTML content in TinyMCE
    if (tinymce.activeEditor) {
      tinymce.activeEditor.setContent(htmlContent || '');
    }
  }
}

/**
 * Clear editor content
 */
function clearEditor() {
  // Clear TinyMCE
  if (tinymce.activeEditor) {
    tinymce.activeEditor.setContent('');
  }
  
  // Clear markdown editor
  const markdownEditor = document.getElementById('markdown-editor');
  if (markdownEditor) {
    markdownEditor.value = '';
  }
  
  // Reset to HTML mode
  const markdownToggle = document.getElementById('markdown-mode-toggle');
  if (markdownToggle && markdownToggle.checked) {
    markdownToggle.checked = false;
    
    const tinyMCEContainer = document.getElementById('tinymce-container');
    const markdownContainer = document.getElementById('markdown-container');
    
    if (tinyMCEContainer && markdownContainer) {
      markdownContainer.classList.add('hidden');
      tinyMCEContainer.classList.remove('hidden');
    }
  }
}

/**
 * Get plain text preview from editor
 * @param {number} maxLength - Maximum length of preview
 * @returns {string} - Plain text preview
 */
function getEditorPreview(maxLength = 200) {
  const content = getCurrentContent();
  const htmlContent = content.html;
  
  // Create temporary div to extract text
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;
  const text = temp.textContent || temp.innerText || '';
  
  // Truncate if needed
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  
  return text;
}

// Export functions for use in other scripts
window.editorUtils = {
  updateTheme: updateTinyMCETheme,
  getContent: getCurrentContent,
  setContent: setEditorContent,
  clearEditor: clearEditor,
  getPreview: getEditorPreview
};

// Log initialization
console.log('Editor module loaded');
