import sys
import os
from pathlib import Path

# Add the root directory and backend directory to sys.path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))
sys.path.append(str(root_dir / "backend"))

# Set NLTK data path to /tmp for Vercel serverless environment
os.environ['NLTK_DATA'] = '/tmp/nltk_data'

# Ensure the nltk_data directory exists
os.makedirs('/tmp/nltk_data', exist_ok=True)

# Now we can import the app
try:
    from backend.app import app
except ImportError:
    from app import app

# This is required for Vercel to handle the app as a serverless function
application = app
