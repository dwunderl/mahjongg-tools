from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel, Field
from .tiles import Tile
from .tilesets import TileSet, TileSetType

class HandTemplate(BaseModel):
    """Represents a template for a Mahjongg hand that can generate variations."""
    template_id: str = Field(..., description="Unique identifier for the template")
    name: str = Field(..., description="Name of the hand template")
    description: str = Field(..., description="Description of the hand")
    category: str = Field(..., description="Category of the hand (e.g., 'Common', 'Special')")
    point_value: int = Field(1, description="Base point value for this hand")
    number: Optional[int] = Field(None, description="Number of the hand within its category")
    
    # Allow arbitrary types for the Tile and TileSet classes
    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {
            Tile: lambda t: t.short_name,
            TileSet: lambda ts: str(ts)
        }
    }
    
    def generate_variations(self) -> List[List[TileSet]]:
        """
        Generate all possible variations of this hand template.
        Each variation is a list of TileSets that form a complete hand.
        """
        raise NotImplementedError("Subclasses must implement generate_variations")
    
    def validate_hand(self, tiles: List[Tile]) -> bool:
        """
        Check if the given list of tiles matches this hand template.
        """
        raise NotImplementedError("Subclasses must implement validate_hand")
    
    def __str__(self):
        return f"{self.name} ({self.template_id}): {self.description}"

class SequenceAndKongsTemplate(HandTemplate):
    """
    Sequence of 5 and Opposite Kongs of first number
    
    For numbers 1-7 and each suit, creates:
    - A pair of the starting number
    - A sequence of 5 consecutive numbers
    - Two kongs of the starting number in the other two suits
    """
    def __init__(self):
        super().__init__(
            template_id="sequence_and_kongs",
            name="Sequence of 5 and Opposite Kongs",
            description="Pair + sequence of 5 + kongs in other suits",
            category="Consecutive",
            point_value=25,
            number=7  # Hand number in the category
        )
    
    def generate_variations(self) -> List[List[TileSet]]:
        from .tiles import Suit, NumberedTile
        from .tilesets import create_pair, create_single, create_kong
        from itertools import combinations, permutations
        
        variations = []
        all_suits = list(Suit)
        
        # For each possible starting number (1-5 to allow sequence of 5)
        for n in range(1, 6):
            # Get all combinations of 2 suits
            for suit1, suit2 in combinations(all_suits, 2):
                # The third suit is the one not in the pair
                third_suit = next(s for s in all_suits if s not in (suit1, suit2))
                
                # The three suits in order: [third_suit, suit1, suit2]
                suits_in_order = [third_suit, suit1, suit2]
                
                # Use the suits in order: third_suit for pair/sequence, suit1 and suit2 for kongs
                pair_suit, kong1_suit, kong2_suit = suits_in_order
                
                # Create the starting tile in pair_suit (third_suit)
                start_tile = NumberedTile(number=n, suit=pair_suit)
                
                # Create the pair of starting number in pair_suit
                pair = create_pair(start_tile)
                
                # Create the sequence of 5 tiles in pair_suit
                sequence_tiles = [
                    NumberedTile(number=n+i, suit=pair_suit) for i in range(1, 5)
                ]
                sequence = [create_single(tile) for tile in sequence_tiles]
                
                # Create the kongs in the other two suits (kong1_suit and kong2_suit)
                kong1 = create_kong(NumberedTile(number=n, suit=kong1_suit))
                kong2 = create_kong(NumberedTile(number=n, suit=kong2_suit))
                
                # Combine all tile sets for this variation
                variation = [pair] + sequence + [kong1, kong2]
                variations.append(variation)
        
        return variations
    
    def validate_hand(self, tiles: List[Tile]) -> bool:
        # This is a simplified validation - in a real implementation,
        # you'd want to check if the hand matches any of the generated variations
        if len(tiles) != 14:  # 1 pair (2) + 5 singles + 2 kongs (8) = 14
            return False
            
        # Count tile occurrences
        from collections import defaultdict
        tile_counts = defaultdict(int)
        for tile in tiles:
            if hasattr(tile, 'short_name'):
                tile_counts[tile.short_name] += 1
        
        # Check for exactly 2 tiles of one number/suit (the pair)
        # and 4 tiles each of the same number in the other two suits (the kongs)
        pair_found = False
        kong_count = 0
        
        for count in tile_counts.values():
            if count == 2:
                pair_found = True
            elif count == 4:
                kong_count += 1
        
        return pair_found and kong_count == 2 and len(tile_counts) == 9  # 1 pair (2) + 5 singles + 2 kongs (2 numbers)


