#!/bin/bash
# Script to push to GitHub

echo "🚀 Pushing to GitHub..."

# Make sure we're on main branch
git checkout main 2>/dev/null || git branch -M main

# Push to GitHub
git push -u origin main

echo ""
echo "✅ Done! If you see an error, you may need to:"
echo "   1. Create the repository at: https://github.com/new"
echo "   2. Name it: aster.github.io"
echo "   3. Don't initialize with README"
echo "   4. Then run this script again"

