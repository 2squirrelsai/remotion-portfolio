import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, typography } from './config';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animations
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Subtitle animation (delayed)
  const subtitleOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleY = interpolate(frame, [40, 70], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glowing effect
  const glowIntensity = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [20, 40]
  );

  // Letter-by-letter reveal for title
  const title = 'AI Agent Orchestration';
  const lettersToShow = Math.floor(interpolate(frame, [0, 60], [0, title.length], {
    extrapolateRight: 'clamp',
  }));

  // Logo fade-in (appears early, centered just above the title area)
  const logoOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Logo - centered just off top of canvas */}
      <Img
        src={staticFile('2squirrelsao-logo-transparent.svg')}
        style={{
          position: 'absolute',
          top: 60,
          width: 180,
          height: 'auto',
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      />

      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
          opacity: titleOpacity * 0.5,
          filter: `blur(${glowIntensity}px)`,
        }}
      />

      {/* Main title */}
      <h1
        style={{
          ...typography.heading,
          fontSize: 100,
          color: colors.primary,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textShadow: `0 0 ${glowIntensity}px ${colors.primary}`,
          letterSpacing: '-2px',
          margin: 0,
        }}
      >
        {title.split('').map((letter, i) => (
          <span
            key={i}
            style={{
              opacity: i < lettersToShow ? 1 : 0,
            }}
          >
            {letter}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          ...typography.body,
          fontSize: 32,
          color: colors.muted,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          marginTop: 30,
        }}
      >
        Multi-Agent Systems & Collaboration
      </p>

      {/* Decorative lines */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          display: 'flex',
          gap: 20,
        }}
      >
        {[0, 1, 2].map((i) => {
          const lineProgress = interpolate(
            frame,
            [80 + i * 10, 110 + i * 10],
            [0, 100],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={i}
              style={{
                width: lineProgress,
                height: 3,
                backgroundColor: colors.secondary,
                borderRadius: 2,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
