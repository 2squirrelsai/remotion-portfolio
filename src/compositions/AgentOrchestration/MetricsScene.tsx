import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, typography } from './config';

// Metrics data
const metricsData = {
  throughput: [65, 78, 82, 95, 88, 92, 98],
  successRate: 97.5,
  tasksCompleted: 1247,
  avgResponseTime: 0.8,
  agentsActive: 5,
};

const barChartData = [
  { label: 'Mon', value: 65 },
  { label: 'Tue', value: 78 },
  { label: 'Wed', value: 82 },
  { label: 'Thu', value: 95 },
  { label: 'Fri', value: 88 },
  { label: 'Sat', value: 92 },
  { label: 'Sun', value: 98 },
];

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  decimals?: number;
  frame: number;
  delay?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  decimals = 0,
  frame,
  delay = 0,
}) => {
  const animatedValue = interpolate(
    frame,
    [delay, delay + 60],
    [0, value],
    { extrapolateRight: 'clamp' }
  );

  return (
    <span>
      {animatedValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  frame: number;
  fps: number;
  index: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  suffix = '',
  decimals = 0,
  frame,
  fps,
  index,
}) => {
  const delay = index * 15;

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.muted}40`,
        borderRadius: 16,
        padding: 24,
        minWidth: 180,
        opacity,
        transform: `scale(${Math.max(0, scale)})`,
      }}
    >
      <p
        style={{
          ...typography.body,
          fontSize: 14,
          color: colors.muted,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </p>
      <p
        style={{
          ...typography.heading,
          fontSize: 42,
          color: colors.primary,
          margin: '12px 0 0',
        }}
      >
        <AnimatedCounter
          value={value}
          suffix={suffix}
          decimals={decimals}
          frame={frame}
          delay={delay + 10}
        />
      </p>
    </div>
  );
};

interface BarChartProps {
  data: typeof barChartData;
  frame: number;
  fps: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, frame, fps }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        height: 200,
        padding: '0 20px',
      }}
    >
      {data.map((item, i) => {
        const delay = 30 + i * 10;
        const heightProgress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 15, stiffness: 80 },
        });

        const barHeight = (item.value / maxValue) * 180 * Math.max(0, heightProgress);

        return (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Bar */}
            <div
              style={{
                width: 40,
                height: barHeight,
                background: `linear-gradient(to top, ${colors.secondary}, ${colors.primary})`,
                borderRadius: '6px 6px 0 0',
                boxShadow: `0 0 10px ${colors.primary}40`,
              }}
            />
            {/* Label */}
            <span
              style={{
                ...typography.code,
                fontSize: 12,
                color: colors.muted,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface CircularProgressProps {
  value: number;
  frame: number;
  size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  frame,
  size = 150,
}) => {
  const progress = interpolate(frame, [60, 120], [0, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 150 150">
        {/* Background circle */}
        <circle
          cx="75"
          cy="75"
          r="60"
          fill="none"
          stroke={colors.muted + '30'}
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx="75"
          cy="75"
          r="60"
          fill="none"
          stroke={colors.primary}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 75 75)"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.primary})`,
          }}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            ...typography.heading,
            fontSize: 32,
            color: colors.text,
          }}
        >
          {progress.toFixed(1)}%
        </span>
        <p
          style={{
            ...typography.body,
            fontSize: 12,
            color: colors.muted,
            margin: 0,
          }}
        >
          Success Rate
        </p>
      </div>
    </div>
  );
};

export const MetricsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
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
      <div style={{ opacity: titleOpacity, marginBottom: 40 }}>
        <h2
          style={{
            ...typography.heading,
            fontSize: 48,
            color: colors.text,
            margin: 0,
          }}
        >
          Performance Metrics
        </h2>
        <p
          style={{
            ...typography.body,
            fontSize: 24,
            color: colors.muted,
            marginTop: 10,
          }}
        >
          Real-time Agent Analytics Dashboard
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 40,
          flex: 1,
        }}
      >
        {/* Left column - Metrics cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <MetricCard
            title="Tasks Completed"
            value={metricsData.tasksCompleted}
            frame={frame}
            fps={fps}
            index={0}
          />
          <MetricCard
            title="Agents Active"
            value={metricsData.agentsActive}
            frame={frame}
            fps={fps}
            index={1}
          />
          <MetricCard
            title="Avg Response"
            value={metricsData.avgResponseTime}
            suffix="s"
            decimals={1}
            frame={frame}
            fps={fps}
            index={2}
          />
        </div>

        {/* Center - Bar chart */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.background,
            border: `1px solid ${colors.muted}40`,
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <p
            style={{
              ...typography.body,
              fontSize: 14,
              color: colors.muted,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Weekly Throughput
          </p>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <BarChart data={barChartData} frame={frame} fps={fps} />
          </div>
        </div>

        {/* Right - Circular progress */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
            border: `1px solid ${colors.muted}40`,
            borderRadius: 16,
            padding: 40,
          }}
        >
          <CircularProgress
            value={metricsData.successRate}
            frame={frame}
            size={180}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
