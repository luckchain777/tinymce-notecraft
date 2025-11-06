from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


# Note Schemas
class NoteBase(BaseModel):
    html_content: str
    area: Optional[str] = None
    tags: List[str] = []


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    html_content: Optional[str] = None
    area: Optional[str] = None
    tags: Optional[List[str]] = None


class NoteResponse(NoteBase):
    id: int
    title: str
    plaintext: Optional[str] = None
    markdown_content: Optional[str] = None
    created_at: datetime
    modified_at: datetime
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    total: int


# Search Schemas
class SearchRequest(BaseModel):
    keyword: str = ""
    area: Optional[str] = None
    tags: List[str] = []
    search_in: List[str] = ["title", "content"]


class SearchResult(BaseModel):
    id: int
    title: str
    snippet: str
    area: Optional[str] = None
    tags: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int


# Area Schemas
class AreaBase(BaseModel):
    name: str
    color: str = "#3B82F6"


class AreaCreate(AreaBase):
    pass


class AreaResponse(AreaBase):
    id: int
    
    class Config:
        from_attributes = True


# Tag Schemas
class TagBase(BaseModel):
    name: str
    color: str = "#6B7280"


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    
    class Config:
        from_attributes = True


# Setting Schemas
class SettingBase(BaseModel):
    key: str
    value: str


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    value: str


class SettingResponse(SettingBase):
    class Config:
        from_attributes = True


# Calendar Schemas
class CalendarNoteItem(BaseModel):
    id: int
    title: str
    area: Optional[str] = None
    tags: List[str]
    
    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    calendar_data: dict[str, List[CalendarNoteItem]]


# Export Schemas
class ExportRequest(BaseModel):
    format: str = Field(pattern="^(html|markdown)$")
    
    @field_validator('format')
    @classmethod
    def validate_format(cls, v):
        if v not in ["html", "markdown"]:
            raise ValueError("Format must be either 'html' or 'markdown'")
        return v


# Statistics Schema
class StatisticsResponse(BaseModel):
    total_notes: int
    notes_by_area: dict[str, int]
    notes_by_tag: dict[str, int]
    notes_this_week: int
    notes_this_month: int
