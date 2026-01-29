import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { colors, typography, projects } from './config';

// Agent node positions in 3D space
const agentPositions: [number, number, number][] = [
  [0, 0, 0],      // Central orchestrator
  [-3, 2, -1],    // Top left
  [3, 2, -1],     // Top right
  [-3, -2, -1],   // Bottom left
  [3, -2, -1],    // Bottom right
];

// Connections between agents (pairs of indices)
const connections: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], // Central to all
  [1, 2], [3, 4], // Horizontal pairs
];

interface AgentNodeProps {
  position: [number, number, number];
  frame: number;
  index: number;
  fps: number;
}

const AgentNode: React.FC<AgentNodeProps> = ({ position, frame, index, fps }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);

  // Staggered appearance
  const appearDelay = index * 15;
  const scale = spring({
    frame: frame - appearDelay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Pulsing effect
  const pulse = 1 + Math.sin(frame * 0.08 + index) * 0.1;
  const finalScale = Math.max(0, scale) * pulse;

  // Emissive intensity animation
  const emissiveIntensity = 0.3 + Math.sin(frame * 0.1 + index * 0.5) * 0.2;

  const color = index === 0 ? colors.primary : colors.secondary;

  return (
    <group position={position}>
      <mesh ref={meshRef} scale={finalScale}>
        <sphereGeometry args={[index === 0 ? 0.6 : 0.4, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Outer glow ring */}
      <mesh scale={finalScale * 1.3} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  frame: number;
  index: number;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ start, end, frame, index }) => {
  // Animated progress
  const delay = 60 + index * 10;
  const progress = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const points = useMemo((): [number, number, number][] => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = endVec.clone().sub(startVec).multiplyScalar(progress).add(startVec);
    return [
      [startVec.x, startVec.y, startVec.z],
      [midPoint.x, midPoint.y, midPoint.z],
    ];
  }, [start, end, progress]);

  // Data flow animation (moving dot)
  const flowPosition = useMemo((): [number, number, number] | null => {
    if (progress < 1) return null;
    const t = (Math.sin(frame * 0.1 + index * 2) + 1) / 2;
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const pos = startVec.lerp(endVec, t);
    return [pos.x, pos.y, pos.z];
  }, [frame, index, start, end, progress]);

  return (
    <>
      <Line
        points={points}
        color={colors.secondary}
        lineWidth={2}
        transparent
        opacity={0.6}
      />
      {flowPosition && progress >= 1 && (
        <mesh position={flowPosition}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={colors.primary} />
        </mesh>
      )}
    </>
  );
};

interface SceneContentProps {
  frame: number;
  fps: number;
}

const SceneContent: React.FC<SceneContentProps> = ({ frame, fps }) => {
  // Camera rotation
  const cameraAngle = interpolate(frame, [0, 300], [0, Math.PI * 0.3], {
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color={colors.primary} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={colors.secondary} />

      <group rotation={[0.2, cameraAngle, 0]}>
        {/* Agent nodes */}
        {agentPositions.map((pos, i) => (
          <AgentNode
            key={i}
            position={pos}
            frame={frame}
            index={i}
            fps={fps}
          />
        ))}

        {/* Connections */}
        {connections.map(([startIdx, endIdx], i) => (
          <ConnectionLine
            key={i}
            start={agentPositions[startIdx]}
            end={agentPositions[endIdx]}
            frame={frame}
            index={i}
          />
        ))}
      </group>
    </>
  );
};

export const AgentNetworkScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Labels that appear
  const labelOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <SceneContent frame={frame} fps={fps} />
      </Canvas>

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          opacity: labelOpacity,
        }}
      >
        <h2
          style={{
            ...typography.heading,
            fontSize: 48,
            color: colors.text,
            margin: 0,
          }}
        >
          Agent Network
        </h2>
        <p
          style={{
            ...typography.body,
            fontSize: 24,
            color: colors.muted,
            marginTop: 10,
          }}
        >
          Interconnected AI Agents Working Together
        </p>
      </div>

      {/* Agent labels */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          opacity: labelOpacity,
        }}
      >
        {projects.slice(0, 5).map((project, i) => {
          const itemOpacity = interpolate(
            frame,
            [100 + i * 20, 130 + i * 20],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={i}
              style={{
                opacity: itemOpacity,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: i === 0 ? colors.primary : colors.secondary,
                  margin: '0 auto 8px',
                }}
              />
              <p
                style={{
                  ...typography.code,
                  fontSize: 14,
                  color: colors.text,
                  margin: 0,
                  maxWidth: 200,
                }}
              >
                {project.name}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
