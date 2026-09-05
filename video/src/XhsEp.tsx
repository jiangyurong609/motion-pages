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
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadSerifSC} from '@remotion/google-fonts/NotoSerifSC';
import {loadFont as loadSansSC} from '@remotion/google-fonts/NotoSansSC';

const mono = loadMono();
const serifSC = loadSerifSC();
const sansSC = loadSansSC();

export const FPS = 30;
const BEAT = 16; // Voxel Revolution ≈ 112 BPM

const HOOK = 6 * BEAT;
const PROMPT = 10 * BEAT;
const CHECK = 6 * BEAT;
const SHOW = 12 * BEAT;
const CTA = 8 * BEAT;
export const XHS_DURATION = HOOK + PROMPT + CHECK + SHOW + CTA; // 672 ≈ 22s

const INK = '#0a0d17';
const BONE = '#ece7db';
const RED = '#ff4b2e';
const GOLD = '#ffd9a0';
const MUT = 'rgba(236,231,219,0.6)';

const serif = serifSC.fontFamily;
const ui = `${mono.fontFamily}, ${sansSC.fontFamily}`;
const sans = sansSC.fontFamily;

// ---------- per-episode content ----------

export type EpKey = 'volera' | 'pura' | 'boreal' | 'dome' | 'paper';

type Ep = {
  num: number;
  clip: string;
  name: string; // demo chip
  hook: [string, string]; // line 1 bone, line 2 gold
  prompt: string; // what gets typed
  feats: [string, string, string]; // rotating bottom captions in SHOW
  next: string; // teaser for the following episode
};

export const EPS: Record<EpKey, Ep> = {
  volera: {
    num: 1,
    clip: 'clips/xhs/volera.mp4',
    name: 'VOLERA · 粒子变形',
    hook: ['六千个粒子，', '一句 prompt 捏出来的'],
    prompt:
      '用 motion-pages skill：6000 个粒子组成鹤群，光标驱散，点击变形成月门。单个 HTML 文件，自我验证到完美。',
    feats: ['光标一碰，鸟群四散', '点一下，重组成月门', '整页只有一个 HTML 文件'],
    next: '液态玻璃文字',
  },
  pura: {
    num: 2,
    clip: 'clips/xhs/pura.mp4',
    name: 'PURA · 液态玻璃',
    hook: ['这行字，', '是液态玻璃做的'],
    prompt:
      '用 motion-pages skill：品牌首页，标题用液态玻璃 shader 文字，光标搅动折射。单个 HTML 文件，自我验证到完美。',
    feats: ['shader 实时折射', '光标搅得动的文字', '整页只有一个 HTML 文件'],
    next: '滚动穿过一整片雾',
  },
  boreal: {
    num: 3,
    clip: 'clips/xhs/boreal.mp4',
    name: 'BOREAL · 滚动叙事',
    hook: ['往下滚，', '穿过一整片雾'],
    prompt:
      '用 motion-pages skill：滚动叙事长页，雾中穹顶，滚轮推着镜头走。单个 HTML 文件，自我验证到完美。',
    feats: ['滚轮就是镜头轨道', '雾色 == 背景色，几何体融进大气', '整页只有一个 HTML 文件'],
    next: '360° 穹顶画廊',
  },
  dome: {
    num: 4,
    clip: 'clips/xhs/dome.mp4',
    name: 'ARCHIVE° · 穹顶画廊',
    hook: ['360° 穹顶画廊，', '点谁就飞到谁面前'],
    prompt:
      '用 motion-pages skill：360° 穹顶画廊，作品卡贴在穹顶内侧，拖拽环视，点击一张，镜头飞到它面前。单个 HTML 文件，自我验证到完美。',
    feats: ['点一下，镜头飞过去', '每张卡片都是一个展位', '整页只有一个 HTML 文件'],
    next: '弹簧物理海报墙',
  },
  paper: {
    num: 5,
    clip: 'clips/xhs/paper.mp4',
    name: 'PAPERWORKS · 弹簧海报墙',
    hook: ['甩一下，', '整墙海报跟着晃'],
    prompt:
      '用 motion-pages skill：无限拖拽海报墙，每张海报像纸一样随速度弯曲回弹，点开看大图。纯 DOM/CSS 不用库，单个 HTML 文件，自我验证到完美。',
    feats: ['速度越快，纸弯得越狠', '不用任何库，纯 CSS 3D', '整页只有一个 HTML 文件'],
    next: '动效语法课：缓动怎么选',
  },
};

// ---------- pieces ----------

