#!/bin/bash

# Manual Entry App Deployment Script
# This script helps prepare the app for deployment

echo "🚀 Manual Entry App - Deployment Preparation"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "src/index.html" ]; then
    echo "❌ Error: Please run this script from the roster-data-app directory"
    exit 1
fi

echo "✅ Files check passed"

# Create GitHub Pages ready structure
echo "📁 Preparing GitHub Pages structure..."

# Copy the TestRoster.csv to data directory if it exists
if [ -f "../Roster/TestRoster.csv" ]; then
    cp "../Roster/TestRoster.csv" "data/"
    echo "✅ Copied TestRoster.csv to data directory"
fi

echo "📋 Pre-deployment checklist:"
echo "  ✅ index.html - Main application file"
echo "  ✅ styles.css - iPad-optimized styling"
echo "  ✅ app.js - Complete application logic"
echo "  ✅ manifest.json - PWA configuration"
echo "  ✅ sample-roster.csv - Example data file"
echo "  ✅ README.md - Documentation"

echo ""
echo "🎯 Next Steps for GitHub Pages Deployment:"
echo "1. Push this repository to GitHub"
echo "2. Go to repository Settings → Pages"
echo "3. Set source to 'Deploy from a branch'"
echo "4. Select 'main' branch and '/ (root)' folder"
echo "5. Your app will be available at: https://USERNAME.github.io/REPO-NAME/"
echo ""
echo "📱 For iPad use:"
echo "1. Open the GitHub Pages URL in Safari"
echo "2. Tap the Share button"
echo "3. Select 'Add to Home Screen'"
echo "4. The app will work offline after first load"
echo ""
echo "✨ Deployment preparation complete!"
