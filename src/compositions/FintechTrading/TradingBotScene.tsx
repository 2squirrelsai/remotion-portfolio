import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { fintechColors, fintechTypography } from './config';

// Price data for chart
const priceData = [
  { t: 0, p: 0.45 },
  { t: 1, p: 0.48 },
  { t: 2, p: 0.52 },
  { t: 3, p: 0.49 },
  { t: 4, p: 0.55 },
  { t: 5, p: 0.62 },
  { t: 6, p: 0.58 },
  { t: 7, p: 0.65 },
  { t: 8, p: 0.61 },
  { t: 9, p: 0.68 },
  { t: 10, p: 0.72 },
  { t: 11, p: 0.70 },
];

const trades = [
  { time: 3, action: 'BUY' as const, price: 0.49 },
  { time: 5, action: 'SELL' as const, price: 0.62 },
  { time: 8, action: 'BUY' as const, price: 0.61 },
  { time: 10, action: 'SELL' as const, price: 0.72 },
];

// Chart dimensions — larger
const CHART_X = 80;
const CHART_Y = 40;
const CHART_W = 1050;
const CHART_H = 460;

const toX = (t: number) => CHART_X + (t / 11) * CHART_W;
const toY = (p: number) => CHART_Y + CHART_H - ((p - 0.4) / 0.4) * CHART_H;

