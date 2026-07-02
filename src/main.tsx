import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Flame, RotateCcw, Share2, Sparkles, Trophy } from 'lucide-react';
import { questions, specialQuestions } from './data/questions';
import { dimensions } from './data/dimensions';
import { nilongTypes } from './data/types';
import { computeResult, type Answers, type ComputedResult } from './lib/computeResult';
import { downloadShareCard } from './lib/shareCard';
import { pickTypeImage } from './lib/typeImages';
import './styles.css';

type Screen = 'home' | 'test' | 'result' | 'types';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<ComputedResult | null>(null);

  const flowQuestions = useMemo(() => [...questions, ...specialQuestions], []);
  const progress = Math.round((Object.keys(answers).length / flowQuestions.length) * 100);

  function startTest() {
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setScreen('test');
  }

  function answer(questionId: string, value: number) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    if (current < flowQuestions.length - 1) {
      setCurrent((item: number) => item + 1);
    } else {
      const computed = computeResult(next);
      setResult(computed);
      setScreen('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <main>
      <Nav onHome={() => setScreen('home')} onTypes={() => setScreen('types')} onStart={startTest} />
      {screen === 'home' && <Home onStart={startTest} onTypes={() => setScreen('types')} />}
      {screen === 'test' && (
        <TestScreen
          current={current}
          questions={flowQuestions}
          answers={answers}
          progress={progress}
          onAnswer={answer}
          onBack={() => setCurrent((item: number) => Math.max(0, item - 1))}
        />
      )}
      {screen === 'result' && result && <ResultScreen result={result} onRestart={startTest} onTypes={() => setScreen('types')} />}
      {screen === 'types' && <TypesScreen />}
    </main>
  );
}

function Nav({ onHome, onTypes, onStart }: { onHome: () => void; onTypes: () => void; onStart: () => void }) {
  return (
    <header className="nav">
      <button className="logo" onClick={onHome}>奶龙TI</button>
      <nav>
        <button onClick={onTypes}>奶龙图鉴</button>
        <button className="primary small" onClick={onStart}>开始测试</button>
      </nav>
    </header>
  );
}

function Home({ onStart, onTypes }: { onStart: () => void; onTypes: () => void }) {
  return (
    <section className="hero">
      <div className="heroText">
        <p className="eyebrow"><Sparkles size={18} /> 仅供娱乐 · 测完不准破防</p>
        <h1>测测你是哪种<br />离谱奶龙</h1>
        <p className="subtitle">30道题检测你的奶味、龙性、发疯程度、生存姿势和群聊污染力。结果可能难听，但也许有点准。</p>
        <div className="ctaRow">
          <button className="primary" onClick={onStart}>开始接受奶龙判决</button>
          <button className="ghost" onClick={onTypes}>先看奶龙图鉴</button>
        </div>
      </div>
      <div className="heroCard">
        <img className="bigDragon" src="/images/types/NL-JIAHAO.png" alt="嘉豪奶" />
        <h2>你的奶龙TI人格可能是</h2>
        <div className="ticker">奶逼龙 · 废奶 · 卧奶 · 孤奶 · 哈奶 · 草奶</div>
      </div>
      <div className="featureGrid">
        <Feature title="30题" text="15维度，每维2题，按奶龙画像匹配结果。" />
        <Feature title="主线+隐藏人格" text="普通人格之外，还有变异奶龙彩蛋结果。" />

      </div>
    </section>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return <div className="feature"><strong>{title}</strong><span>{text}</span></div>;
}

function TestScreen({ current, questions: flowQuestions, answers, progress, onAnswer, onBack }: {
  current: number;
  questions: readonly { id: string; text: string; options: readonly { label: string; value: number }[] }[];
  answers: Answers;
  progress: number;
  onAnswer: (questionId: string, value: number) => void;
  onBack: () => void;
}) {
  const question = flowQuestions[current];
  return (
    <section className="testShell">
      <div className="progressBar"><span style={{ width: `${progress}%` }} /></div>
      <div className="questionMeta">第 {current + 1} / {flowQuestions.length} 题 · 已完成 {progress}%</div>
      <article className="questionCard">
        <h2>{question.text}</h2>
        <div className="options">
          {question.options.map((option) => (
            <button key={option.value} className={answers[question.id] === option.value ? 'selected' : ''} onClick={() => onAnswer(question.id, option.value)}>
              <span>{option.value}</span>
              {option.label}
            </button>
          ))}
        </div>
        <button className="ghost" disabled={current === 0} onClick={onBack}>上一题</button>
      </article>
    </section>
  );
}

function ResultScreen({ result, onRestart, onTypes }: { result: ComputedResult; onRestart: () => void; onTypes: () => void }) {
  const type = result.type;
  const tags = type.tags || [];
  const selectedImage = useMemo(() => pickTypeImage(type), [type]);
  return (
    <section className="resultPage">
      <article className="resultCard">
        <div className="resultImageWrap"><img src={selectedImage} alt={type['奶龙TI类型名']} /></div>
        <div className="resultText">
          <p className="eyebrow"><Trophy size={18} /> 你的奶龙TI人格是</p>
          <h1>{type['奶龙TI类型名']}</h1>
          <h2>{type['一句话判词']}</h2>
          <p>{type.description}</p>
          <div className="pillRow">
            <span>{type['奶龙TI_code']}</span>
            <span>相似度 {result.similarity}%</span>
            <span>{result.reason === 'hidden' ? '隐藏触发' : result.reason === 'fallback' ? '兜底结果' : 'pattern匹配'}</span>
          </div>
          <div className="ctaRow">
            <button className="primary" onClick={() => downloadShareCard(type, tags, selectedImage)}><Share2 size={18} /> 下载分享卡</button>
            <button className="ghost" onClick={onRestart}><RotateCcw size={18} /> 再测一次</button>
            <button className="ghost" onClick={onTypes}>看图鉴</button>
          </div>
        </div>
      </article>
      <DimensionPanel result={result} />
    </section>
  );
}

function DimensionPanel({ result }: { result: ComputedResult }) {
  return (
    <section className="panel">
      <h2><Flame size={22} /> 15维度奶龙画像</h2>
      <div className="dimensionGrid">
        {dimensions.map((dim) => (
          <div className="dim" key={dim.id}>
            <strong>{dim.name}</strong>
            <span>{dim.model}</span>
            <b>{result.levels[dim.id]}</b>
            <small>{result.levels[dim.id] === 'H' ? dim.high : result.levels[dim.id] === 'L' ? dim.low : '中间态：半奶半醒'}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypesScreen() {
  return (
    <section className="typesPage">
      <h1>奶龙TI图鉴</h1>
      <p>包含主线人格与隐藏变异人格；这些不是温柔人格，是系统给群友下的抽象判决。</p>
      <div className="typeGrid">
        {nilongTypes.map((type) => (
          <article className="typeCard" key={type['奶龙TI_code']}>
            <img src={pickTypeImage(type)} alt={type['奶龙TI类型名']} />
            <div>
              <span>{type['奶龙TI_code']}</span>
              <h2>{type['奶龙TI类型名']}</h2>
              <p>{type['一句话判词']}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
