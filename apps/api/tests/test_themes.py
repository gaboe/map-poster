import pytest
from app.themes import load_theme, list_themes


class TestLoadTheme:
    def test_load_theme_noir(self):
        theme = load_theme("noir")
        assert theme is not None
        assert theme["name"] == "Noir"
        assert theme["bg"] == "#000000"
        assert theme["text"] == "#FFFFFF"

    def test_load_theme_terracotta(self):
        theme = load_theme("terracotta")
        assert theme is not None
        assert theme["name"] == "Terracotta"

    def test_load_theme_all_required_keys(self):
        theme = load_theme("noir")
        required_keys = [
            "name", "description", "bg", "text", "gradient_color",
            "water", "parks", "road_motorway", "road_primary",
            "road_secondary", "road_tertiary", "road_residential", "road_default",
        ]
        for key in required_keys:
            assert key in theme

    def test_load_theme_not_found_returns_terracotta(self):
        theme = load_theme("nonexistent_theme")
        assert theme is not None
        assert theme["name"] == "Terracotta"

    def test_load_theme_case_insensitive(self):
        theme_lower = load_theme("noir")
        theme_upper = load_theme("NOIR")
        assert theme_lower["name"] == theme_upper["name"]

    def test_load_theme_returns_dict(self):
        theme = load_theme("noir")
        assert isinstance(theme, dict)


class TestListThemes:
    def test_list_themes_returns_list(self):
        themes = list_themes()
        assert isinstance(themes, list)

    def test_list_themes_count(self):
        themes = list_themes()
        assert len(themes) == 17

    def test_list_themes_structure(self):
        themes = list_themes()
        for theme in themes:
            assert "id" in theme
            assert "name" in theme
            assert "description" in theme

    def test_list_themes_contains_noir(self):
        themes = list_themes()
        theme_ids = [t["id"] for t in themes]
        assert "noir" in theme_ids

    def test_list_themes_contains_terracotta(self):
        themes = list_themes()
        theme_ids = [t["id"] for t in themes]
        assert "terracotta" in theme_ids

    def test_list_themes_all_17_themes(self):
        expected_themes = [
            "noir", "midnight_blue", "terracotta", "japanese_ink",
            "neon_cyberpunk", "warm_beige", "pastel_dream", "emerald",
            "forest", "ocean", "sunset", "autumn", "copper_patina",
            "monochrome_blue", "blueprint", "contrast_zones", "gradient_roads",
        ]
        themes = list_themes()
        theme_ids = [t["id"] for t in themes]
        for expected_id in expected_themes:
            assert expected_id in theme_ids

    def test_list_themes_no_duplicates(self):
        themes = list_themes()
        theme_ids = [t["id"] for t in themes]
        assert len(theme_ids) == len(set(theme_ids))
