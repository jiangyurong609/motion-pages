import {Composition} from 'remotion';
import {Tutorial, TUTORIAL_DURATION, FPS} from './Tutorial';
import {Launch, LAUNCH_DURATION} from './Launch';

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
