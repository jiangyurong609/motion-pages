import {Composition} from 'remotion';
import {Tutorial, TUTORIAL_DURATION, FPS} from './Tutorial';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Tutorial"
      component={Tutorial}
      durationInFrames={TUTORIAL_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
