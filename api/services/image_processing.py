import os
from pathlib import Path

import cv2
import numpy as np

from api.config import TILE_IMAGES_PATH

TILE_SCALE_FACTOR = 2.5
TILE_HEIGHT_DIVISOR = 4.5
HEX_ANGLES = np.deg2rad(np.arange(30, 390, 60))


def crop_hexagon(image, center, tile_size):
    """Crop a hexagonal region from the image."""
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    cx, cy = center
    radius = tile_size / TILE_SCALE_FACTOR

    points = np.column_stack(
        [cx + radius * np.cos(HEX_ANGLES), cy + radius * np.sin(HEX_ANGLES)]
    ).astype(np.int32)

    cv2.fillConvexPoly(mask, points, 255)
    hexagon = cv2.bitwise_and(image, image, mask=mask)

    x, y, w, h = cv2.boundingRect(points)
    return hexagon[y : y + h, x : x + w]


def crop_image(file_bytes):
    """
    Crop hexagonal tiles from image bytes.
    Returns list of file paths to cropped tiles.
    """
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode the uploaded image.")

    height, width = image.shape[:2]
    tile_height = height / TILE_HEIGHT_DIVISOR

    tile_centers = [
        (width * x, tile_height * y)
        for x, y in [
            (0.3, 0.55),
            (0.5, 0.55),
            (0.7, 0.55),
            (0.2, 1.4),
            (0.4, 1.4),
            (0.6, 1.4),
            (0.8, 1.4),
            (0.1, 2.25),
            (0.3, 2.25),
            (0.5, 2.25),
            (0.7, 2.25),
            (0.9, 2.25),
            (0.2, 3.1),
            (0.4, 3.1),
            (0.6, 3.1),
            (0.8, 3.1),
            (0.3, 3.9),
            (0.5, 3.9),
            (0.7, 3.9),
        ]
    ]

    tiles_dir = Path(TILE_IMAGES_PATH)
    tiles_dir.mkdir(parents=True, exist_ok=True)

    tile_paths = []
    for i, center in enumerate(tile_centers):
        hex_img = crop_hexagon(image, center, tile_height * 0.9)
        output_path = tiles_dir / f"tile_{i + 1}.png"
        cv2.imwrite(str(output_path), hex_img)
        tile_paths.append(str(output_path))

    return tile_paths
