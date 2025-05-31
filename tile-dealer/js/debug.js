// Debug script to test button clicks
console.log('Debug script loaded!');

// Create debug styles
const style = document.createElement('style');
style.textContent = `
    #debug-info {
        position: fixed;
        top: 10px;
        right: 10px;
        left: 10px;
        background: rgba(255, 255, 255, 0.95);
        padding: 15px;
        border: 2px solid red;
        border-radius: 5px;
        color: black;
        font-family: monospace;
        z-index: 1000;
        max-height: 200px;
        overflow: auto;
        font-size: 14px;
        line-height: 1.4;
    }
    #debug-info h3 {
        margin: 0 0 10px 0;
        color: red;
    }
    #debug-messages {
        white-space: pre-wrap;
    }
    button {
        margin: 5px;
        padding: 8px 16px;
        font-size: 16px;
    }
`;
document.head.appendChild(style);

// Debug log function - make it globally available
window.debugLog = function(message) {
    console.log(message);
    let debugEl = document.getElementById('debug-messages');
    
    // Create debug container if it doesn't exist
    if (!debugEl) {
        const container = document.createElement('div');
        container.id = 'debug-info';
        container.style.cssText = 'position:fixed;top:10px;right:10px;left:10px;background:rgba(255,255,255,0.95);padding:15px;border:2px solid red;z-index:9999;max-height:200px;overflow:auto;';
        container.innerHTML = '<h3 style="margin:0 0 10px 0;color:red;">Debug Info</h3><div id="debug-messages"></div>';
        document.body.appendChild(container);
        debugEl = document.getElementById('debug-messages');
    }
    
    // Add the message
    const line = document.createElement('div');
    line.textContent = message;
    debugEl.appendChild(line);
    debugEl.scrollTop = debugEl.scrollHeight;
};

// Create debug container if it doesn't exist
let debugContainer = document.getElementById('debug-info');
if (!debugContainer) {
    debugContainer = document.createElement('div');
    debugContainer.id = 'debug-info';
    debugContainer.innerHTML = `
        <h3>Debug Information</h3>
        <div id="debug-messages"></div>
    `;
    document.body.appendChild(debugContainer);
}

// Test button click handler
function testButtonClick(buttonName) {
    debugLog(`🔘 ${buttonName} clicked at ${new Date().toLocaleTimeString()}`);
    
    // Visual feedback
    const button = document.getElementById(buttonName);
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 100);
    }
}

// Set up test buttons
function setupTestButtons() {
    const testContainer = document.createElement('div');
    testContainer.style.margin = '20px';
    testContainer.style.padding = '20px';
    testContainer.style.border = '1px solid #ccc';
    testContainer.style.borderRadius = '5px';
    testContainer.innerHTML = `
        <h3>Test Buttons</h3>
        <button id="test-btn-1" onclick="testButtonClick('test-btn-1')">Test Button 1</button>
        <button id="test-btn-2" onclick="testButtonClick('test-btn-2')">Test Button 2</button>
        <button id="test-deal-13" onclick="testButtonClick('test-deal-13')">Test Deal 13</button>
        <button id="test-deal-14" onclick="testButtonClick('test-deal-14')">Test Deal 14</button>
    `;
    document.body.insertBefore(testContainer, document.body.firstChild);
}

// Initialize
debugLog('🔄 Debug script initialized');
setupTestButtons();
debugLog('✅ Test buttons added to the page');

// Try to find and log the deal buttons
const deal13Btn = document.getElementById('deal-13-btn');
const deal14Btn = document.getElementById('deal-14-btn');

debugLog(`🔍 Deal 13 button: ${deal13Btn ? 'Found' : 'Not found'}`);
debugLog(`🔍 Deal 14 button: ${deal14Btn ? 'Found' : 'Not found'}`);

// Try to add click handlers to the original buttons
if (deal13Btn) {
    deal13Btn.onclick = function() {
        debugLog('🃏 Original Deal 13 button clicked!');
        return false;
    };
}

if (deal14Btn) {
    deal14Btn.onclick = function() {
        debugLog('🃏 Original Deal 14 button clicked!');
        return false;
    };
}
