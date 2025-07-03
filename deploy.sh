#!/bin/bash

# STAFF_PULSE Deployment Script for Netlify
echo "🚀 Deploying STAFF_PULSE to Netlify..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Deploy STAFF_PULSE to Netlify"
fi
git commit -m "$commit_message"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Setting up GitHub remote..."
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Next steps:"
echo "1. Go to https://netlify.com and login"
echo "2. Click 'New site from Git'"
echo "3. Choose your GitHub repository"
echo "4. Set build command: npm run build"
echo "5. Set publish directory: .next"
echo "6. Add environment variables from .env.example"
echo "7. Deploy!"
echo ""
echo "📖 See NETLIFY_DEPLOYMENT.md for detailed instructions"
