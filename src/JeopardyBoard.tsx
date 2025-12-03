import { useState, useEffect } from 'react';

// Stubbed framer-motion for Preview with a CSS-based animation
const MotionDiv = (props: any) => {
  const { className = '', ...rest } = props;
  return (
    <div
      className={
        className +
        ' transition-all duration-700 ease-out transform opacity-0 scale-75 animate-fadeScaleIn'
      }
      {...rest}
    />
  );
};
const AnimatePresence = ({ children }: any) => <>{children}</>;

// Inject simple CSS keyframes for the fake animation (guarded for browser)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
  @keyframes fadeScaleIn {
    0% { opacity: 0; transform: scale(0.6); }
    60% { opacity: 1; transform: scale(1.15); }
    100% { opacity: 1; transform: scale(1); }
  }
  .animate-fadeScaleIn {
    opacity: 1 !important;
    transform: scale(1) !important;
    animation: fadeScaleIn 0.9s ease-out forwards;
  }
  `;
  document.head.appendChild(style);
}

// --- Sound placeholders ---
const sounds = {
  dailyDouble: new Audio('/sounds/daily_double.mp3'),
  revealQuestion: new Audio('/sounds/reveal_question.mp3'),
  revealAnswer: new Audio('/sounds/reveal_answer.mp3'),
  correct: new Audio('/sounds/correct.mp3'),
  incorrect: new Audio('/sounds/incorrect.mp3'),
  finalThink: (() => {
    const a = new Audio('/sounds/final_think.mp3');
    a.loop = true;
    return a;
  })(),
  timerBeep: new Audio('/sounds/timer_beep.mp3'),
};

export default function JeopardyBoard() {
  const categories = ['AI Basics', 'AI in Everyday Life', 'Famous AI Milestones', 'Ethics & AI'];
  const values = [100, 200, 300, 400, 500];

  const qa: Record<string, { q: string; a: string }> = {
    '0-100': {
      q: 'This term refers to machines that mimic human intelligence.',
      a: 'What is Artificial Intelligence?',
    },
    '0-200': {
      q: 'The branch of AI focused on learning from data.',
      a: 'What is Machine Learning?',
    },
    '0-300': {
      q: 'The type of AI that can perform only one specific task.',
      a: 'What is Narrow AI?',
    },
    '0-400': {
      q: 'The year the term "Artificial Intelligence" was coined.',
      a: 'What is 1956?',
    },
    '0-500': {
      q: 'The test designed by Alan Turing to measure machine intelligence.',
      a: 'What is the Turing Test?',
    },

    '1-100': { q: 'This AI assistant was introduced by Apple in 2011.', a: 'What is Siri?' },
    '1-200': { q: 'Netflix uses this type of AI to recommend shows.', a: 'What is a Recommendation System?' },
    '1-300': { q: 'The AI behind self-driving cars relies heavily on this type of sensor.', a: 'What is Lidar?' },
    '1-400': { q: 'This AI model powers ChatGPT.', a: 'What is GPT?' },
    '1-500': { q: 'The company that created AlphaGo.', a: 'What is DeepMind?' },

    '2-100': { q: "IBM's AI that beat Garry Kasparov in chess.", a: 'What is Deep Blue?' },
    '2-200': { q: 'Year AlphaGo defeated a world champion in Go.', a: 'What is 2016?' },
    '2-300': { q: 'The AI that beat humans in Jeopardy.', a: 'What is Watson?' },
    '2-400': { q: 'The first chatbot created in the 1960s.', a: 'What is ELIZA?' },
    '2-500': { q: 'The AI that generated realistic images from text prompts in 2022.', a: 'What is DALL·E?' },

    '3-100': { q: 'The term for bias in AI systems.', a: 'What is Algorithmic Bias?' },
    '3-200': { q: 'This principle ensures AI decisions can be explained.', a: 'What is Explainability?' },
    '3-300': { q: "The EU's major AI regulation proposal.", a: 'What is the AI Act?' },
    '3-400': { q: 'The concept of AI behaving in a way that aligns with human values.', a: 'What is AI Alignment?' },
    '3-500': { q: 'The term for unintended harmful consequences of AI.', a: 'What is AI Risk?' },
  };

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const [presentationMode, setPresentationMode] = useState(false);
  const [dailyDoubles, setDailyDoubles] = useState<string[]>([]);
  const [showDDAnimation, setShowDDAnimation] = useState(false);

  const [activeRow, setActiveRow] = useState(0);
  const [activeCol, setActiveCol] = useState(0);

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [lockedOutTeams, setLockedOutTeams] = useState<Record<string, number[]>>({});
  const [teamScores, setTeamScores] = useState([0, 0, 0, 0]);

  const [ddWagers, setDdWagers] = useState<Record<string, number>>({});
  const [wagerModal, setWagerModal] = useState<{ key: string } | null>(null);

  const [showFinalCorrect, setShowFinalCorrect] = useState(false);
  const [finalJeopardy, setFinalJeopardy] = useState(false);
  const [finalWagers, setFinalWagers] = useState([0, 0, 0, 0]);
  const [finalCategory] = useState('Legendary Final Category');
  const [finalQuestion] = useState(
    'This is a test Final Jeopardy question so you can verify wagers, timer, and reveal flow works.',
  );
  const [finalAnswer] = useState('This is the test Final Jeopardy answer.');
  const [finalRevealQuestion, setFinalRevealQuestion] = useState(false);
  const [finalTimerEnabled, setFinalTimerEnabled] = useState(false);
  const [finalCountdown, setFinalCountdown] = useState(45);

  const getKey = (col: number, rowVal: number) => `${col}-${rowVal}`;

  const activeValue = values[activeRow];
  const activeKey = getKey(activeCol, activeValue);
  const activeLockedTeams = lockedOutTeams[activeKey] ?? [];

  // Roll daily doubles once
  useEffect(() => {
    const allKeys = Object.keys(qa);
    const randomKeys: string[] = [];
    while (randomKeys.length < 2) {
      const random = allKeys[Math.floor(Math.random() * allKeys.length)];
      if (!randomKeys.includes(random)) randomKeys.push(random);
    }
    setDailyDoubles(randomKeys);
  }, []);

  const resetBoard = () => {
    setRevealed({});
    setShowAnswer({});
    setCompleted({});
    setTeamScores([0, 0, 0, 0]);
    setDdWagers({});
    setWagerModal(null);
    setLockedOutTeams({});
    setSelectedTeam(null);
  };

  const resetFinalJeopardy = () => {
    setFinalJeopardy(false);
    setFinalWagers([0, 0, 0, 0]);
    setFinalRevealQuestion(false);
    setFinalTimerEnabled(false);
    setFinalCountdown(45);
    try { sounds.finalThink.pause(); sounds.finalThink.currentTime = 0; } catch {}
  };

  const finalizeTile = (key: string) => {
    setCompleted(p => ({ ...p, [key]: true }));
    setRevealed(p => ({ ...p, [key]: false }));
    setShowAnswer(p => ({ ...p, [key]: false }));
    setLockedOutTeams(p => ({ ...p, [key]: [] }));
    setSelectedTeam(null);
  };

  // KEYBOARD LOGIC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (finalJeopardy || wagerModal) return;
      if (!presentationMode) return;

      const key = getKey(activeCol, values[activeRow]);
      const isDD = dailyDoubles.includes(key);
      const val = values[activeRow];
      const award = isDD ? ddWagers[key] ?? val : val;

      if (e.key === 'ArrowUp') return setActiveRow(r => Math.max(0, r - 1));
      if (e.key === 'ArrowDown') return setActiveRow(r => Math.min(values.length - 1, r + 1));
      if (e.key === 'ArrowLeft') return setActiveCol(c => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') return setActiveCol(c => Math.min(categories.length - 1, c + 1));

      if (['1','2','3','4'].includes(e.key)) {
        setSelectedTeam(Number(e.key) - 1);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (completed[key]) return;

        if (isDD && !revealed[key] && !showAnswer[key]) {
          try{sounds.dailyDouble.play();}catch{}
          setShowDDAnimation(true);
          setTimeout(() => {
            setShowDDAnimation(false);
            setWagerModal({ key });
          }, 1500);
          return;
        }

        if (!revealed[key]) {
          try { sounds.revealQuestion.play(); } catch {}
          setRevealed(p => ({ ...p, [key]: true }));
          setLockedOutTeams(p => ({ ...p, [key]: [] }));
          return;
        }

        if (!showAnswer[key]) {
          try { sounds.revealAnswer.play(); } catch {}
          setShowAnswer(p => ({ ...p, [key]: true }));
          return;
        }

        try { sounds.incorrect.play(); } catch {}
        finalizeTile(key);
        return;
      }

      const locked = lockedOutTeams[key] ?? [];

      if (e.key === 'Enter' && showAnswer[key] && !completed[key]) {
        if (selectedTeam != null && !locked.includes(selectedTeam)) {
          setTeamScores(ts => ts.map((v,i)=> i===selectedTeam ? v + award : v));
          try { sounds.correct.play(); } catch {}
          finalizeTile(key);
        }
        return;
      }

      if (e.key.toLowerCase() === 'w' && showAnswer[key] && !completed[key]) {
        if (selectedTeam != null && !locked.includes(selectedTeam)) {
          setTeamScores(ts => ts.map((v,i)=> i===selectedTeam ? v - award : v));
          setLockedOutTeams(p => ({ ...p, [key]: [...(p[key] ?? []), selectedTeam] }));
          try { sounds.incorrect.play(); } catch {}

          const updatedLocked = [...locked, selectedTeam];
          if ([0,1,2,3].every(t => updatedLocked.includes(t))) {
            finalizeTile(key);
          }
        }
        return;
      }

      if (e.key === 'Escape') {
        setPresentationMode(false);
        return;
      }
    };

    document.addEventListener('keydown', handleKey);
    return ()=>document.removeEventListener('keydown', handleKey);
  }, [presentationMode, activeCol, activeRow, revealed, showAnswer, completed, dailyDoubles, wagerModal, finalJeopardy, ddWagers, lockedOutTeams, selectedTeam]);

  // FINAL JEOPARDY TIMER
  useEffect(() => {
    if (!finalJeopardy || !finalTimerEnabled || !finalRevealQuestion) return;
    if (finalCountdown <= 0) {
      try { sounds.finalThink.pause(); sounds.finalThink.currentTime = 0; } catch {}
      return;
    }

    const id = window.setInterval(() => {
      setFinalCountdown(c => {
        const next = c > 0 ? c - 1 : 0;
        if (next === 0) {
          try { sounds.finalThink.pause(); sounds.finalThink.currentTime = 0; } catch {}
        }
        return next;
      });
    }, 1000);

    return ()=>clearInterval(id);
  }, [finalJeopardy, finalTimerEnabled, finalRevealQuestion, finalCountdown]);

  // CLICK HANDLER
  const handleClick = (col: number, rowIndex: number) => {
    if (presentationMode || finalJeopardy) return;

    const val = values[rowIndex];
    const key = getKey(col, val);
    if (completed[key]) return;

    if (dailyDoubles.includes(key) && !revealed[key] && !showAnswer[key]) {
      try{sounds.dailyDouble.play();}catch{}
      setShowDDAnimation(true);
      setTimeout(() => {
        setShowDDAnimation(false);
        setWagerModal({ key });
      }, 1500);
      return;
    }

    if (!revealed[key]) {
      try{sounds.revealQuestion.play();}catch{}
      setRevealed(p => ({ ...p, [key]: true }));
      setLockedOutTeams(p=>({ ...p, [key]: [] }));
      return;
    }

    if (!showAnswer[key]) {
      try{sounds.revealAnswer.play();}catch{}
      setShowAnswer(p=>({ ...p, [key]: true }));
      return;
    }

    try{sounds.incorrect.play();}catch{}
    finalizeTile(key);
  };

  // RENDER FINAL JEOPARDY
  if (finalJeopardy) {
    return (
      <div className="min-h-screen bg-[#352c1c] w-full flex flex-col items-center justify-center text-white gap-6 p-8">
        <h1 className="text-5xl font-bold text-[#FFD84D]">FINAL JEOPARDY</h1>
        <h2 className="text-3xl">{finalCategory}</h2>

        {!finalRevealQuestion && (
          <div className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-lg flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-center">Enter Wagers</h3>

            {teamScores.map((s, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-bold">Team {i + 1} (${s})</span>

                {s > 0 ? (
                  <input
                    type="number"
                    min={0}
                    max={s}
                    className="border p-1 rounded w-24"
                    onChange={e => {
                      const v = Number(e.target.value);
                      setFinalWagers(w => w.map((x, idx)=> idx===i ? Math.min(Math.max(v,0), s) : x));
                    }}
                  />
                ) : (
                  <span className="text-sm text-gray-400 italic">Eliminated (≤ $0)</span>
                )}
              </div>
            ))}

            <button
              onClick={()=>setFinalRevealQuestion(true)}
              className="bg-blue-700 text-white py-2 rounded font-bold"
            >
              Lock Wagers & Reveal Question
            </button>

            <p className="text-xs text-center text-gray-600 mt-1">
              Timer will start when you press "Start 45s Timer"
            </p>
          </div>
        )}

        {finalRevealQuestion && (
          <div className="flex flex-col items-center gap-6 max-w-2xl text-center">
            <p className="text-2xl">{finalQuestion}</p>

            {finalTimerEnabled && (
              <p className="text-4xl font-bold text-[#FFD84D]">{finalCountdown}</p>
            )}

            <button
              onClick={() => {
                try{sounds.finalThink.play();}catch{}
                setFinalTimerEnabled(true);
                setFinalCountdown(45);
                try{sounds.timerBeep.play();}catch{}
              }}
              className="bg-yellow-300 text-blue-900 px-6 py-2 rounded font-bold"
            >
              Start 45s Timer
            </button>

            {showFinalCorrect && (
              <div className="mt-4 text-3xl font-bold text-[#FFD84D] bg-[#4a3b25] p-4 rounded-xl shadow-xl">
                {finalAnswer}
              </div>
            )}

            <button
              onClick={()=>setShowFinalCorrect(true)}
              className="bg-green-400 text-blue-900 px-6 py-3 rounded font-bold text-xl"
            >
              Reveal Correct Answer
            </button>

            <button
              onClick={resetFinalJeopardy}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
            >
              Exit Final Jeopardy (Manual Scoring)
            </button>
          </div>
        )}
      </div>
    );
  }

  // NORMAL BOARD RENDER
  return (
    <div className="min-h-screen bg-[#352c1c] flex items-start justify-center p-1 relative overflow-hidden">
      <div className="flex w-full max-w-6xl gap-6">

        {/* HOST CONTROLS */}
        {!presentationMode && (
          <div className="w-64 bg-gray-800 text-white p-4 rounded-lg flex flex-col gap-3 h-fit sticky top-4">
            <h2 className="text-xl font-bold mb-1">Host Controls</h2>

            <button onClick={resetBoard} className="bg-green-600 py-2 px-3 rounded hover:bg-green-500 text-sm font-semibold">
              Reset Board
            </button>

            <button onClick={()=>{setRevealed({}); setShowAnswer({});}}
              className="bg-blue-600 py-2 px-3 rounded hover:bg-blue-500 text-sm font-semibold">
              Hide All
            </button>

            <button onClick={()=>setPresentationMode(true)}
              className="bg-[#352c1c] border border-[#FFB500] text-[#FFD84D] py-2 px-3 rounded shadow-md hover:bg-[#4a3b25] text-sm font-semibold">
              Enter Presentation Mode
            </button>

            <button onClick={()=>setFinalJeopardy(true)}
              className="bg-purple-700 py-2 px-3 rounded hover:bg-purple-600 text-sm font-semibold">
              Start Final Jeopardy
            </button>

            {/* SOUND TEST PANEL */}
            <div className="mt-4 p-3 bg-gray-700 rounded-lg flex flex-col gap-2">
              <h3 className="font-bold text-2xl">Sound Test</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button onClick={()=>sounds.dailyDouble.play()} className="bg-gray-600 py-1 rounded">Daily Double</button>
                <button onClick={()=>sounds.revealQuestion.play()} className="bg-gray-600 py-1 rounded">Reveal Question</button>
                <button onClick={()=>sounds.revealAnswer.play()} className="bg-gray-600 py-1 rounded">Reveal Answer</button>
                <button onClick={()=>sounds.correct.play()} className="bg-gray-600 py-1 rounded">Correct</button>
                <button onClick={()=>sounds.incorrect.play()} className="bg-gray-600 py-1 rounded">Incorrect</button>
                <button onClick={()=>{try{sounds.finalThink.play();}catch{}}} className="bg-gray-600 py-1 rounded">Final Think</button>
                <button onClick={()=>{try{sounds.finalThink.pause(); sounds.finalThink.currentTime=0;}catch{}}} className="bg-gray-600 py-1 rounded">
                  Stop Think
                </button>
                <button onClick={()=>sounds.timerBeep.play()} className="bg-gray-600 py-1 rounded">Timer Beep</button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BOARD */}
        <div className="flex-1 flex flex-col items-center gap-4">

          {/* CATEGORIES */}
          <div className="grid grid-cols-4 w-full max-w-4xl text-center text-2xl font-bold text-[#FFD84D]">
            {categories.map((cat,i)=>(
              <div key={i} className="py-1 border-b-2 border-[#FFB500]">{cat}</div>
            ))}
          </div>

          {/* BOARD TILES */}
          <div className="grid grid-cols-4 w-full max-w-4xl gap-2 mt-2">
            {values.map((val,row)=>
              categories.map((_,col)=>{
                const key = getKey(col,val);
                const isActive = presentationMode && row===activeRow && col===activeCol;
                const isDone = completed[key];
                const isDD = dailyDoubles.includes(key);

                return (
                  <div
                    key={key}
                    onClick={()=>handleClick(col,row)}
                    className={`h-16 flex items-center justify-center rounded text-xl font-bold cursor-pointer select-none
                      ${isDone? 'bg-gray-600 text-gray-400' : 'bg-[#4a3b25] text-[#FFD84D]'}
                      ${isActive? 'ring-4 ring-yellow-300 scale-105' : ''}`}
                  >
                    {!revealed[key] && !isDone && <span>${val}</span>}
                    {revealed[key] && !showAnswer[key] && !isDone && (
                      <span className="px-2 text-xs text-white">{qa[key].q}</span>
                    )}
                    {showAnswer[key] && !isDone && (
                      <span className="px-2 text-sm italic text-green-200">{qa[key].a}</span>
                    )}
                    {isDone && <span className="text-2xl">—</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* PRESENTATION HUD */}
          {presentationMode && (
            <div className="mt-2 text-[#FFD84D] text-xs flex flex-col items-center gap-1">
              <div>
                Active: <span className="font-bold">{categories[activeCol]} ${values[activeRow]}</span>
              </div>

              <div>
                Selected Team:{' '}
                {selectedTeam != null ? (
                  <span className="font-bold">Team {selectedTeam + 1}</span>
                ) : (
                  <span className="italic">None</span>
                )}
              </div>

              <div>
                Locked Out:{' '}
                {activeLockedTeams.length ? (
                  activeLockedTeams.map(t => `Team ${t+1}`).join(', ')
                ) : (
                  <span className="italic">None</span>
                )}
              </div>

              <div className="text-[11px] text-[#FFD84D]/80">
                Arrows = move • Space = reveal • 1–4 select team • Enter = correct • W = wrong
              </div>
            </div>
          )}

          {/* PRESENTATION SCOREBOARD */}
          {presentationMode && (
            <div className="fixed top-2 right-2 flex flex-col gap-1 z-40">
              {teamScores.map((s,i)=>(
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg shadow border border-[#FFB500] bg-[#6b5636] text-[#FFD84D] text-2xl flex justify-between gap-3 min-w-[150px]"
                >
                  <span className="font-bold">T{i+1}</span>
                  <span className="tabular-nums">${s}</span>
                </div>
              ))}
            </div>
          )}

          {/* DAILY DOUBLE WAGER MODAL */}
          {wagerModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-white text-black p-6 rounded-xl w-80 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-center">Daily Double Wager</h2>
                <p className="text-sm text-center">
                  Enter wager for this Daily Double. Teams may wager at least $5 up to their current score.
                </p>

                <input
                  type="number"
                  min={5}
                  max={selectedTeam != null ? Math.max(teamScores[selectedTeam], values[activeRow]) : values[activeRow]}
                  className="border p-2 rounded w-full"
                  onChange={e=>{
                    const raw = Number(e.target.value);
                    const v = isNaN(raw) ? 5 : Math.max(5, raw);
                    setDdWagers(prev=>({...prev, [wagerModal.key]: v}));
                  }}
                />

                <button
                  onClick={()=>{
                    const key = wagerModal.key;
                    setDdWagers(prev=>({...prev, [key]: prev[key] ?? values[activeRow]}));
                    setWagerModal(null);
                    setRevealed(p=>({...p,[key]:true}));
                    setLockedOutTeams(p=>({...p,[key]:[]}));
                  }}
                  className="bg-blue-700 text-white py-2 rounded font-bold mt-1"
                >
                  Confirm Wager & Reveal Question
                </button>

                <button onClick={()=>setWagerModal(null)} className="bg-gray-300 text-gray-900 py-1 rounded text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* DAILY DOUBLE ANIMATION */}
          {showDDAnimation && (
            <MotionDiv className="fixed inset-0 flex items-center justify-center text-6xl text-[#FFD84D] font-bold bg-black/80 z-50">
              DAILY DOUBLE!
            </MotionDiv>
          )}

          {/* NORMAL MODE SCOREBOARD */}
          <div className={presentationMode ? "hidden mt-2 flex gap-3 justify-center w-full" : "mt-2 flex gap-3 justify-center w-full"}>
            {teamScores.map((s,i)=>(
              <div
                key={i}
                className={`px-3 py-2 rounded-xl shadow-lg border-2 ${
                  selectedTeam===i ? 'border-white scale-105' : 'border-[#FFB500]'
                } bg-[#4a3b25] text-[#FFD84D] text-center min-w-[120px]`}
              >
                <div className="font-bold text-2xl">Team {i+1}</div>
                <div className="text-2xl">${s}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
