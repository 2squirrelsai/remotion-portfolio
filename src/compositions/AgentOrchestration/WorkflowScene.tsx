import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, typography } from './config';

// Workflow steps
const workflowSteps = [
  { id: 1, label: 'Task Received', icon: '📥', agent: 'Orchestrator' },
  { id: 2, label: 'Task Analysis', icon: '🔍', agent: 'Analyzer Agent' },
  { id: 3, label: 'Work Distribution', icon: '📊', agent: 'Orchestrator' },
  { id: 4, label: 'Parallel Processing', icon: '⚡', agent: 'Worker Agents' },
  { id: 5, label: 'Result Aggregation', icon: '🔗', agent: 'Orchestrator' },
  { id: 6, label: 'Output Delivery', icon: '✅', agent: 'Orchestrator' },
];

interface WorkflowStepProps {
  step: typeof workflowSteps[0];
  index: number;
  frame: number;
  fps: number;
  isActive: boolean;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ step, index, frame, fps, isActive }) => {
  const delay = index * 30;
  const localFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const glowOpacity = isActive ? 0.6 + Math.sin(frame * 0.15) * 0.3 : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Node */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: isActive ? colors.primary : colors.background,
          border: `3px solid ${isActive ? colors.primary : colors.secondary}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 32,
          boxShadow: isActive ? `0 0 30px ${colors.primary}${Math.floor(glowOpacity * 255).toString(16).padStart(2, '0')}` : 'none',
          position: 'relative',
        }}
      >
        {step.icon}
        {/* Processing indicator */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: colors.accent,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: colors.text,
                animation: 'pulse 0.5s infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Label */}
      <p
        style={{
          ...typography.heading,
          fontSize: 16,
          color: isActive ? colors.primary : colors.text,
          marginTop: 16,
          textAlign: 'center',
          maxWidth: 120,
        }}
      >
        {step.label}
      </p>

      {/* Agent label */}
      <p
        style={{
          ...typography.code,
          fontSize: 12,
          color: colors.muted,
          marginTop: 4,
        }}
      >
        {step.agent}
      </p>
    </div>
  );
};

interface ConnectorArrowProps {
  frame: number;
  index: number;
}

const ConnectorArrow: React.FC<ConnectorArrowProps> = ({ frame, index }) => {
  const delay = index * 30 + 15;
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: 30,
      }}
    >
      {/* Line */}
      <div
        style={{
          width: 60 * progress,
          height: 3,
          backgroundColor: colors.secondary,
          borderRadius: 2,
        }}
      />
      {/* Arrow head */}
      {progress > 0.8 && (
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: `12px solid ${colors.secondary}`,
            opacity: interpolate(progress, [0.8, 1], [0, 1]),
          }}
        />
      )}
    </div>
  );
};

export const WorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine which step is currently active
  const activeStep = Math.floor(frame / 35) % workflowSteps.length;

  // Title fade in
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Progress bar
  const totalProgress = interpolate(frame, [0, 180], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        padding: 60,
      }}
    >
      {/* Title */}
      <div style={{ opacity: titleOpacity }}>
        <h2
          style={{
            ...typography.heading,
            fontSize: 48,
            color: colors.text,
            margin: 0,
          }}
        >
          Workflow Execution
        </h2>
        <p
          style={{
            ...typography.body,
            fontSize: 24,
            color: colors.muted,
            marginTop: 10,
          }}
        >
          Orchestrated Task Processing Pipeline
        </p>
      </div>

      {/* Workflow diagram */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0,
          }}
        >
          {workflowSteps.map((step, i) => (
            <React.Fragment key={step.id}>
              <WorkflowStep
                step={step}
                index={i}
                frame={frame}
                fps={fps}
                isActive={i === activeStep}
              />
              {i < workflowSteps.length - 1 && (
                <ConnectorArrow frame={frame} index={i} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              ...typography.code,
              fontSize: 14,
              color: colors.muted,
            }}
          >
            Pipeline Progress
          </span>
          <span
            style={{
              ...typography.code,
              fontSize: 14,
              color: colors.primary,
            }}
          >
            {Math.round(totalProgress)}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: colors.muted + '30',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${totalProgress}%`,
              height: '100%',
              backgroundColor: colors.primary,
              borderRadius: 4,
              boxShadow: `0 0 10px ${colors.primary}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
