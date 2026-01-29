import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, typography, projects } from './config';

interface ProjectCardProps {
  project: typeof projects[0];
  index: number;
  frame: number;
  fps: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, frame, fps }) => {
  const delay = index * 8;

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Hover-like effect based on time
  const hoverScale = 1 + Math.sin(frame * 0.08 + index * 0.5) * 0.02;

  return (
    <div
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.muted}40`,
        borderRadius: 12,
        padding: 20,
        opacity,
        transform: `scale(${Math.max(0, scale) * hoverScale})`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        minWidth: 320,
      }}
    >
      {/* Icon placeholder */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 24,
        }}
      >
        🤖
      </div>
      <div>
        <p
          style={{
            ...typography.heading,
            fontSize: 16,
            color: colors.text,
            margin: 0,
          }}
        >
          {project.name}
        </p>
        <p
          style={{
            ...typography.body,
            fontSize: 13,
            color: colors.muted,
            margin: '4px 0 0',
          }}
        >
          {project.description}
        </p>
      </div>
    </div>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(frame, [0, 20], [-30, 0], {
    extrapolateRight: 'clamp',
  });

  // CTA animation
  const ctaOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo fade-in at bottom
  const logoOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 200 },
  });

  // Final fade out
  const fadeOut = interpolate(frame, [50, 60], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at center, ${colors.accent}10 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          zIndex: 1,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <h2
            style={{
              ...typography.heading,
              fontSize: 56,
              color: colors.text,
              margin: 0,
            }}
          >
            Featured Projects
          </h2>
          <p
            style={{
              ...typography.body,
              fontSize: 24,
              color: colors.muted,
              marginTop: 12,
            }}
          >
            Building the Future of AI Agent Systems
          </p>
        </div>

        {/* Project grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            maxWidth: 1200,
          }}
        >
          {projects.slice(0, 3).map((project, i) => (
            <ProjectCard
              key={i}
              project={project}
              index={i}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
            maxWidth: 700,
          }}
        >
          {projects.slice(3, 5).map((project, i) => (
            <ProjectCard
              key={i + 3}
              project={project}
              index={i + 3}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: ctaOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: colors.primary,
              boxShadow: `0 0 10px ${colors.primary}`,
            }}
          />
          <span
            style={{
              ...typography.code,
              fontSize: 18,
              color: colors.primary,
            }}
          >
            Explore AI Agent Orchestration
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: colors.primary,
              boxShadow: `0 0 10px ${colors.primary}`,
            }}
          />
        </div>
      </div>

      {/* Logo - bottom center */}
      <Img
        src={staticFile('2squirrelsao-logo-transparent.svg')}
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: `translateX(-50%) scale(${Math.max(0, logoScale)})`,
          width: 140,
          height: 'auto',
          opacity: logoOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