class Symmetrical13579AllSuitsTemplate(HandTemplate):
    """
    13579 Symmetrical - All 3 suits
    
    Pattern:
    - Pair of 1s in suit1
    - Pung of 3s in suit1
    - Kong of 5s in suit2
    - Pung of 7s in suit3
    - Pair of 9s in suit3
    
    All combinations of the three suits are generated.
    """
    def __init__(self):
        super().__init__(
            template_id="symmetrical_13579_all_suits",
            name="13579 Symmetrical - All 3 Suits",
            description="Pair of 1s and pung of 3s in one suit, kong of 5s in another, "
                       "pung of 7s and pair of 9s in the third suit",
            category="13579",
            point_value=25,
            number=2  # Second hand in 13579 category
        )
    
    def generate_variations(self) -> List[List[TileSet]]:
        from .tiles import Suit, NumberedTile
        from .tilesets import create_pair, create_pung, create_kong
        
        variations = []
        suits = list(Suit)
        
        # Generate all permutations of the three suits
        from itertools import permutations
        
        for suit1, suit2, suit3 in permutations(suits):
            # Create the tile sets in the specified order
            pair_1 = create_pair(NumberedTile(number=1, suit=suit1))
            pung_3 = create_pung(NumberedTile(number=3, suit=suit1))
            kong_5 = create_kong(NumberedTile(number=5, suit=suit2))
            pung_7 = create_pung(NumberedTile(number=7, suit=suit3))
            pair_9 = create_pair(NumberedTile(number=9, suit=suit3))
            
            # Combine all tile sets for this variation
            variation = [pair_1, pung_3, kong_5, pung_7, pair_9]
            variations.append(variation)
        
        return variations
    
    def validate_hand(self, tiles: List[Tile]) -> bool:
        if len(tiles) != 14:  # 2 + 3 + 4 + 3 + 2 = 14
            return False
            
        # Count occurrences of each tile
        from collections import defaultdict
        tile_counts = defaultdict(int)
        for tile in tiles:
            if hasattr(tile, 'short_name'):
                tile_counts[tile.short_name] += 1
        
        # Check we have exactly:
        # - 2 tiles of one number/suit (pair of 1s)
        # - 3 tiles of another number/suit (pung of 3s)
        # - 4 tiles of another number (kong of 5s)
        # - 3 tiles of another number/suit (pung of 7s)
        # - 2 tiles of another number/suit (pair of 9s)
        count_distribution = defaultdict(int)
        for count in tile_counts.values():
            count_distribution[count] += 1
        
        return (
            count_distribution[2] == 2 and  # Two pairs (1s and 9s)
            count_distribution[3] == 2 and  # Two pungs (3s and 7s)
            count_distribution[4] == 1 and  # One kong (5s)
            len(tile_counts) == 5  # Five distinct tile types
        )

