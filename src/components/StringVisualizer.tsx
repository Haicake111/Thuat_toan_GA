/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Sparkles, 
  History, 
  Lightbulb,
  Cpu,
  BookmarkCheck
} from 'lucide-react';
import { GAParameters, StringIndividual, GenerationHistory } from '../types';
import { 
  initStringPopulation, 
  evolveStringPopulation, 
  calculateStringFitness 
} from '../utils/gaEngine';

const DEFAULT_TARGET = "Thuật toán Di truyền 2026 - GA";

export default function StringVisualizer() {
  // Input Target Phrase
  const [targetText, setTargetText] = useState(DEFAULT_TARGET);
  
  // GA Parameters
  const [params, setParams] = useState<GAParameters>({
    populationSize: 200,
    mutationRate: 0.02, // 2%
    crossoverRate: 0.85, // 85%
    selectionMethod: 'TOURNAMENT',
    elitismCount: 5,
  });

  // Simulator States
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState<StringIndividual[]>([]);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [speedMs, setSpeedMs] = useState(50); // Tick speed in ms
  const [generationsPerTick, setGenerationsPerTick] = useState(1); // Generations advanced per frame for speed

  // Keep a reference to latest state for loop
  const stateRef = useRef({
    isRunning,
    generation,
    population,
    targetText,
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
      targetText,
      params,
      history,
      speedMs,
      generationsPerTick
    };
  }, [isRunning, generation, population, targetText, params, history, speedMs, generationsPerTick]);

  // Initial Population Set up
  const handleReset = () => {
    setIsRunning(false);
    const initialPop = initStringPopulation(params.populationSize, targetText.length);
    const evaluatedPop = initialPop.map(ind => ({
      genes: ind.genes,
      fitness: calculateStringFitness(ind.genes, targetText)
    })).sort((a, b) => b.fitness - a.fitness);

    setPopulation(evaluatedPop);
    setGeneration(0);
    setHistory([{
      generation: 0,
      bestFitness: evaluatedPop[0].fitness,
      avgFitness: evaluatedPop.reduce((acc, curr) => acc + curr.fitness, 0) / evaluatedPop.length,
      bestValue: evaluatedPop[0].genes
    }]);
  };

  // Run initial reset on mount
  useEffect(() => {
    handleReset();
  }, [targetText]);

  // Handle parameter changes that require reset
  const handleParamChange = <K extends keyof GAParameters>(key: K, value: GAParameters[K]) => {
    setParams(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  // The Main Loop using standard setTimeout
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const tick = () => {
      const current = stateRef.current;
      if (!current.isRunning) return;

      // Check termination condition
      const topIndividual = current.population[0];
      if (topIndividual && topIndividual.genes === current.targetText) {
        setIsRunning(false);
        return;
      }

      let currentPopulation = [...current.population];
      let currentGen = currentGenNum;
      const newHistoryEntries: GenerationHistory[] = [];

      // Advance one or multiple generations
      const loops = current.generationsPerTick;
      for (let i = 0; i < loops; i++) {
        currentPopulation = evolveStringPopulation(currentPopulation, current.targetText, current.params);
        currentGen++;

        const bestInd = currentPopulation[0];
        const avgFit = currentPopulation.reduce((acc, curr) => acc + curr.fitness, 0) / currentPopulation.length;
        
        newHistoryEntries.push({
          generation: currentGen,
          bestFitness: bestInd.fitness,
          avgFitness: avgFit,
          bestValue: bestInd.genes
        });

        // Break if perfect match found even inside loop
        if (bestInd.genes === current.targetText) {
          break;
        }
      }

      setPopulation(currentPopulation);
      setGeneration(currentGen);
      setHistory(prev => [...prev, ...newHistoryEntries]);

      // Queue next tick if running
      if (current.isRunning) {
        timerId = setTimeout(tick, current.speedMs);
      }
    };

    const currentGenNum = generation;
    if (isRunning) {
      timerId = setTimeout(tick, speedMs);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isRunning, speedMs]);

  // Advance single generation manually
  const stepOneGeneration = () => {
    if (isRunning) return;
    const current = stateRef.current;
    const nextPop = evolveStringPopulation(current.population, current.targetText, current.params);
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
        bestValue: bestInd.genes
      }
    ]);
  };

  const bestIndividual = population[0];
  const progressPercentage = bestIndividual 
    ? Math.round(bestIndividual.fitness * 100) 
    : 0;

  // Render text of best individual with green highlight for matched letters
  const renderHighlightedBest = () => {
    if (!bestIndividual) return null;
    const genes = bestIndividual.genes;
    
    return (
      <div className="flex flex-wrap justify-center gap-1 font-mono text-xl sm:text-2xl font-bold tracking-wide py-5 bg-slate-900 text-white rounded-xl px-4 select-none min-h-[72px] items-center border border-slate-800">
        {genes.split('').map((char, index) => {
          const isCorrect = char === targetText[index];
          return (
            <span 
              key={index} 
              className={`inline-block px-1 rounded transition-colors duration-150 ${
                isCorrect 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-red-500/10 text-slate-400 border border-slate-700/60'
              }`}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    );
  };

  // Create absolute basic chart in SVG
  const renderSvgChart = () => {
    if (history.length === 0) return null;
    
    const width = 500;
    const height = 150;
    const padding = 20;
    
    // Find limits
    const maxGen = Math.max(10, ...history.map(h => h.generation));
    
    // Convert points to SVG coords
    const getCoords = (h: GenerationHistory) => {
      const x = padding + (h.generation / maxGen) * (width - 2 * padding);
      const yBest = height - padding - (h.bestFitness * (height - 2 * padding));
      const yAvg = height - padding - (h.avgFitness * (height - 2 * padding));
      return { x, yBest, yAvg };
    };

    const points = history.map(getCoords);
    
    let pathBest = '';
    let pathAvg = '';
    
    if (points.length > 0) {
      pathBest = `M ${points[0].x} ${points[0].yBest} ` + points.map(p => `L ${p.x} ${p.yBest}`).join(' ');
      pathAvg = `M ${points[0].x} ${points[0].yAvg} ` + points.map(p => `L ${p.x} ${p.yAvg}`).join(' ');
    }

    return (
      <svg className="w-full h-full min-h-[140px]" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Gridlines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" />

        {/* Average Fitness Line (Lower, smoother curve) */}
        {pathAvg && <path d={pathAvg} fill="none" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="3,3" />}
        
        {/* Best Fitness Line (Top, progressive curve) */}
        {pathBest && <path d={pathBest} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        
        {/* Labels */}
        <text x={padding + 5} y={padding + 12} fill="#94a3b8" fontSize="10" className="font-mono">1.0 (Hoàn hảo)</text>
        <text x={padding + 5} y={height / 2 + 3} fill="#94a3b8" fontSize="10" className="font-mono">0.5 (Một nửa)</text>
        <text x={padding + 5} y={height - padding - 4} fill="#94a3b8" fontSize="10" className="font-mono">0.0 (Thích nghi)</text>
        
        <text x={width - padding - 80} y={height - padding - 4} fill="#64748b" fontSize="10" className="font-bold font-mono">Thế hệ: {generation}</text>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SIDEBAR: CONFIGURATION */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Text Target Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookmarkCheck id="target-phrase-icon" className="w-4 h-4" />
            </div>
            <h3 id="target-phrase-title" className="text-sm font-bold text-slate-800">
              Nhập chuỗi mục tiêu
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Nhập một từ hoặc đoạn văn để các cá thể bắt đầu tiến hóa lắp ghép ngẫu nhiên thành chuỗi này.
          </p>
          <input
            id="target-text-input"
            type="text"
            value={targetText}
            onChange={(e) => {
              const cleaned = e.target.value.substring(0, 50); // limit length to 50 for layout safety
              setTargetText(cleaned);
            }}
            disabled={isRunning}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 font-mono"
            placeholder="Ví dụ: TOI YEU VIET NAM"
          />
          <div className="flex gap-2 mt-2">
            <button
              id="preset-btn-1"
              type="button"
              disabled={isRunning}
              onClick={() => setTargetText("Học Viện Công Nghệ")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/70 text-slate-600 rounded-md text-[11px] font-semibold transition"
            >
              Học Viện Công Nghệ
            </button>
            <button
              id="preset-btn-2"
              type="button"
              disabled={isRunning}
              onClick={() => setTargetText("Trí Tuệ Nhân Tạo 2026")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/70 text-slate-600 rounded-md text-[11px] font-semibold transition"
            >
              Trí Tuệ Nhân Tạo
            </button>
          </div>
        </div>

        {/* GA Parameters Config */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Settings id="ga-settings-icon" className="w-4 h-4" />
            </div>
            <h3 id="ga-settings-title" className="text-sm font-bold text-slate-800">
              Cấu hình Thuật toán GA
            </h3>
          </div>

          {/* Population Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="population-size-slider">Kích thước quần thể (Pop Size)</label>
              <span className="font-mono text-indigo-600">{params.populationSize}</span>
            </div>
            <input
              id="population-size-slider"
              type="range"
              min="20"
              max="500"
              step="10"
              value={params.populationSize}
              onChange={(e) => handleParamChange('populationSize', parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
            <p className="text-[10px] text-slate-400">Số lượng cá thể sống trong thế hệ. Số lượng lớn giúp giải nhanh hơn nhưng tiêu tốn tài nguyên.</p>
          </div>

          {/* Mutation Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="mutation-rate-slider">Tỷ lệ đột biến (Mutation Rate)</label>
              <span className="font-mono text-indigo-600">{Math.round(params.mutationRate * 100)}%</span>
            </div>
            <input
              id="mutation-rate-slider"
              type="range"
              min="0"
              max="0.30"
              step="0.01"
              value={params.mutationRate}
              onChange={(e) => handleParamChange('mutationRate', parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
            <p className="text-[10px] text-slate-400">Tỉ lệ xảy ra sự cố đột biến gen ngẫu nhiên khi lai ghép.</p>
          </div>

          {/* Crossover Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="crossover-rate-slider">Tỷ lệ lai ghép (Crossover Rate)</label>
              <span className="font-mono text-indigo-600">{Math.round(params.crossoverRate * 100)}%</span>
            </div>
            <input
              id="crossover-rate-slider"
              type="range"
              min="0.10"
              max="1.00"
              step="0.05"
              value={params.crossoverRate}
              onChange={(e) => handleParamChange('crossoverRate', parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Selection Method */}
          <div className="space-y-1.5">
            <label htmlFor="selection-method-select" className="text-xs font-bold text-slate-700 block">Phương pháp chọn lọc</label>
            <select
              id="selection-method-select"
              value={params.selectionMethod}
              onChange={(e) => handleParamChange('selectionMethod', e.target.value as GAParameters['selectionMethod'])}
              disabled={isRunning}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="TOURNAMENT">Giải đấu loại (Tournament Select)</option>
              <option value="ROULETTE">Vòng quay roulette (Roulette Wheel)</option>
              <option value="ELITISM">Ưu tú lựa chọn (Elitism Select)</option>
            </select>
          </div>

          {/* Elitism selection size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <label htmlFor="elitism-count-slider">Cá thể ưu tú sao chép thẳng (Elitism)</label>
              <span className="font-mono text-indigo-600">{params.elitismCount}</span>
            </div>
            <input
              id="elitism-count-slider"
              type="range"
              min="0"
              max="20"
              step="1"
              value={params.elitismCount}
              onChange={(e) => handleParamChange('elitismCount', parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-indigo-600"
            />
            <p className="text-[10px] text-slate-400">Giữ nguyên n cá thể xuất sắc nhất thế hệ cũ sang thế hệ mới để bảo toàn lời giải tốt nhất.</p>
          </div>
        </div>

        {/* Speed settings card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 id="speed-settings-title" className="text-xs font-bold text-slate-800">
            Tốc độ tính toán thế hệ
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Chậm (Từng bước)', ms: 600, loop: 1 },
              { label: 'Vừa', ms: 100, loop: 1 },
              { label: 'Nhanh', ms: 15, loop: 1 },
              { label: 'Mạnh mẽ', ms: 10, loop: 5 },
              { label: 'Siêu tốc', ms: 5, loop: 15 },
              { label: 'Tức thời', ms: 1, loop: 35 },
            ].map((speed, i) => {
              const active = speedMs === speed.ms && generationsPerTick === speed.loop;
              return (
                <button
                  id={`speed-btn-${i}`}
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

      {/* RIGHT DISPLAY: MAIN SIMULATOR */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* Simulator Dashboard Cover */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col space-y-5">
          
          {/* Main Simulation Control Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span id="string-sim-title" className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Tiến hóa chuỗi</span>
              <h2 id="string-sim-subtitle" className="text-lg font-bold text-slate-900 mt-0.5">Trình mô phỏng khớp gene chuỗi văn bản</h2>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {/* Play/Pause */}
              <button
                id="btn-play-pause-string"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause id="icon-pause-string" className="w-4 h-4 fill-white" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play id="icon-play-string" className="w-4 h-4 fill-white" />
                    <span>Bắt đầu</span>
                  </>
                )}
              </button>

              {/* Next Single gen step */}
              <button
                id="btn-step-generation-string"
                onClick={stepOneGeneration}
                disabled={isRunning}
                className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 transition cursor-pointer"
              >
                <Cpu id="icon-cpu-string" className="w-4 h-4" />
                <span>Thế hệ tiếp</span>
              </button>

              {/* Reset */}
              <button
                id="btn-reset-string"
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 bg-white cursor-pointer transition-all"
              >
                <RotateCcw id="icon-reset-string" className="w-4 h-4" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          {/* Highlighted best string */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Cá thể thích nghi tốt nhất hiện tại (Best Genome):</span>
              <span className="font-mono text-indigo-600 font-bold bg-indigo-50/70 px-2 py-0.5 rounded">
                Thích nghi (Fitness): {(bestIndividual?.fitness || 0).toFixed(4)}
              </span>
            </div>
            {renderHighlightedBest()}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">Thế hệ (Generation)</span>
              <span id="metric-generation" className="text-2xl font-black text-slate-800 font-mono mt-1 block">
                {generation}
              </span>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">Độ khớp mục tiêu</span>
              <span id="metric-accuracy" className="text-2xl font-black text-indigo-600 font-mono mt-1 block">
                {progressPercentage}%
              </span>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">Số lượng cá thể</span>
              <span id="metric-pop-size" className="text-2xl font-black text-slate-800 font-mono mt-1 block">
                {population.length}
              </span>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">Đồ thị / Lịch sử</span>
              <span id="metric-history-pts" className="text-2xl font-black text-slate-800 font-mono mt-1 block">
                {history.length}
              </span>
            </div>
          </div>

        </div>

        {/* Dynamic plot curves & Current top fitness items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Dynamic Fitness Track Progress Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <History id="history-chart-icon" className="w-4 h-4 text-indigo-500" />
                <h3 id="history-chart-title" className="text-sm font-bold text-slate-800">
                  Biểu đồ độ thích nghi (Fitness Curve)
                </h3>
              </div>
              <div className="flex space-x-3 text-[10px]">
                <span className="flex items-center gap-1 text-indigo-600 font-bold">
                  <span className="inline-block w-2.5 h-0.5 bg-indigo-500"></span>Tốt nhất
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <span className="inline-block w-2.5 h-0.5 bg-indigo-300 border-dashed"></span>Trung bình
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 h-[160px] flex items-center justify-center border border-slate-100">
              {renderSvgChart()}
            </div>
          </div>

          {/* Top 12 individuals visualizer */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles id="ranking-list-icon" className="w-4 h-4 text-amber-500" />
              <h3 id="ranking-list-title" className="text-sm font-bold text-slate-800">
                Top cá thể vượt trội (Hạng 1 - 10)
              </h3>
            </div>

            <div className="space-y-1.5 font-mono max-h-[160px] overflow-y-auto pr-1">
              {population.slice(0, 10).map((ind, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between py-1 px-2.5 rounded text-xs transition duration-150 border ${
                    index === 0 
                      ? 'bg-emerald-50/60 border-emerald-100/80 text-emerald-800 font-bold' 
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-[10px] bg-slate-200/60 px-1 rounded text-slate-500 w-5 text-center">
                      #{index + 1}
                    </span>
                    <span className="truncate">{ind.genes}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                    f: {(ind.fitness).toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Algorithm educational insights details */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 leading-relaxed text-xs text-slate-600 flex items-start gap-3">
          <Lightbulb id="insight-bulb" className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800 mb-0.5">Lý giải khoa học thế hệ:</p>
            <p>
              Mỗi cá thể trong bảng xếp hạng bên trên mang một chuỗi gen ký tự ngẫu nhiên ban đầu. Trải qua mỗi vòng lặp lựa chọn (được ưu tiên chọn lọc cấu trúc giống mục tiêu), cha mẹ tốt ghép cặp (Lai kép) cùng đột xuất biến đổi gen (Đột biến) đã tạo ra con cháu thông minh hơn. Sau nhiều thế hệ, gen ngẫu nhiên sẽ tụ hội chính xác về đáp án đúng mà <strong>không cần dò tìm vét cạn (brute-force) toàn bộ {targetText.length}-ký tự</strong>.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
