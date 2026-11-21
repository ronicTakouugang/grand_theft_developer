"""Re-cut the hero logo layers for the intro.

Our logo-vi layer has a dark, wordmark-shaped "hole" baked in (there is no VI
art under the wordmark in the source). In the intro the VI fades in before the
wordmark wipes down over it, so that hole showed as dark blocks.

This moves every logo-vi pixel that lies inside the wordmark's footprint
(logo-gta alpha > 0) into the wordmark layer, underneath the letters:
  logo-vi-open.webp     = logo-vi outside the footprint
  logo-gta-backed.webp  = logo-gta over (logo-vi inside the footprint)
The regions are disjoint, so open + backed composite to exactly
logo-vi + logo-gta (checked below), and the poster swap at the end of the intro
still matches pixel for pixel.

  python tools/split-logo-hole.py [src/assets/site/hero]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(sys.argv[1] if len(sys.argv) > 1 else "src/assets/site/hero")


def over(top, bottom):
    """Porter-Duff 'over' on float RGBA arrays (straight alpha, 0..1)."""
    ta, ba = top[..., 3:4], bottom[..., 3:4]
    a = ta + ba * (1 - ta)
    rgb = np.where(a > 0, (top[..., :3] * ta + bottom[..., :3] * ba * (1 - ta)) / np.maximum(a, 1e-8), 0)
    return np.concatenate([rgb, a], axis=-1)


for kind in ("desktop", "mobile"):
    d = root / kind
    vi = np.asarray(Image.open(d / "logo-vi.avif").convert("RGBA")).astype(np.float64) / 255
    gta = np.asarray(Image.open(d / "logo-gta.avif").convert("RGBA")).astype(np.float64) / 255
    footprint = gta[..., 3] > 0

    vi_open = vi.copy()
    vi_open[footprint] = 0
    vi_inside = np.zeros_like(vi)
    vi_inside[footprint] = vi[footprint]
    backed = over(gta, vi_inside)

    # the split must not change the final composite
    before = over(gta, vi)
    after = over(backed, vi_open)
    err = np.abs(before - after).max() * 255
    assert err < 1.0, f"{kind}: composite changed by {err:.2f}"

    to_img = lambda a: Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8), "RGBA")
    to_img(vi_open).save(d / "logo-vi-open.webp", lossless=True, quality=100, method=6)
    to_img(backed).save(d / "logo-gta-backed.webp", lossless=True, quality=100, method=6)
    print(f"{kind}: wrote logo-vi-open.webp + logo-gta-backed.webp (max composite error {err:.3f}/255, "
          f"{footprint.sum()} px moved)")

