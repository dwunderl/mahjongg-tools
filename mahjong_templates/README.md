# Mahjong Hand Templates

This project generates Mahjong hand templates in JSON format for use in Mahjong games.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Generate the templates:
```bash
python generate_templates.py
```

This will create a `hand_templates.json` file with all the defined templates.

## Adding New Templates

1. Create a new Python file in `mtg/templates/`
2. Define a function that returns a `HandTemplate` object
3. Import and add it to the `generate_all_templates()` function in `generate_templates.py`
