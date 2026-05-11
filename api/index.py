"""
Vercel Serverless Function Entry Point for Flask App
This file is required for Vercel to properly deploy the Flask backend
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

# Import the Flask app
try:
    from app import app
except ImportError as e:
    print(f"Error importing Flask app: {e}")
    raise

# Export the Flask app for Vercel
__all__ = ['app']
