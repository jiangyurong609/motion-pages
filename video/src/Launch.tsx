import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';

const playfair = loadPlayfair();
const mono = loadMono();

export const FPS = 30;

// "Voxel Revolution" ≈ 112 BPM → one beat ≈ 16 frames at 30fps.
const BEAT = 16;

const PROBLEM = 12 * BEAT;
const MONTAGE = 24 * BEAT;
const LOOP = 18 * BEAT;
const OUTCOME = 8 * BEAT;
const CTA = 10 * BEAT;
export const LAUNCH_DURATION = PROBLEM + MONTAGE + LOOP + OUTCOME + CTA; // 1152 ≈ 38s

// The showcase palette — the video wears the same brand as the site.
const INK = '#0a0d17';
const BONE = '#ece7db';
const RED = '#ff4b2e';
const GOLD = '#ffd9a0';
const MUT = 'rgba(236,231,219,0.6)';

// ---------- shared helpers ----------

const Punch: React.FC<{
  src: string;
  startFrom?: number;
  duration: number;
  panX?: number;
}> = ({src, startFrom = 0, duration, panX = 0}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateRight: 'clamp',
  });
  const scale = 1.1 - 0.08 * p;
  const x = panX * (frame / duration);
  return (
    <AbsoluteFill style={{transform: `scale(${scale}) translateX(${x}px)`}}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        startFrom={startFrom}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
    </AbsoluteFill>
  );
};

