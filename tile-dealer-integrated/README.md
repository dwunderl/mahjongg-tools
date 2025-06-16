# Mahjongg Tile Dealer & Analyzer (Integrated)

This is an integrated version of the Mahjongg Tile Dealer that combines the best features from multiple versions:

- Tile rendering from `tile-dealer-exp`
- Hand analysis from `index-simple.html`
- Modern, responsive UI

## Features

- **Deal Hands**: Deal 13 or 14 tile hands
- **Add/Remove Tiles**: Click on tiles to remove them, or use the Add Tile button
- **Sort Hand**: Sort tiles by type, suit, and value
- **Hand Analysis**: Get detailed analysis of your hand including:
  - Pairs
  - Pungs (3 of a kind)
  - Kongs (4 of a kind)
  - Potential Chows (sequences)
- **Multiple Tile Types**:
  - Suit tiles (Bamboo, Characters, Dots)
  - Dragons (Red, Green, White)
  - Winds (East, South, West, North)
  - Flowers

## Getting Started

1. Open `index.html` in a modern web browser
2. Use the controls to deal a new hand, add/remove tiles, and analyze your hand
3. Click on any tile to remove it from your hand

## Development

- `index.html` - Main HTML file
- `js/simple-dealer.js` - Core game logic
- `css/` - Styling files
  - `mahjongg-styles.css` - General styles
  - `tiles.css` - Tile-specific styles
  - `mobile.css` - Responsive styles for mobile devices

## Future Enhancements

- [ ] Add MTL (Mahjong Template Language) support
- [ ] Save/Load hands
- [ ] More detailed hand analysis
- [ ] Scoring system

## License

This project is open source and available under the [MIT License](LICENSE).