class KongKongPairWithFlowersAndDragonsTemplate(HandTemplate):
    """
    Kong Kong Pair with some flowers and single dragons
    
    Pattern:
    - Pair of Flowers
    - Kong of number in suit1
    - Single Dragon in suit1
    - Kong of same number in suit2
    - Single Dragon in suit2
    - Pair of same number in suit3
    """
    def __init__(self):
        super().__init__(
            template_id="kong_kong_pair_flowers_dragons",
            name="Kong Kong Pair with some flowers and single dragons",
            description="Pair of Flowers, two kongs of the same number in different suits "
                      "with single dragons, and a pair of the same number in a third suit",
            category="Any Like Numbers",
            point_value=25,
            number=1
        )
    
    def generate_variations(self) -> List[List[TileSet]]:
        from .tiles import Suit, NumberedTile, DragonTile, DragonType, FlowerTile
        from .tilesets import create_pair, create_kong, create_single
        from itertools import combinations, permutations
        
        variations = []
        
        # Dragon types to use
        dragon_types = [DragonType.RED, DragonType.GREEN, DragonType.WHITE]
        
        # Get all suits as a list
        all_suits = list(Suit)
        
        # For each number 1-9
        for number in range(1, 10):
            # Get all combinations of 2 suits
            for suit_pair in combinations(all_suits, 2):
                # The third suit is the one not in the pair
                third_suit = next(s for s in all_suits if s not in suit_pair)
                
                # Now create all orderings of the three suits (suit1, suit2, third_suit)
                for suit1, suit2 in permutations(suit_pair, 2):
                    suit3 = third_suit
                    
                    # Determine which dragons to use based on the suits
                    dragon1 = next((dt for dt in dragon_types if dt.suit == suit1), None)
                    dragon2 = next((dt for dt in dragon_types if dt.suit == suit2), None)
                    
                    # If we couldn't find matching dragons for both suits, skip this combination
                    if not dragon1 or not dragon2 or dragon1 == dragon2:
                        continue
                
                # Create the tile sets for this variation
                flower_pair = create_pair(FlowerTile())
                
                # Kong of number in suit1 with matching dragon
                kong1 = create_kong(NumberedTile(number=number, suit=suit1))
                dragon_single1 = create_single(DragonTile(dragon1, suit1))
                
                # Kong of same number in suit2 with matching dragon
                kong2 = create_kong(NumberedTile(number=number, suit=suit2))
                dragon_single2 = create_single(DragonTile(dragon2, suit2))
                
                # Pair of same number in suit3
                number_pair = create_pair(NumberedTile(number=number, suit=suit3))
                
                # Combine all tile sets for this variation
                variation = [
                    flower_pair,
                    kong1,
                    dragon_single1,
                    kong2,
                    dragon_single2,
                    number_pair
                ]
                variations.append(variation)
        
        return variations
    
    def validate_hand(self, tiles: List[Tile]) -> bool:
        if len(tiles) != 14:  # 2 (flowers) + 4 + 1 + 4 + 1 + 2 = 14
            return False
            
        # Count tile occurrences and track suits
        from collections import defaultdict
        tile_counts = defaultdict(int)
        tile_suits = defaultdict(set)
        
        # Track dragons separately to check their suits
        dragons = []
        flower_count = 0
        
        for tile in tiles:
            if hasattr(tile, 'short_name'):
                short_name = tile.short_name
                tile_counts[short_name] += 1
                
                # Track flower count
                if short_name == 'FL':
                    flower_count += 1
                # Track dragons
                elif hasattr(tile, 'dragon_type'):
                    dragons.append(tile)
                # Track suits of numbered tiles
                elif hasattr(tile, 'suit'):
                    tile_suits[short_name[0]].add(tile.suit)
        
        # Check for exactly 2 flowers
        if flower_count != 2:
            return False
            
        # Check we have exactly 2 dragons
        if len(dragons) != 2:
            return False
            
        # Check dragons are of different types and in the correct suits
        if dragons[0].dragon_type == dragons[1].dragon_type:
            return False
            
        # Check each dragon is in its correct suit
        if (dragons[0].suit != dragons[0].dragon_type.suit or 
            dragons[1].suit != dragons[1].dragon_type.suit):
            return False
            
        # Check the numbered tiles
        # We should have:
        # - Two kongs (4 tiles each) of the same number in different suits
        # - One pair (2 tiles) of the same number in a third suit
        number = None
        kong_suits = set()
        pair_suits = set()
        
        for tile_name, count in tile_counts.items():
            if tile_name == 'FL' or len(tile_name) != 2 or not tile_name[0].isdigit():
                continue
                
            tile_number = tile_name[0]
            if number is None:
                number = tile_number
            elif tile_number != number:
                return False  # All numbered tiles must be the same number
                
            if count == 4:
                kong_suits.update(tile_suits[tile_number])
            elif count == 2:
                pair_suits.update(tile_suits[tile_number])
            else:
                return False  # Invalid count for numbered tiles
        
        # Check we have exactly 2 kongs in different suits and 1 pair in a third suit
        return (len(kong_suits) == 2 and 
                len(pair_suits) == 1 and 
                not kong_suits.intersection(pair_suits))

