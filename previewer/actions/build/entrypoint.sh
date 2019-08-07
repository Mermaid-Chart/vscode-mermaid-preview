#!/bin/sh

set -e

cd previewer

# Install dependencies and build app
npm install
npm run build

# Copy font-awesome files
mkdir -p dist/vendor/@fortawesome/fontawesome-free-webfonts
cp -r node_modules/@fortawesome/fontawesome-free-webfonts/css/ dist/vendor/@fortawesome/fontawesome-free-webfonts
cp -r node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/ dist/vendor/@fortawesome/fontawesome-free-webfonts

# Cleanup
if [ $1 = "cleanup" ]; then
  rm -rf node_modules .cache
fi
