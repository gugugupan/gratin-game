# usage: python3 compose-video.py <raw-dir> <start-s> <end-s> <endcard.png> <out.mp4>
# raw-dir comes from record-lemon.mjs / record-clickton.mjs; times are seconds from the first captured frame.
import json, sys, os, subprocess
raw, start, end, card, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5]
CARD, XF = 2.4, 0.4
# -22 LUFS: the user found -16 too loud for a timeline that autoplays.
LOUDNESS = -22
m = json.load(open(f"{raw}/meta.json")); fr = m["frames"]; t0 = fr[0]
# Screencast frames arrive out of order; sort and drop non-increasing timestamps.
sel = sorted((i for i, t in enumerate(fr) if start - 0.2 <= t - t0 <= end + 0.2), key=lambda i: fr[i])
sel = [i for k, i in enumerate(sel) if k + 1 == len(sel) or fr[sel[k + 1]] > fr[i]]
lines = ["ffconcat version 1.0"]
for k, i in enumerate(sel):
    nxt = fr[sel[k + 1]] if k + 1 < len(sel) else fr[i] + 0.01
    lines += [f"file 'frames/{i:05d}.jpg'", f"duration {nxt - fr[i]:.4f}"]
open(f"{raw}/list.txt", "w").write("\n".join(lines) + "\n")
vstart = fr[sel[0]] - t0
lead = t0 - m["audioStart"]
dur = end - start
total = dur + CARD - XF
afiles = sorted(x for x in os.listdir(raw) if x.startswith("audio"))
ain = []
for f in afiles:
    ain += ["-ss", f"{start + lead:.3f}", "-i", f"{raw}/{f}"]
n = len(afiles)
mix = "".join(f"[{i+2}:a]" for i in range(n)) + (f"amix=inputs={n}:normalize=0," if n > 1 else "anull,")
fc = (f"[0:v]trim=start={start - vstart:.3f}:duration={dur:.3f},setpts=PTS-STARTPTS,fps=30,scale=1080:1080:flags=lanczos,format=yuv420p,setsar=1[g];"
      f"[1:v]fps=30,scale=1080:1080,format=yuv420p,setsar=1,trim=duration={CARD}[c];"
      f"[g][c]xfade=transition=fade:duration={XF}:offset={dur - XF:.3f},format=yuv420p[v];"
      f"{mix}apad,atrim=duration={total:.3f},loudnorm=I={LOUDNESS}:TP=-2:LRA=11,afade=t=in:d=0.05,afade=t=out:st={total - 1.6:.3f}:d=1.6[a]")
cmd = ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{raw}/list.txt", "-loop", "1", "-t", str(CARD), "-i", card, *ain,
       "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-profile:v", "high", "-crf", "18", "-preset", "slow",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height", "-of", "compact", out], capture_output=True, text=True).stdout)
