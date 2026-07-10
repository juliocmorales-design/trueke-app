#!/usr/bin/env bash

set -euo pipefail

echo "==> Installing project dependencies..."
npm install

echo ""
echo "==> Installing global developer tools..."

npm install -g @anthropic-ai/claude-code
npm install -g vercel
npm install -g supabase@latest

echo ""
echo "==> Installed versions"

node --version
npm --version
claude --version
vercel --version
supabase --version

echo ""
echo "✅ Development environment ready!"
