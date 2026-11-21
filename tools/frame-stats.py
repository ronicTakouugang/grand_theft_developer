"""Brightness of each recorded frame (tools/record-load.mjs output).

  python tools/frame-stats.py <dir> [every=1]

Flags frames that are near-black or flat (a blank screen): mean < 8 or the
whole frame within 6 levels of one colour.
"""
import sys, glob, os
import cv2

d = sys.argv[1]
every = int(sys.argv[2]) if len(sys.argv) > 2 else 1
files = sorted(glob.glob(os.path.join(d, "frame-*.jpg")))
blank = 0
for i, f in enumerate(files):
    g = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY)
    flat = int(g.max()) - int(g.min()) <= 6
    bad = g.mean() < 8 or flat
    blank += bad
    if bad or i % every == 0:
        ms = os.path.basename(f)[6:-4]
        print(f"{ms}ms mean {g.mean():5.1f} range {g.min()}-{g.max()}{'  <-- BLANK/FLAT' if bad else ''}")
print(f"{len(files)} frames, {blank} blank/flat")
