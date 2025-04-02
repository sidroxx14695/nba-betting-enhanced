#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).parent))

from backend.app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)


