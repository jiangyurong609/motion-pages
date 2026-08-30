import React from 'react';
import {
  AbsoluteFill,
  Audio,
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
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const playfair = loadPlayfair();
const mono = loadMono();
const inter = loadInter();

export const FPS = 30;

// "Voxel Revolution" is ~112 BPM → one beat ≈ 16 frames at 30fps. Every cut
// below lands on a beat multiple so the edit feels locked to the music.
const BEAT = 16;

const HOOK = 12 * BEAT; // 4 hard cuts
const BRAND = 3 * BEAT;
const STEP1 = 6 * BEAT;
const STEP2 = 14 * BEAT;
const STEP3 = 10 * BEAT;
const VALUES = 6 * BEAT;
const CTA = 11 * BEAT;
export const TUTORIAL_DURATION =
  HOOK + BRAND + STEP1 + STEP2 + STEP3 + VALUES + CTA; // 992 ≈ 33s

const INK = '#0b0e1a';
const PAPER = '#f4f1ea';
const ACCENT = '#8b7cf8';
const GREEN = '#5eead4';

// ---------- helpers ----------

// Full-bleed footage with a punch-zoom: lands hard on the cut, settles fast.
const Punch: React.FC<{
  src: string;
  startFrom?: number;
  duration: number;
  panX?: number; // px drift over the cut, alternate sign per cut
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

// Big line of type that snaps in with overshoot.
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

const bigType: React.CSSProperties = {
  fontFamily: playfair.fontFamily,
  fontWeight: 900,
  fontSize: 132,
  lineHeight: 1.04,
  color: PAPER,
  textAlign: 'center',
  background: 'rgba(11,14,26,0.88)',
  borderRadius: 28,
  padding: '18px 56px 30px',
  boxShadow: '0 30px 90px rgba(11,14,26,0.5)',
};

const Center: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill
    style={{alignItems: 'center', justifyContent: 'center', padding: '0 100px'}}
  >
    {children}
  </AbsoluteFill>
);

const Chip: React.FC<{children: React.ReactNode; big?: boolean}> = ({
  children,
  big,
}) => (
  <div
    style={{
      fontFamily: mono.fontFamily,
      fontSize: big ? 34 : 28,
      color: PAPER,
      background: 'rgba(11,14,26,0.7)',
      border: '1px solid rgba(244,241,234,0.3)',
      borderRadius: 999,
      padding: big ? '16px 40px' : '12px 30px',
      backdropFilter: 'blur(8px)',
    }}
  >
    {children}
  </div>
);

const StepTag: React.FC<{n: string; text: string}> = ({n, text}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 22,
      alignSelf: 'flex-start',
      background: 'rgba(11,14,26,0.72)',
      borderRadius: 999,
      padding: '14px 36px 14px 16px',
      backdropFilter: 'blur(8px)',
    }}
  >
    <div
      style={{
        fontFamily: inter.fontFamily,
        fontWeight: 800,
        fontSize: 34,
        color: INK,
        background: GREEN,
        borderRadius: 999,
        width: 62,
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {n}
    </div>
    <div
      style={{
        fontFamily: inter.fontFamily,
        fontWeight: 800,
        fontSize: 46,
        color: PAPER,
        textShadow: '0 2px 24px rgba(11,14,26,0.9)',
      }}
    >
      {text}
    </div>
  </div>
);

// ---------- hook: 4 hard cuts, each "this is one prompt" ----------

const HOOK_CUTS: {
  src: string;
  startFrom: number;
  frames: number;
  line: string;
}[] = [
  {src: 'clips/pura.mp4', startFrom: 60, frames: 4 * BEAT, line: 'This is one prompt.'},
  {src: 'clips/sylva.mp4', startFrom: 90, frames: 4 * BEAT, line: 'So is this.'},
  {src: 'clips/dome.mp4', startFrom: 100, frames: 2 * BEAT, line: 'And this.'},
  {src: 'clips/paper.mp4', startFrom: 80, frames: 2 * BEAT, line: 'This too.'},
];

const Hook: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{background: INK}}>
      {HOOK_CUTS.map((c) => {
        const from = at;
        at += c.frames;
        return (
          <Sequence key={c.line} from={from} durationInFrames={c.frames}>
            <Punch
              src={c.src}
              startFrom={c.startFrom}
              duration={c.frames}
              panX={from % (8 * BEAT) === 0 ? -30 : 30}
            />
            <Center>
              <Pop>
                <div style={bigType}>{c.line}</div>
              </Pop>
            </Center>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- brand card ----------

const Brand: React.FC = () => (
  <AbsoluteFill
    style={{
      background: INK,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}
  >
    <Pop>
      <div style={{...bigType, fontSize: 120}}>motion-pages</div>
    </Pop>
    <Pop delay={4}>
      <div
        style={{
          fontFamily: inter.fontFamily,
          fontSize: 36,
          color: 'rgba(244,241,234,0.75)',
        }}
      >
        an open-source agent skill for living landing pages
      </div>
    </Pop>
  </AbsoluteFill>
);

// ---------- step 1 ----------

const Step1: React.FC = () => (
  <AbsoluteFill style={{background: INK}}>
    <Punch src="clips/dome.mp4" startFrom={40} duration={STEP1} panX={-24} />
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, rgba(11,14,26,0.55) 0%, rgba(11,14,26,0) 40%, rgba(11,14,26,0.75) 100%)',
      }}
    />
    <AbsoluteFill style={{padding: '80px 110px', justifyContent: 'space-between'}}>
      <Pop>
        <StepTag n="1" text="Pick a world on the live showcase" />
      </Pop>
      <Pop delay={8} style={{alignSelf: 'center'}}>
        <Chip big>motion-pages.pages.dev</Chip>
      </Pop>
    </AbsoluteFill>
  </AbsoluteFill>
);

// ---------- step 2: terminal ----------

const PROMPT_TEXT =
  'Use the motion-pages skill: build the foggy living-world hero for my brand as ONE self-contained HTML file. Self-verify until it matches.';

const STATUS_LINES: {t: string; at: number}[] = [
  {t: '● building world — fog == background, baked glow sprites', at: 6 * BEAT},
  {t: '● screenshot 1600×900 … ✓', at: 7.5 * BEAT},
  {t: '● screenshot 820×1180 … ✓', at: 9 * BEAT},
  {t: '● screenshot 390×844 (phone reflow) … ✓', at: 10.5 * BEAT},
  {t: '✔ design review passed — your world is ready', at: 12 * BEAT},
];

const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.round(
    interpolate(frame, [BEAT, 5 * BEAT], [0, PROMPT_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const cursorOn = Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{background: INK, padding: '70px 110px', gap: 40}}>
      <Pop>
        <StepTag n="2" text="Paste its prompt into Claude Code" />
      </Pop>
      <Pop delay={4} style={{flex: 1, display: 'flex'}}>
        <div
          style={{
            flex: 1,
            background: '#080a14',
            borderRadius: 20,
            border: '1px solid rgba(244,241,234,0.14)',
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '20px 24px',
              borderBottom: '1px solid rgba(244,241,234,0.08)',
              alignItems: 'center',
            }}
          >
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <div
                key={c}
                style={{width: 16, height: 16, borderRadius: 8, background: c}}
              />
            ))}
            <div
              style={{
                fontFamily: mono.fontFamily,
                color: 'rgba(244,241,234,0.5)',
                fontSize: 22,
                marginLeft: 14,
              }}
            >
              claude — motion-pages
            </div>
          </div>
          <div
            style={{
              padding: '28px 36px',
              fontFamily: mono.fontFamily,
              fontSize: 30,
              lineHeight: 1.7,
              color: PAPER,
            }}
          >
            <div style={{color: GREEN}}>$ claude</div>
            <div style={{maxWidth: 1560, whiteSpace: 'pre-wrap'}}>
              <span style={{color: 'rgba(244,241,234,0.55)'}}>&gt; </span>
              {PROMPT_TEXT.slice(0, typed)}
              {typed < PROMPT_TEXT.length && cursorOn ? (
                <span style={{background: PAPER, color: INK}}>&nbsp;</span>
              ) : null}
            </div>
            {STATUS_LINES.filter((l) => frame >= l.at).map((l) => (
              <Pop key={l.t} delay={l.at}>
                <div
                  style={{
                    color: l.t.startsWith('✔') ? GREEN : 'rgba(244,241,234,0.75)',
                    fontWeight: l.t.startsWith('✔') ? 700 : 400,
                    fontSize: l.t.startsWith('✔') ? 36 : 30,
                  }}
                >
                  {l.t}
                </div>
              </Pop>
            ))}
          </div>
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// ---------- step 3: results, two hard cuts ----------

const Step3: React.FC = () => {
  const HALF = STEP3 / 2;
  return (
    <AbsoluteFill style={{background: INK}}>
      <Sequence durationInFrames={HALF}>
        <Punch src="clips/fernline.mp4" startFrom={70} duration={HALF} panX={-26} />
        <ResultOverlay label="Fernline — a full conversion hero, phone-ready" />
      </Sequence>
      <Sequence from={HALF} durationInFrames={HALF}>
        <Punch src="clips/boreal.mp4" startFrom={110} duration={HALF} panX={26} />
        <ResultOverlay label="BOREAL — a scroll journey, verified frame by frame" />
      </Sequence>
    </AbsoluteFill>
  );
};

const ResultOverlay: React.FC<{label: string}> = ({label}) => (
  <AbsoluteFill style={{padding: '80px 110px', justifyContent: 'space-between'}}>
    <Pop>
      <StepTag n="3" text="Get your world" />
    </Pop>
    <Pop delay={6} style={{alignSelf: 'flex-start'}}>
      <Chip big>{label}</Chip>
    </Pop>
  </AbsoluteFill>
);

// ---------- values: chips on the beat ----------

const VALUE_ITEMS = ['one HTML file', 'no build step', 'phone-ready', 'MIT'];

const Values: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 60% 50% at 50% 45%, #1a1640 0%, ${INK} 70%)`,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{display: 'flex', gap: 30}}>
      {VALUE_ITEMS.map((v, i) => (
        <Pop key={v} delay={i * BEAT * 0.75}>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 800,
              fontSize: 44,
              color: i === VALUE_ITEMS.length - 1 ? INK : PAPER,
              background:
                i === VALUE_ITEMS.length - 1 ? GREEN : 'rgba(244,241,234,0.08)',
              border: '1px solid rgba(244,241,234,0.25)',
              borderRadius: 18,
              padding: '22px 38px',
            }}
          >
            {v}
          </div>
        </Pop>
      ))}
    </div>
  </AbsoluteFill>
);

