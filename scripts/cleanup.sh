#!/usr/bin/env bash
# Free disk after a project: lists what can go, with sizes; deletes nothing unless asked.
# usage: bash scripts/cleanup.sh <name>            # dry run: SAFE and OPTIONAL lists with sizes
#        bash scripts/cleanup.sh <name> --safe     # delete SAFE items (all regenerable scratch)
#        bash scripts/cleanup.sh <name> --all      # delete SAFE + OPTIONAL items (keeps the final video, code, sources)
# Never touched: out/<name>/<final>.mp4, out/<name>/NOTES.md / PUBLISH.md / thumbs, projects/<name>/SCRIPT.md,
# VOICEOVER.txt, voice.mp3, words.json, captions.json, src/, library/, ledger/, public/fonts.
cd "$(dirname "$0")/.." || exit 1
name="$1"; mode="${2:-dry}"
[ -z "$name" ] && { echo "usage: bash scripts/cleanup.sh <name> [--safe|--all]"; exit 1; }
if pgrep -f "remotion (render|still)|bridge-stills|render.mjs" >/dev/null; then
  echo "A render is running: Remotion temp folders are left alone."; busy=1
fi
SAFE=(); OPT=()
for p in tmp/remotion-webpack-bundle-* tmp/react-motion-render* tmp/puppeteer_dev_chrome_profile-* tmp/remotion-v4* tmp/remotion-*-assets*; do
  [ -e "$p" ] && [ -z "$busy" ] && SAFE+=("$p"); done
for p in tmp/venv tmp/hf tmp/*.f32 tmp/*.txt tmp/*backup* tmp/patch out/_tests/* public/_render/* "out/$name/stills" "out/$name/qa/sheet_"*.jpg "out/$name/qa/perframe.npz" \
         "out/$name/"*_silent.mp4 "out/$name/render_progress.json" src/sandboxes backup; do
  [ -e "$p" ] && SAFE+=("$p"); done
for p in "out/$name/master_nocaptions.mp4" "projects/$name/audio/stem_"*.wav "projects/$name/voice/voice.wav"; do
  [ -e "$p" ] && OPT+=("$p"); done
show() { local t=0; for p in "$@"; do s=$(du -sk "$p" 2>/dev/null | cut -f1); t=$((t + s)); printf "  %8s  %s\n" "$(du -sh "$p" 2>/dev/null | cut -f1)" "$p"; done; echo "  total: $((t / 1024)) MB"; }
echo "SAFE to delete (scratch, rebuilt automatically when needed):"; show "${SAFE[@]}"
echo "OPTIONAL (kept by default: re-mix stems, the uncaptioned master, the 48 kHz voice copy of voice.mp3):"; show "${OPT[@]}"
case "$mode" in
  --safe) rm -rf "${SAFE[@]}"; echo "deleted SAFE items." ;;
  --all)  rm -rf "${SAFE[@]}" "${OPT[@]}"; echo "deleted SAFE + OPTIONAL items." ;;
  *) echo "(dry run: nothing deleted; add --safe or --all)" ;;
esac
bash tidy.sh >/dev/null 2>&1
df -h . | tail -1 | awk '{print "drive free: " $4}'
