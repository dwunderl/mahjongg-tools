# Mahjongg Tools

A collection of web-based tools for American Mahjongg players, fully responsive and mobile-friendly.

## 🎴 Tools

### 1. Tile Dealer
- Deals random hands of 13 or 14 tiles from a standard 152-tile American Mahjongg set
- Tracks remaining tiles in the deck
- Sort hands by Suit/Rank or Rank/Suit
- Reset the deck at any time
- Visual representation of tiles
- Mobile-optimized with touch support

### 2. Card Editor (Coming Soon)
- Create and edit Mahjongg card definitions
- Define custom hands and patterns
- Save and load card configurations
- Validate against Mahjongg rules

## 📱 Mobile Support

The application is fully responsive and works great on mobile devices:
- Touch-optimized controls
- Larger tap targets for better usability
- Visual feedback on touch interactions
- Proper viewport scaling for all screen sizes

## 🚀 Quick Start

### Option 1: Using a Local Web Server (Recommended)
```bash
# Navigate to the project directory
cd mahjongg-tools

# Start a simple HTTP server
python3 -m http.server 8000

# Open your browser to:
# http://localhost:8000
```

### Option 2: Direct Filesystem Access
1. Clone the repository:
   ```bash
   git clone https://github.com/dwunderl/mahjongg-tools.git
   ```
2. Open `index.html` directly in your web browser

## 🏗️ Project Structure

```
mahjongg-tools/
├── tile-dealer/      # The Tile Dealer application
├── card-editor/      # Card Editor (in development)
├── shared/           # Shared code and resources
│   ├── js/           # Shared JavaScript modules
│   │   ├── tile-definitions.js  # Tile types and utilities
│   │   └── card-schema.js       # Card definition schema
│   └── data/         # Card definitions and sample data
├── index.html        # Main entry point
└── README.md         # This file
```

## 🛠️ Development

### Tile Dealer
- Built with vanilla JavaScript, HTML, and CSS
- No external dependencies
- Responsive design works on desktop and mobile

### Card Editor (Planned Features)
- Drag-and-drop interface for building hands
- Real-time validation
- Import/export card definitions
- Print/export to PDF

## 🤝 Contributing

Contributions are welcome! Here's how you can help:
1. Report bugs or request features by opening an issue
2. Submit pull requests for bug fixes or new features
3. Improve documentation
4. Share feedback and suggestions

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- American Mahjongg rules and conventions
- All contributors and testers
