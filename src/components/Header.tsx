import { Award, Brain, Dna, Settings2 } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: 'STRING' | 'TSP') => void;
}

export default function Header({ currentTab, setCurrentTab }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-5 gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 rounded-xl text-indigo-600 animate-pulse">
              <Dna id="dna-icon" className="w-8 h-8" />
            </div>
            <div>
              <h1 id="app-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Trực quan hóa Thuật toán Di truyền
              </h1>
              <p id="app-subtitle" className="text-xs sm:text-sm text-slate-500 font-medium">
                Mô phỏng cơ chế tiến hóa tự nhiên để giải quyết các bài toán tối ưu hóa phức tạp
              </p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/40">
            <button
              id="tab-string-matching"
              onClick={() => setCurrentTab('STRING')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                currentTab === 'STRING'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Brain id="brain-tab-icon" className="w-4 h-4" />
              <span>Tiến hóa chuỗi ký tự</span>
            </button>
            <button
              id="tab-tsp"
              onClick={() => setCurrentTab('TSP')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                currentTab === 'TSP'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Award id="tsp-tab-icon" className="w-4 h-4" />
              <span>Người giao hàng (TSP)</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
