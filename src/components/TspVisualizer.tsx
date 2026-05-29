/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  MapPin, 
  Plus, 
  Sparkles, 
  Trash2, 
  Shuffle, 
  Compass,
  Lightbulb
} from 'lucide-react';
import { GAParameters, TspIndividual, City, GenerationHistory } from '../types';
import { 
  initTspPopulation, 
  evolveTspPopulation, 
  calculateTourDistance,
  getDistance
} from '../utils/gaEngine';

// Default cities preset
const PRESET_CITIES: Omit<City, 'id'>[] = [
  { name: "Hà Nội", x: 25, y: 15 },
  { name: "Hải Phòng", x: 32, y: 18 },
  { name: "Vinh", x: 24, y: 32 },
  { name: "Huế", x: 48, y: 56 },
  { name: "Đà Nẵng", x: 55, y: 60 },
  { name: "Quy Nhơn", x: 62, y: 72 },
  { name: "Nha Trang", x: 65, y: 82 },
  { name: "Đà Lạt", x: 54, y: 80 },
  { name: "TP.HCM", x: 42, y: 88 },
  { name: "Cần Thơ", x: 30, y: 92 },
];

export default function TspVisualizer() {
  // Cities State
  const [cities, setCities] = useState<City[]>(() => 
    PRESET_CITIES.map((c, i) => ({ ...c, id: i }))
  );
  
  // GA Parameters for TSP
  const [params, setParams] = useState<GAParameters>({
    populationSize: 150,
    mutationRate: 0.08, // Higher mutation rate for string permutation (8%)
    crossoverRate: 0.90, // 90%
    selectionMethod: 'TOURNAMENT',
    elitismCount: 8,
  });

  // Simulation States
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState<TspIndividual[]>([]);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  
  // Custom speeds
  const [speedMs, setSpeedMs] = useState(30);
  const [generationsPerTick, setGenerationsPerTick] = useState(1);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  // Real-time states ref for loop matching standard React timers
  const stateRef = useRef({
    isRunning,
    generation,
    population,
    cities,
    params,
    history,
    speedMs,
    generationsPerTick
  });

  useEffect(() => {
    stateRef.current = {
      isRunning,
      generation,
      population,
      cities,
      params,
      history,
      speedMs,
      generationsPerTick
    };
  }, [isRunning, generation, population, cities, params, history, speedMs, generationsPerTick]);

  // Adjust canvas size when container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Keep standard aspect ratio
        const finalWidth = Math.floor(width);
        const finalHeight = Math.max(300, Math.floor(width * 0.65));
        setCanvasSize({ width: finalWidth, height: finalHeight });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle Reset / Initialization of population
  const handleReset = () => {
    setIsRunning(false);
    if (cities.length < 3) {
      setPopulation([]);
      setGeneration(0);
      setHistory([]);
      return;
    }

    const initialPop = initTspPopulation(params.populationSize, cities.length);
    const evaluatedPop = initialPop.map(ind => {
      const distance = calculateTourDistance(ind.genes, cities);
      const fitness = distance > 0 ? 10000 / distance : 0.0001;
      return {
        genes: ind.genes,
        fitness,
        distance
      };
    }).sort((a, b) => b.fitness - a.fitness);

    setPopulation(evaluatedPop);
    setGeneration(0);
    setHistory([{
      generation: 0,
      bestFitness: evaluatedPop[0].fitness,
      avgFitness: evaluatedPop.reduce((acc, curr) => acc + curr.fitness, 0) / evaluatedPop.length,
      bestValue: Math.round(evaluatedPop[0].distance)
    }]);
  };

  useEffect(() => {
    handleReset();
  }, [cities]); // Reset whenever city count changes

  const handleParamChange = <K extends keyof GAParameters>(key: K, value: GAParameters[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Main tick simulator loop
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const tick = () => {
      const current = stateRef.current;
      if (!current.isRunning || current.cities.length < 3) return;

      let currentPopulation = [...current.population];
      let currentGen = currentGenNum;
      const newHistoryEntries: GenerationHistory[] = [];

      const loops = current.generationsPerTick;
      for (let i = 0; i < loops; i++) {
        currentPopulation = evolveTspPopulation(currentPopulation, current.cities, current.params);
        currentGen++;

        const bestInd = currentPopulation[0];
        const avgFit = currentPopulation.reduce((acc, curr) => acc + curr.fitness, 0) / currentPopulation.length;

        newHistoryEntries.push({
          generation: currentGen,
          bestFitness: bestInd.fitness,
          avgFitness: avgFit,
          bestValue: Math.round(bestInd.distance)
        });
      }

      setPopulation(currentPopulation);
      setGeneration(currentGen);
      setHistory(prev => [...prev, ...newHistoryEntries]);

      if (current.isRunning) {
        timerId = setTimeout(tick, current.speedMs);
      }
    };

    const currentGenNum = generation;
    if (isRunning && cities.length >= 3) {
      timerId = setTimeout(tick, speedMs);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isRunning, speedMs]);

  // Step single generation
  const stepOneGeneration = () => {
    if (isRunning || cities.length < 3) return;
    const current = stateRef.current;
    
    const nextPop = evolveTspPopulation(current.population, current.cities, current.params);
    const nextGen = current.generation + 1;
    const bestInd = nextPop[0];
    const avgFit = nextPop.reduce((acc, curr) => acc + curr.fitness, 0) / nextPop.length;

    setPopulation(nextPop);
    setGeneration(nextGen);
    setHistory(prev => [
      ...prev,
      {
        generation: nextGen,
        bestFitness: bestInd.fitness,
        avgFitness: avgFit,
        bestValue: Math.round(bestInd.distance)
      }
    ]);
  };

  // Click on Canvas to add/remove a city
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    // Convert pixels to percentage coords 0-100%
    const pctX = Math.max(2, Math.min(98, Math.round((xPx / rect.width) * 100)));
    const pctY = Math.max(2, Math.min(98, Math.round((yPx / rect.height) * 100)));

    // Check if clicked near an existing city to remove it
    const clickRadiusPercent = 4; // Tolerance limit
    const indexToRemove = cities.findIndex(
      (c) => Math.abs(c.x - pctX) < clickRadiusPercent && Math.abs(c.y - pctY) < clickRadiusPercent
    );

    if (indexToRemove !== -1) {
      // Remove city clicked
      setCities(prev => prev.filter((_, i) => i !== indexToRemove).map((c, i) => ({ ...c, id: i })));
    } else {
      // Limit to max 40 cities for computer performance safety
      if (cities.length >= 40) return;
      
      const newCity: City = {
        id: cities.length,
        x: pctX,
        y: pctY,
        name: `T.Phố ${cities.length + 1}`
      };
      setCities(prev => [...prev, newCity]);
    }
  };

  // Generate N random cities
  const handleGenerateRandom = (count: number) => {
    setIsRunning(false);
    const randomized: City[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.floor(Math.random() * 88) + 6, // keep clear of borders
      y: Math.floor(Math.random() * 84) + 8,
      name: `T.Phố ${i + 1}`
    }));
    setCities(randomized);
  };

  // Subroutines for visual canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust for High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear Canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Background aesthetic grids
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < canvasSize.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasSize.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    const mapX = (xPct: number) => (xPct / 100) * canvasSize.width;
    const mapY = (yPct: number) => (yPct / 100) * canvasSize.height;

    const bestIndividual = population[0];

    // DRAW PATH TRAILS (THE SPIDER-WEB CHROMOSOME TRACES)
    if (bestIndividual && bestIndividual.genes) {
      const tour = bestIndividual.genes;

      // Draw active lines
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1'; // Indigo path line
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';

      const startCity = cities[tour[0]];
      if (startCity) {
        ctx.moveTo(mapX(startCity.x), mapY(startCity.y));
        for (let i = 1; i < tour.length; i++) {
          const nextCity = cities[tour[i]];
          if (nextCity) {
            ctx.lineTo(mapX(nextCity.x), mapY(nextCity.y));
          }
        }
        ctx.lineTo(mapX(startCity.x), mapY(startCity.y)); // Wrap close loop
      }
      ctx.stroke();

      // Reset shadows
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    // DRAW CITIES
    cities.forEach((city) => {
      const cX = mapX(city.x);
      const cY = mapY(city.y);

      // outer pulse ring
      ctx.beginPath();
      ctx.arc(cX, cY, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.fill();

      // inner dot
      ctx.beginPath();
      ctx.arc(cX, cY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4f46e5'; // Main intense indigo
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Label names
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(city.name, cX, cY + 11);
    });

  }, [cities, population, canvasSize]);

  const bestIndividual = population[0];
  const bestDistance = bestIndividual ? Math.round(bestIndividual.distance) : 0;
  
  // Starting path reference to evaluate optimal gain %
  const initialDistance = history[0] ? (history[0].bestValue as number) : 0;
  const optimizationPct = initialDistance && bestDistance 
    ? Math.max(0, Math.round(((initialDistance - bestDistance) / initialDistance) * 100))
    : 0;

  // Custom Decreasing SVG Line chart for TSP Route Distances
  const renderSvgTspChart = () => {
    if (history.length === 0) return null;

    const width = 500;
    const height = 150;
    const padding = 20;

    const maxGen = Math.max(10, ...history.map(h => h.generation));
    
    // Distances limit
    const distances = history.map(h => h.bestValue as number);
    const maxVal = Math.max(...distances) * 1.05;
    const minVal = Math.min(...distances) * 0.95;
    const valueRange = maxVal - minVal || 1;

    const getCoords = (h: GenerationHistory) => {
      const x = padding + (h.generation / maxGen) * (width - 2 * padding);
      const val = h.bestValue as number;
      // Flip layout because smaller distance is better (higher)
      const yBest = height - padding - ((val - minVal) / valueRange) * (height - 2 * padding);
      return { x, yBest };
    };

    const points = history.map(getCoords);
    const pathBest = points.length > 0 
      ? `M ${points[0].x} ${points[0].yBest} ` + points.map(p => `L ${p.x} ${p.yBest}`).join(' ')
      : '';

    return (
      <svg className="w-full h-full min-h-[140px]" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grids */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />

        {pathBest && <path d={pathBest} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Labels info */}
        <text x={padding + 5} y={padding + 12} fill="#94a3b8" fontSize="9" className="font-mono">Tối đa: {Math.round(maxVal)} px</text>
        <text x={padding + 5} y={height - padding - 4} fill="#ef4444" fontSize="9" className="font-mono font-bold">Tối ưu nhất: {Math.round(minVal)} px</text>

        <text x={width - padding - 80} y={height - padding - 4} fill="#64748b" fontSize="10" className="font-bold font-mono">Thế hệ: {generation}</text>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SETTINGS SIDEBAR */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Interactive map toolkit */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Compass id="toolbox-compass-icon" className="w-4 h-4" />
            </div>
            <h3 id="toolbox-title" className="text-sm font-bold text-slate-800">
              Công cụ tạo Bản đồ T.Phố
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click trực tiếp lên khung vẽ màu xám bên phải để tự thêm/bớt địa điểm, hoặc chọn nhanh các mẫu tạo sẵn bên dưới:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-cities-preset-default"
              type="button"
              disabled={isRunning}
              onClick={() => {
                setIsRunning(false);
                setCities(PRESET_CITIES.map((c, i) => ({ ...c, id: i })));
              }}
              className="flex items-center justify-center space-x-1 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 bg-white transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Bản đồ Việt Nam</span>
            </button>

            <button
              id="btn-cities-preset-random-15"
              type="button"
              disabled={isRunning}
              onClick={() => handleGenerateRandom(15)}
              className="flex items-center justify-center space-x-1 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 bg-white transition"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Tạo ngẫu nhiên 15</span>
            </button>

            <button
              id="btn-cities-preset-random-30"
              type="button"
              disabled={isRunning}
              onClick={() => handleGenerateRandom(30)}
              className="flex items-center justify-center space-x-1 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 bg-white transition"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Tạo ngẫu nhiên 30</span>
            </button>

            <button
              id="btn-cities-clear"
              type="button"
              disabled={isRunning}
              onClick={() => {
                setIsRunning(false);
                setCities([]);
              }}
              className="flex items-center justify-center space-x-1 py-2 border border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-bold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa sạch bản đồ</span>
            </button>
          </div>
        </div>

        {/* Dynamic GA Parameters Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Settings id="ga-tsp-config-icon" className="w-4 h-4" />
            </div>
            <h3 id="ga-tsp-config-title" className="text-sm font-bold text-slate-800">
              Thông số di truyền TSP
            </h3>
          </div>

          {/* Pop Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="tsp-population-size">Kích thước quần thể</label>
              <span className="font-mono text-indigo-600">{params.populationSize}</span>
            </div>
            <input
              id="tsp-population-size"
              type="range"
              min="20"
              max="500"
              step="10"
              value={params.populationSize}
              onChange={(e) => handleParamChange('populationSize', parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Mutation Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="tsp-mutation-rate">Tỷ lệ đột biến (Swap Mutation)</label>
              <span className="font-mono text-indigo-600">{Math.round(params.mutationRate * 100)}%</span>
            </div>
            <input
              id="tsp-mutation-rate"
              type="range"
              min="0"
              max="0.40"
              step="0.01"
              value={params.mutationRate}
              onChange={(e) => handleParamChange('mutationRate', parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Selection Method */}
          <div className="space-y-1.5">
            <label htmlFor="tsp-selection" className="text-xs font-bold text-slate-700 block">Chọn lọc tự nhiên</label>
            <select
              id="tsp-selection"
              value={params.selectionMethod}
              onChange={(e) => handleParamChange('selectionMethod', e.target.value as GAParameters['selectionMethod'])}
              disabled={isRunning}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="TOURNAMENT">Đấu loại trực tiếp (Tournament Select)</option>
              <option value="ROULETTE">Vòng quay may mắn (Roulette Selection)</option>
              <option value="ELITISM">Lựa chọn ưu tú (Elitism Select)</option>
            </select>
          </div>

          {/* Elitism kept size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="tsp-elitism">Cá thể sinh tồn xuất sắc (Elites)</label>
              <span className="font-mono text-indigo-600">{params.elitismCount}</span>
            </div>
            <input
              id="tsp-elitism"
              type="range"
              min="0"
              max="20"
              step="1"
              value={params.elitismCount}
              onChange={(e) => handleParamChange('elitismCount', parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Speed ticks selection */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
          <h3 id="tsp-speed-heading" className="text-xs font-bold text-slate-800">
            Tốc độ tìm đường đi (TSP)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Chậm', ms: 150, loop: 1 },
              { label: 'Vừa', ms: 40, loop: 1 },
              { label: 'Nhanh', ms: 10, loop: 1 },
              { label: 'Nâng cao', ms: 8, loop: 6 },
              { label: 'Siêu tốc', ms: 3, loop: 18 },
              { label: 'Cực đại', ms: 1, loop: 30 },
            ].map((speed, i) => {
              const active = speedMs === speed.ms && generationsPerTick === speed.loop;
              return (
                <button
                  id={`tsp-speed-btn-${i}`}
                  key={i}
                  type="button"
                  onClick={() => {
                    setSpeedMs(speed.ms);
                    setGenerationsPerTick(speed.loop);
                  }}
                  className={`py-1.5 border px-1 text-[10px] rounded-lg font-bold transition-all text-center ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {speed.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* CORE TSP CANVAS AREA */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* Main interactive map window */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col space-y-4">
          
          {/* Main Controls row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span id="tsp-sim-title" className="text-xs font-bold text-rose-500 uppercase tracking-widest">Người giao hàng</span>
              <h2 id="tsp-sim-subtitle" className="text-lg font-bold text-slate-900 mt-0.5">Tìm đường đi ngắn nhất qua {cities.length} thành phố</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                id="btn-play-pause-tsp"
                onClick={() => setIsRunning(!isRunning)}
                disabled={cities.length < 3}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause id="icon-pause-tsp" className="w-3.5 h-3.5 fill-white" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play id="icon-play-tsp" className="w-3.5 h-3.5 fill-white" />
                    <span>Giải bài toán</span>
                  </>
                )}
              </button>

              <button
                id="btn-step-generation-tsp"
                onClick={stepOneGeneration}
                disabled={isRunning || cities.length < 3}
                className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300 transition-all cursor-pointer"
              >
                <span>Bước thế hệ</span>
              </button>

              <button
                id="btn-reset-tsp"
                onClick={handleReset}
                disabled={cities.length < 3}
                className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 bg-white transition disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw id="icon-reset-tsp" className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Header */}
          {cities.length >= 3 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-1">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Độc hành hiện tại (Best Dist)</span>
                <span id="best-tsp-metric" className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  {bestDistance ? `${bestDistance} px` : 'Chưa tính'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Đầu tiên (Initial)</span>
                <span id="init-tsp-metric" className="text-base sm:text-lg font-bold text-slate-500 font-mono">
                  {initialDistance ? `${initialDistance} px` : 'Chưa tính'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Rút ngắn tối ưu (Gain)</span>
                <span id="tsp-optimization-metric" className="text-base sm:text-lg font-black text-rose-600 font-mono">
                  -{optimizationPct}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Thế hệ (Gen)</span>
                <span id="tsp-generation-metric" className="text-base sm:text-lg font-black text-slate-800 font-mono">
                  {generation}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-xl border border-amber-200/40 p-3.5 text-xs text-amber-700 flex items-center justify-center font-medium">
              ⚠️ Vui lòng click thêm ít nhất 3 thành phố trên khung vẽ để bắt đầu khởi tạo bài toán TSP.
            </div>
          )}

          {/* Interactive Core Canvas mapping area */}
          <div ref={containerRef} className="w-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/50">
            <canvas
              id="tsp-map-canvas"
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full block bg-slate-100/45 cursor-crosshair hover:bg-slate-100/70 transition-colors"
              style={{ height: `${canvasSize.height}px` }}
            />
            {cities.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50/90 gap-2 pointer-events-none select-none">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <MapPin className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Khung vẽ chưa có tọa độ</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click bất cứ đâu trên tệp vẽ xám này để đặt các thành phố hoặc ấn <strong>Bản đồ Việt Nam</strong> để tải dữ liệu mẫu.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* TSP SVG convergence progress chart */}
        {cities.length >= 3 && history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 id="tsp-chart-title" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Biểu đồ gia tốc hội tụ khoảng cách (Giảm là tốt)
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Sử dụng thuật toán Ordered Crossover (OX) tránh trùng lặp
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-2 h-[150px] flex items-center justify-center">
              {renderSvgTspChart()}
            </div>
          </div>
        )}

        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 leading-relaxed text-xs text-rose-800 flex items-start gap-2.5">
          <Lightbulb className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900 mb-0.5">Giá trị thực tế của TSP:</p>
            <p>
              Tìm lộ trình ngắn nhất đi qua tất cả các điểm trên bản đồ là một bài toán NP-Hard kinh điển. Với 30 thành phố, số lượng các tổ hợp là 30! (khoảng 2.65 x 10<sup>32</sup> phép thử). Thuật toán di truyền di chuyển nhanh chóng, hội tụ một lời giải xuất sắc đạt gần 95-99% mức độ tối ưu toàn cục chỉ sau <strong>vài trăm mili-giây thế hệ mô phỏng</strong>!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
