"""
Poster Generation Service
Ported from maptoposter/create_map_poster.py

This module handles:
- File-based caching with pickle
- Coordinate geocoding via Nominatim
- OSM data fetching (streets, water, parks)
- Poster rendering with matplotlib
"""

import os
import pickle
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, cast

import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import numpy as np
import osmnx as ox
from geopandas import GeoDataFrame
from geopy.geocoders import Nominatim
from matplotlib.font_manager import FontProperties
from networkx import MultiDiGraph
from shapely.geometry import Point

from app.themes import load_theme


# ==============================================================================
# Configuration
# ==============================================================================

CACHE_DIR_PATH = os.environ.get("CACHE_DIR", "cache")
CACHE_DIR = Path(CACHE_DIR_PATH)
CACHE_DIR.mkdir(exist_ok=True)

FONTS_DIR = Path(__file__).parent.parent / "fonts"
POSTERS_DIR = Path(__file__).parent.parent / "posters"
POSTERS_DIR.mkdir(exist_ok=True)

# Output DPI (150 instead of 300 for faster generation)
OUTPUT_DPI = 150


class CacheError(Exception):
    """Raised when a cache operation fails."""


# ==============================================================================
# Cache Functions
# ==============================================================================


def _cache_path(key: str) -> str:
    """
    Generate a safe cache file path from a cache key.

    Args:
        key: Cache key identifier

    Returns:
        Path to cache file with .pkl extension
    """
    safe = key.replace(os.sep, "_")
    return os.path.join(CACHE_DIR, f"{safe}.pkl")


def cache_get(key: str) -> Any:
    """
    Retrieve a cached object by key.

    Args:
        key: Cache key identifier

    Returns:
        Cached object if found, None otherwise

    Raises:
        CacheError: If cache read operation fails
    """
    try:
        path = _cache_path(key)
        if not os.path.exists(path):
            return None
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        raise CacheError(f"Cache read failed: {e}") from e


def cache_set(key: str, value: Any) -> None:
    """
    Store an object in the cache.

    Args:
        key: Cache key identifier
        value: Object to cache (must be picklable)

    Raises:
        CacheError: If cache write operation fails
    """
    try:
        if not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)
        path = _cache_path(key)
        with open(path, "wb") as f:
            pickle.dump(value, f, protocol=pickle.HIGHEST_PROTOCOL)
    except Exception as e:
        raise CacheError(f"Cache write failed: {e}") from e


# ==============================================================================
# Font Management
# ==============================================================================


def load_fonts() -> Optional[Dict[str, str]]:
    """
    Load local Roboto fonts.

    Returns:
        Dict with 'bold', 'regular', 'light' keys mapping to font file paths,
        or None if fonts not found
    """
    fonts = {
        "bold": str(FONTS_DIR / "Roboto-Bold.ttf"),
        "regular": str(FONTS_DIR / "Roboto-Regular.ttf"),
        "light": str(FONTS_DIR / "Roboto-Light.ttf"),
    }

    for weight, path in fonts.items():
        if not os.path.exists(path):
            return None

    return fonts


FONTS = load_fonts()


# ==============================================================================
# Text Utilities
# ==============================================================================


def is_latin_script(text: str) -> bool:
    """
    Check if text is primarily Latin script.
    Used to determine if letter-spacing should be applied to city names.

    Args:
        text: Text to analyze

    Returns:
        True if text is primarily Latin script, False otherwise
    """
    if not text:
        return True

    latin_count = 0
    total_alpha = 0

    for char in text:
        if char.isalpha():
            total_alpha += 1
            # Latin Unicode ranges
            if ord(char) < 0x250:
                latin_count += 1

    if total_alpha == 0:
        return True

    return (latin_count / total_alpha) > 0.8


# ==============================================================================
# Geocoding
# ==============================================================================


def get_coordinates(city: str, country: str) -> Tuple[float, float]:
    """
    Fetches coordinates for a given city and country using geopy.
    Includes rate limiting to be respectful to the geocoding service.

    Args:
        city: City name
        country: Country name

    Returns:
        Tuple of (latitude, longitude)

    Raises:
        ValueError: If geocoding fails or location not found
    """
    coords_key = f"coords_{city.lower()}_{country.lower()}"
    cached = cache_get(coords_key)
    if cached:
        return cached

    geolocator = Nominatim(user_agent="map_poster_api", timeout=10)
    time.sleep(1)  # Rate limiting

    try:
        location = geolocator.geocode(f"{city}, {country}")
    except Exception as e:
        raise ValueError(f"Geocoding failed for {city}, {country}: {e}") from e

    if location:
        result = (location.latitude, location.longitude)
        try:
            cache_set(coords_key, result)
        except CacheError:
            pass
        return result

    raise ValueError(f"Could not find coordinates for {city}, {country}")


