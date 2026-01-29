import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { SceneTiming, colors } from './config';
import { IntroScene } from './IntroScene';
import { AgentNetworkScene } from './AgentNetworkScene';
import { WorkflowScene } from './WorkflowScene';
import { MetricsScene } from './MetricsScene';
import { OutroScene } from './OutroScene';

export { AgentShowcaseConfig } from './config';

export const AgentOrchestration: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Scene 1: Introduction (0-5s, frames 0-150) */}
      <Sequence
        from={SceneTiming.intro.start}
        durationInFrames={SceneTiming.intro.duration}
        name="Intro"
      >
        <IntroScene />
      </Sequence>

      {/* Scene 2: Agent Network Visualization (5-15s, frames 150-450) */}
      <Sequence
        from={SceneTiming.network.start}
        durationInFrames={SceneTiming.network.duration}
        name="Agent Network"
      >
        <AgentNetworkScene />
      </Sequence>

      {/* Scene 3: Workflow Animation (15-22s, frames 450-660) */}
      <Sequence
        from={SceneTiming.workflow.start}
        durationInFrames={SceneTiming.workflow.duration}
        name="Workflow"
      >
        <WorkflowScene />
      </Sequence>

      {/* Scene 4: Metrics Dashboard (22-28s, frames 660-840) */}
      <Sequence
        from={SceneTiming.metrics.start}
        durationInFrames={SceneTiming.metrics.duration}
        name="Metrics"
      >
        <MetricsScene />
      </Sequence>

      {/* Scene 5: Outro with Project Logos (28-30s, frames 840-900) */}
      <Sequence
        from={SceneTiming.outro.start}
        durationInFrames={SceneTiming.outro.duration}
        name="Outro"
      >
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
