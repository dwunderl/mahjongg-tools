from enum import Enum, auto
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, field_validator, ConfigDict
from .tiles import Tile, TileType, NumberedTile

class TileSetType(str, Enum):
    """Types of tile sets in Mahjongg."""
    SINGLE = 'single'
    PAIR = 'pair'
    PUNG = 'pung'
    KONG = 'kong'
    CHOW = 'chow'
    SEQUENCE = 'sequence'
    EYES = 'eyes'  # Special pair for some winning hands

class TileSet(BaseModel):
    """Represents a set of tiles (e.g., pair, pung, kong, chow)."""
    tiles: List[Tile]
    set_type: TileSetType
    
    # Allow arbitrary types for the Tile subclasses
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    @field_validator('tiles')
    @classmethod
    def validate_tiles(cls, v: List[Tile]) -> List[Tile]:
        if not v:
            raise ValueError("Tile set cannot be empty")
        return v
    
    @property
    def short_name(self) -> str:
        """Return a short string representation of the tile set."""
        if not self.tiles:
            return "[]"
            
        if self.set_type in [TileSetType.CHOW, TileSetType.SEQUENCE]:
            # For sequences, show the sequence (e.g., "1B 2B 3B")
            key_fn = lambda x: x.number if hasattr(x, 'number') else x.short_name
            return ' '.join(t.short_name for t in sorted(self.tiles, key=key_fn))
        else:
            # For other sets, show count and first tile (e.g., "3x1B" for a pung of 1 Bamboo)
            count = len(self.tiles)
            return f"{count}x{self.tiles[0].short_name}"
    
    def __str__(self):
        return f"{self.set_type.value.upper()}: {self.short_name}"

def create_single(tile: Tile) -> TileSet:
    """Create a single tile."""
    return TileSet(tiles=[tile], set_type=TileSetType.SINGLE)

def create_pair(tile: Tile) -> TileSet:
    """Create a pair (two identical tiles)."""
    return TileSet(tiles=[tile] * 2, set_type=TileSetType.PAIR)

def create_pung(tile: Tile) -> TileSet:
    """Create a pung (three identical tiles)."""
    return TileSet(tiles=[tile] * 3, set_type=TileSetType.PUNG)

def create_kong(tile: Tile) -> TileSet:
    """Create a kong (four identical tiles)."""
    return TileSet(tiles=[tile] * 4, set_type=TileSetType.KONG)

def create_chow(tile1: NumberedTile, tile2: NumberedTile, tile3: NumberedTile) -> TileSet:
    """Create a chow (sequence of three consecutive numbers in the same suit)."""
    # Validate the chow
    tiles = sorted([tile1, tile2, tile3], key=lambda x: x.number)
    if not all(isinstance(t, NumberedTile) for t in tiles):
        raise ValueError("All tiles in a chow must be numbered tiles")
    if len({t.suit for t in tiles}) != 1:
        raise ValueError("All tiles in a chow must be of the same suit")
    if not (tiles[0].number + 1 == tiles[1].number and tiles[1].number + 1 == tiles[2].number):
        raise ValueError("Tiles in a chow must form a sequence")
    
    return TileSet(tiles=tiles, set_type=TileSetType.CHOW)

def create_sequence(start_tile: NumberedTile, length: int) -> TileSet:
    """
    Create a sequence of numbered tiles in the same suit.
    
    Args:
        start_tile: The first tile in the sequence
        length: Number of tiles in the sequence (must be at least 2)
        
    Returns:
        A TileSet of type SEQUENCE containing the consecutive numbered tiles
    """
    if length < 2:
        raise ValueError("Sequence length must be at least 2")
    if not isinstance(start_tile, NumberedTile):
        raise ValueError("Can only create sequences with numbered tiles")
        
    if start_tile.number + length - 1 > 9:
        raise ValueError(f"Sequence of length {length} starting at {start_tile.number} would exceed tile numbers")
    
    tiles = [
        NumberedTile(number=start_tile.number + i, suit=start_tile.suit)
        for i in range(length)
    ]
    
    return TileSet(
        tiles=tiles,
        set_type=TileSetType.SEQUENCE if length > 3 else TileSetType.CHOW
    )
