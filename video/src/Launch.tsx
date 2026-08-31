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
import {loadFont as loadSerifSC} from '@remotion/google-fonts/NotoSerifSC';
import {loadFont as loadSansSC} from '@remotion/google-fonts/NotoSansSC';

const playfair = loadPlayfair();
const mono = loadMono();
const serifSC = loadSerifSC();
const sansSC = loadSansSC();

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

// ---------- locale strings ----------

type Strings = {
  opening: string;
  tags: string[];
  verdict: [string, string]; // line 1 bone, line 2 red
  montageHead: [string, string]; // bone, gold accent
  cutNames: string[];
  loopHead: [string, string]; // bone, red accent
  prompt: string;
  audit: {t: string; at: number; done?: boolean}[];
  outcomeChip: string;
  tagline: [string, string]; // bone, red accent
  bottomLine: string;
};

const EN: Strings = {
  opening: 'You asked AI for a landing page.',
  tags: ['Inter', 'gradient text', 'three identical cards', 'emoji bullets'],
  verdict: ["It doesn't have to", 'be this.'],
  montageHead: ['One prompt ', 'each.'],
  cutNames: [
    'PURA · liquid-glass type',
    'Sylva · a living world',
    'VOLERA · 6,000 particles',
    'BOREAL · scroll journey',
    'Archive° · dome gallery',
    'Paperworks · spring physics',
  ],
  loopHead: ['Then it ', 'checks its own work.'],
  prompt:
    'Build a foggy 3D world for my brand. ONE html file. Self-verify until perfect.',
  audit: [
    {t: '● building — fog == background, baked glow sprites', at: 5 * BEAT},
    {t: '✓ screenshot 1600×900', at: 7 * BEAT},
    {t: '✓ screenshot 820×1180', at: 9 * BEAT},
    {t: '✓ screenshot 390×844', at: 11 * BEAT},
    {t: '✓ audit: contrast · no blank frames · no slop', at: 13 * BEAT},
    {t: '✔ ship-ready', at: 15 * BEAT, done: true},
  ],
  outcomeChip: '9 worlds · 9 prompts · one file each',
  tagline: ['award-site motion, ', 'one prompt away'],
  bottomLine: 'MIT · no build step · works with any coding agent',
};

const ZH: Strings = {
  opening: '你让 AI 给你做了个落地页。',
  tags: ['Inter 字体', '渐变大字', '三张一样的卡片', 'emoji 图标'],
  verdict: ['其实，不必', '长这样。'],
  montageHead: ['每一个，', '一句 prompt。'],
  cutNames: [
    'PURA · 液态玻璃文字',
    'Sylva · 会呼吸的雾气世界',
    'VOLERA · 六千粒光的变形',
    'BOREAL · 滚动叙事长页',
    'Archive° · 穹顶画廊',
    'Paperworks · 弹簧物理海报墙',
  ],
  loopHead: ['然后，它', '检查自己的作品。'],
  prompt:
    '用 motion-pages skill：给我的品牌建一个雾气 3D 世界。单个 HTML 文件。自我验证，直到完美。',
  audit: [
    {t: '● 构建中 — 雾色 == 背景色，烘焙辉光粒子', at: 5 * BEAT},
    {t: '✓ 截图 1600×900', at: 7 * BEAT},
    {t: '✓ 截图 820×1180', at: 9 * BEAT},
    {t: '✓ 截图 390×844（手机排版）', at: 11 * BEAT},
    {t: '✓ 审计：对比度 · 无空白帧 · 无 AI 味', at: 13 * BEAT},
    {t: '✔ 可以发布', at: 15 * BEAT, done: true},
  ],
  outcomeChip: '9 个世界 · 9 条 prompt · 每个只有一个文件',
  tagline: ['获奖级网站动效，', '一句 prompt 之遥'],
  bottomLine: 'MIT 开源 · 零构建 · 任何编码 agent 都能用',
};

