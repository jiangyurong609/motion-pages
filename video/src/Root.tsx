import {Composition} from 'remotion';
import {Tutorial, TUTORIAL_DURATION, FPS} from './Tutorial';
import {Launch, LAUNCH_DURATION} from './Launch';
import {XhsEp, XHS_DURATION, EPS, EpKey} from './XhsEp';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Launch"
        component={Launch}
        durationInFrames={LAUNCH_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="LaunchZh"
        component={Launch}
        durationInFrames={LAUNCH_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{zh: true}}
      />
      {(Object.keys(EPS) as EpKey[]).map((k) => (
        <Composition
          key={k}
          id={`Xhs-${k}`}
          component={XhsEp}
          durationInFrames={XHS_DURATION}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ep: k}}
        />
      ))}
      <Composition
        id="Tutorial"
        component={Tutorial}
        durationInFrames={TUTORIAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
