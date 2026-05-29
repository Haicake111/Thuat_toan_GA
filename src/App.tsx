/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Header from './components/Header';
import StringVisualizer from './components/StringVisualizer';
import TspVisualizer from './components/TspVisualizer';
import ExplanationPanel from './components/ExplanationPanel';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'STRING' | 'TSP'>('STRING');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Educational Header & Navigation */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Animated switch between the two sandbox engines */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {currentTab === 'STRING' ? (
              <motion.div
                key="string-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <StringVisualizer />
              </motion.div>
            ) : (
              <motion.div
                key="tsp-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <TspVisualizer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step-by-step Tutorial and Math explanation panel */}
        <ExplanationPanel />

        {/* Footer info (humble, compliant) */}
        <footer className="w-full text-center border-t border-slate-200/50 pt-5 pb-2 text-xs text-slate-400 font-medium">
          Dự án trực quan giáo dục khoa học máy tính • Bản quyền 2026 ứng dụng tối ưu hóa mô phỏng
        </footer>

      </main>
    </div>
  );
}
