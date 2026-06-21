#!/bin/bash
echo ""
echo " ========================================"
echo "  Flying Sword - AI DEV OS"
echo "  Local Mac/Linux Setup"
echo " ========================================"
echo ""

echo "[1/4] Preparing package.json..."
cp package.local.json package.json
echo "      OK"

echo "[2/4] Creating assets folder..."
mkdir -p src/assets
echo "      OK"

echo "[3/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "ERROR: npm install failed. Try: npm install --legacy-peer-deps"
  exit 1
fi
echo "      OK"

echo "[4/4] Setup complete!"
echo ""
echo " ========================================"
echo "  Starting dev server..."
echo "  Frontend: http://localhost:5173"
echo "  Dashboard: http://localhost:5173/os"
echo ""
echo "  Make sure your backend runs at:"
echo "  http://localhost:9999"
echo " ========================================"
echo ""
npm run dev
