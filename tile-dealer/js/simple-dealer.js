// Simple Mahjongg Dealer - Debug Version

// Debug logging
function debugLog(message) {
    console.log(message);
    
    // Ensure debug container exists
    let debugEl = document.getElementById('debug-messages');
    if (!debugEl) {
        console.warn('Debug container not found, creating one...');
        const container = document.createElement('div');
        container.id = 'debug-info';
        container.style.cssText = 'position:fixed;top:10px;right:10px;left:10px;background:rgba(255,255,255,0.95);padding:15px;border:2px solid red;z-index:9999;max-height:200px;overflow:auto;';
        container.innerHTML = '<h3 style="margin:0 0 10px 0;color:red;">Debug Info</h3><div id="debug-messages"></div>';
        document.body.appendChild(container);
        debugEl = document.getElementById('debug-messages');
    }
    
    try {
        // Add message
        const line = document.createElement('div');
        line.textContent = `[${new Date().toISOString()}] ${message}`;
        debugEl.appendChild(line);
        debugEl.scrollTop = debugEl.scrollHeight;
    } catch (error) {
        console.error('Error in debugLog:', error);
    }
}

// Initialize
debugLog('Simple Mahjongg Dealer initializing...');
let fullDeck = [];
let currentHand = [];

// Make debugLog globally available
window.debugLog = debugLog;