type Loc = {
  s: Strings;
  serif: string; // display font family
  ui: string; // chip/tag font family (mono first, CJK fallback)
  zh: boolean;
};

const makeLoc = (zh: boolean): Loc => ({
  s: zh ? ZH : EN,
  serif: zh ? serifSC.fontFamily : playfair.fontFamily,
  ui: zh ? `${mono.fontFamily}, ${sansSC.fontFamily}` : mono.fontFamily,
  zh,
});

// CJK has no true italic — accent with color/weight only.
const accentStyle = (zh: boolean, color: string): React.CSSProperties =>
  zh ? {color, fontWeight: 900} : {fontStyle: 'italic', color};

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

const serifBig = (loc: Loc): React.CSSProperties => ({
  fontFamily: loc.serif,
  fontWeight: 700,
  fontSize: 116,
  lineHeight: 1.14,
  color: BONE,
  textAlign: 'center',
  textShadow: '0 4px 60px rgba(0,0,0,0.6)',
});

const NameChip: React.FC<{loc: Loc; children: React.ReactNode}> = ({
  loc,
  children,
}) => (
  <div
    style={{
      fontFamily: loc.ui,
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

const TAG_POS: {x: number; y: number; at: number}[] = [
  {x: 560, y: 180, at: 4 * BEAT},
  {x: 1250, y: 330, at: 5 * BEAT},
  {x: 700, y: 820, at: 6 * BEAT},
  {x: 1300, y: 700, at: 7 * BEAT},
];

const Problem: React.FC<{loc: Loc}> = ({loc}) => {
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
                fontFamily: loc.ui,
                fontSize: 40,
                letterSpacing: '0.1em',
                color: MUT,
              }}
            >
              {loc.s.opening}
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
        {loc.s.tags.map((t, i) => (
          <Pop
            key={t}
            delay={TAG_POS[i].at - 2 * BEAT}
            style={{position: 'absolute', left: TAG_POS[i].x, top: TAG_POS[i].y}}
          >
            <div
              style={{
                fontFamily: loc.ui,
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
              ✕ {t}
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
            <div style={serifBig(loc)}>
              {loc.s.verdict[0]}
              <br />
              <span style={accentStyle(loc.zh, RED)}>{loc.s.verdict[1]}</span>
            </div>
          </Pop>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- 2. the worlds (footage is the star) ----------

const CUT_SRC: {src: string; startFrom: number}[] = [
  {src: 'clips/pura.mp4', startFrom: 60},
  {src: 'clips/sylva.mp4', startFrom: 90},
  {src: 'clips/volera.mp4', startFrom: 120},
  {src: 'clips/boreal.mp4', startFrom: 110},
  {src: 'clips/dome.mp4', startFrom: 100},
  {src: 'clips/paper.mp4', startFrom: 80},
];
const CUT_LEN = 4 * BEAT;

const Montage: React.FC<{loc: Loc}> = ({loc}) => (
  <AbsoluteFill style={{background: INK}}>
    {CUT_SRC.map((c, i) => (
      <Sequence key={c.src} from={i * CUT_LEN} durationInFrames={CUT_LEN}>
        <Punch
          src={c.src}
          startFrom={c.startFrom}
          duration={CUT_LEN}
          panX={i % 2 === 0 ? -28 : 28}
        />
        {/* headline only on the first cut, then the footage speaks */}
        {i === 0 ? (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <Pop>
              <div
                style={{
                  ...serifBig(loc),
                  fontSize: 126,
                  background: 'rgba(10,13,23,0.88)',
                  borderRadius: 26,
                  padding: '16px 60px 30px',
                  boxShadow: '0 30px 90px rgba(10,13,23,0.5)',
                }}
              >
                {loc.s.montageHead[0]}
                <span style={accentStyle(loc.zh, GOLD)}>{loc.s.montageHead[1]}</span>
              </div>
            </Pop>
          </AbsoluteFill>
        ) : null}
        <div style={{position: 'absolute', left: 70, bottom: 60}}>
          <Pop delay={4}>
            <NameChip loc={loc}>{loc.s.cutNames[i]}</NameChip>
          </Pop>
        </div>
      </Sequence>
    ))}
  </AbsoluteFill>
);

// ---------- 3. the loop (the part nobody else has) ----------

const SHOTS: {label: string; w: number; h: number; rot: number; at: number}[] = [
  {label: '1600×900', w: 560, h: 315, rot: -3, at: 7 * BEAT},
  {label: '820×1180', w: 300, h: 432, rot: 2.5, at: 9 * BEAT},
  {label: '390×844', w: 210, h: 454, rot: -2, at: 11 * BEAT},
];

const Loop: React.FC<{loc: Loc}> = ({loc}) => {
  const frame = useCurrentFrame();
  const typed = Math.round(
    interpolate(frame, [BEAT, 4 * BEAT], [0, loc.s.prompt.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const cursorOn = Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{background: INK, padding: '64px 90px'}}>
      <Pop>
        <div style={{...serifBig(loc), fontSize: 84, textAlign: 'left'}}>
          {loc.s.loopHead[0]}
          <span style={accentStyle(loc.zh, RED)}>{loc.s.loopHead[1]}</span>
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
                  fontFamily: loc.ui,
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
                fontFamily: loc.ui,
                fontSize: 28,
                lineHeight: 1.75,
                color: BONE,
              }}
            >
              <div style={{whiteSpace: 'pre-wrap'}}>
                <span style={{color: MUT}}>&gt; </span>
                {loc.s.prompt.slice(0, typed)}
                {typed < loc.s.prompt.length && cursorOn ? (
                  <span style={{background: BONE, color: INK}}>&nbsp;</span>
                ) : null}
              </div>
              {loc.s.audit
                .filter((l) => frame >= l.at)
                .map((l) => (
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
                    fontFamily: loc.ui,
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

const Outcome: React.FC<{loc: Loc}> = ({loc}) => (
  <AbsoluteFill style={{background: INK}}>
    <Punch src="clips/showcase.mp4" startFrom={70} duration={OUTCOME} panX={-20} />
    <AbsoluteFill
      style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 70}}
    >
      <Pop delay={4}>
        <NameChip loc={loc}>{loc.s.outcomeChip}</NameChip>
      </Pop>
    </AbsoluteFill>
  </AbsoluteFill>
);

// ---------- 5. brand close ----------

const Close: React.FC<{loc: Loc}> = ({loc}) => {
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
            fontFamily: loc.serif,
            ...(loc.zh ? {} : {fontStyle: 'italic'}),
            fontSize: 52,
            color: BONE,
          }}
        >
          {loc.s.tagline[0]}
          <span style={accentStyle(loc.zh, RED)}>{loc.s.tagline[1]}</span>
        </div>
      </Pop>
      <Pop delay={11} style={{display: 'flex', gap: 24, marginTop: 14}}>
        <NameChip loc={loc}>motion-pages.pages.dev</NameChip>
        <NameChip loc={loc}>github.com/jiangyurong609/motion-pages</NameChip>
      </Pop>
      <Pop delay={17}>
        <div
          style={{
            fontFamily: loc.ui,
            fontSize: 27,
            color: GOLD,
          }}
        >
          {loc.s.bottomLine}
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

export const Launch: React.FC<{zh?: boolean}> = ({zh = false}) => {
  const frame = useCurrentFrame();
  const loc = makeLoc(zh);
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
        <Problem loc={loc} />
      </Sequence>
      <Sequence from={starts[1]} durationInFrames={MONTAGE}>
        <Montage loc={loc} />
      </Sequence>
      <Sequence from={starts[2]} durationInFrames={LOOP}>
        <Loop loc={loc} />
      </Sequence>
      <Sequence from={starts[3]} durationInFrames={OUTCOME}>
        <Outcome loc={loc} />
      </Sequence>
      <Sequence from={starts[4]} durationInFrames={CTA}>
        <Close loc={loc} />
      </Sequence>
    </AbsoluteFill>
  );
};
