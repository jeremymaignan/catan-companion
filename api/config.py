import os

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://mongo:27017")
MONGO_DB = os.environ.get("MONGO_DB", "catan")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

TILE_IMAGES_PATH = "/tmp/tiles"

SETTLEMENTS_POSITIONS = list("abcdefghijklmnopqrstuvwxyz1ABCDEFGHIJKLMNOPQRSTUVWXYZ2")

RESOURCES_MAP = {
    "wo": {"text": "Wood", "color": "#2d6a2d", "board_color": "#4a9e4a"},
    "b": {"text": "Brick", "color": "#c62828", "board_color": "#d4a373"},
    "o": {"text": "Ore", "color": "#616161", "board_color": "#c5c5c5"},
    "s": {"text": "Sheep", "color": "#7cb342", "board_color": "#c5e1a5"},
    "w": {"text": "Wheat", "color": "#f9a825", "board_color": "#ffe082"},
    "r": {"text": "Desert", "color": "#d7ccc8", "board_color": "#efebe9"},
}

DICE_PROBABILITY = {
    0: {"proba": 0.0, "rate": 0, "color": None},
    2: {"proba": 0.028, "rate": 1, "color": "red"},
    3: {"proba": 0.056, "rate": 2, "color": "red"},
    4: {"proba": 0.083, "rate": 3, "color": "yellow"},
    5: {"proba": 0.111, "rate": 4, "color": "yellow"},
    6: {"proba": 0.139, "rate": 5, "color": "green"},
    7: {"proba": 0.167, "rate": 6, "color": "green"},
    8: {"proba": 0.139, "rate": 5, "color": "green"},
    9: {"proba": 0.111, "rate": 4, "color": "yellow"},
    10: {"proba": 0.083, "rate": 3, "color": "yellow"},
    11: {"proba": 0.056, "rate": 2, "color": "red"},
    12: {"proba": 0.028, "rate": 1, "color": "red"},
}

# Maps settlement positions to the tile indices they touch (1-indexed)
INDEXES = {
    "a": [1],
    "b": [1],
    "c": [1, 2],
    "d": [2],
    "e": [2, 3],
    "f": [3],
    "g": [3],
    "h": [4],
    "i": [1, 4],
    "j": [1, 4, 5],
    "k": [1, 2, 5],
    "l": [2, 5, 6],
    "m": [2, 3, 6],
    "n": [3, 6, 7],
    "o": [3, 7],
    "p": [7],
    "q": [8],
    "r": [4, 8],
    "s": [4, 8, 9],
    "t": [4, 5, 9],
    "u": [5, 9, 10],
    "v": [5, 6, 10],
    "w": [6, 10, 11],
    "x": [6, 7, 11],
    "y": [7, 11, 12],
    "z": [7, 12],
    "1": [12],
    "A": [8],
    "B": [8, 13],
    "C": [8, 9, 13],
    "D": [9, 13, 14],
    "E": [9, 10, 14],
    "F": [10, 14, 15],
    "G": [10, 11, 15],
    "H": [11, 15, 16],
    "I": [11, 12, 16],
    "J": [12, 16],
    "K": [12],
    "L": [13],
    "M": [13, 17],
    "N": [13, 14, 17],
    "O": [14, 17, 18],
    "P": [14, 15, 18],
    "Q": [15, 18, 19],
    "R": [15, 16, 19],
    "S": [16, 19],
    "T": [16],
    "U": [17],
    "V": [17],
    "W": [17, 18],
    "X": [18],
    "Y": [18, 19],
    "Z": [19],
    "2": [19],
}

ADJACENT_SETTLEMENT_POSITIONS = {
    "a": "bi",
    "b": "ac",
    "c": "bdk",
    "d": "ce",
    "e": "dfm",
    "f": "eg",
    "g": "fo",
    "h": "ir",
    "i": "ahj",
    "j": "ikt",
    "k": "cjl",
    "l": "kmv",
    "m": "eln",
    "n": "mox",
    "o": "gnp",
    "p": "oz",
    "q": "Ar",
    "r": "hqs",
    "s": "Crt",
    "t": "jsu",
    "u": "Etv",
    "v": "luw",
    "w": "Gvx",
    "x": "nwy",
    "y": "Ixz",
    "z": "1py",
    "1": "Kz",
    "A": "Bq",
    "B": "ACL",
    "C": "BDs",
    "D": "CEN",
    "E": "DFu",
    "F": "EGP",
    "G": "FHw",
    "H": "GIR",
    "I": "HJy",
    "J": "IKT",
    "K": "1J",
    "L": "BM",
    "M": "LNU",
    "N": "DMO",
    "O": "NPW",
    "P": "FOQ",
    "Q": "PRY",
    "R": "HQS",
    "S": "2RT",
    "T": "JS",
    "U": "MV",
    "V": "UW",
    "W": "OVX",
    "X": "WY",
    "Y": "QXZ",
    "Z": "2Y",
    "2": "SZ",
}

# Port types
PORT_TYPES = {
    "3:1": {"text": "3:1", "color": "#fff"},
    "wo_port": {"text": "Wood 2:1", "resource": "wo", "color": "#1b5e20"},
    "b_port": {"text": "Brick 2:1", "resource": "b", "color": "#a0522d"},
    "o_port": {"text": "Ore 2:1", "resource": "o", "color": "#9e9e9e"},
    "s_port": {"text": "Sheep 2:1", "resource": "s", "color": "#aed581"},
    "w_port": {"text": "Wheat 2:1", "resource": "w", "color": "#fdd835"},
    "none": {"text": "None", "color": None},
}

# 9 port edges on the board perimeter.
# Each port connects two adjacent coastal settlement positions.
# Order: clockwise from top-left, evenly spaced around perimeter.
# Perimeter has 30 edges; ports at roughly every 3-4 edges.
PORT_EDGES = [
    ("a", "b"),  # top-left (top of tile 1)
    ("d", "e"),  # top (top of tile 2)
    ("o", "p"),  # top-right (between tile 3 and tile 7)
    ("1", "K"),  # right (right of tile 12)
    ("S", "T"),  # bottom-right (bottom of tile 16)
    ("X", "Y"),  # bottom (bottom of tile 18)
    ("U", "V"),  # bottom-left (bottom of tile 17)
    ("B", "L"),  # left (between tile 8/13)
    ("h", "r"),  # left (between tile 4 and tile 8)
]

# Default port layout (standard Catan)
DEFAULT_PORTS = [
    "3:1",
    "wo_port",
    "3:1",
    "o_port",
    "3:1",
    "s_port",
    "3:1",
    "b_port",
    "w_port",
]

# Color mapping from OpenAI vision output to resource codes
COLOR_TO_RESOURCE = {
    "dark green": "wo",
    "brown": "b",
    "grey": "o",
    "light green": "s",
    "yellow": "w",
    "beige": "r",
}
