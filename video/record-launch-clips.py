#!/usr/bin/env python3
"""Record the two clips the launch video needs beyond record-clips.py:
VOLERA (particle morph, driven cursor + click-to-morph) and the redesigned
showcase hero (dark particle field). Same conventions as record-clips.py."""
import math
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, '..', 'docs')
OUT = os.path.join(HERE, 'public', 'clips')
PORT = 8654

os.makedirs(OUT, exist_ok=True)
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--directory', DOCS],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)

from playwright.sync_api import sync_playwright  # noqa: E402


def sweep_mouse(pg, seconds, cx=800, cy=450, rx=500, ry=220, steps_per_s=30):
    steps = int(seconds * steps_per_s)
    for i in range(steps):
        a = (i / steps) * 2 * math.pi
        pg.mouse.move(cx + rx * math.sin(a), cy + ry * math.sin(2 * a) / 1.5)
        pg.wait_for_timeout(int(1000 / steps_per_s))


def volera(pg):
    # sweep through the flock, then click twice so the morphs land in-clip
    sweep_mouse(pg, 4, cx=1000, cy=430, rx=380, ry=200)
    pg.mouse.click(1300, 780)          # empty corner: triggers morph, no UI hit
    sweep_mouse(pg, 4, cx=1000, cy=430, rx=380, ry=200)
    pg.mouse.click(1300, 780)
    sweep_mouse(pg, 3, cx=1000, cy=430, rx=300, ry=170)


def showcase(pg):
    # part the field with the cursor, then re-form it once
    sweep_mouse(pg, 5, cx=800, cy=420, rx=520, ry=230)
    pg.mouse.click(300, 250)           # over the canvas, away from CTAs
    sweep_mouse(pg, 5, cx=800, cy=420, rx=450, ry=210)


CLIPS = [
    ('volera', 'examples/volera-morph.html', volera),
    ('showcase', 'index.html', showcase),
]

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, path, action in CLIPS:
            ctx = browser.new_context(
                viewport={'width': 1600, 'height': 900},
                record_video_dir=OUT,
                record_video_size={'width': 1600, 'height': 900})
            pg = ctx.new_page()
            pg.goto(f'http://localhost:{PORT}/{path}', wait_until='networkidle')
            pg.wait_for_timeout(4000)   # entrances settle before footage starts
            action(pg)
            webm = pg.video.path()
            ctx.close()
            mp4 = os.path.join(OUT, f'{name}.mp4')
            subprocess.run([
                'ffmpeg', '-y', '-loglevel', 'error', '-ss', '1.0', '-i', webm,
                '-t', '11', '-an', '-c:v', 'libx264', '-preset', 'fast',
                '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
                '-vf', 'scale=1600:900', mp4], check=True)
            os.remove(webm)
            print('recorded', mp4)
        browser.close()
finally:
    server.terminate()