# ==============================================================================
# OSM Data Fetching
# ==============================================================================


def fetch_graph(point: Tuple[float, float], dist: int) -> Optional[MultiDiGraph]:
    """
    Fetch street network graph from OpenStreetMap.

    Args:
        point: (latitude, longitude) tuple for center point
        dist: Distance in meters from center point

    Returns:
        MultiDiGraph of street network, or None if fetch fails
    """
    lat, lon = point
    graph_key = f"graph_{lat}_{lon}_{dist}"
    cached = cache_get(graph_key)
    if cached is not None:
        return cast(MultiDiGraph, cached)

    try:
        g = ox.graph_from_point(
            point,
            dist=dist,
            dist_type="bbox",
            network_type="all",
            truncate_by_edge=True,
        )
        time.sleep(0.5)  # Rate limiting
        try:
            cache_set(graph_key, g)
        except CacheError:
            pass
        return g
    except Exception:
        return None


def fetch_features(
    point: Tuple[float, float], dist: int, tags: Dict[str, Any], name: str
) -> Optional[GeoDataFrame]:
    """
    Fetch geographic features (water, parks, etc.) from OpenStreetMap.

    Args:
        point: (latitude, longitude) tuple for center point
        dist: Distance in meters from center point
        tags: Dictionary of OSM tags to filter features
        name: Name for this feature type (for caching)

    Returns:
        GeoDataFrame of features, or None if fetch fails
    """
    lat, lon = point
    tag_str = "_".join(tags.keys())
    features_key = f"{name}_{lat}_{lon}_{dist}_{tag_str}"
    cached = cache_get(features_key)
    if cached is not None:
        return cast(GeoDataFrame, cached)

    try:
        data = ox.features_from_point(point, tags=tags, dist=dist)
        time.sleep(0.3)  # Rate limiting
        try:
            cache_set(features_key, data)
        except CacheError:
            pass
        return data
    except Exception:
        return None


# ==============================================================================
# Rendering Helpers
# ==============================================================================


def get_edge_colors_by_type(g: MultiDiGraph, theme: Dict[str, str]) -> list:
    """
    Assigns colors to edges based on road type hierarchy.

    Args:
        g: Street network graph
        theme: Theme color dictionary

    Returns:
        List of colors corresponding to each edge in the graph
    """
    edge_colors = []

    for _u, _v, data in g.edges(data=True):
        highway = data.get("highway", "unclassified")

        if isinstance(highway, list):
            highway = highway[0] if highway else "unclassified"

        if highway in ["motorway", "motorway_link"]:
            color = theme["road_motorway"]
        elif highway in ["trunk", "trunk_link", "primary", "primary_link"]:
            color = theme["road_primary"]
        elif highway in ["secondary", "secondary_link"]:
            color = theme["road_secondary"]
        elif highway in ["tertiary", "tertiary_link"]:
            color = theme["road_tertiary"]
        elif highway in ["residential", "living_street", "unclassified"]:
            color = theme["road_residential"]
        else:
            color = theme["road_default"]

        edge_colors.append(color)

    return edge_colors


def get_edge_widths_by_type(g: MultiDiGraph) -> list:
    """
    Assigns line widths to edges based on road type.

    Args:
        g: Street network graph

    Returns:
        List of widths corresponding to each edge
    """
    edge_widths = []

    for _u, _v, data in g.edges(data=True):
        highway = data.get("highway", "unclassified")

        if isinstance(highway, list):
            highway = highway[0] if highway else "unclassified"

        if highway in ["motorway", "motorway_link"]:
            width = 1.2
        elif highway in ["trunk", "trunk_link", "primary", "primary_link"]:
            width = 1.0
        elif highway in ["secondary", "secondary_link"]:
            width = 0.8
        elif highway in ["tertiary", "tertiary_link"]:
            width = 0.6
        else:
            width = 0.4

        edge_widths.append(width)

    return edge_widths