const Footage: React.FC<{src: string; startFrom?: number; dim?: number}> = ({
  src,
  startFrom = 0,
  dim = 0,
}) => (
  <AbsoluteFill>
    <OffthreadVideo
      muted
      src={staticFile(src)}
      startFrom={startFrom}
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
    {dim > 0 && (
      <AbsoluteFill style={{background: `rgba(10,13,23,${dim})`}} />
    )}
  </AbsoluteFill>
);

// persistent bottom caption — the 默认静音 narrator
const Caption: React.FC<{text: string; color?: string}> = ({text, color = BONE}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const up = spring({frame, fps, config: {damping: 200}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        bottom: 250,
        textAlign: 'center',
        transform: `translateY(${(1 - up) * 40}px)`,
        opacity: up,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: 'rgba(10,13,23,0.82)',
          border: '1px solid rgba(236,231,219,0.14)',
          borderRadius: 22,
          padding: '26px 44px',
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 58,
          lineHeight: 1.35,
          color,
        }}
      >
        {text}
      </span>
    </div>
  );
};

const Chip: React.FC<{text: string; top?: number}> = ({text, top = 130}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      textAlign: 'center',
    }}
  >
    <span
      style={{
        fontFamily: ui,
        fontSize: 30,
        letterSpacing: 4,
        color: GOLD,
        background: 'rgba(10,13,23,0.7)',
        border: '1px solid rgba(255,217,160,0.35)',
        borderRadius: 999,
        padding: '14px 30px',
      }}
    >
      {text}
    </span>
  </div>
);

const Hook: React.FC<{ep: Ep}> = ({ep}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = spring({frame, fps, config: {damping: 200}});
  return (
    <AbsoluteFill>
      <Footage src={ep.clip} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(10,13,23,0.88) 0%, rgba(10,13,23,0.45) 26%, rgba(10,13,23,0) 44%, rgba(10,13,23,0) 60%, rgba(10,13,23,0.8) 100%)',
        }}
      />
      <Chip text={`一句 PROMPT · 第 ${ep.num} 期`} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 240,
          transform: `translateY(${(1 - inS) * 60}px)`,
          opacity: inS,
          fontFamily: serif,
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.28,
          whiteSpace: 'nowrap',
          textShadow: '0 4px 40px rgba(10,13,23,0.9)',
        }}
      >
        <div style={{fontSize: 82, color: BONE}}>{ep.hook[0]}</div>
        <div style={{fontSize: 82, color: GOLD}}>{ep.hook[1]}</div>
      </div>
    </AbsoluteFill>
  );
};

const PromptScene: React.FC<{ep: Ep}> = ({ep}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chars = Math.min(
    ep.prompt.length,
    Math.floor(interpolate(frame, [14, PROMPT - 34], [0, ep.prompt.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
  );
  const typed = ep.prompt.slice(0, chars);
  const sent = frame > PROMPT - 26;
  const inS = spring({frame, fps, config: {damping: 200}});
  return (
    <AbsoluteFill>
      <Footage src={ep.clip} startFrom={HOOK} dim={0.62} />
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 480,
          transform: `translateY(${(1 - inS) * 50}px)`,
          opacity: inS,
          background: 'rgba(12,15,26,0.94)',
          border: '1px solid rgba(236,231,219,0.16)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 28px',
            borderBottom: '1px solid rgba(236,231,219,0.1)',
          }}
        >
          {[RED, GOLD, '#3ddc84'].map((c) => (
            <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />
          ))}
          <span style={{fontFamily: ui, fontSize: 26, color: MUT, marginLeft: 14}}>
            claude code
          </span>
        </div>
        <div
          style={{
            padding: '34px 38px 40px',
            fontFamily: ui,
            fontSize: 40,
            lineHeight: 1.6,
            color: BONE,
            minHeight: 320,
          }}
        >
          <span style={{color: RED, fontWeight: 700}}>{'> '}</span>
          {typed}
          <span
            style={{
              display: 'inline-block',
              width: 20,
              height: 44,
              background: sent ? 'transparent' : GOLD,
              marginLeft: 6,
              verticalAlign: 'middle',
              opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0.15,
            }}
          />
          {sent && (
            <div style={{marginTop: 22, color: GOLD, fontWeight: 700}}>⏎ 交给 agent</div>
          )}
        </div>
      </div>
      <Caption text="把这句话，贴进 Claude Code" />
    </AbsoluteFill>
  );
};

const AUDIT: {t: string; at: number; done?: boolean}[] = [
  {t: '✓ 截图 1600×900', at: 0.5 * BEAT},
  {t: '✓ 截图 820×1180', at: 1.5 * BEAT},
  {t: '✓ 截图 390×844（手机排版）', at: 2.5 * BEAT},
  {t: '✓ 审计：对比度 · 无空白帧 · 无 AI 味', at: 3.5 * BEAT},
  {t: '✔ 可以发布', at: 4.5 * BEAT, done: true},
];

const CheckScene: React.FC<{ep: Ep}> = ({ep}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage src={ep.clip} startFrom={HOOK + PROMPT} dim={0.62} />
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 560,
          background: 'rgba(12,15,26,0.94)',
          border: '1px solid rgba(236,231,219,0.16)',
          borderRadius: 24,
          padding: '38px 42px',
          fontFamily: ui,
          fontSize: 38,
          lineHeight: 2.0,
        }}
      >
        {AUDIT.map((l) =>
          frame >= l.at ? (
            <div
              key={l.t}
              style={{
                color: l.done ? INK : BONE,
                background: l.done ? GOLD : 'transparent',
                display: l.done ? 'inline-block' : 'block',
                borderRadius: l.done ? 12 : 0,
                padding: l.done ? '2px 20px' : 0,
                fontWeight: l.done ? 900 : 400,
              }}
            >
              {l.t}
            </div>
          ) : null,
        )}
      </div>
      <Caption text="它自己截图三个尺寸，检查到满意为止" color={GOLD} />
    </AbsoluteFill>
  );
};

