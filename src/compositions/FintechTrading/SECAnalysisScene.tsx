import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { fintechColors, fintechTypography } from './config';

const extractedMetrics = [
  { label: 'Revenue', value: '$142.3B', change: '+12%', positive: true },
  { label: 'Net Income', value: '$28.7B', change: '+18%', positive: true },
  { label: 'EPS', value: '$4.82', change: '+15%', positive: true },
  { label: 'Debt/Equity', value: '0.32', change: '-5%', positive: true },
];

const documentLines = [
  'UNITED STATES SECURITIES AND EXCHANGE COMMISSION',
  'Washington, D.C. 20549',
  '',
  'FORM 10-K',
  '',
  'ANNUAL REPORT PURSUANT TO SECTION 13 OR 15(d)',
  'OF THE SECURITIES EXCHANGE ACT OF 1934',
  '',
  'For the fiscal year ended December 31, 2024',
  '',
  'Commission File Number: 001-37580',
  '',
  'Revenue for FY2024: $142.3 billion',
  'representing a 12% increase year-over-year.',
  '',
  'Net income attributable to shareholders',
  'was $28.7 billion, up 18% from prior year.',
  '',
  'Earnings per share (diluted): $4.82',
];

// Highlight positions for annotations
const highlights = [
  { line: 12, color: fintechColors.positive },
  { line: 15, color: fintechColors.secondary },
  { line: 18, color: fintechColors.accent },
];

const MetricCard: React.FC<{
  metric: typeof extractedMetrics[0];
  frame: number;
  fps: number;
}> = ({ metric, frame, fps }) => {
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <div
      style={{
        backgroundColor: fintechColors.surface,
        border: `1px solid ${fintechColors.muted}20`,
        borderRadius: 10,
        padding: 20,
        transform: `scale(${Math.max(0, scale)})`,
      }}
    >
      <p style={{ ...fintechTypography.body, fontSize: 12, color: fintechColors.muted, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
        {metric.label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span style={{ ...fintechTypography.numbers, fontSize: 28, color: fintechColors.text }}>
          {metric.value}
        </span>
        <span
          style={{
            ...fintechTypography.numbers,
            fontSize: 14,
            color: metric.positive ? fintechColors.positive : fintechColors.negative,
          }}
        >
          {metric.change}
        </span>
      </div>
    </div>
  );
};

export const SECAnalysisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Document scroll
  const scrollY = interpolate(frame, [20, 120], [0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scanning highlight effect
  const scanLine = interpolate(frame, [30, 100], [0, documentLines.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Key finding reveal
  const findingOpacity = interpolate(frame, [130, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: fintechColors.background, padding: 50 }}>
      {/* Header */}
      <div style={{ opacity: titleOpacity, marginBottom: 30 }}>
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: `${fintechColors.accent}15`,
            borderRadius: 20,
            padding: '6px 16px',
            marginBottom: 12,
          }}
        >
          <span style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.accent }}>
            Financial Research Agent
          </span>
        </div>
        <h2 style={{ ...fintechTypography.heading, fontSize: 42, color: fintechColors.text, margin: 0 }}>
          SEC Filing Analysis
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 40, flex: 1, minHeight: 0 }}>
        {/* Left: Document view */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: '#1a1f2e',
            borderRadius: 12,
            border: `1px solid ${fintechColors.muted}20`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Document header bar */}
          <div
            style={{
              backgroundColor: fintechColors.surface,
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: `1px solid ${fintechColors.muted}20`,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27ca40' }} />
            <span style={{ ...fintechTypography.body, fontSize: 13, color: fintechColors.muted, marginLeft: 12 }}>
              10-K_FY2024.pdf
            </span>
          </div>

          {/* Document content */}
          <div
            style={{
              padding: 24,
              transform: `translateY(-${scrollY}px)`,
              overflow: 'hidden',
            }}
          >
            {documentLines.map((line, i) => {
              const isHighlighted = highlights.some((h) => h.line === i && i < scanLine);
              const highlightColor = highlights.find((h) => h.line === i)?.color;

              return (
                <div
                  key={i}
                  style={{
                    padding: '3px 8px',
                    margin: '1px 0',
                    backgroundColor: isHighlighted ? `${highlightColor}20` : 'transparent',
                    borderLeft: isHighlighted ? `3px solid ${highlightColor}` : '3px solid transparent',
                    borderRadius: 2,
                  }}
                >
                  <span
                    style={{
                      ...fintechTypography.body,
                      fontSize: i < 2 ? 11 : 14,
                      color: i < 4 ? fintechColors.muted : fintechColors.text,
                      fontWeight: i === 3 ? 700 : 400,
                      opacity: i <= scanLine ? 1 : 0.3,
                    }}
                  >
                    {line || '\u00A0'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scan line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 50 + scanLine * 24 - scrollY,
              height: 2,
              backgroundColor: fintechColors.secondary,
              opacity: frame < 100 ? 0.6 : 0,
              boxShadow: `0 0 10px ${fintechColors.secondary}`,
            }}
          />
        </div>

        {/* Right: Extracted metrics */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p
            style={{
              ...fintechTypography.heading,
              fontSize: 18,
              color: fintechColors.text,
              margin: '0 0 8px',
              letterSpacing: 1,
            }}
          >
            EXTRACTED METRICS
          </p>

          {extractedMetrics.map((metric, i) => (
            <Sequence key={i} from={60 + i * 20} durationInFrames={120 - i * 20} layout="none">
              <MetricCard metric={metric} frame={frame - 60 - i * 20} fps={fps} />
            </Sequence>
          ))}

          {/* Key finding */}
          <div
            style={{
              opacity: findingOpacity,
              backgroundColor: `${fintechColors.positive}10`,
              border: `1px solid ${fintechColors.positive}30`,
              borderRadius: 10,
              padding: 16,
              marginTop: 8,
            }}
          >
            <p style={{ ...fintechTypography.heading, fontSize: 12, color: fintechColors.positive, margin: '0 0 8px', letterSpacing: 1 }}>
              KEY FINDING
            </p>
            <p style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.text, margin: 0, lineHeight: 1.5 }}>
              Revenue growth exceeded analyst estimates by 3.2%, driven by strong cloud segment performance.
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
