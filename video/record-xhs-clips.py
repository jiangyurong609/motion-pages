#!/usr/bin/env python3
"""Vertical (1080x1920) footage for the 小红书「一句 prompt」series.
One clip per episode demo; same server/ffmpeg conventions as the other recorders."""
import math
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, '..', 'docs')
OUT = os.path.join(HERE, 'public', 'clips', 'xhs')
PORT = 8655

os.makedirs(OUT, exist_ok=True)
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--directory', DOCS],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)

from playwright.sync_api import sync_playwright  # noqa: E402

W, H = 1080, 1920


def sweep_mouse(pg, seconds, cx=W / 2, cy=H / 2, rx=420, ry=520, steps_per_s=30):
    steps = int(seconds * steps_per_s)
    for i in range(steps):
        a = (i / steps) * 2 * math.pi
        pg.mouse.move(cx + rx * math.sin(a), cy + ry * math.sin(2 * a) / 1.5)
        pg.wait_for_timeout(int(1000 / steps_per_s))


def volera(pg):
    sweep_mouse(pg, 5, cy=850, ry=430)
    pg.mouse.click(950, 1700)          # canvas corner: morph, no UI hit
    sweep_mouse(pg, 5, cy=850, ry=430)
    pg.mouse.click(950, 1700)
    sweep_mouse(pg, 5, cy=850, ry=380)


def pura(pg):
    # the liquid type reads best under a slow figure-eight near the headline
    sweep_mouse(pg, 8, cy=800, rx=380, ry=350, steps_per_s=25)
    sweep_mouse(pg, 7, cy=1000, rx=440, ry=420, steps_per_s=25)


def boreal(pg):
    # scroll journey: ride the wheel down, hover mid-way, keep drifting
    pg.mouse.move(540, 900)
    for _ in range(46):
        pg.mouse.wheel(0, 260)
        pg.wait_for_timeout(280)
    sweep_mouse(pg, 2, cy=900, ry=300)


CLIPS = [
    ('volera', 'examples/volera-morph.html', volera),
    ('pura', 'examples/pura-liquid-hero.html', pura),
    ('boreal', 'examples/boreal-journey.html', boreal),
]

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, path, action in CLIPS:
            ctx = browser.new_context(
                viewport={'width': W, 'height': H},
                record_video_dir=OUT,
                record_video_size={'width': W, 'height': H})
            pg = ctx.new_page()
            pg.goto(f'http://localhost:{PORT}/{path}', wait_until='networkidle')
            pg.wait_for_timeout(4000)   # entrances settle before footage starts
            action(pg)
            webm = pg.video.path()
            ctx.close()
            mp4 = os.path.join(OUT, f'{name}.mp4')
            subprocess.run([
                'ffmpeg', '-y', '-loglevel', 'error', '-ss', '1.0', '-i', webm,
                '-t', '15', '-an', '-c:v', 'libx264', '-preset', 'fast',
                '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
                '-vf', f'scale={W}:{H}', mp4], check=True)
            os.remove(webm)
            print('recorded', mp4)
        browser.close()
finally:
    server.terminate()
