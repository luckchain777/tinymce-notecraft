from fastapi import FastAPI, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.background import BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uvicorn
import os
import shutil
from app.database import get_db, init_db
from app import crud, schemas
from app.utils import html_to_markdown


# Initialize FastAPI app
app = FastAPI(title="Personal Notes API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database and create necessary directories on startup."""
    init_db()
    os.makedirs("static/uploads", exist_ok=True)


# Mount static files - ensure directory exists before mounting
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# Root Endpoint

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main application page."""
    # Will be created by frontend phase
    if os.path.exists("templates/index.html"):
        with open("templates/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Personal Notes API</h1><p>Visit <a href='/docs'>/docs</a> for API documentation.</p>")


# Notes CRUD Endpoints

@app.post("/api/notes", status_code=201, response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    """Create a new note."""
    return crud.create_note(db, note)


@app.get("/api/notes", response_model=schemas.NoteListResponse)
def get_notes(
    area: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get notes with optional filters and pagination."""
    # Split tags by comma if provided
    tag_list = tags.split(",") if tags else None
    
    # Get notes and total count
    notes = crud.get_notes(db, area=area, tags=tag_list, limit=limit, offset=offset)
    total = crud.count_notes(db, area=area, tags=tag_list)
    
    return {"notes": notes, "total": total}


@app.get("/api/notes/{note_id}", response_model=schemas.NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a single note by ID."""
    note = crud.get_note(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@app.put("/api/notes/{note_id}", response_model=schemas.NoteResponse)
def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing note."""
    note = crud.update_note(db, note_id, note_update)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note by ID."""
    success = crud.delete_note(db, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return None


# Search Endpoint

@app.post("/api/search", response_model=schemas.SearchResponse)
def search_notes(
    search_request: schemas.SearchRequest,
    db: Session = Depends(get_db)
):
    """Search notes with keyword and filters."""
    results = crud.search_notes(db, search_request)
    return {"results": results, "total": len(results)}


# Calendar Endpoint

@app.get("/api/calendar", response_model=schemas.CalendarResponse)
def get_calendar(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get notes grouped by date for calendar view."""
    calendar_data = crud.get_calendar_notes(db, year, month)
    return {"calendar_data": calendar_data}


# Statistics Endpoint

@app.get("/api/statistics", response_model=schemas.StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    """Get statistics about notes."""
    return crud.get_statistics(db)


# Settings Endpoints

@app.get("/api/areas", response_model=List[schemas.AreaResponse])
def get_areas(db: Session = Depends(get_db)):
    """Get all areas."""
    return crud.get_areas(db)


@app.post("/api/areas", status_code=201, response_model=schemas.AreaResponse)
def create_area(area: schemas.AreaCreate, db: Session = Depends(get_db)):
    """Create a new area."""
    return crud.create_area(db, area)


@app.get("/api/tags", response_model=List[schemas.TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """Get all tags."""
    return crud.get_tags(db)


@app.post("/api/tags", status_code=201, response_model=schemas.TagResponse)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    """Create a new tag."""
    return crud.create_tag(db, tag)


@app.get("/api/settings", response_model=List[schemas.SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    """Get all settings."""
    return crud.get_settings(db)


@app.put("/api/settings/{key}", response_model=schemas.SettingResponse)
def update_setting(
    key: str,
    setting_update: schemas.SettingUpdate,
    db: Session = Depends(get_db)
):
    """Update a setting value."""
    setting = crud.update_setting(db, key, setting_update.value)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


# Export Endpoint

@app.get("/api/notes/{note_id}/export")
def export_note(
    note_id: int,
    format: str = Query(..., pattern="^(html|markdown)$"),
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Export a note in HTML or Markdown format."""
    note = crud.get_note(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Determine content and media type based on format
    if format == "markdown":
        content = note.markdown_content or html_to_markdown(note.html_content)
        media_type = "text/markdown"
        extension = "md"
    else:  # html
        content = note.html_content
        media_type = "text/html"
        extension = "html"
    
    # Create temporary file
    os.makedirs("static/uploads", exist_ok=True)
    temp_filename = f"temp_{note_id}.{extension}"
    temp_path = os.path.join("static/uploads", temp_filename)
    
    with open(temp_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    # Schedule cleanup of temp file after response
    background_tasks.add_task(os.remove, temp_path)
    
    # Return file response
    return FileResponse(
        path=temp_path,
        media_type=media_type,
        filename=f"{note.title}.{extension}"
    )


# Image Upload Endpoint

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file for use in notes."""
    # Validate file extension
    allowed_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"image_{timestamp}{file_extension}"
    
    # Save file to static/uploads
    os.makedirs("static/uploads", exist_ok=True)
    file_path = os.path.join("static/uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return location for TinyMCE
    return {"location": f"/static/uploads/{unique_filename}"}


# Main entry point
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
