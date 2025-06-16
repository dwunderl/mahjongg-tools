# Mahjong Template Language (MTL) Compiler

This compiler processes Mahjong hand templates written in MTL and generates all possible variations of those hands in JSON format.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Template Syntax](#template-syntax)
- [Available Functions](#available-functions)
- [Testing](#testing)
- [Development](#development)

## Installation

1. Clone the repository
2. Install Node.js (v14 or higher)
3. Install dependencies:
   ```
   npm install
   ```

## Usage

1. Create a template file in the `templates/` directory with a `.mtl` extension
2. Run the compiler:
   ```
   node compile.js templates/your-template.mtl output/output-file.json
   ```
3. The compiled JSON will be saved to the specified output file

## Template Syntax

### Metadata Section
```
metadata = {
    category: "Category Name",
    catid: "1a",           // Must be a string (can include letters)
    name: "Template Name",
    description: "Template description",
    image: "Visual representation"  // Optional
}
```

### Variations Section
```
Variations:
    // Define available suits (b=characters, c=circles, d=bamboo)
    suits = (b, c, d)
    
    // Generate variations using loops and tile functions
    foreach (p in permutations(suits)):
        s1 = p[0]
        s2 = p[1]
        s3 = p[2]
        
        // Your hand pattern here
        pair(9, s1)
        kong(6, s2)
        kong(6, s3)
    End:
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
