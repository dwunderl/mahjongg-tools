# Mahjongg Tile Dealer - Project History

## Key Implementation Details

### Tile Representation
- **Number Tiles**: Display as `value` + `suit` (e.g., "1 C" for 1 Cracks)
- **Dragons**: 
  - Red Dragon: White text on red background, shows "Red"
  - Green Dragon: White text on green background, shows "Green"
  - White Dragon: Black text on white background, shows "Soap"
- **Flowers**: Display as flower emoji (🌸)
- **Jokers**: Display as "Joker" in purple

### CSS Classes
- `.tile`: Base tile styling
- `.tile-crack`: Red color for Cracks
- `.tile-bam`: Green color for Bams
- `.tile-dot`: Black color for Dots
- `.tile-dragon-red`: White text on red background
- `.tile-dragon-green`: White text on green background
- `.tile-dragon-white`: Black text on white background
- `.tile-flower`: Pink flower emoji
- `.tile-joker`: Purple text

### JavaScript Structure
- `deck` array contains all tiles with type, suit, value, and shortName
- `dealTiles(count)` function handles dealing tiles
- Tiles are created with proper classes based on their type

## Git Workflow
1. Always work on a feature branch: `git checkout -b feature/description`
2. Make atomic commits with clear messages
3. Push to remote frequently
4. Create pull requests for review before merging to main

## Recent Changes

### 2023-05-31
- Fixed tile styling for dot tiles and white dragon
- Implemented proper tile display with rank and suit
- Added hover and selection states for tiles
- Set up debug console for development

## Known Issues
- None at this time

## Future Improvements
- Add tile images for better visual representation
- Implement drag-and-drop functionality
- Add sound effects for dealing and selecting tiles
- Improve mobile responsiveness