// Create a full deck of Mahjongg tiles (152 tiles)
function createFullDeck() {
    debugLog('=== CREATING NEW DECK ===');
    const deck = [];
    const suits = ['C', 'B', 'D']; // Crack, Bam, Dot
    const honors = ['N', 'E', 'S', 'W', 'RD', 'GD', 'WD']; // Winds and Dragons
    const bonus = ['FL', 'JK']; // Flowers and Jokers
    
    // 1. Number tiles (4 of each, 1-9 for each suit)
    suits.forEach(suit => {
        for (let value = 1; value <= 9; value++) {
            for (let i = 0; i < 4; i++) {
                deck.push(`${value}${suit}`);
            }
        }
    });
    
    // 2. Honor tiles (4 of each wind/dragon)
    honors.forEach(honor => {
        for (let i = 0; i < 4; i++) {
            deck.push(honor);
        }
    });
    
    // 3. Bonus tiles (flowers/jokers)
    bonus.forEach(b => {
        for (let i = 0; i < 4; i++) {
            deck.push(b);
        }
    });
    
    debugLog(`Created deck with ${deck.length} tiles`);
    return deck;
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffleDeck(deck) {
    debugLog('Shuffling deck...');
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Deal a hand of tiles
function dealHand(numTiles) {
    debugLog(`\n=== DEALING ${numTiles} TILES ===`);
    
    // Create new deck if needed
    if (fullDeck.length < numTiles) {
        debugLog('Not enough tiles, creating new deck...');
        fullDeck = createFullDeck();
        shuffleDeck(fullDeck);
    }
    
    // Deal the tiles
    const hand = [];
    for (let i = 0; i < numTiles; i++) {
        if (fullDeck.length === 0) {
            debugLog('WARNING: Deck is empty!');
            break;
        }
        const tile = fullDeck.pop();
        hand.push(tile);
        debugLog(`Dealt: ${tile} (${fullDeck.length} remaining)`);
    }
    
    return hand;
}

// Calculate optimal tile size based on viewport width
function calculateOptimalTileSize(tileCount) {
    // Use the full viewport width minus some padding
    const viewportWidth = Math.min(window.innerWidth, 1400) - 40; // Adjusted padding
    const minTileWidth = 30; // Smaller minimum width to fit more tiles
    const maxTileWidth = 65; // Slightly smaller maximum width
    const tileGap = 1; // Minimal gap between tiles
    
    // Calculate available width for tiles
    const availableWidth = viewportWidth - (tileCount * tileGap);
    
    // Calculate optimal width per tile
    let tileWidth = Math.min(maxTileWidth, Math.max(minTileWidth, availableWidth / tileCount));
    
    // For very small screens, use a fixed smaller size
    if (window.innerWidth < 480) {
        tileWidth = Math.min(tileWidth, 32);
    }
    
    // Round to nearest 1px for more precision
    tileWidth = Math.floor(tileWidth);
    
    // Calculate height maintaining aspect ratio (3:4)
    const tileHeight = Math.round(tileWidth * 1.5);
    
    return { width: tileWidth, height: tileHeight };
}

// Update tile sizes based on viewport and number of tiles
function updateTileSizes(tileCount) {
    const tiles = document.querySelectorAll('.tile');
    if (tiles.length === 0) return;
    
    const { width, height } = calculateOptimalTileSize(tileCount);
    
    // Update CSS variables
    document.documentElement.style.setProperty('--tile-width', `${width}px`);
    document.documentElement.style.setProperty('--tile-height', `${height}px`);
    
    // Adjust font sizes proportionally
    const baseFontSize = Math.max(10, Math.min(20, Math.floor(width / 2.2)));
    const suitFontSize = Math.max(8, Math.floor(baseFontSize * 0.7));
    
    document.documentElement.style.setProperty('--tile-font-size', `${baseFontSize}px`);
    document.documentElement.style.setProperty('--tile-suit-size', `${suitFontSize}px`);
    
    // Adjust font size for dragon tiles
    tiles.forEach(tile => {
        if (tile.hasAttribute('data-original-suit')) {
            tile.style.fontSize = `${Math.max(8, Math.floor(baseFontSize * 0.8))}px`;
            tile.style.lineHeight = '1';
        }
    });
}

// Display the hand on the page
function displayHand(hand) {
    debugLog(`Displaying hand with ${hand.length} tiles`);
    const container = document.getElementById('tiles-row');
    if (!container) {
        debugLog('ERROR: Could not find tiles row container');
        return;
    }
    
    // Clear previous hand
    container.innerHTML = '';
    
    // Add each tile
    hand.forEach((tileCode) => {
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        
        // Extract suit and value for styling
        const suitMatch = tileCode.match(/[A-Za-z]+/);
        const valueMatch = tileCode.match(/\d+/);
        const suit = suitMatch ? suitMatch[0] : '';
        const value = valueMatch ? valueMatch[0] : '';
        
        // Set data attributes for styling
        tileEl.setAttribute('data-suit', suit || tileCode);
        if (value) tileEl.setAttribute('data-value', value);
        
        // Set tile content with proper display text
        let displayText = tileCode;
        if (suit && value) {
            // For numbered tiles (e.g., 1C, 2B, 3D)
            displayText = value;
            // Map single-letter suit codes to full names
            const suitNames = { 'C': 'Crack', 'B': 'Bam', 'D': 'Dot' };
            tileEl.setAttribute('data-corner', suitNames[suit] || suit);
        } else if (tileCode === 'RD') {
            displayText = 'Red';
            tileEl.setAttribute('data-corner', 'Dragon');
        } else if (tileCode === 'GD') {
            displayText = 'Green';
            tileEl.setAttribute('data-corner', 'Dragon');
        } else if (tileCode === 'WD') {
            displayText = 'Soap';
            tileEl.setAttribute('data-corner', 'Dragon');
        } else if (['N', 'E', 'S', 'W'].includes(tileCode)) {
            // Use single letter for wind directions
            displayText = tileCode;
            tileEl.setAttribute('data-corner', 'Wind');
        } else if (tileCode === 'FL') {
            displayText = '🌺';
            tileEl.setAttribute('data-corner', 'Flower');
        } else if (tileCode === 'JK') {
            displayText = '🃏';
            tileEl.setAttribute('data-corner', 'Joker');
        }
        
        tileEl.textContent = displayText;
        container.appendChild(tileEl);
    });
    
    // Update tile sizes to fit viewport
    updateTileSizes(hand.length);
    
    debugLog(`Displayed ${hand.length} tiles`);
    
    // Update remaining tiles count
    const tileCountEl = document.getElementById('tile-count');
    if (tileCountEl) {
        tileCountEl.textContent = fullDeck.length;
    }
}

// Handle deal button click
function handleDeal(numTiles) {
    debugLog(`\n=== HANDLE DEAL (${numTiles} tiles) ===`);
    try {
        // Deal a new hand
        currentHand = dealHand(numTiles);
        
        // Display the hand
        displayHand(currentHand);
        
        debugLog('=== DEAL COMPLETE ===');
    } catch (error) {
        const errorMsg = `ERROR: ${error.message}`;
        debugLog(errorMsg);
        alert(errorMsg);
    }
}

// Initialize the application
function init() {
    debugLog('Initializing Mahjongg Dealer...');
    
    // Create and shuffle the initial deck
    fullDeck = createFullDeck();
    shuffleDeck(fullDeck);
    
    // Set up event listeners
    const deal13Btn = document.getElementById('deal-13-btn');
    const deal14Btn = document.getElementById('deal-14-btn');
    
    if (deal13Btn) {
        deal13Btn.onclick = () => handleDeal(13);
        debugLog('Added click handler to Deal 13 button');
    } else {
        debugLog('ERROR: Could not find Deal 13 button');
    }
    
    if (deal14Btn) {
        deal14Btn.onclick = () => handleDeal(14);
        debugLog('Added click handler to Deal 14 button');
    } else {
        debugLog('ERROR: Could not find Deal 14 button');
    }
    
    debugLog('Initialization complete');
}

// Handle window resize to adjust tile sizes
function handleResize() {
    const container = document.getElementById('tiles-row');
    if (container && container.children.length > 0) {
        updateTileSizes(container.children.length);
    }
}

// Start the app when the page loads
function startApp() {
    debugLog('Starting app...');
    try {
        init();
        
        // Add resize event listener
        window.addEventListener('resize', handleResize);
        
        debugLog('App started successfully');
    } catch (error) {
        const errorMsg = `Failed to start app: ${error.message}`;
        debugLog(errorMsg);
        console.error(errorMsg, error);
        alert(errorMsg);
    }
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    debugLog('Waiting for DOM to load...');
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    debugLog('DOM already loaded, starting app...');
    startApp();
}

// Make sure debug log is visible
setTimeout(() => {
    const debugEl = document.getElementById('debug-messages');
    if (debugEl) {
        debugEl.scrollTop = debugEl.scrollHeight;
    }
}, 1000);