const ShowScene: React.FC<{ep: Ep}> = ({ep}) => {
  const frame = useCurrentFrame();
  const per = SHOW / 3;
  const idx = Math.min(2, Math.floor(frame / per));
  return (
    <AbsoluteFill>
      {/* clip is 450f — start at 250 so SHOW's 192f stays inside it */}
      <Footage src={ep.clip} startFrom={250} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(10,13,23,0.45) 0%, rgba(10,13,23,0) 22%, rgba(10,13,23,0) 62%, rgba(10,13,23,0.75) 100%)',
        }}
      />
      <Chip text={ep.name} />
      <Sequence from={idx * per} layout="none" key={idx}>
        <Caption text={ep.feats[idx]} />
      </Sequence>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ep: Ep}> = ({ep}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = spring({frame, fps, config: {damping: 200}});
  const glow = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, #1e0e0a 0%, ${INK} 62%)`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - inS) * 50}px)`,
          opacity: inS,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: ui,
            fontSize: 64,
            fontWeight: 700,
            color: BONE,
            textShadow: `0 0 ${30 + glow * 40}px rgba(255,75,46,0.65)`,
          }}
        >
          motion-pages
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: serif,
            fontWeight: 900,
            fontSize: 74,
            lineHeight: 1.35,
            color: BONE,
          }}
        >
          复制 prompt，
          <br />
          <span style={{color: RED}}>你也能做一个</span>
        </div>
        <div style={{marginTop: 60, fontFamily: ui, fontWeight: 700, fontSize: 46, color: GOLD}}>
          motion-pages.pages.dev
        </div>
        <div style={{marginTop: 24, fontFamily: sans, fontWeight: 700, fontSize: 40, color: MUT}}>
          MIT 开源 · GitHub 同名仓库 · 链接也在评论区 👇
        </div>
        <div
          style={{
            marginTop: 90,
            display: 'inline-block',
            fontFamily: sans,
            fontWeight: 900,
            fontSize: 48,
            color: GOLD,
            border: '1px solid rgba(255,217,160,0.4)',
            borderRadius: 999,
            padding: '22px 46px',
            background: 'rgba(255,217,160,0.06)',
          }}
        >
          关注 · 下一期：{ep.next}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- composition ----------

export const XhsEp: React.FC<{ep?: EpKey}> = ({ep = 'volera'}) => {
  const e = EPS[ep];
  const frame = useCurrentFrame();
  const musicVolume = interpolate(
    frame,
    [0, 30, XHS_DURATION - 60, XHS_DURATION - 8],
    [0, 0.32, 0.32, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)},
  );
  return (
    <AbsoluteFill style={{background: INK}}>
      <Audio src={staticFile('audio/voxel-revolution.mp3')} volume={musicVolume} />
      <Sequence durationInFrames={HOOK}>
        <Hook ep={e} />
      </Sequence>
      <Sequence from={HOOK} durationInFrames={PROMPT}>
        <PromptScene ep={e} />
      </Sequence>
      <Sequence from={HOOK + PROMPT} durationInFrames={CHECK}>
        <CheckScene ep={e} />
      </Sequence>
      <Sequence from={HOOK + PROMPT + CHECK} durationInFrames={SHOW}>
        <ShowScene ep={e} />
      </Sequence>
      <Sequence from={HOOK + PROMPT + CHECK + SHOW} durationInFrames={CTA}>
        <CtaScene ep={e} />
      </Sequence>
    </AbsoluteFill>
  );
};
