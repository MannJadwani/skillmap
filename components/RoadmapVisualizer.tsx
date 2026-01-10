import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Roadmap, RoadmapNode, NodeType } from '../types';
import { Move, ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';

interface RoadmapVisualizerProps {
  roadmap: Roadmap;
  onNodeToggle: (id: string) => void;
}

// Layout Configuration
const NODE_WIDTH = 280;
const NODE_HEIGHT = 160;
const LEVEL_SPACING = 200; // Vertical spacing between levels (top to bottom)
const HORIZONTAL_SPACING = 300; // Horizontal spacing between nodes in same level
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

    let maxX = 0;

    levels.forEach((levelNodes, level) => {
      // Sort nodes in level to try to minimize edge crossing (heuristic: mostly stable sort)
      levelNodes.sort((a, b) => a.id.localeCompare(b.id));

      const totalWidth = (levelNodes.length - 1) * HORIZONTAL_SPACING;
      const startX = -totalWidth / 2;

      levelNodes.forEach((node, index) => {
        // Top to bottom: y increases with level, x varies within level
        node.y = level * LEVEL_SPACING;
        node.x = startX + index * HORIZONTAL_SPACING;
      });
      
      if (totalWidth > maxX) maxX = totalWidth;
    });

    // Center the whole graph horizontally
    // Coordinates are relative to (0,0) being the start
    
    return { nodes, nodeMap };
  }, [roadmap]);

  const graphBounds = useMemo(() => {
    if (!graphData?.nodes.length) return null;

    const nodesX = graphData.nodes.map(n => n.x);
    const nodesY = graphData.nodes.map(n => n.y);

    return {
      minX: Math.min(...nodesX),
      maxX: Math.max(...nodesX),
      minY: Math.min(...nodesY),
      maxY: Math.max(...nodesY)
    };
  }, [graphData]);

  const fitToView = useCallback(() => {
    if (!containerRef.current || !graphBounds) return;

    const rect = containerRef.current.getBoundingClientRect();
    const padding = 80;

    const graphWidth = (graphBounds.maxX - graphBounds.minX) + NODE_WIDTH;
    const graphHeight = (graphBounds.maxY - graphBounds.minY) + NODE_HEIGHT;

    const scaleX = rect.width / (graphWidth + padding * 2);
    const scaleY = rect.height / (graphHeight + padding * 2);
    const nextScale = Math.min(Math.max(0.2, Math.min(scaleX, scaleY)), 2);

    const centerX = (graphBounds.minX + graphBounds.maxX + NODE_WIDTH) / 2;
    const centerY = (graphBounds.minY + graphBounds.maxY + NODE_HEIGHT) / 2;

    setScale(nextScale);
    setOffset({
      x: rect.width / 2 - centerX * nextScale,
      y: rect.height / 2 - centerY * nextScale
    });
  }, [graphBounds]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await containerRef.current.requestFullscreen();
  }, []);

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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear with Dark Background
    ctx.fillStyle = '#0a0a0a'; // bg-dark-950
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Background Grid (Dot Pattern)
    const gridSize = 24 * scale;
    ctx.fillStyle = '#2c2c2c'; // bg-dark-700
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
            // Top to bottom: edges go from bottom of parent to top of child
            const startX = parent.x + NODE_WIDTH / 2;
            const startY = parent.y + NODE_HEIGHT;
            const endX = node.x + NODE_WIDTH / 2;
            const endY = node.y;

            const midY = (startY + endY) / 2;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            // Cubic bezier for smooth vertical curve
            ctx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
            
            // Gradient Stroke
            const grad = ctx.createLinearGradient(startX, startY, endX, endY);
            grad.addColorStop(0, '#2c2c2c'); // Dark-700
            grad.addColorStop(1, '#525252'); // Dark-600
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // Node Background
      ctx.fillStyle = '#1e1e1e'; // bg-dark-800
      if (isCompleted) ctx.fillStyle = '#2d1b0e'; // Slight orange tint for completed
      
      drawRoundedRect(ctx, node.x, node.y, NODE_WIDTH, NODE_HEIGHT, RADIUS);
      ctx.fill();

      // Reset Shadow for stroke
      ctx.shadowColor = 'transparent';

      // Node Border
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.strokeStyle = '#2c2c2c'; // border-dark-700
      if (isCompleted) ctx.strokeStyle = '#ea580c'; // primary-600
      if (isHovered) ctx.strokeStyle = '#f97316'; // primary-500
      
      ctx.stroke();

      // Top Bar (Color code by type)
      const typeColors: Record<string, string> = {
        CONCEPT: '#525252', // Neutral
        PROJECT: '#9333ea', // Purple
        MILESTONE: '#ea580c', // Primary Orange
        RESOURCE: '#3b82f6', // Blue
      };
      const barColor = typeColors[node.data.type] || '#525252';
      
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.moveTo(node.x + RADIUS, node.y);
      ctx.lineTo(node.x + NODE_WIDTH - RADIUS, node.y);
      ctx.quadraticCurveTo(node.x + NODE_WIDTH, node.y, node.x + NODE_WIDTH, node.y + RADIUS);
      ctx.lineTo(node.x, node.y + RADIUS);
      ctx.quadraticCurveTo(node.x, node.y, node.x + RADIUS, node.y);
      ctx.fill();

      // Type Label
      ctx.fillStyle = '#e5e5e5';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(node.data.type, node.x + 12, node.y + 10);

      // Status Badge (Top Right)
      if (isCompleted) {
        ctx.fillStyle = '#f97316'; // Primary Orange
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
        ctx.strokeStyle = '#525252';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = isCompleted ? '#fb923c' : '#ffffff'; 
      ctx.font = 'bold 16px Inter, sans-serif';
      wrapText(ctx, node.data.title, node.x + 20, node.y + 50, NODE_WIDTH - 40, 20);

      // Description (Truncated)
      ctx.fillStyle = '#9ca3af'; // dark-400
      ctx.font = '12px Inter, sans-serif';
      const descHeight = wrapText(ctx, node.data.description, node.x + 20, node.y + 90, NODE_WIDTH - 40, 16);

      // Metadata (Bottom)
      const hours = `${node.data.estimatedHours}h`;
      ctx.fillStyle = '#525252'; // dark-600
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

  // Center Graph on Mount (fit full graph)
  useEffect(() => {
    fitToView();
  }, [fitToView]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      fitToView();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [fitToView]);

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
    <div className="flex flex-col h-full bg-dark-950">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
         <div className="bg-dark-900/90 backdrop-blur shadow-lg border border-dark-700 p-4 rounded-xl pointer-events-auto max-w-md">
            <h1 className="font-bold text-white text-lg">{roadmap.title}</h1>
            <p className="text-sm text-dark-400 line-clamp-2">{roadmap.description}</p>
            <div className="mt-3 flex items-center gap-3">
               <div className="h-2 flex-1 bg-dark-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
               </div>
               <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
         </div>

         <div className="flex flex-col gap-2 pointer-events-auto">
            <button 
              className="p-2 bg-dark-800 shadow-md rounded-lg border border-dark-700 hover:bg-dark-700"
              onClick={() => setScale(s => Math.min(s + 0.1, 2))}
            >
              <ZoomIn size={20} className="text-dark-400" />
            </button>
            <button 
              className="p-2 bg-dark-800 shadow-md rounded-lg border border-dark-700 hover:bg-dark-700"
              onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
            >
              <ZoomOut size={20} className="text-dark-400" />
            </button>
            <button 
              className="p-2 bg-dark-800 shadow-md rounded-lg border border-dark-700 hover:bg-dark-700"
              onClick={toggleFullscreen}
            >
              <Maximize size={20} className="text-dark-400" />
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

      <div className="bg-dark-900 border-t border-dark-700 px-6 py-2 flex items-center justify-between text-xs text-dark-500">
         <div className="flex gap-4">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-dark-500"/> Concept</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-600"/> Project</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"/> Milestone</div>
         </div>
         <div>
            Scroll to Zoom • Drag to Pan • Click to Complete
         </div>
      </div>
    </div>
  );
};