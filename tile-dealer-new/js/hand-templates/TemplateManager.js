// Using a simple object instead of Map/Set for maximum compatibility
function TemplateManager() {
    this.templates = {};  // name -> template
    this.categories = {};  // category -> true
}

/**
 * Register a new template
 * @param {Object} template - The template to register
 */
TemplateManager.prototype.registerTemplate = function(template) {
    if (!template || !template.name) {
        console.error('Invalid template:', template);
        return;
    }

    this.templates[template.name] = template;
    if (template.category) {
        this.categories[template.category] = true;
    }

    // Generate variations if not already done
    if (!template.variations || template.variations.length === 0) {
        if (typeof template.generateVariations === 'function') {
            template.generateVariations();
        } else {
            template.variations = [];
        }
    }
};

/**
 * Get a template by name
 * @param {string} name - The name of the template to get
 * @returns {Object|undefined}
 */
TemplateManager.prototype.getTemplate = function(name) {
    return this.templates[name];
};

/**
 * Get all templates, optionally filtered by category
 * @param {string} [category] - Optional category to filter by
 * @returns {Array<Object>}
 */
TemplateManager.prototype.getAllTemplates = function(category) {
    const templates = [];
    
    for (const name in this.templates) {
        if (this.templates.hasOwnProperty(name)) {
            const template = this.templates[name];
            if (!category || template.category === category) {
                templates.push(template);
            }
        }
    }
    
    return templates;
};

/**
 * Get all available categories
 * @returns {Array<string>}
 */
TemplateManager.prototype.getCategories = function() {
    return Object.keys(this.categories).sort();
};

// Create a singleton instance
var templateManager = new TemplateManager();

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TemplateManager: TemplateManager,
        templateManager: templateManager
    };
}
// Export for browsers
else if (typeof window !== 'undefined') {
    window.TemplateManager = TemplateManager;
    window.templateManager = templateManager;
}
