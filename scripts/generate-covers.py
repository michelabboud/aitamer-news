#!/usr/bin/env python3
"""Document / regenerate Big Top house SVG covers.

Canonical desk fills + motifs (from bigtop-tokens.md):
  top rings, models layers, tools blocks, image lenses, video film,
  data bars, databases cylinders, rust hex, policy columns, opinion speech.

SVGs live at public/covers/{slug}.svg. Soft warm --shadow-tint (#e7d9ea) depth,
dark plum outlines (#241c30), pastel section fills. Legal: house geometric art.
"""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "covers"
SECTIONS = [
    "top", "models", "tools", "image", "video",
    "data", "databases", "rust", "policy", "opinion",
]

def main() -> None:
    missing = [s for s in SECTIONS if not (OUT / f"{s}.svg").exists()]
    present = [s for s in SECTIONS if (OUT / f"{s}.svg").exists()]
    print(f"present={len(present)} missing={missing or 'none'}")
    for s in present:
        print(f"  {s}: {(OUT / f'{s}.svg').stat().st_size} bytes")

if __name__ == "__main__":
    main()
