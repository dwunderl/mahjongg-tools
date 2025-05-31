from enum import Enum, auto
from dataclasses import dataclass
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, field_validator

class Suit(str, Enum):
    """Mahjong suits."""
    BAMBOO = 'B'
    CHARACTER = 'C'
    DOT = 'D'

class WindDirection(str, Enum):
    """Wind directions."""
    NORTH = 'N'
    EAST = 'E'
    SOUTH = 'S'
    WEST = 'W'

class DragonType(str, Enum):
    """Dragon types with their associated suits."""
    RED = 'RD'      # Associated with Character (C) suit
    GREEN = 'GD'    # Associated with Bamboo (B) suit
    WHITE = 'WD'    # Associated with Dot (D) suit
    
    @property
    def suit(self):
        """Get the suit associated with this dragon type."""
        return {
            DragonType.RED: Suit.CHARACTER,
            DragonType.GREEN: Suit.BAMBOO,
            DragonType.WHITE: Suit.DOT
        }[self]

class TileType(str, Enum):
    """Types of tiles."""
    NUMBERED = 'numbered'
    WIND = 'wind'
    DRAGON = 'dragon'
    FLOWER = 'flower'
    JOKER = 'joker'

class Tile(BaseModel):
    """Base class for all Mahjongg tiles."""
    type: TileType
    short_name: str
    full_name: str
    
    def __eq__(self, other):
        if not isinstance(other, Tile):
            return False
        return self.short_name == other.short_name
    
    def __hash__(self):
        return hash(self.short_name)

class NumberedTile(Tile):
    """Numbered tile (1-9) in a suit."""
    number: int
    suit: Suit
    
    def __init__(self, number: int, suit: Union[Suit, str]):
        if isinstance(suit, str):
            suit = Suit(suit.upper())
            
        if not (1 <= number <= 9):
            raise ValueError("Number must be between 1 and 9")
            
        short_name = f"{number}{suit.value}"
        full_name = f"{number} {suit.name.lower().capitalize()}"
        
        super().__init__(
            type=TileType.NUMBERED,
            short_name=short_name,
            full_name=full_name,
            number=number,
            suit=suit
        )

class WindTile(Tile):
    """Wind direction tile."""
    direction: WindDirection
    
    def __init__(self, direction: Union[WindDirection, str]):
        if isinstance(direction, str):
            direction = WindDirection(direction.upper())
            
        super().__init__(
            type=TileType.WIND,
            short_name=direction.value,
            full_name=f"{direction.name.title()} Wind",
            direction=direction
        )

class DragonTile(Tile):
    """Dragon tile with an associated suit."""
    dragon_type: DragonType
    suit: Suit
    
    def __init__(self, dragon_type: Union[DragonType, str], suit: Optional[Union[Suit, str]] = None):
        if isinstance(dragon_type, str):
            dragon_type = DragonType(dragon_type.upper())
            
        # If suit is provided as string, convert to Suit enum
        if isinstance(suit, str):
            suit = Suit(suit.upper())
        
        # If no suit provided, use the default suit for this dragon type
        if suit is None:
            suit = dragon_type.suit
            
        name_map = {
            DragonType.RED: 'Red Dragon',
            DragonType.GREEN: 'Green Dragon',
            DragonType.WHITE: 'White Dragon'
        }
        
        # Update short name to include suit if it's not the default
        short_name = dragon_type.value
        if suit != dragon_type.suit:
            short_name = f"{short_name[0]}{suit.value}"
        
        super().__init__(
            type=TileType.DRAGON,
            short_name=short_name,
            full_name=f"{name_map[dragon_type]} ({suit.name.title()})",
            dragon_type=dragon_type,
            suit=suit
        )

class FlowerTile(Tile):
    """Flower tile."""
    def __init__(self):
        super().__init__(
            type=TileType.FLOWER,
            short_name='FL',
            full_name='Flower'
        )

class JokerTile(Tile):
    """Joker tile."""
    def __init__(self):
        super().__init__(
            type=TileType.JOKER,
            short_name='JK',
            full_name='Joker'
        )

def create_tile_from_short_name(short_name: str) -> Tile:
    """Create a tile from its short name."""
    # Handle numbered tiles (e.g., '1B', '5D', '9C')
    if len(short_name) == 2 and short_name[0].isdigit() and short_name[1] in [s.value for s in Suit]:
        number = int(short_name[0])
        suit = Suit(short_name[1])
        return NumberedTile(number=number, suit=suit)
    
    # Handle wind tiles (N, E, S, W)
    try:
        wind = WindDirection(short_name.upper())
        return WindTile(wind)
    except ValueError:
        pass
    
    # Handle dragon tiles (RD, GD, WD or with suit like 'RB' for Red in Bamboo)
    if len(short_name) == 2 and short_name.upper() in [dt.value for dt in DragonType]:
        dragon_type = DragonType(short_name.upper())
        return DragonTile(dragon_type)
    elif len(short_name) == 3 and short_name[:2].upper() in [dt.value for dt in DragonType] and short_name[2] in [s.value for s in Suit]:
        dragon_type = DragonType(short_name[:2].upper())
        suit = Suit(short_name[2])
        return DragonTile(dragon_type, suit)
    
    # Handle flower and joker
    if short_name.upper() == 'FL':
        return FlowerTile()
    elif short_name.upper() == 'JK':
        return JokerTile()
    
    raise ValueError(f"Unknown tile short name: {short_name}")
