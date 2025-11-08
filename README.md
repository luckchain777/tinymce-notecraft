# NoteCraft 📝

> A local-first personal notes management system with rich text editing, intelligent organization, and powerful search capabilities for software engineers.

![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **📝 Rich Text Editing** - Powered by TinyMCE with code syntax highlighting, tables, and image support
- **🏷️ Smart Organization** - Tag-based system with predefined areas (Learning, Blog Ideas, Code Snippets, Personal)
- **🔍 Powerful Search** - Full-text search with keyword + filter combinations (AND logic)
- **📅 Calendar View** - Visualize your notes timeline with interactive calendar
- **📊 Dashboard** - At-a-glance statistics and recent notes
- **🌓 Dark Mode** - Eye-friendly interface for day and night
- **📤 Export** - Download notes as HTML or Markdown
- **💾 Local-First** - All data stored in SQLite - no cloud required
- **🚀 Modern Stack** - FastAPI backend with auto-generated API docs

## 🎯 Perfect For

- Senior software engineers managing technical knowledge
- Developers organizing code snippets and learning resources
- Technical writers drafting blog posts and documentation
- Anyone who wants a powerful, local notes system without cloud dependencies

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/luckchain777/tinymce-notecraft.git
cd tinymce-notecraft
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the application**
```bash
python main.py
```

4. **Open in browser**
```
http://localhost:5000
```

The database will be automatically created and initialized with default areas and tags on first run.

## 📚 Usage

### Creating Notes

1. Click the "**+ New Note**" button
2. Notes are automatically named with current date/time (e.g., `2025-01-30_14-30`)
3. Select an **Area** and add **Tags**
4. Write your content using the rich text editor
5. Click **Save**

### Organizing with Tags & Areas

**Predefined Areas:**
- 🎓 Learning - Technical learning notes, tutorials
- 💡 Blog Ideas - Draft posts and content ideas
- 💻 Code Snippets - Reusable code and solutions
- 👤 Personal - Personal notes and thoughts

**Default Tags:**
- AI, Python, Architect, Javascript, Web3, Idea, Tutorial

Add custom tags and areas through the Settings panel.

### Searching Notes

1. Enter keywords in the search bar
2. Filter by Area and Tags (left sidebar)
3. Click **Search** button
4. Results use AND logic (must match ALL selected filters)

### Views

- **📊 Dashboard** - Recent notes and statistics
- **📋 Notes List** - All notes with filters
- **📅 Calendar** - Notes organized by date

### Exporting

- Click **Export HTML** or **Export Markdown** on any note
- Single-file download for easy sharing

## 🛠️ Tech Stack

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - SQL toolkit and ORM
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [SQLite](https://www.sqlite.org/) - Embedded database

**Frontend:**
- [TinyMCE](https://www.tiny.cloud/) - Rich text editor
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [FullCalendar](https://fullcalendar.io/) - Calendar component
- Vanilla JavaScript - No heavy frameworks

**Utilities:**
- BeautifulSoup4 - HTML parsing
- html2text - HTML to Markdown conversion
- Markdown - Markdown to HTML conversion

## 📖 API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### Key Endpoints

```
POST   /api/notes          - Create note
GET    /api/notes          - List notes (with filters)
GET    /api/notes/{id}     - Get note
PUT    /api/notes/{id}     - Update note
DELETE /api/notes/{id}     - Delete note
POST   /api/search         - Search notes
GET    /api/calendar       - Get calendar data
GET    /api/statistics     - Get dashboard stats
GET    /api/areas          - List areas
GET    /api/tags           - List tags
```

## 🗂️ Project Structure

```
notecraft/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── notes.db               # SQLite database (auto-created)
├── app/
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── database.py        # Database connection
│   ├── crud.py            # CRUD operations
│   └── utils.py           # Helper functions
├── static/
│   ├── css/
│   │   └── styles.css     # Custom styles + dark mode
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── editor.js      # TinyMCE integration
│   │   ├── search.js      # Search functionality
│   │   └── calendar.js    # Calendar view
│   └── uploads/           # Image uploads storage
└── templates/
    └── index.html         # Single page application
```

## ⚙️ Configuration

### Default Settings

- **Dark Mode**: Off (toggle in UI)
- **Default Area**: Learning
- **Port**: 5000

### Customization

Edit initial areas and tags in `app/database.py`:

```python
initial_areas = [
    Area(name="Your Custom Area", color="#FF5733"),
    # Add more areas...
]

initial_tags = [
    Tag(name="your-tag", color="#3B82F6"),
    # Add more tags...
]
```

## 🔒 Data & Privacy

- **100% Local**: All data stored in local SQLite database
- **No Cloud**: No external services or API calls
- **No Tracking**: Zero analytics or telemetry
- **Portable**: Copy `notes.db` to backup or move your data

## 🚧 Roadmap

- [ ] Bulk import from Markdown files
- [ ] Export entire database as JSON
- [ ] Note templates
- [ ] Favorites/pinning
- [ ] Keyboard shortcuts
- [ ] Note linking (wiki-style)
- [ ] Full-text search ranking
- [ ] Mobile responsive improvements
- [ ] Desktop app (Electron/Tauri)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TinyMCE](https://www.tiny.cloud/) for the excellent rich text editor
- [FastAPI](https://fastapi.tiangolo.com/) for the modern Python framework
- [FullCalendar](https://fullcalendar.io/) for calendar functionality
- The open-source community for inspiration