class EvenChowEvenPungsFlowersTemplate(HandTemplate):
    """
    Even Chow + Even Pungs + Flowers
    
    Pattern:
    - Kong of Flowers
    - Singles: 2, 4, 6, 8 in suit1
    - Pung of 2n in suit2
    - Pung of 2n in suit3
    
    Where n ranges from 1 to 4
    """
    def __init__(self):
        super().__init__(
            template_id="even_chow_even_pungs_flowers",
            name="Even Chow + Even Pungs + Flowers",
            description="Kong of Flowers, singles of 2,4,6,8 in one suit, "
                      "and pungs of the same even number in the other two suits",
            category="2468",
            point_value=25,
            number=6
        )
    
    def generate_variations(self) -> List[List[TileSet]]:
        from .tiles import Suit, NumberedTile, FlowerTile
        from .tilesets import create_single, create_pung, create_kong
        from itertools import permutations
        
        variations = []
        even_numbers = [2, 4, 6, 8]  # Even numbers for singles
        
        # For n from 1 to 4 (2n will be 2, 4, 6, 8)
        for n in range(1, 5):
            pung_number = 2 * n
            
            # For each permutation of the three suits
            for suit1, suit2, suit3 in permutations(Suit):
                # Create the tile sets for this variation
                flower_kong = create_kong(FlowerTile())
                
                # Create singles for 2, 4, 6, 8 in suit1
                singles = [
                    create_single(NumberedTile(number=num, suit=suit1))
                    for num in even_numbers
                ]
                
                # Create pungs of 2n in suit2 and suit3
                pung_suit2 = create_pung(NumberedTile(number=pung_number, suit=suit2))
                pung_suit3 = create_pung(NumberedTile(number=pung_number, suit=suit3))
                
                # Combine all tile sets for this variation
                variation = [flower_kong] + singles + [pung_suit2, pung_suit3]
                variations.append(variation)
        
        return variations
    
    def validate_hand(self, tiles: List[Tile]) -> bool:
        if len(tiles) != 14:  # 4 (flowers) + 4 (singles) + 3 + 3 = 14
            return False
            
        from collections import defaultdict
        tile_counts = defaultdict(int)
        suits_used = defaultdict(set)
        flower_count = 0
        
        # Track numbers and their suits
        number_suits = defaultdict(set)
        pung_numbers = set()
        single_numbers = set()
        
        for tile in tiles:
            if hasattr(tile, 'short_name'):
                short_name = tile.short_name
                
                # Count flowers
                if short_name == 'FL':
                    flower_count += 1
                    continue
                    
                # Only process numbered tiles
                if len(short_name) != 2 or not short_name[0].isdigit():
                    return False
                    
                number = int(short_name[0])
                suit = tile.suit
                number_suits[number].add(suit)
                
                # Track if this is part of a pung or single
                tile_counts[short_name] += 1
                
        # Check we have exactly 4 flowers (a kong)
        if flower_count != 4:
            return False
            
        # Check we have exactly 4 singles (2,4,6,8) in one suit
        # and two pungs (3 each) of the same even number in two other suits
        pung_count = 0
        single_count = 0
        pung_number = None
        single_suit = None
        
        for number, suits in number_suits.items():
            for suit in suits:
                tile_key = f"{number}{suit.value}"
                count = tile_counts[tile_key]
                
                if count == 1:
                    # Should be a single in the first suit
                    if single_suit is None:
                        single_suit = suit
                    elif suit != single_suit:
                        return False  # Singles must be in the same suit
                        
                    if number not in [2, 4, 6, 8]:
                        return False  # Singles must be even numbers
                        
                    single_count += 1
                    single_numbers.add(number)
                    
                elif count == 3:
                    # Should be a pung in one of the other suits
                    if pung_number is None:
                        pung_number = number
                    elif number != pung_number:
                        return False  # Both pungs must be the same number
                        
                    pung_count += 1
                    pung_numbers.add(number)
                else:
                    return False  # Invalid count
        
        # Check we have exactly 4 singles (2,4,6,8) and 2 pungs of the same even number
        return (
            len(single_numbers) == 4 and  # All four even numbers
            single_count == 4 and
            len(pung_numbers) == 1 and    # One number for both pungs
            pung_count == 2 and           # Two pungs
            pung_number is not None and
            pung_number % 2 == 0 and      # Pung number is even
            pung_number in [2, 4, 6, 8]   # Pung number is one of the even numbers
        )

# Registry of all available hand templates
HAND_TEMPLATES: Dict[str, HandTemplate] = {
    "sequence_and_kongs": SequenceAndKongsTemplate(),
    "symmetrical_13579_all_suits": Symmetrical13579AllSuitsTemplate(),
    "kong_kong_pair_flowers_dragons": KongKongPairWithFlowersAndDragonsTemplate(),
    "even_chow_even_pungs_flowers": EvenChowEvenPungsFlowersTemplate()
}

def get_template(template_id: str) -> Optional[HandTemplate]:
    """Get a hand template by its ID."""
    return HAND_TEMPLATES.get(template_id)

def list_templates() -> List[HandTemplate]:
    """List all available hand templates."""
    return list(HAND_TEMPLATES.values())
