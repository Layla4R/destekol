"""Generate print-ready kit QR assets. Development tools: reportlab and Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel

URL = "https://destekol.org/kit"
COLOR = "#063962"
QUIET_ZONE = 4
SCALE = 32


def main():
    qr = QRCode(None, QRErrorCorrectLevel.H)
    qr.addData(URL)
    qr.make()
    size = qr.moduleCount + QUIET_ZONE * 2
    output = Path(__file__).resolve().parent.parent / "public" / "kit"
    output.mkdir(parents=True, exist_ok=True)
    png = Image.new("RGB", (size * SCALE, size * SCALE), "white")
    draw = ImageDraw.Draw(png)
    paths = []
    for row in range(qr.moduleCount):
        for col in range(qr.moduleCount):
            if not qr.modules[row][col]:
                continue
            x, y = col + QUIET_ZONE, row + QUIET_ZONE
            draw.rectangle((x * SCALE, y * SCALE, (x + 1) * SCALE - 1, (y + 1) * SCALE - 1), fill=COLOR)
            paths.append(f"M{x},{y}h1v1h-1z")
    png.save(output / "destekol-kit-qr.png", dpi=(300, 300))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size * SCALE}" height="{size * SCALE}" viewBox="0 0 {size} {size}" role="img" aria-labelledby="title description" shape-rendering="crispEdges">
  <title id="title">Destekol Digital Marketing Kit QR code</title>
  <desc id="description">Scan to open {URL}</desc>
  <rect width="{size}" height="{size}" fill="#fff"/>
  <path d="{"".join(paths)}" fill="{COLOR}"/>
</svg>
'''
    (output / "destekol-kit-qr.svg").write_text(svg, encoding="utf-8")
    print(f"Generated PNG and SVG: {URL}; {qr.moduleCount} modules; error correction H; {size * SCALE}px")


if __name__ == "__main__":
    main()
