/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Trophy, AlertTriangle, Play, RefreshCw, Languages } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [lang, setLang] = useState<'en' | 'zh'>('zh');

  const t = {
    en: {
      title: "Shinobi Defense (Will of Fire)",
      start: "Enter the Battlefield",
      restart: "Rebirth / Try Again",
      win: "Will of Fire!",
      loss: "Village Fallen",
      winMsg: "You have successfully protected the Hidden Leaf Village!",
      lossMsg: "The defense scrolls have been exhausted. The village is lost.",
      score: "Shinobi Merit",
      instructions: "Tap to launch intercepting shurikens. Accumulate 1000 merit points to secure the village.",
      prediction: "Tip: Predict the enemy's path to strike with precision!",
      ammo: "Chakra: Side 2000, Center 4000",
    },
    zh: {
      title: "忍者防御 (火之意志)",
      start: "进入战场",
      restart: "再次挑战",
      win: "火之意志！",
      loss: "村庄沦陷",
      winMsg: "你成功守护了木叶村！",
      lossMsg: "防御卷轴已耗尽，村庄被摧毁了。",
      score: "忍者功勋",
      instructions: "点击屏幕发射拦截手里剑。获得1000点功勋即可保卫村庄。",
      prediction: "提示：预判敌方苦无的飞行路径进行精准拦截！",
      ammo: "查克拉：左右卷轴 2000，中间卷轴 4000",
    }
  }[lang];

  const handleGameEnd = (result: 'WON' | 'LOST') => {
    setGameState(result);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/20">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Shield className="text-white w-6 h-6" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight italic font-serif text-orange-500">
            {t.title}
          </h1>
        </div>
        
        <button 
          onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <Languages className="w-4 h-4" />
          {lang === 'en' ? '中文' : 'English'}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-12 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center max-w-2xl mt-12"
            >
              <div className="mb-8 p-8 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-sm">
                <Target className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold mb-4">{t.title}</h2>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  {t.instructions}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-500 uppercase mb-1 font-mono">Strategy / 策略</p>
                    <p className="text-sm text-zinc-300">{t.prediction}</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-500 uppercase mb-1 font-mono">Resources / 资源</p>
                    <p className="text-sm text-zinc-300">{t.ammo}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setGameState('PLAYING')}
                className="group relative px-12 py-4 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl shadow-emerald-500/20"
              >
                <Play className="w-5 h-5 fill-current" />
                {t.start}
              </button>
            </motion.div>
          )}

          {gameState === 'PLAYING' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full mt-4"
            >
              <GameCanvas 
                gameState={gameState} 
                lang={lang}
                onScoreUpdate={setScore}
                onGameEnd={handleGameEnd}
              />
            </motion.div>
          )}

          {(gameState === 'WON' || gameState === 'LOST') && (
            <motion.div 
              key="end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center mt-20"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${gameState === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameState === 'WON' ? <Trophy className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
              </div>
              
              <h2 className={`text-5xl font-bold mb-2 ${gameState === 'WON' ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameState === 'WON' ? t.win : t.loss}
              </h2>
              <p className="text-zinc-400 text-xl mb-8">
                {gameState === 'WON' ? t.winMsg : t.lossMsg}
              </p>
              
              <div className="bg-zinc-900 px-8 py-4 rounded-2xl border border-white/5 mb-10">
                <p className="text-zinc-500 uppercase text-xs tracking-widest mb-1">{t.score}</p>
                <p className="text-4xl font-mono font-bold text-white">{score}</p>
              </div>

              <button
                onClick={() => setGameState('PLAYING')}
                className="flex items-center gap-3 px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                {t.restart}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 text-zinc-600 text-[10px] uppercase tracking-[0.2em] pointer-events-none">
        &copy; 2024 Tina Nova Defense &bull; Tactical Intercept Protocol
      </footer>
    </div>
  );
}
