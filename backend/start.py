
#!/usr/bin/env python3
"""
Simple startup script for the Flask backend
Run with: python start.py
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing Flask backend requirements...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Requirements installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        sys.exit(1)

def start_server():
    """Start the Flask server"""
    print("Starting Flask backend server...")
    print("🚀 Server will be available at: http://localhost:5000")
    print("📡 API endpoints will be at: http://localhost:5000/api/")
    print("🔑 Login with any username/password (temporary bypass)")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        from app import app
        app.run(debug=True, port=5000, host='0.0.0.0')
    except ImportError:
        print("❌ Could not import Flask app. Make sure requirements are installed.")
        install_requirements()
        from app import app
        app.run(debug=True, port=5000, host='0.0.0.0')

if __name__ == '__main__':
    # Check if we're in the backend directory
    if not os.path.exists('app.py'):
        print("❌ Please run this script from the backend directory")
        print("Usage: cd backend && python start.py")
        sys.exit(1)
    
    # Install requirements if needed
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt not found")
        sys.exit(1)
    
    # Check if Flask is installed
    try:
        import flask
        print("✅ Flask is already installed")
    except ImportError:
        install_requirements()
    
    # Start the server
    start_server()
