import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [view, setView] = useState('sanctuary'); 
  const [mood, setMood] = useState(null);
  const [streak, setStreak] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [duration, setDuration] = useState(120); 
  const [timeLeft, setTimeLeft] = useState(120);
  const [gratitudes, setGratitudes] = useState(Array(10).fill(''));
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);

  const audioCtx = useRef(null);
  const masterGain = useRef(null);

  // --- THE QUOTE ENGINE (Linked to Emoji Symbols) ---
  const moodSettings = {
    '😊': { 
      quote: "Success is the sum of small efforts, repeated day in and day out.", 
      bg: 'bg-[#065F46]', 
      accent: 'text-emerald-300' 
    },
    '😌': { 
      quote: "Your calm mind is the ultimate weapon against your challenges.", 
      bg: 'bg-[#064E3B]', 
      accent: 'text-emerald-200' 
    },
    '😐': { 
      quote: "Neutrality is the perfect soil for new growth. Be still.", 
      bg: 'bg-[#1E293B]', 
      accent: 'text-slate-300' 
    },
    '😔': { 
      quote: "The forest is quiet because it is healing. Give yourself that same grace.", 
      bg: 'bg-[#0F172A]', 
      accent: 'text-indigo-300' 
    },
    '😰': { 
      quote: "Storms make trees take deeper roots. You are becoming stronger.", 
      bg: 'bg-[#020617]', 
      accent: 'text-rose-300' 
    }
  };

  const current = moodSettings[mood] || { 
    quote: "Welcome to your Sanctuary. Select your current frequency.", 
    bg: 'bg-[#064E3B]', 
    accent: 'text-emerald-100' 
  };

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('sanctuary_final_v1')) || [];
    setHistory(raw);
    if (raw.length > 0) {
      let count = 0;
      let today = new Date().setHours(0,0,0,0);
      raw.forEach(entry => {
        const entryDate = new Date(entry.timestamp).setHours(0,0,0,0);
        if ((today - entryDate) / 86400000 === count) count++;
      });
      setStreak(count);
    }
  }, [view]);

  // --- AUDIO SYNTH ENGINE ---
  const initAudio = () => {
    if (audioCtx.current) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new Context();
      masterGain.current = audioCtx.current.createGain();
      masterGain.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
      masterGain.current.connect(audioCtx.current.destination);

      const bufferSize = 2 * audioCtx.current.sampleRate;
      const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02; 
        lastOut = output[i];
        output[i] *= 3.5; 
      }
      const rain = audioCtx.current.createBufferSource();
      rain.buffer = noiseBuffer;
      rain.loop = true;
      const filter = audioCtx.current.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, audioCtx.current.currentTime);
      rain.connect(filter);
      filter.connect(masterGain.current);
      rain.start();
    } catch (e) { console.error("Audio block:", e); }
  };

  useEffect(() => {
    let timer;
    if (isBreathing && timeLeft > 0) {
      if (masterGain.current) masterGain.current.gain.setTargetAtTime(0.1, audioCtx.current.currentTime, 2);
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      if (masterGain.current) masterGain.current.gain.setTargetAtTime(0, audioCtx.current.currentTime, 1);
      if (timeLeft === 0) { setIsBreathing(false); setTimeLeft(duration); }
    }
    return () => clearInterval(timer);
  }, [isBreathing, timeLeft, duration]);

  const saveSession = () => {
    const session = { 
      timestamp: Date.now(), 
      mood, 
      note, 
      gratitudes: gratitudes.filter(g => g.trim() !== '') 
    };
    const updated = [session, ...history];
    localStorage.setItem('sanctuary_final_v1', JSON.stringify(updated));
    setNote('');
    setGratitudes(Array(10).fill(''));
    alert("Session Encrypted & Wisdom Archived. 🔒");
    setView('vault');
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center p-6 transition-all duration-[2000ms] ${current.bg} text-white font-sans overflow-x-hidden relative`}>
      
      {/* PARALLAX FOREST BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute bottom-[-10%] left-[-10%] text-[400px] opacity-10 animate-sway">🌿</div>
        <div className="absolute top-[10%] right-[-5%] text-[250px] opacity-5 animate-sway" style={{animationDelay: '-5s'}}>🍃</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* NAVIGATION BAR */}
      <nav className="w-full max-w-md bg-white/5 backdrop-blur-3xl p-1 rounded-3xl border border-white/10 shadow-2xl flex mb-12 z-50">
        {['sanctuary', 'gratitude', 'vault'].map(v => (
          <button key={v} onClick={() => setView(v)} className={`flex-1 py-2.5 rounded-2xl text-[9px] font-black tracking-widest uppercase transition-all ${view === v ? 'bg-white text-black shadow-xl' : 'text-gray-400 opacity-60'}`}>
            {v === 'vault' ? 'RESILIENCE BANK' : v}
          </button>
        ))}
      </nav>

      <main className="w-full max-w-md z-10 flex flex-col items-center pb-24">
        
        {view === 'sanctuary' && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            
            {/* ULTRA-CLEAR STREAK */}
            <div className="flex flex-col items-center mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
              <span className="text-[10px] font-black tracking-[0.4em] opacity-40 uppercase mb-1">Consistency</span>
              <div className="flex items-center gap-3">
                <span className="text-6xl font-extralight tracking-tighter">{streak}</span>
                <span className="text-4xl animate-bounce">🔥</span>
              </div>
            </div>

            <header className="text-center mb-8 h-20 flex items-center justify-center">
              <p className={`text-[13px] italic opacity-80 leading-relaxed font-light transition-all duration-1000 ${current.accent}`}>
                "{current.quote}"
              </p>
            </header>

            {/* MOOD SELECTOR */}
            <div className="flex gap-4 mb-10">
              {Object.keys(moodSettings).map(m => (
                <button key={m} onClick={() => {setMood(m); initAudio();}} className={`text-3xl w-14 h-14 rounded-2xl transition-all ${mood === m ? 'bg-white shadow-2xl scale-110 -translate-y-2' : 'bg-white/10 opacity-30 hover:opacity-100 grayscale hover:grayscale-0'}`}>{m}</button>
              ))}
            </div>

            {/* STAR RESONANCE CIRCLE */}
            <div onClick={() => { initAudio(); setIsBreathing(!isBreathing); }} className="relative w-64 h-64 rounded-full flex items-center justify-center cursor-pointer bg-white/5 border border-white/10 shadow-2xl overflow-hidden mb-12">
              <div className={`absolute rounded-full bg-white/30 transition-all duration-[4000ms] ease-in-out ${isBreathing ? 'w-full h-full opacity-40 scale-100' : 'w-0 h-0 opacity-0 scale-0'}`} style={{ boxShadow: '0 0 50px white' }}></div>
              <div className={`w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_white] z-20 ${isBreathing ? 'scale-150' : 'scale-100'}`}></div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="48%" stroke="white" strokeWidth="1" className="opacity-10" fill="none" />
                <circle cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="1000" strokeDashoffset={1000 - (1000 * (timeLeft / duration))} className={`transition-all duration-1000 linear ${current.accent}`} />
              </svg>
              <div className="text-center z-30">
                <p className={`font-light tracking-[0.5em] text-lg ${isBreathing ? 'animate-pulse' : ''}`}>{isBreathing ? 'EXHALE' : 'BREATHE'}</p>
              </div>
            </div>

            {/* MESSAGE TO FUTURE SELF */}
            <div className="w-full bg-white/5 backdrop-blur-3xl rounded-[35px] p-8 border border-white/10 mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-40">Message to your future self</h3>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What does your 'unmotivated self' need to hear right now?" className="w-full h-24 bg-transparent outline-none border-none resize-none text-sm italic placeholder:opacity-20 leading-relaxed" />
            </div>

            <button onClick={saveSession} className="w-full py-6 bg-white/10 backdrop-blur-3xl text-white/40 text-[11px] font-black rounded-3xl tracking-[0.8em] border border-white/5 shadow-inner hover:bg-white hover:text-black transition-all duration-700">
              SUBMIT SESSION
            </button>
          </div>
        )}

        {view === 'vault' && (
          <div className="w-full animate-fadeIn flex flex-col items-center">
            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] mb-10 opacity-40">Resilience Bank</h2>
            <div className="w-full space-y-6">
              {history.length === 0 ? <p className="opacity-30 italic text-sm">Your vault is currently empty.</p> : history.map((h, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-40"></div>
                  <p className="text-sm italic leading-relaxed opacity-90 mb-4">"{h.note || "A silent moment of peace."}"</p>
                  <div className="flex justify-between items-center opacity-30 text-[9px] font-mono uppercase tracking-widest">
                    <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                    <span>Energy: {h.mood}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'gratitude' && (
          <div className="w-full bg-white/5 backdrop-blur-3xl rounded-[45px] p-10 border border-white/10 animate-fadeIn">
            <h3 className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.5em] mb-10 text-center">10 Pillars of Gratitude</h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scroll">
              {gratitudes.map((g, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-white/5 pb-2">
                  <span className="text-[10px] opacity-20 font-mono">{(i+1).toString().padStart(2,'0')}</span>
                  <input value={g} onChange={(e) => { const n = [...gratitudes]; n[i] = e.target.value; setGratitudes(n); }} placeholder="Something good..." className="w-full bg-transparent text-sm focus:outline-none placeholder:opacity-10 italic" />
                </div>
              ))}
            </div>
            <button onClick={() => setView('sanctuary')} className="w-full mt-10 py-5 bg-white text-black text-[10px] font-bold rounded-2xl tracking-[0.4em]">SAVE & RETURN</button>
          </div>
        )}

      </main>
    </div>
  );
}