const Pop: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({children, delay = 0, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: {damping: 14, stiffness: 160, mass: 0.7},
  });
  const blur = interpolate(s, [0, 1], [10, 0]);
  return (
    <div
      style={{
        opacity: Math.min(1, s * 1.4),
        transform: `scale(${0.85 + 0.15 * s})`,
        filter: `blur(${blur}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const serifBig: React.CSSProperties = {
  fontFamily: playfair.fontFamily,
  fontWeight: 700,
  fontSize: 116,
  lineHeight: 1.08,
  color: BONE,
  textAlign: 'center',
  textShadow: '0 4px 60px rgba(0,0,0,0.6)',
};

const NameChip: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: mono.fontFamily,
      fontSize: 26,
      letterSpacing: '0.08em',
      color: BONE,
      background: 'rgba(10,13,23,0.72)',
      border: '1px solid rgba(236,231,219,0.25)',
      borderRadius: 999,
      padding: '14px 32px',
      backdropFilter: 'blur(8px)',
    }}
  >
    {children}
  </div>
);

// ---------- 1. the problem ----------

const SLOP_TAGS: {t: string; x: number; y: number; at: number}[] = [
  {t: 'Inter', x: 560, y: 180, at: 4 * BEAT},
  {t: 'gradient text', x: 1250, y: 330, at: 5 * BEAT},
  {t: 'three identical cards', x: 700, y: 820, at: 6 * BEAT},
  {t: 'emoji bullets', x: 1300, y: 700, at: 7 * BEAT},
];

const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const CUT = 9 * BEAT; // slop → black verdict
  const push = interpolate(frame, [2 * BEAT, CUT], [1.0, 1.09], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* opening line on black */}
      <Sequence durationInFrames={2 * BEAT}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Pop>
            <div
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 40,
                letterSpacing: '0.1em',
                color: MUT,
              }}
            >
              You asked AI for a landing page.
            </div>
          </Pop>
        </AbsoluteFill>
      </Sequence>
      {/* the slop, examined */}
      <Sequence from={2 * BEAT} durationInFrames={CUT - 2 * BEAT}>
        <AbsoluteFill style={{transform: `scale(${push})`}}>
          <Img
            src={staticFile('shots/slop.png')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.85) brightness(0.9)',
            }}
          />
        </AbsoluteFill>
        {SLOP_TAGS.map((tag) => (
          <Pop
            key={tag.t}
            delay={tag.at - 2 * BEAT}
            style={{position: 'absolute', left: tag.x, top: tag.y}}
          >
            <div
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 30,
                fontWeight: 700,
                color: RED,
                background: 'rgba(10,13,23,0.85)',
                border: `2px solid ${RED}`,
                borderRadius: 8,
                padding: '10px 22px',
                transform: 'rotate(-2deg)',
              }}
            >
              ✕ {tag.t}
            </div>
          </Pop>
        ))}
      </Sequence>
      {/* the verdict */}
      <Sequence from={CUT} durationInFrames={PROBLEM - CUT}>
        <AbsoluteFill
          style={{background: INK, alignItems: 'center', justifyContent: 'center'}}
        >
          <Pop>
            <div style={serifBig}>
              It doesn't have to
              <br />
              <span style={{fontStyle: 'italic', color: RED}}>be this.</span>
            </div>
          </Pop>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- 2. the worlds (footage is the star) ----------

const CUTS: {src: string; startFrom: number; name: string}[] = [
  {src: 'clips/pura.mp4', startFrom: 60, name: 'PURA · liquid-glass type'},
  {src: 'clips/sylva.mp4', startFrom: 90, name: 'Sylva · a living world'},
  {src: 'clips/volera.mp4', startFrom: 120, name: 'VOLERA · 6,000 particles'},
  {src: 'clips/boreal.mp4', startFrom: 110, name: 'BOREAL · scroll journey'},
  {src: 'clips/dome.mp4', startFrom: 100, name: 'Archive° · dome gallery'},
  {src: 'clips/paper.mp4', startFrom: 80, name: 'Paperworks · spring physics'},
];
const CUT_LEN = 4 * BEAT;

const Montage: React.FC = () => (
  <AbsoluteFill style={{background: INK}}>
    {CUTS.map((c, i) => (
      <Sequence key={c.name} from={i * CUT_LEN} durationInFrames={CUT_LEN}>
        <Punch
          src={c.src}
          startFrom={c.startFrom}
          duration={CUT_LEN}
          panX={i % 2 === 0 ? -28 : 28}
        />
        {/* headline only on the first cut, then the footage speaks */}
        {i === 0 ? (
          <AbsoluteFill
            style={{alignItems: 'center', justifyContent: 'center'}}
          >
            <Pop>
              <div
                style={{
                  ...serifBig,
                  fontSize: 126,
                  background: 'rgba(10,13,23,0.88)',
                  borderRadius: 26,
                  padding: '16px 60px 30px',
                  boxShadow: '0 30px 90px rgba(10,13,23,0.5)',
                }}
              >
                One prompt <span style={{fontStyle: 'italic', color: GOLD}}>each.</span>
              </div>
            </Pop>
          </AbsoluteFill>
        ) : null}
        <div style={{position: 'absolute', left: 70, bottom: 60}}>
          <Pop delay={4}>
            <NameChip>{c.name}</NameChip>
          </Pop>
        </div>
      </Sequence>
    ))}
  </AbsoluteFill>
);

// ---------- 3. the loop (the part nobody else has) ----------

const PROMPT_TEXT =
  'Build a foggy 3D world for my brand. ONE html file. Self-verify until perfect.';

const AUDIT_LINES: {t: string; at: number; done?: boolean}[] = [
  {t: '● building — fog == background, baked glow sprites', at: 5 * BEAT},
  {t: '✓ screenshot 1600×900', at: 7 * BEAT},
  {t: '✓ screenshot 820×1180', at: 9 * BEAT},
  {t: '✓ screenshot 390×844', at: 11 * BEAT},
  {t: '✓ audit: contrast · no blank frames · no slop', at: 13 * BEAT},
  {t: '✔ ship-ready', at: 15 * BEAT, done: true},
];

const SHOTS: {label: string; w: number; h: number; rot: number; at: number}[] = [
  {label: '1600×900', w: 560, h: 315, rot: -3, at: 7 * BEAT},
  {label: '820×1180', w: 300, h: 432, rot: 2.5, at: 9 * BEAT},
  {label: '390×844', w: 210, h: 454, rot: -2, at: 11 * BEAT},
];

const Loop: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.round(
    interpolate(frame, [BEAT, 4 * BEAT], [0, PROMPT_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const cursorOn = Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{background: INK, padding: '64px 90px'}}>
      <Pop>
        <div style={{...serifBig, fontSize: 84, textAlign: 'left'}}>
          Then it <span style={{fontStyle: 'italic', color: RED}}>checks its own work.</span>
        </div>
      </Pop>
      <div style={{display: 'flex', gap: 50, flex: 1, marginTop: 44}}>
        {/* terminal */}
        <Pop delay={4} style={{flex: 1.25, display: 'flex'}}>
          <div
            style={{
              flex: 1,
              background: '#05070d',
              borderRadius: 18,
              border: '1px solid rgba(236,231,219,0.14)',
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '18px 22px',
                borderBottom: '1px solid rgba(236,231,219,0.08)',
                alignItems: 'center',
              }}
            >
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div
                  key={c}
                  style={{width: 15, height: 15, borderRadius: 8, background: c}}
                />
              ))}
              <div
                style={{
                  fontFamily: mono.fontFamily,
                  color: MUT,
                  fontSize: 21,
                  marginLeft: 12,
                }}
              >
                claude — motion-pages
              </div>
            </div>
            <div
              style={{
                padding: '26px 32px',
                fontFamily: mono.fontFamily,
                fontSize: 28,
                lineHeight: 1.75,
                color: BONE,
              }}
            >
              <div style={{whiteSpace: 'pre-wrap'}}>
                <span style={{color: MUT}}>&gt; </span>
                {PROMPT_TEXT.slice(0, typed)}
                {typed < PROMPT_TEXT.length && cursorOn ? (
                  <span style={{background: BONE, color: INK}}>&nbsp;</span>
                ) : null}
              </div>
              {AUDIT_LINES.filter((l) => frame >= l.at).map((l) => (
                <Pop key={l.t} delay={l.at}>
                  <div
                    style={{
                      color: l.done ? GOLD : l.t.startsWith('✓') ? BONE : MUT,
                      fontWeight: l.done ? 700 : 400,
                      fontSize: l.done ? 36 : 28,
                    }}
                  >
                    {l.t}
                  </div>
                </Pop>
              ))}
            </div>
          </div>
        </Pop>
        {/* the screenshots it takes, fanned in as they land */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26,
          }}
        >
          {SHOTS.map((s) => (
            <Pop key={s.label} delay={s.at}>
              <div style={{transform: `rotate(${s.rot}deg)`}}>
                <div
                  style={{
                    width: s.w,
                    height: s.h,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(236,231,219,0.25)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
                  }}
                >
                  <Img
                    src={staticFile('shots/built.png')}
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </div>
                <div
                  style={{
                    fontFamily: mono.fontFamily,
                    fontSize: 20,
                    color: MUT,
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </Pop>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4. outcome: the field ----------

const Outcome: React.FC = () => (
  <AbsoluteFill style={{background: INK}}>
    <Punch src="clips/showcase.mp4" startFrom={70} duration={OUTCOME} panX={-20} />
    <AbsoluteFill
      style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 70}}
    >
      <Pop delay={4}>
        <NameChip>9 worlds · 9 prompts · one file each</NameChip>
      </Pop>
    </AbsoluteFill>
  </AbsoluteFill>
);

// ---------- 5. brand close ----------

const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 55% 45% at 50% 42%, #1e0e0a 0%, ${INK} 70%)`,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
      }}
    >
      <Pop>
        <div
          style={{
            fontFamily: mono.fontFamily,
            fontWeight: 700,
            fontSize: 92,
            color: BONE,
            textShadow: `0 0 ${30 + glow * 40}px rgba(255,75,46,${0.25 + glow * 0.25})`,
          }}
        >
          motion-pages<span style={{color: RED}}>*</span>
        </div>
      </Pop>
      <Pop delay={5}>
        <div
          style={{
            fontFamily: playfair.fontFamily,
            fontStyle: 'italic',
            fontSize: 52,
            color: BONE,
          }}
        >
          award-site motion, <span style={{color: RED}}>one prompt away</span>
        </div>
      </Pop>
      <Pop delay={11} style={{display: 'flex', gap: 24, marginTop: 14}}>
        <NameChip>motion-pages.pages.dev</NameChip>
        <NameChip>github.com/jiangyurong609/motion-pages</NameChip>
      </Pop>
      <Pop delay={17}>
        <div
          style={{
            fontFamily: mono.fontFamily,
            fontSize: 27,
            color: GOLD,
          }}
        >
          MIT · no build step · works with any coding agent
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// ---------- root ----------

const starts = (() => {
  const durations = [PROBLEM, MONTAGE, LOOP, OUTCOME, CTA];
  const out: number[] = [];
  let acc = 0;
  for (const d of durations) {
    out.push(acc);
    acc += d;
  }
  return out;
})();

export const Launch: React.FC = () => {
  const frame = useCurrentFrame();
  // quiet under the problem, full send from the montage smash cut onward
  const musicVolume = interpolate(
    frame,
    [0, 10, PROBLEM - 8, PROBLEM, LAUNCH_DURATION - 50, LAUNCH_DURATION - 5],
    [0, 0.35, 0.35, 0.9, 0.9, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  return (
    <AbsoluteFill style={{background: INK}}>
      <Audio src={staticFile('audio/voxel-revolution.mp3')} volume={musicVolume} />
      <Sequence durationInFrames={PROBLEM}>
        <Problem />
      </Sequence>
      <Sequence from={starts[1]} durationInFrames={MONTAGE}>
        <Montage />
      </Sequence>
      <Sequence from={starts[2]} durationInFrames={LOOP}>
        <Loop />
      </Sequence>
      <Sequence from={starts[3]} durationInFrames={OUTCOME}>
        <Outcome />
      </Sequence>
      <Sequence from={starts[4]} durationInFrames={CTA}>
        <Close />
      </Sequence>
    </AbsoluteFill>
  );
};
