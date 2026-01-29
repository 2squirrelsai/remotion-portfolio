import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { AgentOrchestration, AgentShowcaseConfig } from "./compositions/AgentOrchestration";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id={AgentShowcaseConfig.id}
        component={AgentOrchestration}
        durationInFrames={AgentShowcaseConfig.durationInFrames}
        fps={AgentShowcaseConfig.fps}
        width={AgentShowcaseConfig.width}
        height={AgentShowcaseConfig.height}
      />
    </>
  );
};
