import numpy as np
import pytest

from app.poster_service import _bbox_from_point


class TestBboxFromPoint:
    def test_returns_python_floats_not_numpy(self):
        point = (50.0755, 14.4378)
        dist = 1000

        west, south, east, north = _bbox_from_point(point, dist)

        assert isinstance(west, float), f"west should be float, got {type(west)}"
        assert isinstance(south, float), f"south should be float, got {type(south)}"
        assert isinstance(east, float), f"east should be float, got {type(east)}"
        assert isinstance(north, float), f"north should be float, got {type(north)}"

        assert not isinstance(west, np.floating), "west should not be numpy float"
        assert not isinstance(south, np.floating), "south should not be numpy float"
        assert not isinstance(east, np.floating), "east should not be numpy float"
        assert not isinstance(north, np.floating), "north should not be numpy float"

    def test_bbox_order_west_south_east_north(self):
        point = (50.0755, 14.4378)
        dist = 1000

        west, south, east, north = _bbox_from_point(point, dist)

        assert west < east, "west should be less than east"
        assert south < north, "south should be less than north"

    def test_bbox_contains_center_point(self):
        lat, lon = 50.0755, 14.4378
        point = (lat, lon)
        dist = 1000

        west, south, east, north = _bbox_from_point(point, dist)

        assert west < lon < east, "longitude should be within west-east bounds"
        assert south < lat < north, "latitude should be within south-north bounds"

    def test_larger_distance_produces_larger_bbox(self):
        point = (50.0755, 14.4378)

        w1, s1, e1, n1 = _bbox_from_point(point, 500)
        w2, s2, e2, n2 = _bbox_from_point(point, 2000)

        assert (e2 - w2) > (e1 - w1), "larger dist should produce wider bbox"
        assert (n2 - s2) > (n1 - s1), "larger dist should produce taller bbox"
