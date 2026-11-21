"""Frame tools for the reference recordings (motion is checked frame by frame).

  python tools/frames.py sheet <video> <out.png> <start> <end> <step> [cols=4] [thumbW=480]
      contact sheet of frames start..end every <step>, each stamped "#frame t=sec"
  python tools/frames.py grab <video> <outdir> <frame> [frame ...]
      full-size PNGs of individual frames
  python tools/frames.py diff <video> [start] [end]
      per-frame mean absolute change (find when motion starts/stops)
"""
import sys, os
import cv2
import numpy as np


def open_video(path):
    c = cv2.VideoCapture(path)
    if not c.isOpened():
        sys.exit(f"cannot open {path}")
    return c, c.get(cv2.CAP_PROP_FPS)


def read(c, i):
    c.set(cv2.CAP_PROP_POS_FRAMES, i)
    ok, f = c.read()
    return f if ok else None


def sheet(video, out, start, end, step, cols=4, tw=480):
    c, fps = open_video(video)
    tiles = []
    for i in range(start, end + 1, step):
        f = read(c, i)
        if f is None:
            break
        h, w = f.shape[:2]
        t = cv2.resize(f, (tw, int(h * tw / w)), interpolation=cv2.INTER_AREA)
        cv2.putText(t, f"#{i} t={i / fps:.3f}", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 4)
        cv2.putText(t, f"#{i} t={i / fps:.3f}", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
        tiles.append(t)
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[r:r + cols]) for r in range(0, len(tiles), cols)]
    cv2.imwrite(out, np.vstack(rows))
    print("->", out, len(tiles), "tiles")


def grab(video, outdir, frames):
    c, fps = open_video(video)
    os.makedirs(outdir, exist_ok=True)
    for i in frames:
        f = read(c, i)
        p = os.path.join(outdir, f"frame-{i:04d}.png")
        cv2.imwrite(p, f)
        print("->", p)


def diff(video, start=0, end=None):
    c, fps = open_video(video)
    n = int(c.get(cv2.CAP_PROP_FRAME_COUNT))
    end = n - 1 if end is None else end
    c.set(cv2.CAP_PROP_POS_FRAMES, start)
    prev = None
    for i in range(start, end + 1):
        ok, f = c.read()
        if not ok:
            break
        g = cv2.cvtColor(cv2.resize(f, (320, 180)), cv2.COLOR_BGR2GRAY).astype(np.float32)
        if prev is not None:
            d = float(np.mean(np.abs(g - prev)))
            print(f"{i:4d} t={i / fps:7.3f} d={d:6.2f} mean={g.mean():6.1f} " + "#" * int(min(d, 60)))
        prev = g


if __name__ == "__main__":
    cmd, *a = sys.argv[1:]
    if cmd == "sheet":
        sheet(a[0], a[1], int(a[2]), int(a[3]), int(a[4]), *(int(x) for x in a[5:7]))
    elif cmd == "grab":
        grab(a[0], a[1], [int(x) for x in a[2:]])
    elif cmd == "diff":
        diff(a[0], *(int(x) for x in a[1:3]))
