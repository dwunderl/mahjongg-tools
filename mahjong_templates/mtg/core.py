from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

class TileType(Enum):
    SINGLE = "single"
    PAIR = "pair"
    PUNG = "pung"
    KONG = "kong"
    QUINT = "quint"
    CHOW = "chow"

@dataclass
class TileInHand:
    number: int
    suit: str
    group_type: str  # 'pair', 'pung', 'kong', 'single', etc.
    group_id: int    # To identify which group this tile belongs to
    position_in_group: int  # Position within the group (0-based)
    is_joker: bool = False
    
    def __str__(self):
        # Map group types to their sizes
        group_sizes = {
            'single': 1,
            'pair': 2,
            'pung': 3,
            'kong': 4,
            'quint': 5,
            'chow': 1  # Chows are treated as singles for joker matching
        }
        size = group_sizes.get(self.group_type, 1)  # default to 1 if type not found
        
        # Handle special tiles
        if self.suit == 'f':  # Flower (suit is 'f' for flower)
            return f"F,{size}"
        elif self.suit.startswith('dragon_'):  # Dragon (suit is 'dragon_b', 'dragon_c', etc.)
            dragon_suit = self.suit.split('_')[1]  # Get the suit after 'dragon_'
            return f"D{dragon_suit[0]},{size}"  # e.g., Db, Dc, Ds
        else:
            # Regular tile (bamboo, characters, dots)
            return f"{self.number}{self.suit},{size}"

@dataclass
class TileGroup:
    tiles: List[TileInHand]
    group_type: str
    description: str = ""
    
    def to_dict(self):
        return {
            "tiles": [str(tile) for tile in self.tiles],
            "group_type": self.group_type,
            "description": self.description
        }

class HandTemplate:
    def __init__(self, id: str, name: str, description: str, category: str, catid: str, image: str):
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.catid = catid
        self.image = image
        self.variations = []
    
    def add_variation(self, groups: List[Any]):
        """Convert GroupBuilder objects to TileGroups and create a 14-tile hand"""
        variation = []
        group_id = 0
        
        # First create all tile groups
        tile_groups = []
        for group_builder in groups:
            if hasattr(group_builder, 'build'):  # It's a GroupBuilder
                group = group_builder.build(group_id)
                tile_groups.append(group)
                group_id += 1
            else:  # It's already a TileGroup
                tile_groups.append(group_builder)
        
        # Flatten into a 14-tile hand
        hand = []
        for group in tile_groups:
            for tile in group.tiles:
                hand.append(tile)
        
        if len(hand) != 14:
            raise ValueError(f"Variation must have exactly 14 tiles, got {len(hand)}")
        
        self.variations.append(hand)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "catid": self.catid,
            "image": self.image,
            "variations": [
                [str(tile) for tile in variation]
                for variation in self.variations
            ]
        }

class GroupBuilder:
    def __init__(self, *args, **kwargs):
        self.tiles = []
        self.group_type = kwargs.get('group_type', 'single')
        self.description = kwargs.get('description', '')
        
        # Handle different initialization patterns
        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            # Single argument that's a list/tuple of (number, suit) pairs
            for num, suit in args[0]:
                self.tiles.append(TileInHand(num, suit, self.group_type, 0, len(self.tiles)))
        else:
            # Multiple arguments, each a (number, suit) pair
            for i in range(0, len(args), 2):
                if i + 1 < len(args):
                    num, suit = args[i], args[i+1]
                    self.tiles.append(TileInHand(num, suit, self.group_type, 0, len(self.tiles)))
    
    def build(self, group_id: int) -> TileGroup:
        """Convert to a TileGroup with proper group_id and positions"""
        tiles = []
        for i, tile in enumerate(self.tiles):
            tiles.append(TileInHand(
                number=tile.number,
                suit=tile.suit,
                group_type=self.group_type,
                group_id=group_id,
                position_in_group=i,
                is_joker=tile.is_joker
            ))
        return TileGroup(tiles, self.group_type, self.description)

# Helper functions
def single(number: int, suit: str, description: str = "") -> GroupBuilder:
    """Create a single tile"""
    gb = GroupBuilder(number, suit)
    gb.group_type = 'single'  # This will be converted to 's' in __str__
    gb.description = description or f"Single {number}{suit}"
    return gb

def pair(number: int, suit: str, description: str = "") -> GroupBuilder:
    """Create a pair of tiles"""
    gb = GroupBuilder(number, suit, number, suit)
    gb.group_type = 'pair'  # This will be converted to 'p' in __str__
    gb.description = description or f"Pair of {number}{suit}"
    return gb

def kong(number: int, suit: str, description: str = "") -> GroupBuilder:
    """Create a kong (4 identical tiles)"""
    gb = GroupBuilder(number, suit, number, suit, number, suit, number, suit)
    gb.group_type = 'kong'  # This will be converted to 'k' in __str__
    gb.description = description or f"Kong of {number}{suit}"
    return gb


def pung(number: int, suit: str, description: str = "") -> GroupBuilder:
    """Create a pung (3 identical tiles)"""
    gb = GroupBuilder(number, suit, number, suit, number, suit)
    gb.group_type = 'pung'  # This will be converted to 'p' in __str__
    gb.description = description or f"Pung of {number}{suit}"
    return gb
