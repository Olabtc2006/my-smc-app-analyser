/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SMCOverlayElement } from '../types';
import { 
  Layers, 
  Trash2, 
  Plus, 
  Download, 
  Eye, 
  EyeOff, 
  Tag, 
  Square, 
  TrendingUp, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface SMCWorkbenchProps {
  imageUrl: string;
  annotations: SMCOverlayElement[];
  onAnnotationsChange: (updated: SMCOverlayElement[]) => void;
  isLoading: boolean;
  theme?: any;
}

export default function SMCWorkbench({
  imageUrl,
  annotations,
  onAnnotationsChange,
  isLoading,
  theme
}: SMCWorkbenchProps) {
  // Theme color adaptation variables
  const isDark = theme ? theme.isDark : true;
  const c_bg = theme ? theme.bg : 'bg-slate-950';
  const c_card = theme ? theme.cardBg : 'bg-slate-900 border-slate-800';
  const c_inner = theme ? theme.cardInnerBg : 'bg-slate-950/40 border-white/5';
  const c_border = theme ? theme.border : 'border-slate-800';
  const c_textPrimary = theme ? theme.textPrimary : 'text-slate-100';
  const c_textSecondary = theme ? theme.textSecondary : 'text-slate-300';
  const c_textMuted = theme ? theme.textMuted : 'text-slate-400';
  const c_accentText = theme ? theme.accentText : 'text-sky-400';
  const c_accentBg = theme ? theme.accentBg : 'bg-sky-500';
  const c_accentBorder = theme ? theme.accentBorder : 'border-sky-500/20';
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [selectedElement, setSelectedElement] = useState<SMCOverlayElement | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'draw'>('view');
  const [drawTool, setDrawTool] = useState<SMCOverlayElement['type']>('BOS');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Custom drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [tempElement, setTempElement] = useState<Partial<SMCOverlayElement> | null>(null);
  
  // Visibility toggles
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    structure: true,     // BOS, CHOCH, MSS
    fvg: true,           // FVG
    poi: true,           // ORDER_BLOCK, BREAKER, HTF_POI
    liquidity: true,     // LIQUIDITY_SWEEP, IDM
    fibs: true,          // OTE, PREMIUM, DISCOUNT
    trade: true,         // ENTRY, STOP_LOSS, TAKE_PROFIT, DIRECTIONAL_ARROW
  });

  // Automatically select the first trade or structure element on load
  useEffect(() => {
    if (annotations.length > 0 && !selectedElement) {
      const match = annotations.find(a => ['ENTRY', 'FVG', 'BOS', 'ORDER_BLOCK', 'LIQUIDITY_SWEEP'].includes(a.type));
      if (match) setSelectedElement(match);
    }
  }, [annotations, selectedElement]);

  const toggleCategory = (cat: string) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const isElementVisible = (el: SMCOverlayElement): boolean => {
    if (filterType !== 'all' && el.type !== filterType) return false;
    
    switch (el.type) {
      case 'BOS':
      case 'CHOCH':
      case 'MSS':
        return visibleCategories.structure;
      case 'FVG':
        return visibleCategories.fvg;
      case 'ORDER_BLOCK':
      case 'BREAKER':
      case 'HTF_POI':
        return visibleCategories.poi;
      case 'LIQUIDITY_SWEEP':
      case 'IDM':
        return visibleCategories.liquidity;
      case 'OTE':
      case 'PREMIUM':
      case 'DISCOUNT':
        return visibleCategories.fibs;
      case 'ENTRY':
      case 'STOP_LOSS':
      case 'TAKE_PROFIT':
      case 'DIRECTIONAL_ARROW':
        return visibleCategories.trade;
      default:
        return true;
    }
  };

  const getElementColor = (type: SMCOverlayElement['type']): string => {
    switch (type) {
      case 'HTF_POI': return '#ffffff'; // WHITE
      case 'LIQUIDITY_SWEEP': return '#facc15'; // YELLOW
      case 'BOS': return '#3b82f6'; // BLUE
      case 'CHOCH': return '#06b6d4'; // CYAN
      case 'MSS': return '#06b6d4'; // CYAN
      case 'FVG': return '#a855f7'; // PURPLE
      case 'IDM': return '#f97316'; // ORANGE
      case 'OTE': return '#d97706'; // GOLD (or #eab308)
      case 'ENTRY': return '#10b981'; // GREEN
      case 'STOP_LOSS': return '#ef4444'; // RED
      case 'TAKE_PROFIT': return '#3b82f6'; // BLUE
      case 'ORDER_BLOCK': return '#6366f1'; // Indigo (Standard)
      case 'BREAKER': return '#ec4899'; // Pink (Standard)
      case 'PREMIUM': return '#f97316'; // Orange
      case 'DISCOUNT': return '#a855f7'; // Purple
      case 'DIRECTIONAL_ARROW': return '#eab308'; // Yellow
      default: return '#94a3b8'; // Slate
    }
  };

  // Convert client coordinates to percentage-based coordinates within container bounding box
  const getRelativeCoords = (clientX: number, clientY: number) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== 'draw' || !imageRef.current) return;
    
    e.preventDefault();
    const coords = getRelativeCoords(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawStart(coords);

    setTempElement({
      id: `custom_${Date.now()}`,
      type: drawTool,
      label: `${drawTool} Drawing`,
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      x2: coords.x,
      y2: coords.y,
      color: getElementColor(drawTool),
      notes: `Manually plotted ${drawTool} asset indicator.`
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !tempElement || !imageRef.current) return;
    
    const coords = getRelativeCoords(e.clientX, e.clientY);
    
    // For box-based tools (FVG, OrderBlock, Trade zones, POI)
    const isBox = ['FVG', 'ORDER_BLOCK', 'BREAKER', 'HTF_POI', 'ENTRY', 'STOP_LOSS', 'TAKE_PROFIT', 'PREMIUM', 'DISCOUNT', 'OTE'].includes(drawTool);
    
    if (isBox) {
      const x = Math.min(drawStart.x, coords.x);
      const y = Math.min(drawStart.y, coords.y);
      const width = Math.abs(drawStart.x - coords.x);
      const height = Math.abs(drawStart.y - coords.y);
      
      setTempElement(prev => prev ? ({
        ...prev,
        x,
        y,
        width,
        height
      }) : null);
    } else {
      // Line/Arrow-based tools
      setTempElement(prev => prev ? ({
        ...prev,
        x2: coords.x,
        y2: coords.y
      }) : null);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !tempElement) return;
    setIsDrawing(false);
    setDrawStart(null);

    // Filter out tiny clicks (accidental taps)
    const isValidElement = 
      (tempElement.width !== undefined && tempElement.width > 1) || 
      (tempElement.height !== undefined && tempElement.height > 1) ||
      (tempElement.x2 !== undefined && Math.abs(tempElement.x2 - (tempElement.x ?? 0)) > 1) ||
      !['FVG', 'ORDER_BLOCK', 'BREAKER', 'HTF_POI', 'ENTRY', 'STOP_LOSS', 'TAKE_PROFIT', 'BOS', 'CHOCH', 'MSS', 'DIRECTIONAL_ARROW'].includes(drawTool);

    if (isValidElement) {
      const completeElement = {
        ...tempElement,
        label: tempElement.label ?? drawTool,
      } as SMCOverlayElement;

      const updated = [...annotations, completeElement];
      onAnnotationsChange(updated);
      setSelectedElement(completeElement);
    }
    setTempElement(null);
  };

  const removeElement = (id: string) => {
    const updated = annotations.filter(a => a.id !== id);
    onAnnotationsChange(updated);
    if (selectedElement?.id === id) {
      setSelectedElement(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleResetAnnotations = () => {
    if (window.confirm("Are you sure you want to reset all custom drawings and restore AI annotations?")) {
      onAnnotationsChange(annotations.filter(a => !a.id.startsWith('custom_')));
    }
  };

  // Highly robust PNG export method blending image with SVGs on an HTML5 canvas
  const handleExportChart = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 1. Draw chart background image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Helper functions for percentages to pixels
    const toPxX = (percent: number) => (percent / 100) * canvas.width;
    const toPxY = (percent: number) => (percent / 100) * canvas.height;

    // 2. Iterate and draw active annotations
    annotations.forEach(el => {
      if (!isElementVisible(el)) return;

      const color = el.color || getElementColor(el.type);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 500)); // Dynamic line thickness
      
      const isBox = ['FVG', 'ORDER_BLOCK', 'BREAKER', 'HTF_POI', 'ENTRY', 'STOP_LOSS', 'TAKE_PROFIT', 'PREMIUM', 'DISCOUNT', 'OTE'].includes(el.type);

      if (isBox && el.width && el.height) {
        // Draw shaded semi-transparent box
        ctx.globalAlpha = 0.15;
        ctx.fillRect(toPxX(el.x), toPxY(el.y), toPxX(el.width), toPxY(el.height));
        ctx.globalAlpha = 1.0;
        
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(toPxX(el.x), toPxY(el.y), toPxX(el.width), toPxY(el.height));
        ctx.setLineDash([]);
      } else if (el.x2 !== undefined && el.y2 !== undefined) {
        // Draw structure lines
        ctx.beginPath();
        ctx.moveTo(toPxX(el.x), toPxY(el.y));
        ctx.lineTo(toPxX(el.x2), toPxY(el.y2));
        ctx.stroke();

        // Draw structural label badge over midpoint of the line
        const midX = toPxX((el.x + el.x2) / 2);
        const midY = toPxY((el.y + el.y2) / 2);
        
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(10, Math.round(canvas.width / 100))}px sans-serif`;
        const textWidth = ctx.measureText(el.label).width;
        
        ctx.globalAlpha = 0.85;
        ctx.fillRect(midX - textWidth/2 - 6, midY - 10, textWidth + 12, 20);
        ctx.globalAlpha = 1.0;
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.label, midX, midY);
      } else {
        // Draw marker/dot with visual labels
        ctx.beginPath();
        ctx.arc(toPxX(el.x), toPxY(el.y), 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(10, Math.round(canvas.width / 110))}px sans-serif`;
        const textWidth = ctx.measureText(el.label).width;
        
        // Label background badge
        ctx.globalAlpha = 0.85;
        ctx.fillRect(toPxX(el.x) - textWidth/2 - 6, toPxY(el.y) - 26, textWidth + 12, 18);
        ctx.globalAlpha = 1.0;
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.label, toPxX(el.x), toPxY(el.y) - 17);
      }
    });

    // 3. Draw Brand Watermark
    ctx.fillStyle = '#0f172a';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(10, canvas.height - 42, 240, 32);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ELITE AI SMC TRADING ANALYST', 125, canvas.height - 26);

    // 4. Save file
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'SMC_Elite_Chart_Analysis.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${c_card} rounded-2xl overflow-hidden shadow-2xl`}>
      {/* LEFT: Chart Annotation Workbench Screen (9 Grid Columns) */}
      <div className={`lg:col-span-8 flex flex-col ${c_bg} p-4 border-r ${c_border} relative select-none`}>
        <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b ${c_border}`}>
          <div className="flex items-center gap-2">
            <Layers className={`w-5 h-5 ${c_accentText}`} />
            <h3 className={`text-sm font-semibold ${c_accentText} font-mono tracking-tight`}>INTERACTIVE SMC ANNOTATIONS</h3>
            <span className={`bg-sky-500/10 ${c_accentText} text-xs px-2 py-0.5 rounded border ${c_accentBorder} font-mono`}>
              {annotations.length} Nodes
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode vs Draw Mode Tabs */}
            <div className={`${isDark ? 'bg-slate-900' : 'bg-slate-200'} p-1 rounded-lg border ${c_border} flex`}>
              <button
                id="btn-tab-view"
                onClick={() => setActiveTab('view')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'view'
                    ? `${c_accentBg} ${isDark ? 'text-slate-950' : 'text-white'} shadow-md font-semibold`
                    : `${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'}`
                }`}
              >
                Inspect
              </button>
              <button
                id="btn-tab-draw"
                onClick={() => setActiveTab('draw')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  activeTab === 'draw'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                    : `${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'}`
                }`}
              >
                <Plus className="w-3 h-3" /> Custom Draw
              </button>
            </div>

            <button
              id="btn-export-chart"
              onClick={handleExportChart}
              className={`px-3 py-1.5 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'} rounded-lg text-xs font-medium flex items-center gap-1.5 border transition`}
              title="Download marked up image"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 text-xs font-medium mr-1 font-mono">Filter:</span>
          <select
            id="select-annotation-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="all">All Elements</option>
            <option value="BOS">BOS (Break of Structure)</option>
            <option value="CHOCH">CHOCH (Change of Character)</option>
            <option value="MSS">MSS (Market Structure Shift)</option>
            <option value="FVG">FVG (Fair Value Gaps)</option>
            <option value="ORDER_BLOCK">OB (Order Blocks)</option>
            <option value="LIQUIDITY_SWEEP">Liquidity Grab/Sweep</option>
            <option value="HTF_POI">HTF points of interest (POI)</option>
            <option value="OTE">OTE Zone</option>
            <option value="ENTRY">Entry Bands</option>
            <option value="STOP_LOSS">Stop Loss</option>
            <option value="TAKE_PROFIT">Take Profit Targets</option>
          </select>
        </div>

        {/* The Viewport Container for Annotations */}
        <div 
          ref={containerRef}
          className={`relative border border-slate-800 rounded-xl overflow-hidden ${
            activeTab === 'draw' ? 'cursor-crosshair ring-2 ring-emerald-500/20' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Base Image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="SMC Trading Analysis Chart"
            className="w-full h-auto object-contain bg-slate-950 block max-h-[550px] mx-auto"
            referrerPolicy="no-referrer"
          />

          {/* SVG Overlay layer matching percentage-based rendering */}
          {visibleCategories && (
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="absolute top-0 left-0 w-full h-full pointer-events-auto"
            >
              {annotations.filter(isElementVisible).map((el) => {
                const color = el.color || getElementColor(el.type);
                const isSelected = selectedElement?.id === el.id;
                const isBox = ['FVG', 'ORDER_BLOCK', 'BREAKER', 'HTF_POI', 'ENTRY', 'STOP_LOSS', 'TAKE_PROFIT', 'PREMIUM', 'DISCOUNT', 'OTE'].includes(el.type);

                if (isBox && el.width !== undefined && el.height !== undefined) {
                  return (
                    <g key={el.id} className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); setSelectedElement(el); }}>
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        style={{
                          fill: color,
                          fillOpacity: isSelected ? 0.28 : 0.12,
                          stroke: color,
                          strokeWidth: isSelected ? 0.8 : 0.4,
                          strokeDasharray: el.type === 'FVG' ? '1 1' : 'none'
                        }}
                        className="transition duration-150"
                      />
                      {/* Highlight border on hover */}
                      <rect
                        x={el.x - 0.5}
                        y={el.y - 0.5}
                        width={el.width + 1}
                        height={el.height + 1}
                        style={{
                          fill: 'none',
                          stroke: '#ffffff',
                          strokeWidth: 0.3,
                          strokeOpacity: 0,
                        }}
                        className="group-hover:stroke-opacity-40 transition"
                      />
                    </g>
                  );
                } else if (el.x2 !== undefined && el.y2 !== undefined) {
                  // Draw structure line elements e.g. BOS or trend directional indicators
                  return (
                    <g key={el.id} className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); setSelectedElement(el); }}>
                      <line
                        x1={el.x}
                        y1={el.y}
                        x2={el.x2}
                        y2={el.y2}
                        style={{
                          stroke: color,
                          strokeWidth: isSelected ? 0.8 : 0.4,
                          strokeDasharray: el.type === 'BOS' || el.type === 'CHOCH' ? '1 1' : 'none'
                        }}
                      />
                      {/* Directional arrow tip if it is an arrow tool */}
                      {el.type === 'DIRECTIONAL_ARROW' && (
                        <circle cx={el.x2} cy={el.y2} r="0.8" fill={color} />
                      )}
                      
                      {/* Text Badge at line center */}
                      <foreignObject
                        x={(el.x + el.x2) / 2 - 6}
                        y={(el.y + el.y2) / 2 - 2}
                        width="12"
                        height="4.5"
                        className="overflow-visible pointer-events-none"
                      >
                        <div className="flex items-center justify-center h-full w-full">
                          <span 
                            style={{ backgroundColor: color }} 
                            className={`text-[8px] font-bold text-white px-1 rounded-sm shadow-md font-mono border border-white/10 scale-50 transition ${
                              isSelected ? 'ring-1 ring-white' : ''
                            }`}
                          >
                            {el.label}
                          </span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                } else {
                  // Single node marker with label (e.g. Sweeps, High/Low, Inducements)
                  return (
                    <g key={el.id} className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); setSelectedElement(el); }}>
                      {/* Anchor point */}
                      <circle
                        cx={el.x}
                        cy={el.y}
                        r={isSelected ? 0.9 : 0.6}
                        style={{ fill: color, stroke: '#ffffff', strokeWidth: isSelected ? 0.3 : 0.1 }}
                        className="transition"
                      />
                      {/* Indicator Tag Badge above the dot */}
                      <foreignObject
                        x={el.x - 7.5}
                        y={el.y - 7}
                        width="15"
                        height="5"
                        className="overflow-visible pointer-events-none"
                      >
                        <div className="flex items-center justify-center w-full h-full">
                          <span 
                            style={{ backgroundColor: color }} 
                            className={`text-[8px] font-bold text-white px-1 rounded shadow-md font-mono scale-50 inline-block transition whitespace-nowrap border border-white/10 ${
                              isSelected ? 'ring-1 ring-white scale-60' : ''
                            }`}
                          >
                            {el.label}
                          </span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                }
              })}

              {/* Temp drawing overlay */}
              {isDrawing && tempElement && (
                <g>
                  {['FVG', 'ORDER_BLOCK', 'BREAKER', 'HTF_POI', 'ENTRY', 'STOP_LOSS', 'TAKE_PROFIT', 'PREMIUM', 'DISCOUNT', 'OTE'].includes(drawTool) && tempElement.width !== undefined && tempElement.height !== undefined ? (
                    <rect
                      x={tempElement.x}
                      y={tempElement.y}
                      width={tempElement.width}
                      height={tempElement.height}
                      style={{
                        fill: getElementColor(drawTool),
                        fillOpacity: 0.18,
                        stroke: getElementColor(drawTool),
                        strokeWidth: 0.5,
                        strokeDasharray: drawTool === 'FVG' ? '1 1' : 'none'
                      }}
                    />
                  ) : tempElement.x2 !== undefined && tempElement.y2 !== undefined ? (
                    <line
                      x1={tempElement.x}
                      y1={tempElement.y}
                      x2={tempElement.x2}
                      y2={tempElement.y2}
                      style={{
                        stroke: getElementColor(drawTool),
                        strokeWidth: 0.5,
                        strokeDasharray: '1 1'
                      }}
                    />
                  ) : (
                    <circle
                      cx={tempElement.x}
                      cy={tempElement.y}
                      r="0.6"
                      fill={getElementColor(drawTool)}
                    />
                  )}
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Draw Instructions Block in Draw Tab */}
        {activeTab === 'draw' && (
          <div className={`mt-3 p-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border rounded-xl flex items-start gap-2.5`}>
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-emerald-300 font-semibold mb-0.5">SMC Drawing Mode Active</p>
              <p className={c_textMuted}>
                Click and drag directly over the chart above to draw your custom Smart Money indicator coordinate box or structural shift line.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Selected Node Inspector & Category Manager (4 Grid Columns) */}
      <div className={`lg:col-span-4 p-5 flex flex-col justify-between ${isDark ? 'bg-slate-950' : 'bg-slate-50 border-l border-slate-200'}`}>
        <div>
          {/* Category Toggle Manager */}
          <div className="mb-6">
            <h4 className={`text-xs font-bold ${c_textMuted} uppercase tracking-widest font-mono mb-3`}>SMC Category Visibilities</h4>
            <div className="space-y-2.5">
              <div className={`flex items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-200'} p-2 rounded-lg border text-xs`}>
                <span className={`${c_textSecondary} font-medium`}>BOS / CHOCH Structure</span>
                <button 
                  onClick={() => toggleCategory('structure')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {visibleCategories.structure ? <Eye className={`w-4 h-4 ${c_accentText}`} /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className={`flex items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-200'} p-2 rounded-lg border text-xs`}>
                <span className={`${c_textSecondary} font-medium`}>Fair Value Gaps (FVG)</span>
                <button 
                  onClick={() => toggleCategory('fvg')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {visibleCategories.fvg ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className={`flex items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-200'} p-2 rounded-lg border text-xs`}>
                <span className={`${c_textSecondary} font-medium`}>Order Blocks & HTF POIs</span>
                <button 
                  onClick={() => toggleCategory('poi')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {visibleCategories.poi ? <Eye className="w-4 h-4 text-indigo-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className={`flex items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-200'} p-2 rounded-lg border text-xs`}>
                <span className={`${c_textSecondary} font-medium`}>Liquidity Pools & sweeps</span>
                <button 
                  onClick={() => toggleCategory('liquidity')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {visibleCategories.liquidity ? <Eye className="w-4 h-4 text-rose-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className={`flex items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-200'} p-2 rounded-lg border text-xs`}>
                <span className={`${c_textSecondary} font-medium font-mono`}>Premium / Discount & OTE</span>
                <button 
                  onClick={() => toggleCategory('fibs')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {visibleCategories.fibs ? <Eye className="w-4 h-4 text-teal-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className={`flex items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800/60' : 'bg-white border-slate-200'} p-2 rounded-lg border text-xs`}>
                <span className={`${c_textSecondary} font-medium`}>Active Trade Target Bands</span>
                <button 
                  onClick={() => toggleCategory('trade')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {visibleCategories.trade ? <Eye className="w-4 h-4 text-yellow-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className={`border-t ${c_border} my-5`}></div>

          {/* Draw Toolbox controls */}
          {activeTab === 'draw' && (
            <div className="mb-4">
              <h4 className={`text-xs font-bold ${c_textMuted} uppercase tracking-widest font-mono mb-3`}>Drawing Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'BOS Line', type: 'BOS' },
                  { name: 'CHOCH Line', type: 'CHOCH' },
                  { name: 'MSS Line', type: 'MSS' },
                  { name: 'FVG Block', type: 'FVG' },
                  { name: 'Order Block', type: 'ORDER_BLOCK' },
                  { name: 'HTF POI Zone', type: 'HTF_POI' },
                  { name: 'Liquidity Sweep', type: 'LIQUIDITY_SWEEP' },
                  { name: 'Entry Zone', type: 'ENTRY' },
                  { name: 'Stop Loss', type: 'STOP_LOSS' },
                  { name: 'Take Profit', type: 'TAKE_PROFIT' },
                  { name: 'OTE Fib Zone', type: 'OTE' },
                  { name: 'Projection Arrow', type: 'DIRECTIONAL_ARROW' },
                ].map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => setDrawTool(tool.type as SMCOverlayElement['type'])}
                    className={`p-2 rounded-lg text-left text-xs font-medium border flex items-center justify-between transition ${
                      drawTool === tool.type
                        ? `${isDark ? 'bg-slate-800 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-600'}`
                        : `${isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'}`
                    }`}
                  >
                    <span>{tool.name}</span>
                    <span 
                      style={{ backgroundColor: getElementColor(tool.type as SMCOverlayElement['type']) }} 
                      className="w-1.5 h-1.5 rounded-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inspector Panel */}
          {activeTab === 'view' && (
            <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border rounded-xl p-4 shadow-lg min-h-[220px] flex flex-col justify-between`}>
              {selectedElement ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      style={{ backgroundColor: `${selectedElement.color || getElementColor(selectedElement.type)}20`, borderColor: selectedElement.color || getElementColor(selectedElement.type), color: selectedElement.color || getElementColor(selectedElement.type) }} 
                      className="px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider border"
                    >
                      {selectedElement.type}
                    </span>
                    
                    {selectedElement.id.startsWith('custom_') && (
                      <button
                        title="Delete custom drawing"
                        onClick={() => removeElement(selectedElement.id)}
                        className={`text-slate-500 hover:text-red-400 p-1 rounded ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-200'} shrink-0 transition`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <h5 className={`${c_textPrimary} text-sm font-semibold tracking-wide`}>{selectedElement.label}</h5>
                    <p className={`${c_textMuted} text-[10px] font-mono mt-1`}>
                      COORDS: X: {selectedElement.x.toFixed(1)}% | Y: {selectedElement.y.toFixed(1)}%
                      {selectedElement.width !== undefined && ` | W: ${selectedElement.width.toFixed(1)}%`}
                      {selectedElement.height !== undefined && ` | H: ${selectedElement.height.toFixed(1)}%`}
                    </p>
                  </div>

                  <p className={`${c_textSecondary} text-xs leading-relaxed italic ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} p-2.5 rounded-lg border font-sans`}>
                    "{selectedElement.notes || 'SMC identified coordinate feature situated on this key structure quadrant.'}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <Layers className={`w-10 h-10 ${c_textMuted} mb-2.5 stroke-[1.2]`} />
                  <p className={`${c_textSecondary} text-xs font-medium`}>No annotation node is active.</p>
                  <p className={`${c_textMuted} text-[11px] mt-1`}>Click any element overlaid on the chart to read full SMC analytical notes.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear/Reset Custom markings button */}
        {annotations.some(a => a.id.startsWith('custom_')) && (
          <button
            onClick={handleResetAnnotations}
            className={`mt-4 w-full p-2 ${isDark ? 'bg-slate-900 hover:bg-slate-800 text-red-400 border-red-500/20' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'} text-xs font-mono rounded-lg border text-center transition flex items-center justify-center gap-2`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESET ALL CUSTOM DRAWINGS
          </button>
        )}
      </div>
    </div>
  );
}
