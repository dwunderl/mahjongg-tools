// Tile Definitions
const TILES = {
    suits: {
        C: { name: 'Crack', color: '#e74c3c' },
        B: { name: 'Bam', color: '#3498db' },
        D: { name: 'Dot', color: '#2ecc71' }
    },
    honors: {
        N: { name: 'North', color: '#9b59b6' },
        E: { name: 'East', color: '#e67e22' },
        S: { name: 'South', color: '#1abc9c' },
        W: { name: 'West', color: '#f39c12' },
        RD: { name: 'Red Dragon', color: '#e74c3c' },
        GD: { name: 'Green Dragon', color: '#2ecc71' },
        WD: { name: 'White Dragon', color: '#ecf0f1', textColor: '#2c3e50' }
    },
    bonus: {
        FL: { name: 'Flower', symbol: '🌸' },
        JK: { name: 'Joker', symbol: '🃏' }
    }
};

// Card Editor State
let currentCard = {
    name: 'New Card',
    year: new Date().getFullYear(),
    hands: []
};

// DOM Elements
const tilePalette = document.getElementById('tile-palette');
const cardPreview = document.getElementById('card-preview');
const cardNameInput = document.getElementById('card-name');
const cardYearInput = document.getElementById('card-year');
const saveBtn = document.getElementById('save-btn');
const newHandBtn = document.getElementById('new-hand-btn');

// Initialize the application
function init() {
    renderTilePalette();
    setupEventListeners();
    loadSampleCard();
}

// Render the tile palette
function renderTilePalette() {
    // Clear existing tiles
    tilePalette.innerHTML = '';
    
    // Add numbered tiles (1-9 for each suit)
    Object.entries(TILES.suits).forEach(([suitKey, suit]) => {
        for (let i = 1; i <= 9; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile-option';
            tile.textContent = `${i}${suitKey}`;
            tile.style.borderColor = suit.color;
            tile.dataset.tile = `${i}${suitKey}`;
            tilePalette.appendChild(tile);
        }
    });
    
    // Add honor tiles
    Object.entries(TILES.honors).forEach(([key, honor]) => {
        const tile = document.createElement('div');
        tile.className = 'tile-option';
        tile.textContent = key;
        tile.style.borderColor = honor.color;
        tile.dataset.tile = key;
        if (honor.textColor) tile.style.color = honor.textColor;
        tilePalette.appendChild(tile);
    });
    
    // Add bonus tiles
    Object.entries(TILES.bonus).forEach(([key, bonus]) => {
        const tile = document.createElement('div');
        tile.className = 'tile-option';
        tile.textContent = bonus.symbol || key;
        tile.dataset.tile = key;
        tilePalette.appendChild(tile);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Tile selection
    tilePalette.addEventListener('click', (e) => {
        const tileElement = e.target.closest('.tile-option');
        if (tileElement) {
            const tileId = tileElement.dataset.tile;
            addTileToHand(tileId);
        }
    });
    
    // Save button
    saveBtn.addEventListener('click', saveCard);
    
    // New hand button
    newHandBtn.addEventListener('click', addNewHand);
}

// Add a tile to the current hand
function addTileToHand(tileId) {
    console.log('Adding tile:', tileId);
    // TODO: Implement adding tile to hand
}

// Add a new hand to the card
function addNewHand() {
    console.log('Adding new hand');
    // TODO: Implement adding new hand
}

// Save the current card
function saveCard() {
    console.log('Saving card:', currentCard);
    // TODO: Implement save functionality
}

// Load a sample card (for development)
function loadSampleCard() {
    currentCard = {
        name: 'Sample Card',
        year: 2024,
        hands: [
            { name: '2024', tiles: ['1C', '2C', '3C', '4C', '5C'] },
            { name: 'Dragons', tiles: ['RD', 'GD', 'WD'] }
        ]
    };
    
    renderCardPreview();
}

// Render the card preview
function renderCardPreview() {
    // TODO: Implement card preview rendering
    cardPreview.innerHTML = '<p>Card preview will be displayed here</p>';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
