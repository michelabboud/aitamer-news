#!/usr/bin/env python3
"""Generate Big Top house-owned section cover SVGs into public/covers/."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "covers"

INK = "#241c30"
CREAM = "#fff8f0"

SECTIONS = {
    "top": ("#ff6b8a", "#ffe0e8"),
    "models": ("#7eb6ff", "#dceeff"),
    "tools": ("#7ddea0", "#d9f5e4"),
    "image": ("#ff9ec4", "#ffe0ee"),
    "video": ("#ffe38a", "#fff6d0"),
    "data": ("#5ec8c0", "#d4f4f1"),
    "databases": ("#c4b0ff", "#ebe4ff"),
    "rust": ("#ff9a5c", "#ffe4d4"),
    "policy": ("#6b7cff", "#dde2ff"),
    "opinion": ("#d4c4f0", "#efe8fa"),
}


def svg(section: str, accent: str, soft: str) -> str:
    bg = soft if section in ("video", "opinion") else CREAM
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" role="img" aria-label="Generated cover art ({section} motif). Not a photo.">
<!-- Big Top house cover — {section}. Legal: original geometric art, not a photo. -->
<rect width="1600" height="900" fill="{bg}"/>
<rect x="48" y="48" width="1504" height="804" rx="48" fill="none" stroke="{INK}" stroke-width="3" opacity=".12"/>
<rect x="430" y="250" width="520" height="360" rx="40" fill="{INK}" opacity=".16"/>
<rect x="420" y="240" width="520" height="360" rx="40" fill="{soft}" stroke="{INK}" stroke-width="8"/>
<circle cx="1010" cy="310" r="100" fill="{INK}" opacity=".16"/>
<circle cx="1000" cy="300" r="100" fill="{accent}" stroke="{INK}" stroke-width="8"/>
<rect x="980" y="460" width="280" height="120" rx="60" fill="{INK}" opacity=".16"/>
<rect x="970" y="450" width="280" height="120" rx="60" fill="{CREAM}" stroke="{INK}" stroke-width="7"/>
<rect x="280" y="520" width="140" height="140" rx="32" fill="{INK}" opacity=".16"/>
<rect x="270" y="510" width="140" height="140" rx="32" fill="{accent}" stroke="{INK}" stroke-width="7"/>
<g stroke="{accent}" stroke-width="4" stroke-linecap="round" opacity=".5">
<line x1="140" y1="120" x2="160" y2="120"/><line x1="150" y1="110" x2="150" y2="130"/>
<line x1="1440" y1="780" x2="1460" y2="780"/><line x1="1450" y1="770" x2="1450" y2="790"/>
</g>
</svg>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for section, (accent, soft) in SECTIONS.items():
        (OUT / f"{section}.svg").write_text(svg(section, accent, soft))
        print(f"wrote {section}.svg")


if __name__ == "__main__":
    main()
