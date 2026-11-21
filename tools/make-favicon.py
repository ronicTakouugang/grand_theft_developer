"""Cut the favicon set from our own logo poster.

The live site declares a single 48x48 favicon.ico; we ship the same, plus a
180x180 apple-touch-icon. The logo is placed whole, centred on a transparent
square (never upscaled past the source).

Usage: python tools/make-favicon.py [src=src/assets/brand/logo-poster.png] [out=public]
"""
import sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1] if len(sys.argv) > 1 else "src/assets/brand/logo-poster.png")
out = Path(sys.argv[2] if len(sys.argv) > 2 else "public")
out.mkdir(parents=True, exist_ok=True)

logo = Image.open(src).convert("RGBA")
logo = logo.crop(logo.getbbox())  # trim transparent margin
side = max(logo.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(logo, ((side - logo.width) // 2, (side - logo.height) // 2), logo)

square.save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
square.resize((180, 180), Image.LANCZOS).save(out / "apple-touch-icon.png", optimize=True)
print("wrote", out / "favicon.ico", out / "apple-touch-icon.png")