def create_gradient_fade(
    ax: plt.Axes, color: str, location: str = "bottom", zorder: int = 10
) -> None:
    """
    Creates a fade effect at the top or bottom of the map.

    Args:
        ax: Matplotlib axes
        color: Gradient color (hex)
        location: 'top' or 'bottom'
        zorder: Z-order for rendering
    """
    vals = np.linspace(0, 1, 256).reshape(-1, 1)
    gradient = np.hstack((vals, vals))

    rgb = mcolors.to_rgb(color)
    my_colors = np.zeros((256, 4))
    my_colors[:, 0] = rgb[0]
    my_colors[:, 1] = rgb[1]
    my_colors[:, 2] = rgb[2]

    if location == "bottom":
        my_colors[:, 3] = np.linspace(1, 0, 256)
        extent_y_start = 0
        extent_y_end = 0.25
    else:
        my_colors[:, 3] = np.linspace(0, 1, 256)
        extent_y_start = 0.75
        extent_y_end = 1.0

    custom_cmap = mcolors.ListedColormap(my_colors)

    xlim = ax.get_xlim()
    ylim = ax.get_ylim()
    y_range = ylim[1] - ylim[0]

    y_bottom = ylim[0] + y_range * extent_y_start
    y_top = ylim[0] + y_range * extent_y_end

    ax.imshow(
        gradient,
        extent=[xlim[0], xlim[1], y_bottom, y_top],
        aspect="auto",
        cmap=custom_cmap,
        zorder=zorder,
        origin="lower",
    )


def get_crop_limits(
    g_proj: MultiDiGraph,
    center_lat_lon: Tuple[float, float],
    fig: plt.Figure,
    dist: int,
) -> Tuple[Tuple[float, float], Tuple[float, float]]:
    """
    Crop inward to preserve aspect ratio while guaranteeing
    full coverage of the requested radius.

    Args:
        g_proj: Projected graph
        center_lat_lon: Center point (lat, lon)
        fig: Matplotlib figure
        dist: Distance in meters

    Returns:
        Tuple of ((x_min, x_max), (y_min, y_max))
    """
    lat, lon = center_lat_lon

    center = ox.projection.project_geometry(
        Point(lon, lat), crs="EPSG:4326", to_crs=g_proj.graph["crs"]
    )[0]
    center_x, center_y = center.x, center.y

    fig_width, fig_height = fig.get_size_inches()
    aspect = fig_width / fig_height

    half_x = dist
    half_y = dist

    if aspect > 1:
        half_y = half_x / aspect
    else:
        half_x = half_y * aspect

    return (
        (center_x - half_x, center_x + half_x),
        (center_y - half_y, center_y + half_y),
    )


# ==============================================================================
# Main Poster Creation
# ==============================================================================


