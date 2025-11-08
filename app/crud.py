from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, extract
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from app import models, schemas
from app.utils import extract_plaintext, html_to_markdown


def generate_note_title() -> str:
    """Generate auto-title using current datetime in YYYY-MM-DD_HH-MM format."""
    return datetime.now().strftime("%Y-%m-%d_%H-%M")


# Note CRUD Operations

def create_note(db: Session, note: schemas.NoteCreate) -> models.Note:
    """Create a new note with auto-generated title."""
    # Generate auto-title
    title = generate_note_title()
    
    # Extract plaintext and markdown
    plaintext = extract_plaintext(note.html_content)
    markdown_content = html_to_markdown(note.html_content)
    
    # Create note object
    db_note = models.Note(
        title=title,
        html_content=note.html_content,
        plaintext=plaintext,
        markdown_content=markdown_content,
        area=note.area,
        tags=note.tags
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def get_notes(
    db: Session,
    area: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 50,
    offset: int = 0
) -> List[models.Note]:
    """Get notes with optional filters and pagination."""
    query = db.query(models.Note)
    
    # Apply area filter
    if area:
        query = query.filter(models.Note.area == area)
    
    # Apply tag filters with AND logic
    if tags:
        for tag in tags:
            query = query.filter(models.Note.tags.contains(tag))
    
    # Order by modified_at DESC and apply pagination
    query = query.order_by(models.Note.modified_at.desc())
    query = query.offset(offset).limit(limit)
    
    return query.all()


def count_notes(
    db: Session,
    area: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> int:
    """Count notes with optional filters."""
    query = db.query(func.count(models.Note.id))
    
    # Apply area filter
    if area:
        query = query.filter(models.Note.area == area)
    
    # Apply tag filters with AND logic
    if tags:
        for tag in tags:
            query = query.filter(models.Note.tags.contains(tag))
    
    return query.scalar()


def get_note(db: Session, note_id: int) -> Optional[models.Note]:
    """Get a single note by ID."""
    return db.query(models.Note).filter(models.Note.id == note_id).first()


def update_note(
    db: Session,
    note_id: int,
    note_update: schemas.NoteUpdate
) -> Optional[models.Note]:
    """Update an existing note."""
    db_note = get_note(db, note_id)
    if not db_note:
        return None
    
    # Get update data
    update_data = note_update.model_dump(exclude_unset=True)
    
    # If html_content changed, regenerate plaintext and markdown
    if "html_content" in update_data:
        update_data["plaintext"] = extract_plaintext(update_data["html_content"])
        update_data["markdown_content"] = html_to_markdown(update_data["html_content"])
    
    # Ensure tags is never set to None (coerce to empty list)
    if "tags" in update_data and update_data["tags"] is None:
        update_data["tags"] = []
    
    # Update fields
    for field, value in update_data.items():
        setattr(db_note, field, value)
    
    # Update modified_at timestamp
    db_note.modified_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_note)
    return db_note


def delete_note(db: Session, note_id: int) -> bool:
    """Delete a note by ID."""
    db_note = get_note(db, note_id)
    if not db_note:
        return False
    
    db.delete(db_note)
    db.commit()
    return True


# Search Operations

def search_notes(
    db: Session,
    search_request: schemas.SearchRequest
) -> List[schemas.SearchResult]:
    """Search notes with keyword and filters."""
    query = db.query(models.Note)
    
    # Apply keyword search with OR logic for fields
    if search_request.keyword:
        search_filters = []
        if "title" in search_request.search_in:
            search_filters.append(
                models.Note.title.like(f"%{search_request.keyword}%")
            )
        if "content" in search_request.search_in:
            search_filters.append(
                models.Note.plaintext.like(f"%{search_request.keyword}%")
            )
        if search_filters:
            query = query.filter(or_(*search_filters))
    
    # Apply area filter
    if search_request.area:
        query = query.filter(models.Note.area == search_request.area)
    
    # Apply tag filters with AND logic
    if search_request.tags:
        for tag in search_request.tags:
            query = query.filter(models.Note.tags.contains(tag))
    
    # Order by modified_at DESC
    query = query.order_by(models.Note.modified_at.desc())
    
    # Execute query
    notes = query.all()
    
    # Create search results with snippets
    results = []
    for note in notes:
        # Create 150-character snippet from plaintext
        snippet = note.plaintext[:150] if note.plaintext else ""
        if len(note.plaintext or "") > 150:
            snippet += "..."
        
        result = schemas.SearchResult(
            id=note.id,
            title=note.title,
            snippet=snippet,
            area=note.area,
            tags=note.tags,
            created_at=note.created_at
        )
        results.append(result)
    
    return results


# Calendar Operations

def get_calendar_notes(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> Dict[str, List[schemas.CalendarNoteItem]]:
    """Get notes grouped by date for calendar view."""
    # Default to current year/month
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
    
    # Filter notes by year and month
    query = db.query(models.Note)
    query = query.filter(extract('year', models.Note.created_at) == year)
    query = query.filter(extract('month', models.Note.created_at) == month)
    query = query.order_by(models.Note.created_at.desc())
    
    notes = query.all()
    
    # Group by date string
    calendar_data: Dict[str, List[schemas.CalendarNoteItem]] = {}
    for note in notes:
        date_str = note.created_at.strftime("%Y-%m-%d")
        if date_str not in calendar_data:
            calendar_data[date_str] = []
        
        calendar_item = schemas.CalendarNoteItem(
            id=note.id,
            title=note.title,
            area=note.area,
            tags=note.tags
        )
        calendar_data[date_str].append(calendar_item)
    
    return calendar_data


# Statistics Operations

def get_statistics(db: Session) -> schemas.StatisticsResponse:
    """Calculate statistics about notes."""
    # Total notes count
    total_notes = db.query(func.count(models.Note.id)).scalar()
    
    # Notes by area
    notes_by_area_query = db.query(
        models.Note.area,
        func.count(models.Note.id)
    ).group_by(models.Note.area).all()
    
    notes_by_area = {
        area if area else "None": count
        for area, count in notes_by_area_query
    }
    
    # Notes by tag - iterate all notes and tally tag occurrences
    all_notes = db.query(models.Note).all()
    notes_by_tag: Dict[str, int] = {}
    for note in all_notes:
        for tag in note.tags:
            notes_by_tag[tag] = notes_by_tag.get(tag, 0) + 1
    
    # Notes from last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    notes_this_week = db.query(func.count(models.Note.id)).filter(
        models.Note.created_at >= week_ago
    ).scalar()
    
    # Notes from current month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    notes_this_month = db.query(func.count(models.Note.id)).filter(
        models.Note.created_at >= month_start
    ).scalar()
    
    return schemas.StatisticsResponse(
        total_notes=total_notes,
        notes_by_area=notes_by_area,
        notes_by_tag=notes_by_tag,
        notes_this_week=notes_this_week,
        notes_this_month=notes_this_month
    )


# Area Operations

def get_areas(db: Session) -> List[models.Area]:
    """Get all areas."""
    return db.query(models.Area).all()


def create_area(db: Session, area: schemas.AreaCreate) -> models.Area:
    """Create a new area."""
    db_area = models.Area(name=area.name, color=area.color)
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area


# Tag Operations

def get_tags(db: Session) -> List[models.Tag]:
    """Get all tags."""
    return db.query(models.Tag).all()


def create_tag(db: Session, tag: schemas.TagCreate) -> models.Tag:
    """Create a new tag."""
    db_tag = models.Tag(name=tag.name, color=tag.color)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


# Setting Operations

def get_settings(db: Session) -> List[models.Setting]:
    """Get all settings."""
    return db.query(models.Setting).all()


def update_setting(db: Session, key: str, value: str) -> Optional[models.Setting]:
    """Update a setting value by key."""
    db_setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if not db_setting:
        return None
    
    db_setting.value = value
    db.commit()
    db.refresh(db_setting)
    return db_setting
