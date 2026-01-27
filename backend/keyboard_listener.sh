#!/bin/bash
# Keyboard listener service startup script

cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the keyboard listener
python -m app.services.keyboard_listener
