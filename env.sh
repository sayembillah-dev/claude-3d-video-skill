# Source this before any render or tool run: `source env.sh`
# Keeps all Remotion temp bundles on this drive and puts the project's Python tools first on PATH.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
mkdir -p "$ROOT/tmp"
export REMOTION_TMP="$ROOT/tmp" TMPDIR="$ROOT/tmp" TEMP="$ROOT/tmp" TMP="$ROOT/tmp"
export SHORTS_ROOT="$ROOT"
export HF_HOME="$ROOT/.venv/hf"           # speech-to-text model cache (faster-whisper), recreated by setup.sh
[ -x "$ROOT/.venv/bin/python" ] && export PATH="$ROOT/.venv/bin:$PATH"