def create_poster(
    lat: float,
    lon: float,
    theme_id: str,
    distance: int,
    city: str = "City",
    country: str = "Country",
    width: int = 12,
    height: int = 16,
) -> str:
    """
    Generate a complete map poster with roads, water, parks, and typography.

    Args:
        lat: Latitude of map center
        lon: Longitude of map center
        theme_id: Theme identifier
        distance: Map radius in meters
        city: City name for display
        country: Country name for display
        width: Poster width in inches
        height: Poster height in inches

    Returns:
        Path to the generated poster file

    Raises:
        RuntimeError: If street network data cannot be retrieved
    """
    theme = load_theme(theme_id)
    point = (lat, lon)

    # Calculate compensated distance for viewport
    compensated_dist = distance * (max(height, width) / min(height, width)) / 4

    # Fetch data
    g = fetch_graph(point, int(compensated_dist))
    if g is None:
        raise RuntimeError("Failed to retrieve street network data.")

    water = fetch_features(
        point,
        int(compensated_dist),
        tags={"natural": ["water", "bay", "strait"], "waterway": "riverbank"},
        name="water",
    )

    parks = fetch_features(
        point,
        int(compensated_dist),
        tags={"leisure": "park", "landuse": "grass"},
        name="parks",
    )

    # Setup plot
    fig, ax = plt.subplots(figsize=(width, height), facecolor=theme["bg"])
    ax.set_facecolor(theme["bg"])
    ax.set_position((0.0, 0.0, 1.0, 1.0))

    g_proj = ox.project_graph(g)

    # Plot water
    if water is not None and not water.empty:
        water_polys = water[water.geometry.type.isin(["Polygon", "MultiPolygon"])]
        if not water_polys.empty:
            try:
                water_polys = ox.projection.project_gdf(water_polys)
            except Exception:
                water_polys = water_polys.to_crs(g_proj.graph["crs"])
            water_polys.plot(
                ax=ax, facecolor=theme["water"], edgecolor="none", zorder=0.5
            )

    # Plot parks
    if parks is not None and not parks.empty:
        parks_polys = parks[parks.geometry.type.isin(["Polygon", "MultiPolygon"])]
        if not parks_polys.empty:
            try:
                parks_polys = ox.projection.project_gdf(parks_polys)
            except Exception:
                parks_polys = parks_polys.to_crs(g_proj.graph["crs"])
            parks_polys.plot(
                ax=ax, facecolor=theme["parks"], edgecolor="none", zorder=0.8
            )

    # Plot roads
    edge_colors = get_edge_colors_by_type(g_proj, theme)
    edge_widths = get_edge_widths_by_type(g_proj)

    crop_xlim, crop_ylim = get_crop_limits(g_proj, point, fig, int(compensated_dist))

    ox.plot_graph(
        g_proj,
        ax=ax,
        bgcolor=theme["bg"],
        node_size=0,
        edge_color=edge_colors,
        edge_linewidth=edge_widths,
        show=False,
        close=False,
    )
    ax.set_aspect("equal", adjustable="box")
    ax.set_xlim(crop_xlim)
    ax.set_ylim(crop_ylim)

    # Gradient fades
    create_gradient_fade(ax, theme["gradient_color"], location="bottom", zorder=10)
    create_gradient_fade(ax, theme["gradient_color"], location="top", zorder=10)

    # Typography
    scale_factor = min(height, width) / 12.0
    base_main = 60
    base_sub = 22
    base_coords = 14
    base_attr = 8

    if FONTS:
        font_sub = FontProperties(fname=FONTS["light"], size=base_sub * scale_factor)
        font_coords = FontProperties(
            fname=FONTS["regular"], size=base_coords * scale_factor
        )
        font_attr = FontProperties(fname=FONTS["light"], size=base_attr * scale_factor)
    else:
        font_sub = FontProperties(
            family="monospace", weight="normal", size=base_sub * scale_factor
        )
        font_coords = FontProperties(
            family="monospace", size=base_coords * scale_factor
        )
        font_attr = FontProperties(family="monospace", size=base_attr * scale_factor)

    # Format city name
    if is_latin_script(city):
        spaced_city = "  ".join(list(city.upper()))
    else:
        spaced_city = city

    # Adjust font size for long names
    base_adjusted_main = base_main * scale_factor
    city_char_count = len(city)

    if city_char_count > 10:
        length_factor = 10 / city_char_count
        adjusted_font_size = max(base_adjusted_main * length_factor, 10 * scale_factor)
    else:
        adjusted_font_size = base_adjusted_main

    if FONTS:
        font_main = FontProperties(fname=FONTS["bold"], size=adjusted_font_size)
    else:
        font_main = FontProperties(
            family="monospace", weight="bold", size=adjusted_font_size
        )

    # City name
    ax.text(
        0.5,
        0.14,
        spaced_city,
        transform=ax.transAxes,
        color=theme["text"],
        ha="center",
        fontproperties=font_main,
        zorder=11,
    )

    # Country name
    ax.text(
        0.5,
        0.10,
        country.upper(),
        transform=ax.transAxes,
        color=theme["text"],
        ha="center",
        fontproperties=font_sub,
        zorder=11,
    )

    # Coordinates
    coords_text = (
        f"{lat:.4f}\u00b0 N / {lon:.4f}\u00b0 E"
        if lat >= 0
        else f"{abs(lat):.4f}\u00b0 S / {lon:.4f}\u00b0 E"
    )
    if lon < 0:
        coords_text = coords_text.replace("E", "W")

    ax.text(
        0.5,
        0.07,
        coords_text,
        transform=ax.transAxes,
        color=theme["text"],
        alpha=0.7,
        ha="center",
        fontproperties=font_coords,
        zorder=11,
    )

    # Decorative line
    ax.plot(
        [0.4, 0.6],
        [0.125, 0.125],
        transform=ax.transAxes,
        color=theme["text"],
        linewidth=1 * scale_factor,
        zorder=11,
    )

    # Attribution
    ax.text(
        0.98,
        0.02,
        "\u00a9 OpenStreetMap contributors",
        transform=ax.transAxes,
        color=theme["text"],
        alpha=0.5,
        ha="right",
        va="bottom",
        fontproperties=font_attr,
        zorder=11,
    )

    # Save
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    city_slug = city.lower().replace(" ", "_")
    filename = f"{city_slug}_{theme_id}_{timestamp}.png"
    output_path = str(POSTERS_DIR / filename)

    plt.savefig(
        output_path,
        format="png",
        facecolor=theme["bg"],
        bbox_inches="tight",
        pad_inches=0.05,
        dpi=OUTPUT_DPI,
    )
    plt.close()

    return output_path
