from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import textwrap
import traceback

from core.tiles import Tile, create_tile_from_short_name
from core.hand_templates import HandTemplate, get_template, list_templates

# Create FastAPI app
app = FastAPI(
    title="Mahjongg Hand Analyzer API",
    description="API for analyzing Mahjongg hands against templates",
    version="0.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class TileModel(BaseModel):
    short_name: str

class HandTemplateModel(BaseModel):
    template_id: str
    name: str
    description: str
    category: str
    point_value: int

class HandAnalysisResult(BaseModel):
    template: HandTemplateModel
    is_match: bool
    score: float
    details: Dict[str, Any]

# Helper functions
def format_tile_set(tile_set) -> str:
    """Format a single tile set for display."""
    tile_names = [tile.short_name for tile in tile_set.tiles]
    return f"{tile_set.set_type.value}: {', '.join(tile_names)}"

def format_variation(variation) -> str:
    """Format a single variation for display."""
    return " | ".join(format_tile_set(ts) for ts in variation)

def generate_html_response(title: str, content: str) -> HTMLResponse:
    """Generate a complete HTML response with consistent styling."""
    # Create the HTML template as a regular string with double curly braces
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{title}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
            }}
            .container {{ max-width: 1000px; margin: 0 auto; }}
            .template {{
                background: #f9f9f9;
                border-left: 4px solid #4CAF50;
                padding: 10px 15px;
                margin: 10px 0;
            }}
            .variation {{
                background: white;
                border: 1px solid #ddd;
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
            }}
            .tile-set {{ margin: 5px 0; }}
            .tile {{
                display: inline-block;
                padding: 2px 6px;
                margin: 2px;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 3px;
                font-family: monospace;
            }}
            .nav {{ margin: 20px 0; }}
            .nav a {{
                display: inline-block;
                padding: 8px 15px;
                background: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin-right: 10px;
            }}
            .nav a:hover {{ background: #45a049; }}
            .error {{ color: #d32f2f; }}
            .tile.pair {{ background-color: #e8f5e9; }}
            .tile.pung {{ background-color: #e3f2fd; }}
            .tile.kong {{ background-color: #e8eaf6; }}
            .tile.single {{ background-color: #fff3e0; }}
        </style>
    </head>
    <body>
        <div class="container">
            {content}
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

# API Endpoints
@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with links to templates."""
    try:
        templates = list_templates()
        links = "".join(
            f'<li><a href="/templates/{t.template_id}">{t.name}</a> - {t.description}</li>'
            for t in templates
        )
        return generate_html_response(
            "Mahjongg Hand Templates",
            f"""
            <h1>Mahjongg Hand Templates</h1>
            <p>Available templates:</p>
            <ul>{links}</ul>
            """
        )
    except Exception as e:
        error_details = f"<pre>{traceback.format_exc()}</pre>"
        return generate_html_response(
            "Error",
            f"""
            <h1>Error Loading Templates</h1>
            <p>An error occurred: {str(e)}</p>
            <details>
                <summary>Show traceback</summary>
                {error_details}
            </details>
            """
        )

@app.get("/templates", response_class=HTMLResponse)
async def list_hand_templates():
    """List all available hand templates with links to view variations."""
    templates = list_templates()
    
    template_cards = []
    for template in templates:
        card = f"""
        <div class="template">
            <h2>{template.name} <small>({template.category} #{template.number}, {template.point_value} points)</small></h2>
            <p>{template.description}</p>
            <div class="nav">
                <a href="/templates/{template.template_id}">View Details</a>
                <a href="/templates/{template.template_id}/variations">View Variations</a>
            </div>
        </div>
        """
        template_cards.append(card)
    
    return generate_html_response(
        "Mahjongg Hand Templates",
        """
        <div class="nav">
            <a href="/">← Back to Home</a>
        </div>
        <h1>Available Hand Templates</h1>
        <div class="templates">
            {"".join(template_cards)}
        </div>
        """
    )

def find_template(template_id: str):
    """Helper function to find a template by ID."""
    templates = list_templates()
    for template in templates:
        if template.template_id == template_id:
            return template
    return None

@app.get("/templates/{template_id}", response_class=HTMLResponse)
async def get_hand_template(template_id: str):
    """Display details about a specific hand template with a link to view variations."""
    template = find_template(template_id)
    if not template:
        return generate_html_response(
            "Template Not Found",
            "<h1>Template not found</h1><p>The requested template does not exist.</p>"
        )
    
    return generate_html_response(
        f"Template: {template.name}",
        f"""
        <div class="nav">
            <a href="/templates">← Back to Templates</a>
        </div>
        <div class="template">
            <h1>{template.name} <small>({template.category} #{template.number})</small></h1>
            <p><strong>Points:</strong> {template.point_value}</p>
            <p><strong>Description:</strong> {template.description}</p>
            <div class="nav">
                <a href="/templates/{template_id}/variations">View All Variations</a>
            </div>
        </div>
        """
    )

@app.get("/templates/{template_id}/variations", response_class=HTMLResponse)
async def get_template_variations(template_id: str):
    """Display all variations for a specific hand template in a readable format."""
    template = find_template(template_id)
    if not template:
        return generate_html_response(
            "Template Not Found",
            "<h1>Template not found</h1><p>The requested template does not exist.</p>"
        )
    
    try:
        variations = template.generate_variations()
    except Exception as e:
        error_details = f"<pre>{traceback.format_exc()}</pre>"
        return generate_html_response(
            "Error Generating Variations",
            f"""
            <div class="nav">
                <a href="/templates/{template_id}">← Back to Template</a>
            </div>
            <h1>Error Generating Variations</h1>
            <p class="error">An error occurred while generating variations:</p>
            <pre>{str(e)}</pre>
            <details>
                <summary>Show traceback</summary>
                {error_details}
            </details>
            """
        )
    
    # Format variations for display
    variations_html = []
    for i, variation in enumerate(variations[:100], 1):  # Limit to first 100 variations
        variation_html = f"<div class='variation'><h3>Variation {i}:</h3>"
        
        for tile_set in variation:
            tile_names = [f'<span class="tile {tile_set.set_type.value.lower()}">{tile.short_name}</span>'
                        for tile in tile_set.tiles]
            variation_html += f"""
            <div class="tile-set">
                <strong>{tile_set.set_type.value}:</strong> {" ".join(tile_names)}
            </div>
            """
        variation_html += "</div>"
        variations_html.append(variation_html)
    
    # Add a warning if we're not showing all variations
    if len(variations) > 100:
        variations_html.append(f"<p>... and {len(variations) - 100} more variations not shown</p>")
    
    return generate_html_response(
        f"Variations for {template.name}",
        f"""
        <div class="nav">
            <a href="/templates/{template_id}">← Back to Template</a>
            <a href="/templates">← All Templates</a>
        </div>
        <h1>Variations for {template.name}</h1>
        <p>Showing {min(100, len(variations))} of {len(variations)} variations</p>
        <div class="variations">
            {"".join(variations_html)}
        </div>
        """
    )

@app.post("/analyze/{template_id}", response_model=HandAnalysisResult)
async def analyze_hand(template_id: str, tiles: List[TileModel]):
    """
    Analyze a hand of tiles against a specific template.
    
    Args:
        template_id: ID of the template to analyze against
        tiles: List of tiles in the hand (by short name)
    """
    # Get the template
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Convert short names to Tile objects
    try:
        tile_objects = [create_tile_from_short_name(tile.short_name) for tile in tiles]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check if the hand matches the template
    is_match = template.validate_hand(tile_objects)
    
    # In a real implementation, calculate a more detailed score
    score = 1.0 if is_match else 0.0
    
    return HandAnalysisResult(
        template=template,
        is_match=is_match,
        score=score,
        details={
            "message": "Analysis complete",
            "tile_count": len(tile_objects)
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
