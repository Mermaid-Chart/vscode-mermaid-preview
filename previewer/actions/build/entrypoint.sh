#!/bin/sh

set -e

cd previewer

# Install dependencies and build app
npm install
npm run build

# Copy font-awesome files
mkdir -p dist/vendor/font-awesome/css
cp node_modules/font-awesome/css/font-awesome.min.css dist/vendor/font-awesome/css/
cp node_modules/font-awesome/css/font-awesome.css.map dist/vendor/font-awesome/css/
cp -r node_modules/font-awesome/fonts dist/vendor/font-awesome/

# Cleanup
if [ $1 = "cleanup" ]; then
  rm -rf node_modules .cache
fi
