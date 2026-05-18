#!/bin/bash

echo ""
echo "========================================"
echo "  Telugu Trader Mindset - Launcher"
echo "  Professional Trading Journal v2.0"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please download and install Node.js from: https://nodejs.org/"
    echo "(Download the LTS version)"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

# Display Node version
echo "Node.js found:"
node --version
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (this may take a few minutes)..."
    echo ""
    npm install
    echo ""
fi

# Start the application
echo "Starting Trading Journal Pro..."
echo ""
echo "The app will launch in development mode."
echo "React dev server: http://localhost:3000"
echo ""
npm run dev
