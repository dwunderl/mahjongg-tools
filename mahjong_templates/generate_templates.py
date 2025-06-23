#!/usr/bin/env python3
"""
Generate Mahjong hand templates in JSON format.
"""
import json
from pathlib import Path
from mtg.templates.codelib import sequence_and_kongs, p3_k6_p6_k9, like_kong_kong_pair, even_pungs_2468, even_pungs_2468

def generate_all_templates() -> dict:
    """Generate all hand templates."""
    templates = [
        sequence_and_kongs(),
        p3_k6_p6_k9(),
        like_kong_kong_pair(),
        even_pungs_2468(),
        # Add more templates here as they're created
    ]
    
    return {
        "version": "1.0.0",
        "templates": [t.to_dict() for t in templates]
    }

def save_templates(output_path: str = "hand_templates.json") -> None:
    """Generate and save all templates to a JSON file."""
    output = generate_all_templates()
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"Saved {len(output['templates'])} templates to {output_path}")

if __name__ == "__main__":
    save_templates()
