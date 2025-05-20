# Mahjongg Tools

A collection of web-based tools for American Mahjongg players.

## Tools

### 1. Tile Dealer
- Deals random hands of 13 or 14 tiles from a standard 152-tile American Mahjongg set
- Displays remaining tile count
- Sort hands by Suit/Rank or Rank/Suit
- Reset the deck at any time

### 2. Card Editor (Coming Soon)
- Create and edit Mahjongg card definitions
- Define custom hands and patterns
- Save and load card configurations

## Project Structure

```
mahjongg-tools/
├── tile-dealer/      # The Tile Dealer application
├── card-editor/      # Card Editor (in development)
├── shared/           # Shared code and resources
│   ├── js/           # Shared JavaScript modules
│   └── data/         # Card definitions and other data
└── index.html        # Main entry point
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/dwunderl/mahjongg-tools.git
   ```

2. Open `index.html` in a web browser to access all tools.

## Development

### Tile Dealer
- Located in `/tile-dealer`
- Built with vanilla JavaScript, HTML, and CSS

### Card Editor (Planned)
- Will be built as a separate application
- Will share common tile definitions and utilities with the Tile Dealer

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).
