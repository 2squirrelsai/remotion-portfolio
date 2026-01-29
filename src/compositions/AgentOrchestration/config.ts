import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

// Composition settings
export const AgentShowcaseConfig = {
  id: 'ai-agents-orchestration',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 900, // 30 seconds
};

// Scene timing (in frames)
export const SceneTiming = {
  intro: { start: 0, duration: 150 },           // 0-5s
  network: { start: 150, duration: 300 },       // 5-15s
  workflow: { start: 450, duration: 210 },      // 15-22s
  metrics: { start: 660, duration: 180 },       // 22-28s
  outro: { start: 840, duration: 60 },          // 28-30s
};

// Color palette
export const colors = {
  background: '#0a0a0a',
  primary: '#00ff88',      // Neon green for agents
  secondary: '#00b4d8',    // Cyan for connections
  accent: '#7b2cbf',       // Purple for highlights
  text: '#ffffff',
  muted: '#666666',
};

// Load fonts
const { fontFamily: interFont } = loadFont();
const { fontFamily: monoFont } = loadMono();

export const typography = {
  heading: { fontFamily: interFont, fontWeight: 700 as const },
  body: { fontFamily: interFont, fontWeight: 400 as const },
  code: { fontFamily: monoFont, fontWeight: 400 as const },
};

// Projects featured
export const projects = [
  {
    name: 'Multi-Agent SaaS Orchestration',
    description: 'Claude Code agent coordination',
  },
  {
    name: 'Agent Force: Multi-agent Workforce',
    description: 'Multi-agent productivity platform',
  },
  {
    name: 'E-Comm Customer Service Agents: CrewAI-RAG',
    description: 'AI agent systems',
  },
  {
    name: 'Chatbot MCP Server',
    description: 'MCP streaming server chatbot',
  },
  {
    name: 'Customer Service Agents Demo',
    description: 'OpenAI Agents SDK',
  },
];
