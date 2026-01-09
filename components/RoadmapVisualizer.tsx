import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Roadmap, RoadmapNode, NodeType } from '../types';
import { Move, ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';

interface RoadmapVisualizerProps {
  roadmap: Roadmap;
  onNodeToggle: (id: string) => void;
}

// Layout Configuration
const NODE_WIDTH = 280;
const NODE_HEIGHT = 160;
const LEVEL_SPACING = 350;
const VERTICAL_SPACING = 180;
const RADIUS = 12;

// --- Canvas Helper Classes ---

class GraphNode {
  id: string;
  x: number = 0;
  y: number = 0;
  data: RoadmapNode;
  level: number = 0;

  constructor(data: RoadmapNode) {
    this.id = data.id;
    this.data = data;
  }
}

// --- Component ---

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({ roadmap, onNodeToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport State
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Process Nodes & Calculate Layout
  const graphData = useMemo(() => {
    const nodes = roadmap.nodes.map(n => new GraphNode(n));
    // Explicitly type the Map to ensure proper type inference for values
    const nodeMap = new Map<string, GraphNode>(nodes.map(n => [n.id, n] as [string, GraphNode]));

    // 1. Calculate Levels (Depth)
    // Simple approach: Level = Max(ParentLevel) + 1
    const getLevel = (node: GraphNode, visited = new Set<string>()): number => {
      if (visited.has(node.id)) return 0; // Cycle detection
      visited.add(node.id);
      
      if (node.data.dependencies.length === 0) return 0;
      
      let maxParentLevel = -1;
      node.data.dependencies.forEach(depId => {
        const parent = nodeMap.get(depId);
        if (parent) {
          maxParentLevel = Math.max(maxParentLevel, getLevel(parent, new Set(visited)));
        }
      });
      return maxParentLevel + 1;
    };

    nodes.forEach(node => {
      node.level = getLevel(node);
    });

    // 2. Group by Level and Assign Coordinates
    const levels = new Map<number, GraphNode[]>();
    nodes.forEach(node => {
      if (!levels.has(node.level)) levels.set(node.level, []);
      levels.get(node.level)!.push(node);
    });

    let maxY = 0;

    levels.forEach((levelNodes, level) => {
      // Sort nodes in level to try to minimize edge crossing (heuristic: mostly stable sort)
      levelNodes.sort((a, b) => a.id.localeCompare(b.id));

      const totalHeight = (levelNodes.length - 1) * VERTICAL_SPACING;
      const startY = -totalHeight / 2;

      levelNodes.forEach((node, index) => {
        node.x = level * LEVEL_SPACING;
        node.y = startY + index * VERTICAL_SPACING;
        // Jitter slightly to look organic if needed, but clean grid is better for reading
      });
      
      if (totalHeight > maxY) maxY = totalHeight;
    });

    // Center the whole graph vertically
    // Coordinates are relative to (0,0) being the start
    
    return { nodes, nodeMap };
  }, [roadmap]);

  // --- Rendering Logic ---

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineArray = [];

    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lineArray.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lineArray.push(line);

    for (let k = 0; k < lineArray.length; k++) {
      ctx.fillText(lineArray[k], x, y + k * lineHeight);
    }
    return lineArray.length * lineHeight;
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Background Grid (Dot Pattern)
    const gridSize = 24 * scale;
    ctx.fillStyle = '#f1f5f9';
    for(let x = (offset.x % gridSize); x < rect.width; x += gridSize) {
       for(let y = (offset.y % gridSize); y < rect.height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
          ctx.fill();
       }
    }

    // Apply Transform
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // --- Draw Edges ---
    ctx.lineWidth = 2;
    
    graphData.nodes.forEach(node => {
       node.data.dependencies.forEach(depId => {
         const parent = graphData.nodeMap.get(depId);
         if (parent) {
            const startX = parent.x + NODE_WIDTH;
            const startY = parent.y + NODE_HEIGHT / 2;
            const endX = node.x;
            const endY = node.y + NODE_HEIGHT / 2;

            const midX = (startX + endX) / 2;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            // Cubic bezier for smooth S-curve
            ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
            
            // Gradient Stroke
            const grad = ctx.createLinearGradient(startX, startY, endX, endY);
            grad.addColorStop(0, '#cbd5e1'); // Slate-300
            grad.addColorStop(1, '#94a3b8'); // Slate-400
            ctx.strokeStyle = grad;
            ctx.stroke();
         }
       });
    });

    // --- Draw Nodes ---
    graphData.nodes.forEach(node => {
      const isCompleted = node.data.status === 'completed';
      const isHovered = hoveredNodeId === node.id;
      
      // Node Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // Node Background
      ctx.fillStyle = '#ffffff';
      if (isCompleted) ctx.fillStyle = '#eff6ff'; // brand-50
      
      drawRoundedRect(ctx, node.x, node.y, NODE_WIDTH, NODE_HEIGHT, RADIUS);
      ctx.fill();

      // Reset Shadow for stroke
      ctx.shadowColor = 'transparent';

      // Node Border
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      if (isCompleted) ctx.strokeStyle = '#60a5fa'; // brand-400
      if (isHovered) ctx.strokeStyle = '#3b82f6'; // brand-500
      
      ctx.stroke();

      // Top Bar (Color code by type)
      const typeColors: Record<string, string> = {
        CONCEPT: '#64748b', // Slate
        PROJECT: '#9333ea', // Purple
        MILESTONE: '#d97706', // Amber
        RESOURCE: '#3b82f6', // Blue
      };
      const barColor = typeColors[node.data.type] || '#64748b';
      
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.moveTo(node.x + RADIUS, node.y);
      ctx.lineTo(node.x + NODE_WIDTH - RADIUS, node.y);
      ctx.quadraticCurveTo(node.x + NODE_WIDTH, node.y, node.x + NODE_WIDTH, node.y + RADIUS);
      ctx.lineTo(node.x, node.y + RADIUS);
      ctx.quadraticCurveTo(node.x, node.y, node.x + RADIUS, node.y);
      ctx.fill();

      // Type Label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(node.data.type, node.x + 12, node.y + 10);

      // Status Badge (Top Right)
      if (isCompleted) {
        ctx.fillStyle = '#22c55e'; // Green
        ctx.beginPath();
        ctx.arc(node.x + NODE_WIDTH - 20, node.y + 24, 8, 0, Math.PI * 2);
        ctx.fill();
        // Checkmark
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(node.x + NODE_WIDTH - 24, node.y + 24);
        ctx.lineTo(node.x + NODE_WIDTH - 21, node.y + 27);
        ctx.lineTo(node.x + NODE_WIDTH - 16, node.y + 21);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(node.x + NODE_WIDTH - 20, node.y + 24, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = isCompleted ? '#1e3a8a' : '#0f172a'; // slate-900
      ctx.font = 'bold 16px Inter, sans-serif';
      wrapText(ctx, node.data.title, node.x + 20, node.y + 50, NODE_WIDTH - 40, 20);

      // Description (Truncated)
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '12px Inter, sans-serif';
      const descHeight = wrapText(ctx, node.data.description, node.x + 20, node.y + 90, NODE_WIDTH - 40, 16);

      // Metadata (Bottom)
      const hours = `${node.data.estimatedHours}h`;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(hours, node.x + 20, node.y + NODE_HEIGHT - 15);
      
      // Difficulty
      const diff = node.data.difficulty;
      let diffColor = '#22c55e';
      if (diff === 'INTERMEDIATE') diffColor = '#3b82f6';
      if (diff === 'ADVANCED') diffColor = '#f97316';
      
      ctx.fillStyle = diffColor;
      ctx.fillText(diff, node.x + NODE_WIDTH - 20 - ctx.measureText(diff).width, node.y + NODE_HEIGHT - 15);

    });

    ctx.restore();
  };

  // --- Event Handlers ---

  useEffect(() => {
    const animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  });

  // Center Graph on Mount
  useEffect(() => {
    if (containerRef.current && graphData.nodes.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const nodesY = graphData.nodes.map(n => n.y);
      const minY = Math.min(...nodesY);
      const maxY = Math.max(...nodesY);
      const height = maxY - minY + NODE_HEIGHT;
      
      setOffset({
        x: 100, // Start with some padding
        y: (rect.height / 2) - ((minY + maxY + NODE_HEIGHT)/2)
      });
    }
  }, [graphData]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate Mouse Pos relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left);
    const mouseY = (e.clientY - rect.top);
    
    // Convert to Graph Space
    const graphX = (mouseX - offset.x) / scale;
    const graphY = (mouseY - offset.y) / scale;

    // Hover Detection
    let hitId: string | null = null;
    for (const node of graphData.nodes) {
      if (
        graphX >= node.x && graphX <= node.x + NODE_WIDTH &&
        graphY >= node.y && graphY <= node.y + NODE_HEIGHT
      ) {
        hitId = node.id;
        break;
      }
    }
    setHoveredNodeId(hitId);
    canvas.style.cursor = hitId ? 'pointer' : (isDragging ? 'grabbing' : 'grab');

    // Pan Logic
    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = () => {
    if (hoveredNodeId) {
      onNodeToggle(hoveredNodeId);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // Prevent page scroll
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, scale + delta), 2);
    setScale(newScale);
  };

  // Stats
  const completedCount = roadmap.nodes.filter(n => n.status === 'completed').length;
  const progress = Math.round((completedCount / roadmap.nodes.length) * 100);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
         <div className="bg-white/90 backdrop-blur shadow-lg border border-slate-200 p-4 rounded-xl pointer-events-auto max-w-md">
            <h1 className="font-bold text-slate-800 text-lg">{roadmap.title}</h1>
            <p className="text-sm text-slate-500 line-clamp-2">{roadmap.description}</p>
            <div className="mt-3 flex items-center gap-3">
               <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
               </div>
               <span className="text-xs font-bold text-brand-600">{progress}%</span>
            </div>
         </div>

         <div className="flex flex-col gap-2 pointer-events-auto">
            <button 
              className="p-2 bg-white shadow-md rounded-lg border border-slate-200 hover:bg-slate-50"
              onClick={() => setScale(s => Math.min(s + 0.1, 2))}
            >
              <ZoomIn size={20} className="text-slate-600" />
            </button>
            <button 
              className="p-2 bg-white shadow-md rounded-lg border border-slate-200 hover:bg-slate-50"
              onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
            >
              <ZoomOut size={20} className="text-slate-600" />
            </button>
            <button 
              className="p-2 bg-white shadow-md rounded-lg border border-slate-200 hover:bg-slate-50"
              onClick={() => {
                setScale(0.8);
                setOffset({ x: 50, y: 50 });
              }}
            >
              <Maximize size={20} className="text-slate-600" />
            </button>
         </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
          className="block w-full h-full"
        />
      </div>

      <div className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-500">
         <div className="flex gap-4">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"/> Concept</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-600"/> Project</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/> Milestone</div>
         </div>
         <div>
            Scroll to Zoom • Drag to Pan • Click to Complete
         </div>
      </div>
    </div>
  );
};