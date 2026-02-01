import json
from pathlib import Path
from typing import Dict, List, Any


def get_themes_dir() -> Path:
    """Get the themes directory path"""
    return Path(__file__).parent.parent / "themes"


def load_theme(theme_id: str) -> Dict[str, Any]:
    """Load a theme by ID from JSON file."""
    theme_id = theme_id.lower()
    themes_dir = get_themes_dir()
    theme_file = themes_dir / f"{theme_id}.json"
    
    if not theme_file.exists():
        theme_file = themes_dir / "terracotta.json"
    
    try:
        with open(theme_file, "r") as f:
            theme = json.load(f)
        return theme
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "name": "Terracotta",
            "description": "Default fallback theme",
            "bg": "#E8D4C4",
            "text": "#3D2817",
            "gradient_color": "#E8D4C4",
            "water": "#A8C5D1",
            "parks": "#B8D4A8",
            "road_motorway": "#5C3D2E",
            "road_primary": "#6D4E3F",
            "road_secondary": "#7D5E4F",
            "road_tertiary": "#8D6E5F",
            "road_residential": "#9D7E6F",
            "road_default": "#8D6E5F",
        }


def list_themes() -> List[Dict[str, str]]:
    """List all available themes."""
    themes_dir = get_themes_dir()
    themes = []
    
    theme_files = sorted(themes_dir.glob("*.json"))
    
    for theme_file in theme_files:
        try:
            with open(theme_file, "r") as f:
                theme_data = json.load(f)
            
            theme_id = theme_file.stem
            themes.append({
                "id": theme_id,
                "name": theme_data.get("name", theme_id.replace("_", " ").title()),
                "description": theme_data.get("description", ""),
            })
        except (json.JSONDecodeError, IOError):
            continue
    
    return themes
