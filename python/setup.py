#!/usr/bin/env python3
"""
Setup script for JobSpark AI Python environment
"""

import os
import sys
import subprocess

def run_command(command):
    """Run shell command and return result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error running command: {command}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"Exception running command: {command}")
        print(f"Exception: {str(e)}")
        return False

def setup_python_env():
    """Set up Python environment"""
    print("Setting up JobSpark AI Python environment...")
    
    # Check if Python is available
    if not run_command("python3 --version"):
        print("Error: Python 3 is not installed or not available")
        return False
    
    # Install requirements
    print("Installing Python dependencies...")
    if not run_command("pip3 install -r requirements.txt"):
        print("Error: Failed to install requirements")
        return False
    
    # Download NLTK data
    print("Setting up NLTK data...")
    import nltk
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
    except Exception as e:
        print(f"Warning: NLTK setup failed: {e}")
    
    print("Python environment setup complete!")
    return True

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    
    if not os.path.exists(env_path):
        print("Creating .env file...")
        with open(env_path, 'w') as f:
            f.write("""# JobSpark AI Environment Variables

# OpenAI Configuration
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4o-mini

# Python Environment
PYTHON_PATH=/usr/bin/python3

# File Processing
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,doc,txt
""")
        print("Created .env file with default configuration")

if __name__ == "__main__":
    create_env_file()
    if setup_python_env():
        print("\n✅ Setup complete! You can now use the CV parser.")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)