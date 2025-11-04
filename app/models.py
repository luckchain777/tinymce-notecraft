from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    html_content = Column(Text, nullable=False)
    plaintext = Column(Text, nullable=True)
    markdown_content = Column(Text, nullable=True)
    area = Column(String, nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_notes_area', 'area'),
        Index('idx_notes_created', 'created_at'),
        Index('idx_notes_modified', 'modified_at'),
    )
    
    def __repr__(self):
        return f"<Note(id={self.id}, title='{self.title}')>"


class Area(Base):
    __tablename__ = "areas"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#3B82F6")
    
    def __repr__(self):
        return f"<Area(name='{self.name}')>"


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#6B7280")
    
    def __repr__(self):
        return f"<Tag(name='{self.name}')>"


class Setting(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    
    def __repr__(self):
        return f"<Setting(key='{self.key}', value='{self.value}')>"
