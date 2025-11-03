# NoteCraft - Personal Notes Web Application

A local-first personal notes management system with rich text editing, intelligent organization, and powerful search capabilities for software engineers.

## Features

- 📝 Rich text editing with TinyMCE (code syntax highlighting, tables, images)
- 🏷️ Organize with tags and areas (Learning, Blog Ideas, Code Snippets, Personal)
- 🔍 Powerful search with keyword + filter combinations
- 📅 Calendar view for temporal organization
- 🌓 Dark mode support
- 📤 Export notes as HTML or Markdown
- 💾 SQLite database - portable and self-contained
- 🚀 FastAPI backend with auto-generated API documentation

## Tech Stack

**Backend:** Python • FastAPI • SQLAlchemy • Pydantic • SQLite

**Frontend:** Vanilla JavaScript • TinyMCE • Tailwind CSS • FullCalendar

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tinymce-personal-wiki
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 5000
   ```

   Or using Python directly:
   ```bash
   python main.py
   ```

2. Open your browser and navigate to:
   - **Application:** http://localhost:5000
   - **API Documentation (Swagger):** http://localhost:5000/docs
   - **API Documentation (ReDoc):** http://localhost:5000/redoc

## Project Structure

```
tinymce-personal-wiki/
├── app/                    # Backend application code
│   ├── __init__.py
│   ├── models.py          # SQLAlchemy database models
│   ├── schemas.py         # Pydantic validation schemas
│   ├── database.py        # Database connection and initialization
│   ├── crud.py            # CRUD operations
│   ├── utils.py           # Helper functions
│   └── routers/           # API route handlers
├── static/                # Frontend static assets
│   ├── css/              # Custom stylesheets
│   ├── js/               # JavaScript modules
│   └── uploads/          # User-uploaded images
├── templates/            # HTML templates
│   └── index.html        # Single-page application
├── main.py               # FastAPI application entry point
├── requirements.txt      # Python dependencies
├── notes.db             # SQLite database (auto-created)
└── README.md            # This file
```

## Database

The application uses SQLite for data storage. The database file (`notes.db`) is automatically created on first run with the following tables:

- **notes** - Note content, metadata, and timestamps
- **areas** - Organizational categories (Learning, Blog Ideas, etc.)
- **tags** - Labels for cross-cutting categorization
- **settings** - Application preferences (dark mode, defaults)

## Development

### API Endpoints

All API endpoints are documented at `/docs` when the server is running. Key endpoints include:

- `POST /api/notes` - Create a new note
- `GET /api/notes` - List all notes (with filters)
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note
- `POST /api/search` - Search notes
- `GET /api/calendar` - Get calendar view data
- `GET /api/statistics` - Get dashboard statistics

### TinyMCE Configuration

To use TinyMCE, you'll need an API key:

1. Sign up for a free API key at https://www.tiny.cloud/auth/signup/
2. Replace `YOUR_API_KEY` in `templates/index.html` with your key
3. Alternatively, self-host TinyMCE to avoid needing an API key

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