// Build a smooth cubic bezier spline through all data points (Catmull-Rom -> cubic bezier)
const buildSmoothPath = (data: typeof priceData, tension = 0.3): string => {
  if (data.length < 2) return '';
  const pts = data.map((d) => ({ x: toX(d.t), y: toY(d.p) }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

// Build area path that closes under the smooth line
const buildSmoothAreaPath = (data: typeof priceData, tension = 0.3): string => {
  const linePart = buildSmoothPath(data, tension);
  if (!linePart) return '';
  const lastPt = { x: toX(data[data.length - 1].t), y: CHART_Y + CHART_H };
  const firstPt = { x: toX(data[0].t), y: CHART_Y + CHART_H };
  return `${linePart} L ${lastPt.x} ${lastPt.y} L ${firstPt.x} ${firstPt.y} Z`;
};

// Pre-compute full paths (static data, no need to recalculate per frame)
const fullLinePath = buildSmoothPath(priceData);
const fullAreaPath = buildSmoothAreaPath(priceData);

// Get the interpolated price value at a fractional t-value using the same
// Catmull-Rom spline used for rendering, so the displayed price matches the dot.
const getPriceAtT = (tValue: number): number => {
  const segIdx = Math.min(Math.floor(tValue), priceData.length - 2);
  const segFrac = tValue - segIdx;
  const tension = 0.3;

  const p0 = priceData[Math.max(0, segIdx - 1)].p;
  const p1 = priceData[segIdx].p;
  const p2 = priceData[Math.min(priceData.length - 1, segIdx + 1)].p;
  const p3 = priceData[Math.min(priceData.length - 1, segIdx + 2)].p;

  const cp1 = p1 + (p2 - p0) * tension;
  const cp2 = p2 - (p3 - p1) * tension;

  const t = segFrac;
  const mt = 1 - t;
  return mt * mt * mt * p1 + 3 * mt * mt * t * cp1 + 3 * mt * t * t * cp2 + t * t * t * p2;
};

// Sample the smooth curve y-value at a given x by evaluating the Catmull-Rom spline
// This ensures the dot sits exactly on the curve at the clip boundary
const sampleCurveAtT = (tValue: number): { x: number; y: number } => {
  const x = toX(tValue);
  // Find which segment this t falls into
  const segIdx = Math.min(Math.floor(tValue), priceData.length - 2);
  const segFrac = tValue - segIdx;

  // Recreate the cubic bezier control points for this segment (same as buildSmoothPath)
  const tension = 0.3;
  const pts = priceData.map((d) => ({ x: toX(d.t), y: toY(d.p) }));
  const i = segIdx;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[Math.min(pts.length - 1, i + 1)];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];

  const cp1y = p1.y + (p2.y - p0.y) * tension;
  const cp2y = p2.y - (p3.y - p1.y) * tension;

  // Evaluate cubic bezier at parameter t using De Casteljau
  // First find the bezier parameter that corresponds to our x position
  // Since x is monotonically increasing, we can use the segment fraction directly
  const t = segFrac;
  const mt = 1 - t;
  const y =
    mt * mt * mt * p1.y +
    3 * mt * mt * t * cp1y +
    3 * mt * t * t * cp2y +
    t * t * t * p2.y;

  return { x, y };
};

const PriceChart: React.FC<{ frame: number }> = ({ frame }) => {
  // Smooth eased progress for the line draw
  const chartProgress = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  // Clip width drives both line and area reveal — single source of truth
  const clipWidth = (CHART_W + 10) * chartProgress;

  // Leading edge: fractional t-value (0..11) based on clip x-position
  const leadingT = chartProgress * 11;
  // Clamp to valid range for sampling
  const clampedT = Math.min(leadingT, priceData.length - 1);
  const leadPos = sampleCurveAtT(clampedT);

  // Determine which trade markers are visible based on continuous progress
  const visibleT = leadingT;

  // Grid lines
  const gridYValues = [0.45, 0.5, 0.55, 0.6, 0.65, 0.7];

  return (
    <svg width="1200" height="560" viewBox="0 0 1200 560">
      <defs>
        <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fintechColors.primary} stopOpacity="0.3" />
          <stop offset="100%" stopColor={fintechColors.primary} stopOpacity="0" />
        </linearGradient>
        {/* Single clip rect used for both line and area — keeps dot in sync */}
        <clipPath id="chartRevealClip">
          <rect
            x={CHART_X}
            y={0}
            width={clipWidth}
            height={CHART_H + CHART_Y + 20}
          />
        </clipPath>
      </defs>

      {/* Grid */}
      {gridYValues.map((val) => (
        <g key={val}>
          <line
            x1={CHART_X}
            y1={toY(val)}
            x2={CHART_X + CHART_W}
            y2={toY(val)}
            stroke={fintechColors.chart.grid}
            strokeDasharray="4,4"
          />
          <text
            x={CHART_X - 10}
            y={toY(val) + 4}
            textAnchor="end"
            fill={fintechColors.muted}
            fontSize="13"
            fontFamily={fintechTypography.numbers.fontFamily}
          >
            ${val.toFixed(2)}
          </text>
        </g>
      ))}

      {/* Area fill — clipped to revealed portion */}
      {chartProgress > 0 && (
        <path
          d={fullAreaPath}
          fill="url(#chartAreaGradient)"
          clipPath="url(#chartRevealClip)"
        />
      )}

      {/* Smooth price line — clipped to same rect as area */}
      {chartProgress > 0 && (
        <path
          d={fullLinePath}
          fill="none"
          stroke={fintechColors.chart.line}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#chartRevealClip)"
        />
      )}

      {/* Current price dot — positioned on the curve at the clip boundary */}
      {chartProgress > 0.01 && (
        <circle
          cx={leadPos.x}
          cy={leadPos.y}
          r="7"
          fill={fintechColors.primary}
          filter="drop-shadow(0 0 8px rgba(0,212,170,0.6))"
        />
      )}

      {/* Trade markers */}
      {trades.map((trade, i) => {
        const tradeDelay = 60 + i * 30;
        const markerOpacity = interpolate(frame, [tradeDelay, tradeDelay + 15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Only show marker once the line has reached this point
        if (trade.time > visibleT + 0.5) return null;

        const isBuy = trade.action === 'BUY';
        const markerColor = isBuy ? fintechColors.positive : fintechColors.negative;
        const mx = toX(trade.time);
        const my = toY(trade.price);

        return (
          <g key={i} opacity={markerOpacity}>
            {/* Vertical line */}
            <line
              x1={mx}
              y1={my}
              x2={mx}
              y2={CHART_Y + CHART_H}
              stroke={markerColor}
              strokeDasharray="3,3"
              opacity="0.4"
            />

            {/* Marker */}
            <circle cx={mx} cy={my} r="12" fill={markerColor} opacity="0.8" />
            <text
              x={mx}
              y={my - 20}
              textAnchor="middle"
              fill={markerColor}
              fontSize="13"
              fontWeight="700"
              fontFamily={fintechTypography.numbers.fontFamily}
            >
              {trade.action}
            </text>
            <text
              x={mx}
              y={my - 34}
              textAnchor="middle"
              fill={fintechColors.text}
              fontSize="11"
              fontFamily={fintechTypography.numbers.fontFamily}
            >
              ${trade.price.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// --- Enhanced AI Inference Pipeline Panel (replaces BotReasoningPanel) ---

const AIPipelinePanel: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const x = interpolate(slideIn, [0, 1], [400, 0]);

  // Step timing: each step fades in staggered
  const stepStart = [0, 25, 55, 85];

  const steps = [
    { id: 'api', label: 'Calling Inference API' },
    { id: 'guardrails', label: 'Guardrails Check' },
    { id: 'confidence', label: 'Confidence: 73%' },
    { id: 'execute', label: 'Executing Trade' },
  ];

  return (
    <div
      style={{
        transform: `translateX(${x}px)`,
        backgroundColor: fintechColors.surface,
        border: `1px solid ${fintechColors.secondary}30`,
        borderRadius: 12,
        padding: 24,
        width: 360,
      }}
    >
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: `${fintechColors.secondary}20`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 16,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1L2 5v8l7 4 7-4V5L9 1z"
              stroke={fintechColors.secondary}
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="9" cy="9" r="2.5" fill={fintechColors.secondary} />
          </svg>
        </div>
        <span style={{ ...fintechTypography.heading, fontSize: 16, color: fintechColors.secondary }}>
          AI Inference Pipeline
        </span>
      </div>

      {steps.map((step, i) => {
        const stepOpacity = interpolate(
          frame,
          [stepStart[i], stepStart[i] + 15],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const stepY = interpolate(
          frame,
          [stepStart[i], stepStart[i] + 15],
          [8, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={step.id}
            style={{
              opacity: stepOpacity,
              transform: `translateY(${stepY}px)`,
              marginBottom: i < steps.length - 1 ? 6 : 0,
            }}
          >
            {step.id === 'api' && (
              <APICallStep frame={frame} stepStart={stepStart[i]} />
            )}
            {step.id === 'guardrails' && (
              <GuardrailsStep frame={frame} stepStart={stepStart[i]} />
            )}
            {step.id === 'confidence' && (
              <ConfidenceStep frame={frame} stepStart={stepStart[i]} />
            )}
            {step.id === 'execute' && (
              <ExecuteStep frame={frame} stepStart={stepStart[i]} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const APICallStep: React.FC<{ frame: number; stepStart: number }> = ({ frame, stepStart }) => {
  const localFrame = Math.max(0, frame - stepStart);
  // Pulsing indicator
  const pulse = Math.sin(localFrame * 0.3) * 0.3 + 0.7;
  const spinnerDone = localFrame > 20;

  return (
    <div
      style={{
        backgroundColor: `${fintechColors.secondary}10`,
        borderRadius: 8,
        padding: '10px 14px',
        border: `1px solid ${fintechColors.secondary}20`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {!spinnerDone ? (
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: `2px solid ${fintechColors.secondary}`,
              borderTopColor: 'transparent',
              transform: `rotate(${localFrame * 18}deg)`,
            }}
          />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="6" fill={fintechColors.positive} />
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
        )}
        <span
          style={{
            ...fintechTypography.numbers,
            fontSize: 12,
            color: fintechColors.secondary,
            opacity: pulse,
          }}
        >
          POST /v1/completions
        </span>
      </div>
      {/* Model badge */}
      <div style={{ display: 'flex', gap: 6 }}>
        <span
          style={{
            ...fintechTypography.numbers,
            fontSize: 10,
            color: fintechColors.text,
            backgroundColor: `${fintechColors.secondary}25`,
            borderRadius: 4,
            padding: '2px 8px',
          }}
        >
          Claude
        </span>
        <span
          style={{
            ...fintechTypography.numbers,
            fontSize: 10,
            color: fintechColors.muted,
            backgroundColor: `${fintechColors.muted}15`,
            borderRadius: 4,
            padding: '2px 8px',
          }}
        >
          1,247 tokens
        </span>
      </div>
    </div>
  );
};

const GuardrailsStep: React.FC<{ frame: number; stepStart: number }> = ({ frame, stepStart }) => {
  const localFrame = Math.max(0, frame - stepStart);
  const check1Opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const check2Opacity = interpolate(localFrame, [10, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const checks = [
    { label: 'Input Validated', opacity: check1Opacity },
    { label: 'Output Filtered', opacity: check2Opacity },
  ];

  return (
    <div
      style={{
        backgroundColor: `${fintechColors.positive}08`,
        borderRadius: 8,
        padding: '10px 14px',
        border: `1px solid ${fintechColors.positive}20`,
      }}
    >
      <div
        style={{
          ...fintechTypography.body,
          fontSize: 12,
          color: fintechColors.muted,
          marginBottom: 6,
        }}
      >
        Guardrails Check
      </div>
      {checks.map((check, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: check.opacity,
            marginBottom: i === 0 ? 4 : 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle cx="6" cy="6" r="5" fill={fintechColors.positive} />
            <path d="M3.5 6l2 2 3-3.5" stroke="white" strokeWidth="1.2" fill="none" />
          </svg>
          <span style={{ ...fintechTypography.numbers, fontSize: 11, color: fintechColors.positive }}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const ConfidenceStep: React.FC<{ frame: number; stepStart: number }> = ({ frame, stepStart }) => {
  const localFrame = Math.max(0, frame - stepStart);
  const barWidth = interpolate(localFrame, [0, 25], [0, 73], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glowOpacity = interpolate(localFrame, [20, 30], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor: `${fintechColors.positive}08`,
        borderRadius: 8,
        padding: '10px 14px',
        border: `1px solid ${fintechColors.positive}15`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ ...fintechTypography.body, fontSize: 12, color: fintechColors.muted }}>
          Confidence
        </span>
        <span style={{ ...fintechTypography.numbers, fontSize: 12, color: fintechColors.positive }}>
          {Math.round(barWidth)}%
        </span>
      </div>
      {/* Bar background */}
      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          backgroundColor: `${fintechColors.muted}20`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            borderRadius: 4,
            backgroundColor: fintechColors.positive,
            boxShadow: `0 0 12px rgba(0,200,83,${glowOpacity})`,
          }}
        />
      </div>
      <div
        style={{
          ...fintechTypography.numbers,
          fontSize: 13,
          color: fintechColors.positive,
          marginTop: 6,
          fontWeight: 700,
        }}
      >
        BUY Signal
      </div>
    </div>
  );
};

const ExecuteStep: React.FC<{ frame: number; stepStart: number }> = ({ frame, stepStart }) => {
  const localFrame = Math.max(0, frame - stepStart);
  const checkScale = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
      }}
    >
      <div style={{ transform: `scale(${checkScale})` }}>
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="8" fill={fintechColors.positive} />
          <path d="M5 9l3 3 5-5.5" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <span style={{ ...fintechTypography.numbers, fontSize: 13, color: fintechColors.text }}>
        Executing BUY @ $0.61
      </span>
    </div>
  );
};

// --- Live Alert Ticker Strip ---

const alertItems = [
  { status: 'OK', label: 'Latency: 142ms' },
  { status: 'OK', label: 'Error Rate: 0.2%' },
  { status: 'WARN', label: 'Token Usage: 87%' },
  { status: 'OK', label: 'Drift Score: 0.04' },
  { status: 'OK', label: 'Content Flags: 0' },
  { status: 'OK', label: 'Moderation: Pass' },
];

const AlertTicker: React.FC<{ frame: number }> = ({ frame }) => {
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Total content width for seamless scrolling
  const itemWidth = 200;
  const totalWidth = alertItems.length * itemWidth;
  const scrollOffset = (frame * 1.5) % totalWidth;

  // Render items twice for seamless wrap
  const allItems = [...alertItems, ...alertItems];

  return (
    <div
      style={{
        opacity: fadeIn,
        height: 32,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 6,
        backgroundColor: `${fintechColors.surface}`,
        border: `1px solid ${fintechColors.muted}15`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          transform: `translateX(-${scrollOffset}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {allItems.map((item, i) => {
          const isWarn = item.status === 'WARN';
          const dotColor = isWarn ? fintechColors.accent : fintechColors.positive;
          return (
            <div
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 16px',
                minWidth: itemWidth,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  boxShadow: `0 0 6px ${dotColor}80`,
                }}
              />
              <span
                style={{
                  ...fintechTypography.numbers,
                  fontSize: 11,
                  color: isWarn ? fintechColors.accent : fintechColors.muted,
                  letterSpacing: 0.3,
                }}
              >
                [{item.status}]
              </span>
              <span
                style={{
                  ...fintechTypography.numbers,
                  fontSize: 11,
                  color: fintechColors.text,
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Request/Response Log Feed Overlay ---

const LOG_REQUEST = '> POST /v1/completions  {model: "claude", tokens: 1,247}';
const LOG_RESPONSE = '< 200 OK  {action: "BUY", confidence: 0.73}  [142ms]';

const LogFeedOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  // The overlay exists from frame 0-50 in its own Sequence (mapped to scene frames 110-160)
  const fadeIn = interpolate(frame, [0, 8], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [38, 50], [0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  // Typewriter: request types first 20 frames, response types next 20
  const reqChars = Math.min(
    LOG_REQUEST.length,
    Math.floor(interpolate(frame, [3, 20], [0, LOG_REQUEST.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }))
  );
  const resChars = Math.min(
    LOG_RESPONSE.length,
    Math.floor(interpolate(frame, [18, 35], [0, LOG_RESPONSE.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }))
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(10, 14, 23, 0.85)',
          borderRadius: 8,
          padding: '10px 16px',
          border: `1px solid ${fintechColors.muted}25`,
          maxWidth: 520,
        }}
      >
        <div
          style={{
            ...fintechTypography.numbers,
            fontSize: 11,
            color: fintechColors.primary,
            lineHeight: 1.8,
          }}
        >
          {LOG_REQUEST.slice(0, reqChars)}
          {reqChars < LOG_REQUEST.length && (
            <span style={{ opacity: frame % 6 < 3 ? 1 : 0, color: fintechColors.primary }}>_</span>
          )}
        </div>
        {resChars > 0 && (
          <div
            style={{
              ...fintechTypography.numbers,
              fontSize: 11,
              color: fintechColors.positive,
              lineHeight: 1.8,
            }}
          >
            {LOG_RESPONSE.slice(0, resChars)}
            {resChars < LOG_RESPONSE.length && (
              <span style={{ opacity: frame % 6 < 3 ? 1 : 0, color: fintechColors.positive }}>_</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Risk Monitor Mini-Panel ---

const riskIndicators = [
  { label: 'Hallucination Risk', value: 12, status: 'Low', color: fintechColors.positive },
  { label: 'Model Drift', value: 8, status: 'Normal', color: fintechColors.positive },
  { label: 'Prompt Injection', value: 0, status: 'Blocked', color: fintechColors.negative, blocked: true },
];

const RiskMonitorCard: React.FC<{ frame: number; baseDelay: number }> = ({ frame, baseDelay }) => {
  const cardOpacity = interpolate(
    frame,
    [baseDelay, baseDelay + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: fintechColors.surface,
        borderRadius: 8,
        padding: '12px 16px',
        opacity: cardOpacity,
      }}
    >
      <p
        style={{
          ...fintechTypography.body,
          fontSize: 11,
          color: fintechColors.muted,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        Risk Monitor
      </p>
      {riskIndicators.map((risk, i) => {
        const barProgress = interpolate(
          frame,
          [baseDelay + 10 + i * 8, baseDelay + 30 + i * 8],
          [0, risk.value],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div key={i} style={{ marginBottom: i < riskIndicators.length - 1 ? 5 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ ...fintechTypography.numbers, fontSize: 9, color: fintechColors.muted }}>
                {risk.label}
              </span>
              <span style={{ ...fintechTypography.numbers, fontSize: 9, color: risk.color }}>
                {risk.blocked ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <svg width="8" height="8" viewBox="0 0 8 8">
                      <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke={fintechColors.negative} strokeWidth="1.5" />
                    </svg>
                    {risk.status}
                  </span>
                ) : (
                  risk.status
                )}
              </span>
            </div>
            {!risk.blocked && (
              <div
                style={{
                  width: '100%',
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: `${fintechColors.muted}20`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barProgress}%`,
                    height: '100%',
                    borderRadius: 2,
                    backgroundColor: risk.color,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Guardrails Shield Badge ---

const GuardrailsShieldBadge: React.FC<{ frame: number }> = ({ frame }) => {
  // Shield draw animation via strokeDashoffset
  const shieldPathLength = 80; // approximate
  const drawProgress = interpolate(frame, [0, 30], [shieldPathLength, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subItems = ['Input Validated', 'Output Filtered', 'Rate Limited'];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="20" height="22" viewBox="0 0 20 22">
          <path
            d="M10 1L2 5v6c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V5L10 1z"
            fill="none"
            stroke={fintechColors.primary}
            strokeWidth="1.5"
            strokeDasharray={shieldPathLength}
            strokeDashoffset={drawProgress}
          />
          <path
            d="M7 11l2.5 2.5L13.5 9"
            fill="none"
            stroke={fintechColors.primary}
            strokeWidth="1.5"
            opacity={textOpacity}
          />
        </svg>
        <span
          style={{
            ...fintechTypography.body,
            fontSize: 11,
            color: fintechColors.primary,
            opacity: textOpacity,
          }}
        >
          Guardrails Active
        </span>
      </div>
      {subItems.map((item, i) => {
        const itemOpacity = interpolate(
          frame,
          [35 + i * 10, 45 + i * 10],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <span
            key={i}
            style={{
              ...fintechTypography.numbers,
              fontSize: 9,
              color: fintechColors.muted,
              opacity: itemOpacity,
            }}
          >
            {item}
          </span>
        );
      })}
    </div>
  );
};

export const TradingBotScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Compute live price matching the dot position on the chart
  const chartProgress = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const leadingT = Math.min(chartProgress * 11, priceData.length - 1);
  const currentPrice = getPriceAtT(leadingT);

  return (
    <AbsoluteFill style={{ backgroundColor: fintechColors.background, padding: 50 }}>
      {/* Header */}
      <div style={{ opacity: titleOpacity, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: `${fintechColors.secondary}15`,
                borderRadius: 20,
                padding: '6px 16px',
                marginBottom: 12,
              }}
            >
              <span style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.secondary }}>
                Polymarket AI Trading Bot
              </span>
            </div>
            <h2 style={{ ...fintechTypography.heading, fontSize: 36, color: fintechColors.text, margin: 0 }}>
              Prediction Market Autonomous Agent
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.muted, margin: 0 }}>
              Current Price
            </p>
            <p style={{ ...fintechTypography.numbers, fontSize: 42, color: fintechColors.positive, margin: 0 }}>
              ${currentPrice.toFixed(2)}
            </p>
            {/* Guardrails Shield Badge — appears after frame 160 */}
            <Sequence from={160} durationInFrames={80}>
              <div style={{ marginTop: 8 }}>
                <GuardrailsShieldBadge frame={frame - 160} />
              </div>
            </Sequence>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 30, flex: 1 }}>
        {/* Chart area */}
        <div
          style={{
            flex: 1,
            backgroundColor: fintechColors.surface,
            borderRadius: 12,
            border: `1px solid ${fintechColors.muted}20`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <PriceChart frame={frame} />

          {/* Log Feed Overlay — appears frames 110-160 */}
          <Sequence from={110} durationInFrames={50}>
            <LogFeedOverlay frame={frame - 110} />
          </Sequence>
        </div>

        {/* Enhanced AI Pipeline Panel (replaces BotReasoningPanel) */}
        <Sequence from={120} durationInFrames={120}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AIPipelinePanel frame={frame - 120} fps={fps} />
          </div>
        </Sequence>
      </div>

      {/* Alert Ticker Strip — visible immediately */}
      <Sequence from={0} durationInFrames={240}>
        <div style={{ marginTop: 10 }}>
          <AlertTicker frame={frame} />
        </div>
      </Sequence>

      {/* P&L bar with Risk Monitor */}
      <div
        style={{
          display: 'flex',
          gap: 30,
          marginTop: 10,
        }}
      >
        {[
          { label: 'Total Trades', value: '47' },
          { label: 'Win Rate', value: '72%' },
          { label: 'Total P&L', value: '+$3,240', color: fintechColors.positive },
        ].map((stat, i) => {
          const statOpacity = interpolate(
            frame,
            [150 + i * 10, 170 + i * 10],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: fintechColors.surface,
                borderRadius: 8,
                padding: '14px 20px',
                opacity: statOpacity,
              }}
            >
              <p style={{ ...fintechTypography.body, fontSize: 12, color: fintechColors.muted, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                {stat.label}
              </p>
              <p style={{ ...fintechTypography.numbers, fontSize: 24, color: stat.color || fintechColors.text, margin: '4px 0 0' }}>
                {stat.value}
              </p>
            </div>
          );
        })}

        {/* Risk Monitor card replaces Sharpe Ratio stat */}
        <RiskMonitorCard frame={frame} baseDelay={180} />
      </div>
    </AbsoluteFill>
  );
};
