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

### 2025-06-01 - Session Summary: Dragon Tile Text Styling
- **Issue Addressed**:
  - Dragon tile text was too small and difficult to read
  - Text was wrapping inappropriately on dragon tiles
  - Inconsistent styling between different tile types

- **Changes Made**:
  - Increased dragon tile text size to 12px for better readability
  - Implemented CSS to prevent text wrapping on dragon tiles
  - Added proper text centering and padding
  - Ensured consistent styling across all dragon tiles (Red, Green, Soap)
  - Documented all changes in PROJECT_HISTORY.md

- **Technical Notes**:
  - Used CSS `white-space: nowrap` to prevent wrapping
  - Added `text-overflow: ellipsis` for better overflow handling
  - Used `!important` flags to ensure styles take precedence
  - Committed changes to `feature/increase-tile-text-size` branch

- **Next Steps**:
  - Review changes in the feature branch
  - Create pull request to merge into main branch
  - Consider similar text size adjustments for other tile types if needed

### 2025-06-01 - CSS Debugging and Text Size Fix
- **Issue**: CSS changes weren't being applied due to:
  - Multiple style sheets with conflicting rules
  - CSS specificity issues with dynamically generated content
  - Browser caching of styles
- **Solution**:
  - Added styles at the end of the document with `!important` to ensure they take precedence
  - Used more specific selectors to target the corner text
  - Documented the need for `!important` when overriding styles in this project
- **Changes**:
  - Increased corner text size to 9px for better readability
  - Ensured consistent text positioning with `line-height` and `position`
  - Removed debug styles after testing

### 2025-06-01
- Created new branch `feature/increase-tile-text-size` for tile text size improvements
- Verified current application state:
  - Tiles display correctly
  - All buttons functional (Deal 13/14, Reset Deck)
  - No console errors present

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
