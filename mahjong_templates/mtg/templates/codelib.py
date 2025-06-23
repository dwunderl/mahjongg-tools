from itertools import permutations
from ..core import HandTemplate, pair, single, kong, pung

def sequence_and_kongs() -> HandTemplate:
    """Sequence and Kongs template."""
    template = HandTemplate(
        id="sequence_and_kongs",
        name="Sequence and Kongs",
        description="One sequence and two kongs",
        category="CONSECUTIVE RUN",
        catid="2",
        image="<red>123 <green>1111 <black>1111"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots
    numbers = list(range(1, 6))  # 1-5 to ensure n+4 doesn't exceed 9
    
    for s1 in suits:
        other_suits = [x for x in suits if x != s1]
        s2 = other_suits[0]
        s3 = other_suits[1]
        for n in numbers:
            template.add_variation([
                pair(n, s1),
                single(n+1, s1),
                single(n+2, s1),
                single(n+3, s1),
                single(n+4, s1),
                kong(n, s2),
                kong(n, s3)
            ])
    
    return template


def p3_k6_p6_k9() -> HandTemplate:
    """p3 k6 p6 k9 template"""
    template = HandTemplate(
        id="p3_k6_p6_k9",
        name = "p3 k6 p6 k9 in 3 suits",
        description = "Pung of 3s, Kong of 6s (same suit), Pung of 6s (different suit), Kong of 9s",
        category="369",
        catid="1b",
        image = "<green>333 6666 <red>666 <black>9999"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots

    for p in permutations(suits):
        s1 = p[0]  # First suit for pung(3) and kong(6)
        s2 = p[1]  # Second suit for pung(6)
        s3 = p[2]  # Third suit for kong(9)
        template.add_variation([
            pung(3, s1),
            kong(6, s1),
            pung(6, s2),
            kong(9, s3)
        ])
        
    return template

def like_kong_kong_pair() -> HandTemplate:
    """like kong kong pair template."""
    template = HandTemplate(
        id="like_kong_kong_pair",
        category="ANY LIKE NUMBERS",
        catid="1",
        image="<black>FF <green>1111 D <red>1111 D <black>11",
        name="Like Kong Kong Pair",
        description="Like kongs and Pair in different suits with matching dragons and flower pair"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots
    numbers = list(range(1, 10))  # 1-9 all tile numbers
    
    for s1 in suits:
        other_suits = [x for x in suits if x != s1]
        s2 = other_suits[0]
        s3 = other_suits[1]
        for n in numbers:
            template.add_variation([
                pair(0, 'f'),  # Flower pair
                kong(n, s2),
                single(0, f'dragon_{s2}'),  # Dragon in the same suit as first kong
                kong(n, s3),
                single(0, f'dragon_{s3}'),  # Dragon in the same suit as second kong
                pair(n, s1)  # Pair in the third suit
            ])
    
    return template


def even_pungs_2468() -> HandTemplate:
    """2468 2 even pungs kong template."""
    template = HandTemplate(
        id="even_pungs_2468",
        name="2468 2 even pungs kong Flowers",
        description="2468 and 2 even pungs with opposite suits and a kong of flowers",
        category="2468",
        catid="4",
        image="<black>FFFF <green>2468 <red>222 <black>222"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots
    numbers = list(range(1, 5))  # 1-4 to help calculate 2,4,6,8
    
    for s1 in suits:
        other_suits = [x for x in suits if x != s1]
        s2 = other_suits[0]
        s3 = other_suits[1]
        for n in numbers:
            template.add_variation([
                kong(0, 'f'),  # Kong of flowers
                single(2, s1),
                single(4, s1),
                single(6, s1),
                single(8, s1),
                pung(2*n, s2),  # Even number pung in second suit
                pung(2*n, s3)   # Same even number pung in third suit

            ])
    
    return template


