from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Area, Tag, Setting

SQLALCHEMY_DATABASE_URL = "sqlite:///./notes.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency function to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database with tables and seed data."""
    # Create all tables (indexes are defined in Note.__table_args__)
    Base.metadata.create_all(bind=engine)
    
    # Seed initial data
    db = SessionLocal()
    try:
        # Seed areas
        initial_areas = [
            {"name": "Learning", "color": "#10B981"},
            {"name": "Blog Ideas", "color": "#F59E0B"},
            {"name": "Code Snippets", "color": "#8B5CF6"},
            {"name": "Personal", "color": "#EC4899"},
        ]
        
        for area_data in initial_areas:
            existing_area = db.query(Area).filter(Area.name == area_data["name"]).first()
            if not existing_area:
                area = Area(**area_data)
                db.add(area)
        
        # Seed tags
        initial_tags = [
            {"name": "AI", "color": "#EF4444"},
            {"name": "Python", "color": "#3B82F6"},
            {"name": "Architect", "color": "#10B981"},
            {"name": "Javascript", "color": "#F59E0B"},
            {"name": "Web3", "color": "#8B5CF6"},
            {"name": "Idea", "color": "#EC4899"},
            {"name": "Tutorial", "color": "#6366F1"},
        ]
        
        for tag_data in initial_tags:
            existing_tag = db.query(Tag).filter(Tag.name == tag_data["name"]).first()
            if not existing_tag:
                tag = Tag(**tag_data)
                db.add(tag)
        
        # Seed settings
        initial_settings = [
            {"key": "dark_mode", "value": "false"},
            {"key": "default_area", "value": "Learning"},
        ]
        
        for setting_data in initial_settings:
            existing_setting = db.query(Setting).filter(Setting.key == setting_data["key"]).first()
            if not existing_setting:
                setting = Setting(**setting_data)
                db.add(setting)
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
