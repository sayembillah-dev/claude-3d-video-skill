#!/usr/bin/env bash
# Run once on each new machine (and after copying the SSD to a different OS): bash setup.sh
# Installs node_modules and the Python tools (.venv) inside this folder only. Both are platform-specific, so a new
# machine always reinstalls them; everything else (code, library/, fonts, projects, ledger) is portable as is.
cd "$(dirname "$0")" || exit 1
missing=0
for c in node npm python3 ffmpeg ffprobe; do command -v $c >/dev/null || { echo "MISSING: $c"; missing=1; }; done
[ $missing = 1 ] && { echo "Install the missing tools (macOS: brew install node python ffmpeg; Windows: winget install OpenJS.NodeJS Python.Python.3.12 Gyan.FFmpeg), then rerun."; exit 1; }
source ./env.sh
npm install || exit 1
if ! .venv/bin/python -c "import numpy, scipy, PIL, faster_whisper" 2>/dev/null; then
  rm -rf .venv && python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt || exit 1
fi
[ -f public/fonts/Montserrat-Variable.ttf ] || echo "NOTE: caption font missing in public/fonts (see library/README.md)."
echo "Ready. Open Claude Code in $(pwd); run 'source env.sh' before rendering."
