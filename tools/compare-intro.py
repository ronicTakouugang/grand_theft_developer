"""Side-by-side: reference recording frame vs our capture at the same intro time.

  python tools/compare-intro.py <video> <t0_seconds> <ourPrefix> <t1,t2,...> <out.png> [thumbW=640]

t0 is the moment the live loader fired "fadeout" in the recording; our captures
(tools/capture-intro.mjs) are named <ourPrefix>-<t>.png with t after fadeout.
Left = recording, right = ours. Each row is stamped with t and the frame number.
"""
import sys
import cv2
import numpy as np

video, t0, prefix, times, out = sys.argv[1:6]
tw = int(sys.argv[6]) if len(sys.argv) > 6 else 640
t0 = float(t0)
cap = cv2.VideoCapture(video)
fps = cap.get(cv2.CAP_PROP_FPS)
rows = []
for t in [float(x) for x in times.split(",")]:
    frame = round((t0 + t) * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame)
    ok, ref = cap.read()
    ours = cv2.imread(f"{prefix}-{t:.2f}.png")
    tiles = []
    for img in (ref, ours):
        h, w = img.shape[:2]
        tiles.append(cv2.resize(img, (tw, int(h * tw / w)), interpolation=cv2.INTER_AREA))
    hh = min(x.shape[0] for x in tiles)
    row = np.hstack([x[:hh] for x in tiles])
    label = f"t={t:.2f}s  ref frame #{frame}"
    cv2.putText(row, label, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
    cv2.putText(row, label, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 1)
    rows.append(row)
cv2.imwrite(out, np.vstack(rows))
print("->", out)
