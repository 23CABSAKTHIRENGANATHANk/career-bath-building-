import sys
import os
from pathlib import Path

# Add the root directory to sys.path so we can import from backend
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir / "backend"))

# Set NLTK data path to /tmp for Vercel serverless environment
os.environ['NLTK_DATA'] = '/tmp/nltk_data'

# Now we can import the app
# pyrefly: ignore [missing-import]
from app import app

# This is required for Vercel to handle the app as a serverless function
# Vercel looks for the 'app' or 'application' variable by default
application = app
