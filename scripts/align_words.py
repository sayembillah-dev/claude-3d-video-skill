# Word timings for a project's voice-over: speech-to-text word times (faster-whisper, local, free) mapped onto the
# exact words of the script, so captions and shots use the script's spelling and punctuation.
# usage: .venv/bin/python scripts/align_words.py <name> [--model tiny.en|base.en]
#   reads  projects/<name>/voice/voice.mp3 (or voice.wav) and projects/<name>/VOICEOVER.txt
#   writes projects/<name>/voice/voice.wav (48 kHz mono, what the mix uses) and voice/words.json
#          [{word, start, end, line}] (line = script line index), prints line starts in seconds and frames @30
# Unmatched words (the reader skipped, added or changed one) are interpolated and listed so they can be hand-fixed.
import difflib, json, os, re, subprocess, sys
import numpy as np

name = sys.argv[1]
model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "tiny.en"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdir = os.path.join(root, "projects", name)
vdir = os.path.join(pdir, "voice")
src = next((os.path.join(vdir, f) for f in ("voice.mp3", "voice.m4a", "voice.wav") if os.path.exists(os.path.join(vdir, f))), None)
if not src:
    sys.exit(f"no voice file in {vdir} (expected voice.mp3)")
os.environ.setdefault("HF_HOME", os.path.join(root, ".venv", "hf"))
if not src.endswith("voice.wav"):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ar", "48000", "-ac", "1", os.path.join(vdir, "voice.wav")], check=True)
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.float32)
dur = len(audio) / 16000

from faster_whisper import WhisperModel
m = WhisperModel(model, device="cpu", compute_type="int8", download_root=os.environ["HF_HOME"])
segs, _ = m.transcribe(audio, word_timestamps=True, language="en")
asr = [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]

lines = [l.strip() for l in open(os.path.join(pdir, "VOICEOVER.txt"), encoding="utf-8") if l.strip()]
toks = [(w, n) for n, l in enumerate(lines) for w in l.split()]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
num = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
       "20": "twenty", "30": "thirty", "40": "forty", "50": "fifty", "60": "sixty", "70": "seventy", "80": "eighty", "90": "ninety", "100": "hundred"}
key = lambda w: num.get(norm(w), norm(w))
A, B = [key(t[0]) for t in toks], [key(a["w"]) for a in asr]
out = [None] * len(toks)
for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
    for k in range(blk.size):
        out[blk.a + k] = (asr[blk.b + k]["s"], asr[blk.b + k]["e"])
missing = [i for i, o in enumerate(out) if o is None]
# interpolate unmatched words between their matched neighbours
for i in missing:
    lo = next((out[j][1] for j in range(i - 1, -1, -1) if out[j]), 0.0)
    hi = next((out[j][0] for j in range(i + 1, len(out)) if out[j]), dur)
    out[i] = (lo, min(hi, lo + 0.35))
words = [{"word": w, "start": round(o[0], 3), "end": round(o[1], 3), "line": n} for (w, n), o in zip(toks, out)]
json.dump(words, open(os.path.join(vdir, "words.json"), "w"), indent=0)
print(f"{len(words)} script words, {len(asr)} heard, {len(missing)} interpolated, voice {dur:.2f} s -> TOTAL ~{int(np.ceil((dur + 0.5) * 30))} frames")
for i in missing:
    print(f"  CHECK word {i} '{toks[i][0]}' (line {toks[i][1]}) ~{out[i][0]:.2f} s")
for n in range(len(lines)):
    ws = [w for w in words if w["line"] == n]
    print(f"  line {n:2d}  {ws[0]['start']:6.2f} s  f{round(ws[0]['start'] * 30):5d}  {lines[n][:50]}")
