import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { fintechColors, fintechTypography } from './config';

// Portfolio data
const portfolio = [
  { category: 'NIL Income', value: 45000, color: '#4CAF50', pct: 47 },
  { category: 'Investments', value: 25000, color: '#2196F3', pct: 26 },
  { category: 'Savings', value: 15000, color: '#9C27B0', pct: 16 },
  { category: 'Expenses', value: 10000, color: '#FF9800', pct: 11 },
];

const transactions = [
  { label: 'NIL Sponsor Payment', amount: '+$5,000', type: 'income' as const },
  { label: 'Investment Deposit', amount: '-$2,000', type: 'expense' as const },
  { label: 'Merch Revenue', amount: '+$1,250', type: 'income' as const },
  { label: 'Training Equipment', amount: '-$480', type: 'expense' as const },
];

// Animated donut chart — sized to fit inside phone
const DonutChart: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={fintechColors.surface} strokeWidth={strokeWidth} />

      {/* Segments */}
      {portfolio.map((item, i) => {
        const segmentLength = (item.pct / 100) * circumference * progress;
        const offset = circumference - cumulativeOffset * progress;
        cumulativeOffset += (item.pct / 100) * circumference;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}

      {/* Center text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill={fintechColors.text}
        fontSize="11"
        fontFamily={fintechTypography.body.fontFamily}
      >
        Total
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill={fintechColors.primary}
        fontSize="18"
        fontWeight="700"
        fontFamily={fintechTypography.numbers.fontFamily}
      >
        $95K
      </text>
    </svg>
  );
};

export const NilWalletScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slide in from bottom
  const phoneSlide = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const phoneY = interpolate(phoneSlide, [0, 1], [300, 0]);

  // Balance counter
  const balanceValue = Math.floor(
    interpolate(frame, [30, 90], [0, 95000], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    })
  );

  // Description text
  const descOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Partner logos fade-in (Plaid first, then Stripe)
  const plaidOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const plaidScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
  });

  const stripeOpacity = interpolate(frame, [70, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stripeScale = spring({
    frame: frame - 70,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: fintechColors.background }}>
      {/* Partner logos — bottom center, horizontal with label */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          zIndex: 0,
        }}
      >
        <span
          style={{
            ...fintechTypography.body,
            fontSize: 14,
            color: fintechColors.muted,
            opacity: plaidOpacity,
          }}
        >
          API Integrations:
        </span>
        <Img
          src={staticFile('plaid-logo.svg')}
          style={{
            width: 120,
            height: 'auto',
            opacity: plaidOpacity,
            transform: `scale(${Math.max(0, plaidScale)})`,
          }}
        />
        <Img
          src={staticFile('stripe-logo.svg')}
          style={{
            width: 120,
            height: 'auto',
            opacity: stripeOpacity,
            transform: `scale(${Math.max(0, stripeScale)})`,
          }}
        />
      </div>

      {/* Left: Description */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 120,
          width: 550,
          display: 'flex',
          flexDirection: 'column',
          opacity: descOpacity,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: `${fintechColors.primary}15`,
            borderRadius: 20,
            padding: '6px 16px',
            marginBottom: 20,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.primary }}>
            NilWallet
          </span>
        </div>

        <h2
          style={{
            ...fintechTypography.heading,
            fontSize: 52,
            color: fintechColors.text,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Athlete Financial
          <br />
          <span style={{ color: fintechColors.primary }}>Platform</span>
        </h2>

        <p
          style={{
            ...fintechTypography.body,
            fontSize: 20,
            color: fintechColors.muted,
            marginTop: 30,
            lineHeight: 1.6,
          }}
        >
          Manage NIL income, investments, and expenses
          <br />
          in one unified mobile experience.
        </p>

        {/* Portfolio legend */}
        <Sequence from={80} durationInFrames={160} layout="none">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 40 }}>
            {portfolio.map((item, i) => {
              const itemOpacity = interpolate(
                frame,
                [80 + i * 10, 100 + i * 10],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: itemOpacity }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.text }}>
                    {item.category} ({item.pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Sequence>
      </div>

      {/* Right: Phone mockup */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: '50%',
          transform: `translateY(calc(-50% + ${phoneY}px))`,
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: 360,
            height: 720,
            backgroundColor: fintechColors.surface,
            borderRadius: 40,
            border: `3px solid ${fintechColors.muted}30`,
            overflow: 'hidden',
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${fintechColors.primary}10`,
          }}
        >
          {/* Inner content — clipped to phone bounds */}
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Status bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 4px 12px',
                flexShrink: 0,
              }}
            >
              <span style={{ ...fintechTypography.numbers, fontSize: 12, color: fintechColors.muted }}>
                9:41
              </span>
              <span style={{ ...fintechTypography.numbers, fontSize: 12, color: fintechColors.muted }}>
                100%
              </span>
            </div>

            {/* Balance — centered */}
            <div
              style={{
                textAlign: 'center',
                flexShrink: 0,
                marginBottom: 8,
              }}
            >
              <p style={{ ...fintechTypography.body, fontSize: 14, color: fintechColors.muted, margin: 0 }}>
                Total Balance
              </p>
              <p style={{ ...fintechTypography.numbers, fontSize: 32, color: fintechColors.text, margin: '4px 0 0' }}>
                ${balanceValue.toLocaleString()}
              </p>
            </div>

            {/* Donut chart — centered below balance */}
            <Sequence from={40} durationInFrames={200} layout="none">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                  paddingTop: 8,
                  paddingBottom: 25,
                  width: '100%',
                }}
              >
                <DonutChart frame={Math.max(0, frame - 40)} />
              </div>
            </Sequence>

            {/* Transactions — fade in below donut chart */}
            <Sequence from={60} durationInFrames={180} layout="none">
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
                {transactions.map((tx, i) => {
                  const txOpacity = interpolate(
                    frame,
                    [65 + i * 12, 80 + i * 12],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        opacity: txOpacity,
                      }}
                    >
                      <span style={{ ...fintechTypography.body, fontSize: 12, color: fintechColors.text }}>
                        {tx.label}
                      </span>
                      <span
                        style={{
                          ...fintechTypography.numbers,
                          fontSize: 12,
                          color: tx.type === 'income' ? fintechColors.positive : fintechColors.negative,
                          marginTop: 2,
                        }}
                      >
                        {tx.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Sequence>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
