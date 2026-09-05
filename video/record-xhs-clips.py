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


def _drag(pg, x0, y0, x1, y1, seconds, steps=45):
    pg.mouse.move(x0, y0)
    pg.mouse.down()
    for i in range(1, steps + 1):
        pg.mouse.move(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)
        pg.wait_for_timeout(int(seconds * 1000 / steps))
    pg.mouse.up()


def dome(pg):
    # orbit right (inertia carries), orbit back, Start = camera flies to a
    # card, hold the focus, back out, keep orbiting. Drag-step waits stretch
    # ~2x under video recording, so the fly-in is wall-clock-synced (below)
    # instead of trusting nominal timings.
    _drag(pg, 280, 950, 820, 900, 2.0)
    pg.wait_for_timeout(600)
    _drag(pg, 820, 950, 240, 1000, 1.8)
    pg.wait_for_timeout(400)
    dome.sync = time.time()  # clip is trimmed so this lands at t≈9.3s
    pg.locator('#start').click()
    pg.wait_for_timeout(3000)
    pg.locator('#back').click()
    pg.wait_for_timeout(1500)
    _drag(pg, 300, 900, 860, 950, 2.5)
    pg.wait_for_timeout(800)
    _drag(pg, 860, 950, 300, 900, 2.5)
    pg.wait_for_timeout(1200)


def paper(pg):
    # springy poster wall: a fast fling (posters bend with velocity), a slow
    # pull, a fling back; then tap one poster → detail modal (sync point),
    # tap to close, keep flinging so the wobble reads to the end.
    _drag(pg, 800, 1100, 260, 700, 0.9, steps=30)
    pg.wait_for_timeout(1400)
    _drag(pg, 300, 700, 780, 1150, 2.2)
    pg.wait_for_timeout(500)
    _drag(pg, 780, 1150, 340, 800, 0.8, steps=30)
    pg.wait_for_timeout(1500)
    paper.sync = time.time()  # clip is trimmed so the modal lands at t≈9.3s
    pg.mouse.click(540, 960)
    pg.wait_for_timeout(2600)
    pg.mouse.click(540, 1700)  # anywhere closes the modal
    pg.wait_for_timeout(700)
    _drag(pg, 260, 1200, 820, 640, 1.0, steps=30)
    pg.wait_for_timeout(1400)
    _drag(pg, 820, 700, 300, 1150, 1.6)
    pg.wait_for_timeout(2000)


CLIPS = [
    ('volera', 'examples/volera-morph.html', volera),
    ('pura', 'examples/pura-liquid-hero.html', pura),
    ('boreal', 'examples/boreal-journey.html', boreal),
    ('dome', 'examples/dome-gallery.html', dome),
    ('paper', 'examples/paperworks-posterwall.html', paper),
]

if len(sys.argv) > 1:
    CLIPS = [c for c in CLIPS if c[0] in sys.argv[1:]]

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, path, action in CLIPS:
            ctx = browser.new_context(
                viewport={'width': W, 'height': H},
                record_video_dir=OUT,
                record_video_size={'width': W, 'height': H})
            pg = ctx.new_page()
            t0 = time.time()  # ≈ when the video starts
            pg.goto(f'http://localhost:{PORT}/{path}', wait_until='networkidle')
            pg.wait_for_timeout(4000)   # entrances settle before footage starts
            action(pg)
            webm = pg.video.path()
            ctx.close()
            # actions may stamp a wall-clock sync point (action.sync) that the
            # trim aligns to clip t=9.3s; otherwise trim a fixed 1s of head
            sync = getattr(action, 'sync', None)
            ss = max(0.0, sync - t0 - 9.3) if sync else 1.0
            mp4 = os.path.join(OUT, f'{name}.mp4')
            subprocess.run([
                'ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss), '-i', webm,
                '-t', '15', '-an', '-c:v', 'libx264', '-preset', 'fast',
                '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
                '-vf', f'scale={W}:{H}', mp4], check=True)
            os.remove(webm)
            print('recorded', mp4)
        browser.close()
finally:
    server.terminate()
