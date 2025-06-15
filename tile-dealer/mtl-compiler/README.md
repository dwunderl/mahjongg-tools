# Mahjong Template Language (MTL) Compiler

This compiler processes Mahjong hand templates written in MTL and generates all possible variations of those hands in JSON format.

## Usage

1. Create a template file in the `templates/` directory with a `.mtl` extension
2. Run the compiler:
   ```
   node compile.js templates/your-template.mtl output/output-file.json
   ```

## Template Syntax

### Metadata
```
category = "Category Name"
catid = "1a"
name = "Template Name"
description = "Template description"
image = "Visual representation"
```

### Variations
```
// Define available suits
suits = (b, c, d)

// Generate variations using loops and tile functions
foreach (p in permutations(suits)):
    s1 = p[0]
    s2 = p[1]
    s3 = p[2]
    
    // Tile functions
    pung(3, s1)    // Pung (3 of a kind)
    kong(6, s1)    // Kong (4 of a kind)
    pair(9, s2)    // Pair (2 of a kind)
    single(5, s3)  // Single tile
End:
```

## Available Functions

- `pair(number, suit)`: Add a pair of tiles
- `pung(number, suit)`: Add a pung (3 of a kind)
- `kong(number, suit)`: Add a kong (4 of a kind)
- `single(number, suit)`: Add a single tile
- `complement(suit, suits)`: Get the other two suits
- `permutations(array)`: Generate all permutations of an array

## Output Format

The compiler generates a JSON file with the following structure:

```json
{
  "templates": [
    {
      "id": 1,
      "category": "Category",
      "name": "Template Name",
      "description": "Description",
      "image": "Visual representation",
      "variations": [
        ["tile1", "tile2", ...],
        ...
      ]
    }
  ]
}
```

## Examples

See the `templates/` directory for example templates.
