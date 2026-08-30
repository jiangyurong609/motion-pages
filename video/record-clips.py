#!/usr/bin/env python3
"""Record the demo-page footage used by the Remotion tutorial video.

Usage:  python3 record-clips.py
Requires: playwright (pip install playwright && playwright install chromium), ffmpeg.
Serves ../docs locally, records each demo with driven mouse/scroll input,
and writes H.264 clips to public/clips/.
"""
import math
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, '..', 'docs')
OUT = os.path.join(HERE, 'public', 'clips')
PORT = 8653

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


def drag_wall(pg):
    for dx in (-600, 500, -400):
        pg.mouse.move(800, 450)
        pg.mouse.down()
        for i in range(20):
            pg.mouse.move(800 + dx * i / 20, 450 - 60 * math.sin(i / 20 * math.pi))
            pg.wait_for_timeout(16)
        pg.mouse.up()
        pg.wait_for_timeout(1400)


def drag_dome(pg):
    for dx in (-500, 400):
        pg.mouse.move(800, 450)
        pg.mouse.down()
        for i in range(30):
            pg.mouse.move(800 + dx * i / 30, 450)
            pg.wait_for_timeout(20)
        pg.mouse.up()
        pg.wait_for_timeout(1500)


def scroll_journey(pg):
    for _ in range(36):
        pg.mouse.wheel(0, 140)
        pg.wait_for_timeout(220)


CLIPS = [
    ('pura', 'pura-liquid-hero.html', lambda pg: sweep_mouse(pg, 9)),
    ('sylva', 'sylva-replica.html', lambda pg: sweep_mouse(pg, 9)),
    ('fernline', 'fernline-hero.html', lambda pg: sweep_mouse(pg, 9)),
    ('paper', 'paperworks-posterwall.html', drag_wall),
    ('dome', 'dome-gallery.html', drag_dome),
    ('boreal', 'boreal-journey.html', scroll_journey),
]

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, page_file, action in CLIPS:
            ctx = browser.new_context(
                viewport={'width': 1600, 'height': 900},
                record_video_dir=OUT,
                record_video_size={'width': 1600, 'height': 900})
            pg = ctx.new_page()
            pg.goto(f'http://localhost:{PORT}/examples/{page_file}',
                    wait_until='networkidle')
            pg.wait_for_timeout(3500)
            action(pg)
            webm = pg.video.path()
            ctx.close()
            mp4 = os.path.join(OUT, f'{name}.mp4')
            subprocess.run([
                'ffmpeg', '-y', '-loglevel', 'error', '-ss', '1.0', '-i', webm,
                '-t', '10', '-an', '-c:v', 'libx264', '-preset', 'fast',
                '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
                '-vf', 'scale=1600:900', mp4], check=True)
            os.remove(webm)
            print('recorded', mp4)
        browser.close()
finally:
    server.terminate()
