import React from 'react';
import {
  AbsoluteFill,
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

const HOOK = 180; // 6s
const STEP1 = 210; // 7s
const STEP2 = 390; // 13s
const STEP3 = 360; // 12s
const CTA = 270; // 9s
export const TUTORIAL_DURATION = HOOK + STEP1 + STEP2 + STEP3 + CTA; // 1410 = 47s

const INK = '#0b0e1a';
const PAPER = '#f4f1ea';
const ACCENT = '#8b7cf8';
const GREEN = '#5eead4';

// ---------- helpers ----------

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  from?: number; // px translateY
  style?: React.CSSProperties;
}> = ({children, delay = 0, from = 24, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 200}});
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * from}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const SceneFade: React.FC<{children: React.ReactNode; duration: number}> = ({
  children,
  duration,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 12, duration - 12, duration],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: inter.fontFamily,
      fontSize: 26,
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      color: GREEN,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const UrlChip: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: mono.fontFamily,
      fontSize: 30,
      color: PAPER,
      background: 'rgba(11,14,26,0.72)',
      border: '1px solid rgba(244,241,234,0.28)',
      borderRadius: 999,
      padding: '14px 34px',
      backdropFilter: 'blur(8px)',
    }}
  >
    {children}
  </div>
);

const ClipFill: React.FC<{src: string; darken?: number}> = ({src, darken = 0}) => (
  <AbsoluteFill>
    <OffthreadVideo
      muted
      src={staticFile(src)}
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
    {darken > 0 && (
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(11,14,26,${darken * 0.5}) 0%, rgba(11,14,26,0) 35%, rgba(11,14,26,${darken}) 100%)`,
        }}
      />
    )}
  </AbsoluteFill>
);

// ---------- scenes ----------

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, HOOK], [1, 1.06], {
    easing: Easing.out(Easing.quad),
  });
  const line2 = frame >= 90;
  return (
    <SceneFade duration={HOOK}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <ClipFill src="clips/pura.mp4" darken={0.85} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          padding: '0 120px 110px',
          gap: 26,
        }}
      >
        <FadeIn delay={10}>
          <Kicker>motion-pages · open source</Kicker>
        </FadeIn>
        <FadeIn delay={20}>
          <div
            style={{
              fontFamily: playfair.fontFamily,
              fontWeight: 900,
              fontSize: 92,
              lineHeight: 1.06,
              color: PAPER,
              maxWidth: 1450,
              textShadow: '0 3px 40px rgba(11,14,26,0.95), 0 1px 8px rgba(11,14,26,0.8)',
            }}
          >
            AI pages don&rsquo;t have to look AI&#8209;generated.
          </div>
        </FadeIn>
        {line2 && (
          <FadeIn delay={92}>
            <div
              style={{
                fontFamily: inter.fontFamily,
                fontSize: 40,
                color: 'rgba(244,241,234,0.85)',
                textShadow: '0 2px 24px rgba(11,14,26,0.9)',
              }}
            >
              This liquid-glass page is <b style={{color: GREEN}}>one prompt</b>.
              Here&rsquo;s the whole recipe.
            </div>
          </FadeIn>
        )}
      </AbsoluteFill>
    </SceneFade>
  );
};

const StepTitle: React.FC<{n: string; title: string; sub?: string}> = ({
  n,
  title,
  sub,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
    <Kicker>step {n}</Kicker>
    <div
      style={{
        fontFamily: playfair.fontFamily,
        fontWeight: 900,
        fontSize: 76,
        color: PAPER,
        lineHeight: 1.05,
      }}
    >
      {title}
    </div>
    {sub ? (
      <div
        style={{
          fontFamily: inter.fontFamily,
          fontSize: 34,
          color: 'rgba(244,241,234,0.8)',
          maxWidth: 1100,
        }}
      >
        {sub}
      </div>
    ) : null}
  </div>
);

const Step1: React.FC = () => {
  const cards: {src: string; label: string}[] = [
    {src: 'clips/sylva.mp4', label: 'Foggy living world'},
    {src: 'clips/dome.mp4', label: '360° dome gallery'},
    {src: 'clips/paper.mp4', label: 'Springy poster wall'},
  ];
  return (
    <SceneFade duration={STEP1}>
      <AbsoluteFill style={{background: INK, padding: '90px 120px', gap: 54}}>
        <FadeIn delay={4}>
          <StepTitle
            n="1"
            title="Pick a world on the showcase"
            sub="7 live demos — every one is a real single-file page the agent built."
          />
        </FadeIn>
        <div style={{display: 'flex', gap: 40, flex: 1, minHeight: 0}}>
          {cards.map((c, i) => (
            <FadeIn key={c.src} delay={20 + i * 10} from={40} style={{flex: 1, display: 'flex'}}>
              <div
                style={{
                  flex: 1,
                  borderRadius: 22,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(244,241,234,0.14)',
                }}
              >
                <OffthreadVideo
                  muted
                  src={staticFile(c.src)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '70px 28px 24px',
                    background:
                      'linear-gradient(180deg, rgba(11,14,26,0) 0%, rgba(11,14,26,0.85) 100%)',
                    fontFamily: inter.fontFamily,
                    fontSize: 28,
                    fontWeight: 600,
                    color: PAPER,
                  }}
                >
                  {c.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={60} style={{alignSelf: 'center'}}>
          <UrlChip>motion-pages.pages.dev</UrlChip>
        </FadeIn>
      </AbsoluteFill>
    </SceneFade>
  );
};

const PROMPT_TEXT =
  'Using the motion-pages skill, build the foggy living-world hero for my brand as ONE self-contained HTML file. Keep every mechanic, then self-verify until it matches.';

const STATUS_LINES: {t: string; at: number}[] = [
  {t: '● building world — fog == background, baked glow sprites', at: 170},
  {t: '● screenshot 1600×900 … ✓', at: 215},
  {t: '● screenshot 820×1180 … ✓', at: 245},
  {t: '● screenshot 390×844 (phone reflow) … ✓', at: 275},
  {t: '✔ design review passed — your world is ready', at: 315},
];

const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  // typing runs frames 40..160
  const typed = Math.round(
    interpolate(frame, [40, 160], [0, PROMPT_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  return (
    <SceneFade duration={STEP2}>
      <AbsoluteFill style={{background: INK, padding: '90px 120px', gap: 50}}>
        <FadeIn delay={4}>
          <StepTitle
            n="2"
            title="Copy its prompt into Claude Code"
            sub="The agent builds the page, then screenshots its own work at three sizes and iterates until it looks right."
          />
        </FadeIn>
        <FadeIn delay={18} from={40} style={{flex: 1, display: 'flex'}}>
          <div
            style={{
              flex: 1,
              background: '#080a14',
              borderRadius: 20,
              border: '1px solid rgba(244,241,234,0.14)',
              padding: '0 0 30px',
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
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
                padding: '30px 36px',
                fontFamily: mono.fontFamily,
                fontSize: 27,
                lineHeight: 1.75,
                color: PAPER,
              }}
            >
              <div style={{color: GREEN}}>$ claude</div>
              <div style={{maxWidth: 1500, whiteSpace: 'pre-wrap'}}>
                <span style={{color: 'rgba(244,241,234,0.55)'}}>&gt; </span>
                {PROMPT_TEXT.slice(0, typed)}
                {typed < PROMPT_TEXT.length && cursorOn ? (
                  <span style={{background: PAPER, color: INK}}>&nbsp;</span>
                ) : null}
              </div>
              {STATUS_LINES.filter((l) => frame >= l.at).map((l) => (
                <FadeIn key={l.t} from={10} delay={l.at}>
                  <div
                    style={{
                      color: l.t.startsWith('✔') ? GREEN : 'rgba(244,241,234,0.75)',
                      fontWeight: l.t.startsWith('✔') ? 700 : 400,
                    }}
                  >
                    {l.t}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      </AbsoluteFill>
    </SceneFade>
  );
};

const Step3: React.FC = () => {
  const frame = useCurrentFrame();
  const HALF = STEP3 / 2;
  const first = frame < HALF;
  return (
    <SceneFade duration={STEP3}>
      {first ? (
        <ClipFill src="clips/fernline.mp4" darken={0.7} />
      ) : (
        <ClipFill src="clips/boreal.mp4" darken={0.7} />
      )}
      <AbsoluteFill style={{padding: '90px 120px', justifyContent: 'space-between'}}>
        <FadeIn delay={4}>
          <StepTitle n="3" title="Get your world" />
        </FadeIn>
        <FadeIn delay={first ? 16 : HALF + 16} from={20}>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontSize: 34,
              color: PAPER,
              background: 'rgba(11,14,26,0.62)',
              border: '1px solid rgba(244,241,234,0.2)',
              borderRadius: 16,
              padding: '18px 30px',
              alignSelf: 'flex-start',
              display: 'inline-block',
              backdropFilter: 'blur(8px)',
            }}
          >
            {first ? (
              <>
                <b>Fernline</b> — a full conversion hero, phone-ready, from one
                prompt
              </>
            ) : (
              <>
                <b>BOREAL</b> — a scroll journey the agent verified frame by frame
              </>
            )}
          </div>
        </FadeIn>
      </AbsoluteFill>
    </SceneFade>
  );
};

const Cta: React.FC = () => {
  return (
    <SceneFade duration={CTA}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 42%, #1a1640 0%, ${INK} 70%)`,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 34,
        }}
      >
        <FadeIn delay={6}>
          <div
            style={{
              fontFamily: playfair.fontFamily,
              fontWeight: 900,
              fontSize: 210,
              color: PAPER,
              lineHeight: 1,
            }}
          >
            M
          </div>
        </FadeIn>
        <FadeIn delay={16}>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontSize: 44,
              color: PAPER,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            7 demos · 7 prompts · MIT · no build step
          </div>
        </FadeIn>
        <FadeIn delay={28} style={{display: 'flex', gap: 26}}>
          <UrlChip>motion-pages.pages.dev</UrlChip>
          <UrlChip>github.com/jiangyurong609/motion-pages</UrlChip>
        </FadeIn>
        <FadeIn delay={44}>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontSize: 30,
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            Paste one prompt tonight. Star it if you want more worlds.
          </div>
        </FadeIn>
      </AbsoluteFill>
    </SceneFade>
  );
};

// ---------- root ----------

export const Tutorial: React.FC = () => {
  return (
    <AbsoluteFill style={{background: INK}}>
      <Sequence durationInFrames={HOOK}>
        <Hook />
      </Sequence>
      <Sequence from={HOOK} durationInFrames={STEP1}>
        <Step1 />
      </Sequence>
      <Sequence from={HOOK + STEP1} durationInFrames={STEP2}>
        <Step2 />
      </Sequence>
      <Sequence from={HOOK + STEP1 + STEP2} durationInFrames={STEP3}>
        <Step3 />
      </Sequence>
      <Sequence from={HOOK + STEP1 + STEP2 + STEP3} durationInFrames={CTA}>
        <Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
