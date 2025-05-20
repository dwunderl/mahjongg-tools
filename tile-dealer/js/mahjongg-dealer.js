document.addEventListener('DOMContentLoaded', () => {
    console.log('Mahjongg Dealer script loaded.');

    const suits = ['C', 'B', 'D']; // Crack, Bam, Dot
    const honors = ['N', 'E', 'S', 'W', 'RD', 'GD', 'WD']; // Winds and Dragons
    const bonus = ['FL', 'JK']; // Flowers and Jokers

    let fullDeck = [];
    let currentHand = []; // To store the currently dealt hand

    // Function to create a full Mahjongg deck (152 tiles)
    function createFullDeck() {
        const deck = [];

        // 1. Suited Tiles (Craks, Bams, Dots)
        for (const suit of suits) {
            for (let i = 1; i <= 9; i++) {
                for (let copy = 0; copy < 4; copy++) {
                    deck.push(`${i}${suit}`); // e.g., "1C", "9D"
                }
            }
        }

        // 2. Wind Tiles
        for (const wind of ['N', 'E', 'S', 'W']) {
            for (let copy = 0; copy < 4; copy++) {
                deck.push(wind);
            }
        }

        // 3. Dragon Tiles
        for (const dragon of ['RD', 'GD', 'WD']) {
            for (let copy = 0; copy < 4; copy++) {
                deck.push(dragon);
            }
        }

        // 4. Flower Tiles
        for (let i = 0; i < 8; i++) {
            deck.push('FL'); // Representing all flowers as 'FL' for now
        }

        // 5. Joker Tiles
        for (let i = 0; i < 8; i++) {
            deck.push('JK');
        }
        
        console.log(`Deck created with ${deck.length} tiles.`);
        return deck;
    }

    // Fisher-Yates Shuffle Algorithm
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
        }
        return deck;
    }

    // Function to shuffle and deal a specified number of tiles
    function shuffleAndDeal(numTiles) {
        const shuffledDeck = shuffleDeck(fullDeck);
        const dealtHand = shuffledDeck.slice(0, numTiles);
        fullDeck = shuffledDeck.slice(numTiles); // Update fullDeck
        return dealtHand;
    }

    // Function to display the hand in the HTML
    function displayHand(handArray) {
        const dealtHandContainer = document.getElementById('dealt-hand-container');
        dealtHandContainer.innerHTML = ''; // Clear previous hand

        handArray.forEach(tileCode => {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('tile');

            let tileDisplayValue = tileCode; // Fallback for non-suited tiles
            let specificClass = '';

            if (tileCode.length === 2 && !isNaN(tileCode[0])) { // Numbered suit tiles (e.g., '1C', '9B')
                const rank = tileCode[0];
                const suit = tileCode[1];
                let suitName = '';

                if (suit === 'C') { suitName = 'Cra'; specificClass = 'tile-crack'; }
                else if (suit === 'B') { suitName = 'Bam'; specificClass = 'tile-bam'; }
                else if (suit === 'D') { suitName = 'Dot'; specificClass = 'tile-dot'; }
                
                // Create separate spans for rank and suit
                const rankSpan = document.createElement('span');
                rankSpan.textContent = rank;
                rankSpan.classList.add('tile-rank');

                const suitSpan = document.createElement('span');
                suitSpan.textContent = suitName;
                suitSpan.classList.add('tile-suit-suffix');

                tileDiv.appendChild(rankSpan);
                tileDiv.appendChild(suitSpan);
                // tileDisplayValue is handled by spans now
            }
            else if (tileCode === 'N') { tileDisplayValue = 'N'; specificClass = 'tile-wind'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'E') { tileDisplayValue = 'E'; specificClass = 'tile-wind'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'S') { tileDisplayValue = 'S'; specificClass = 'tile-wind'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'W') { tileDisplayValue = 'W'; specificClass = 'tile-wind'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'RD') { tileDisplayValue = 'Red'; specificClass = 'tile-dragon-red'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'GD') { tileDisplayValue = 'Green'; specificClass = 'tile-dragon-green'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'WD') { tileDisplayValue = 'Soap'; specificClass = 'tile-dragon-white'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'FL') { tileDisplayValue = '🌺'; specificClass = 'tile-flower'; tileDiv.textContent = tileDisplayValue;}
            else if (tileCode === 'JK') { tileDisplayValue = 'Joker'; specificClass = 'tile-joker'; tileDiv.textContent = tileDisplayValue;}

            if (specificClass) {
                tileDiv.classList.add(specificClass);
            }
            // tileDiv.textContent = tileDisplayValue; // Moved to within conditions or handled by spans
            dealtHandContainer.appendChild(tileDiv);
        });
    }

    // Function to handle the deal action
    function handleDeal(numTiles) {
        if (fullDeck.length === 0) {
            fullDeck = createFullDeck();
        }
        currentHand = shuffleAndDeal(numTiles);
        displayHand(currentHand);

        if (remainingTilesP) { // Update remaining tiles count
            const remainingInDeck = fullDeck.length;
            remainingTilesP.textContent = `Tiles remaining: ${remainingInDeck}`;
        }
        updateDealButtonStates(); // Update button states
    }

    // Function to handle resetting the deck and game state
    function handleResetDeck() {
        fullDeck = createFullDeck(); // Re-initialize the deck
        currentHand = []; // Clear the current hand array

        const dealtHandContainer = document.getElementById('dealt-hand-container');
        if (dealtHandContainer) {
            dealtHandContainer.innerHTML = ''; // Clear the displayed hand
        }

        if (remainingTilesP) { // Update remaining tiles count
            remainingTilesP.textContent = `Tiles remaining: ${fullDeck.length}`;
        }
        console.log('Deck reset. New game ready.');
        updateDealButtonStates(); // Update button states
    }

    // Function to update the enabled/disabled state of deal buttons
    function updateDealButtonStates() {
        if (deal13Button) {
            deal13Button.disabled = fullDeck.length < 13;
        }
        if (deal14Button) {
            deal14Button.disabled = fullDeck.length < 14;
        }
    }

    // Helper function to get sort keys for Sort Type 1 (Suit then Rank)
    function getSortKeysType1(tileCode) {
        let primaryGroup = 99; // Default for Jokers/unspecified
        let rankInGroup = 99;
        const suitChar = tileCode.length === 2 ? tileCode[1] : '';
        const rankChar = tileCode.length === 2 ? tileCode[0] : '';

        if (suitChar === 'C' && !isNaN(rankChar)) { primaryGroup = 1; rankInGroup = parseInt(rankChar); } // Cracks 1-9
        else if (tileCode === 'RD') { primaryGroup = 2; rankInGroup = 1; } // Red Dragon
        else if (suitChar === 'B' && !isNaN(rankChar)) { primaryGroup = 3; rankInGroup = parseInt(rankChar); } // Bams 1-9
        else if (tileCode === 'GD') { primaryGroup = 4; rankInGroup = 1; } // Green Dragon
        else if (suitChar === 'D' && !isNaN(rankChar)) { primaryGroup = 5; rankInGroup = parseInt(rankChar); } // Dots 1-9
        else if (tileCode === 'WD') { primaryGroup = 6; rankInGroup = 1; } // White Dragon
        else if (['N', 'E', 'S', 'W'].includes(tileCode)) { // Winds
            primaryGroup = 7;
            if (tileCode === 'E') rankInGroup = 1;
            else if (tileCode === 'N') rankInGroup = 2;
            else if (tileCode === 'S') rankInGroup = 3;
            else if (tileCode === 'W') rankInGroup = 4;
        }
        else if (tileCode === 'FL') { primaryGroup = 8; rankInGroup = 1; } // Flowers
        else if (tileCode === 'JK') { primaryGroup = 9; rankInGroup = 1; } // Jokers

        return [primaryGroup, rankInGroup];
    }

    // Helper function to get sort keys for Sort Type 2 (Rank then Suit)
    function getSortKeysType2(tileCode) {
        let primaryRank = 99; // Default for Jokers/unspecified
        let suitInRankGroup = 99;
        const suitChar = tileCode.length === 2 ? tileCode[1] : '';
        const rankVal = tileCode.length === 2 && !isNaN(tileCode[0]) ? parseInt(tileCode[0]) : 0;

        if (rankVal >= 1 && rankVal <= 9) { // Numbered tiles 1-9
            primaryRank = rankVal;
            if (suitChar === 'C') suitInRankGroup = 1;      // Cracks
            else if (suitChar === 'B') suitInRankGroup = 2; // Bams
            else if (suitChar === 'D') suitInRankGroup = 3; // Dots
        }
        else if (['RD', 'GD', 'WD'].includes(tileCode)) { // Dragons
            primaryRank = 10; // After 9s
            if (tileCode === 'RD') suitInRankGroup = 1;
            else if (tileCode === 'GD') suitInRankGroup = 2;
            else if (tileCode === 'WD') suitInRankGroup = 3;
        }
        else if (['N', 'E', 'S', 'W'].includes(tileCode)) { // Winds
            primaryRank = 11; // After Dragons
            if (tileCode === 'E') suitInRankGroup = 1;
            else if (tileCode === 'N') suitInRankGroup = 2;
            else if (tileCode === 'S') suitInRankGroup = 3;
            else if (tileCode === 'W') suitInRankGroup = 4;
        }
        else if (tileCode === 'FL') { primaryRank = 12; suitInRankGroup = 1; } // Flowers
        else if (tileCode === 'JK') { primaryRank = 13; suitInRankGroup = 1; } // Jokers

        return [primaryRank, suitInRankGroup];
    }

    // Function to sort the current hand and redraw
    function sortHandAndRedraw(sortType) {
        if (currentHand.length === 0) return; // No hand to sort

        currentHand.sort((a, b) => {
            const keysA = sortType === 1 ? getSortKeysType1(a) : getSortKeysType2(a);
            const keysB = sortType === 1 ? getSortKeysType1(b) : getSortKeysType2(b);

            if (keysA[0] !== keysB[0]) {
                return keysA[0] - keysB[0]; // Compare primary group/rank
            }
            return keysA[1] - keysB[1]; // Compare secondary rank/suit
        });

        displayHand(currentHand);
    }

    // Event Listeners for Deal Buttons
    fullDeck = createFullDeck(); // Initialize the deck when the DOM is loaded

    const deal13Button = document.getElementById('deal-13-btn');
    const deal14Button = document.getElementById('deal-14-btn');
    const remainingTilesP = document.getElementById('remaining-tiles-p'); // Get the new paragraph
    const resetDeckButton = document.getElementById('reset-deck-btn'); // Get the reset button

    if (remainingTilesP) { // Set initial count
        remainingTilesP.textContent = `Tiles remaining: ${fullDeck.length}`;
    }
    updateDealButtonStates(); // Set initial button states

    if (deal13Button) {
        deal13Button.addEventListener('click', () => handleDeal(13));
    }

    if (deal14Button) {
        deal14Button.addEventListener('click', () => handleDeal(14));
    }

    if (resetDeckButton) {
        resetDeckButton.addEventListener('click', handleResetDeck);
    }

    // Event listeners for sort buttons
    const sortSuitRankButton = document.getElementById('sortSuitRankBtn');
    const sortRankSuitButton = document.getElementById('sortRankSuitBtn');

    if (sortSuitRankButton) {
        sortSuitRankButton.addEventListener('click', () => sortHandAndRedraw(1));
    }
    if (sortRankSuitButton) {
        sortRankSuitButton.addEventListener('click', () => sortHandAndRedraw(2));
    }
});