// ---------- CTA ----------

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 40%, #1a1640 0%, ${INK} 70%)`,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
      }}
    >
      <Pop>
        <div
          style={{
            fontFamily: playfair.fontFamily,
            fontWeight: 900,
            fontSize: 190,
            color: PAPER,
            lineHeight: 1,
            textShadow: `0 0 ${40 + glow * 50}px rgba(139,124,248,${0.35 + glow * 0.3})`,
          }}
        >
          M
        </div>
      </Pop>
      <Pop delay={5}>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontSize: 44,
            color: PAPER,
            fontWeight: 700,
          }}
        >
          7 demos · 7 prompts · one file each
        </div>
      </Pop>
      <Pop delay={11} style={{display: 'flex', gap: 26}}>
        <Chip big>motion-pages.pages.dev</Chip>
        <Chip big>github.com/jiangyurong609/motion-pages</Chip>
      </Pop>
      <Pop delay={18}>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontSize: 32,
            color: ACCENT,
            fontWeight: 600,
          }}
        >
          Paste one prompt tonight ★
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// ---------- root ----------

const starts = (() => {
  const durations = [HOOK, BRAND, STEP1, STEP2, STEP3, VALUES, CTA];
  const out: number[] = [];
  let acc = 0;
  for (const d of durations) {
    out.push(acc);
    acc += d;
  }
  return out;
})();

export const Tutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const musicVolume = interpolate(
    frame,
    [0, 10, TUTORIAL_DURATION - 50, TUTORIAL_DURATION - 5],
    [0, 0.85, 0.85, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  return (
    <AbsoluteFill style={{background: INK}}>
      <Audio
        src={staticFile('audio/voxel-revolution.mp3')}
        volume={musicVolume}
      />
      <Sequence durationInFrames={HOOK}>
        <Hook />
      </Sequence>
      <Sequence from={starts[1]} durationInFrames={BRAND}>
        <Brand />
      </Sequence>
      <Sequence from={starts[2]} durationInFrames={STEP1}>
        <Step1 />
      </Sequence>
      <Sequence from={starts[3]} durationInFrames={STEP2}>
        <Step2 />
      </Sequence>
      <Sequence from={starts[4]} durationInFrames={STEP3}>
        <Step3 />
      </Sequence>
      <Sequence from={starts[5]} durationInFrames={VALUES}>
        <Values />
      </Sequence>
      <Sequence from={starts[6]} durationInFrames={CTA}>
        <Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
