import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Copy, Flame, ImageDown, RotateCcw, Share2, Sparkles, Trophy, X } from 'lucide-react';
import { questions, specialQuestions } from './data/questions';
import { dimensions } from './data/dimensions';
import { nilongTypes } from './data/types';
import { computeResult, type Answers, type ComputedResult } from './lib/computeResult';
import { createShareCardBlob, createShareCardDataUrl } from './lib/shareCard';
import { copySiteLink, shareImage, shareSite } from './lib/share';
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
        <img className="bigDragon" src="/images/types/NL-JIAHAO.webp" alt="嘉豪奶" />
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
  const [notice, setNotice] = useState('');
  const [sharePreview, setSharePreview] = useState('');
  const [showWeChatGuide, setShowWeChatGuide] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  async function handleShareSite() {
    const status = await shareSite(type['奶龙TI类型名']);
    if (status === 'wechat-guide') {
      setShowWeChatGuide(true);
      setNotice('链接已复制');
      return;
    }
    setNotice(status === 'shared' ? '分享面板已打开' : status === 'copied' ? '链接已复制，发给朋友开测' : '分享已取消');
  }

  async function handleCopyLink() {
    const status = await copySiteLink();
    setNotice(status === 'copied' ? '链接已复制' : '复制失败，请手动复制网址');
  }

  async function handleCopyLinkFromModal() {
    const status = await copySiteLink();
    setNotice(status === 'copied' ? '链接已复制' : '复制失败，请手动复制网址');
  }

  async function handleCreateCard() {
    setIsCreatingCard(true);
    try {
      const blob = await createShareCardBlob(type, tags, selectedImage);
      const shared = await shareImage(blob, type['奶龙TI类型名']);
      if (shared === 'shared') {
        setNotice('结果图分享面板已打开');
        return;
      }
      const dataUrl = await createShareCardDataUrl(type, tags, selectedImage);
      setSharePreview(dataUrl);
      setNotice('长按图片保存，或直接截图分享');
    } catch {
      setNotice('结果图生成失败，请直接截图分享');
    } finally {
      setIsCreatingCard(false);
    }
  }

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
          <div className="ctaRow resultActions">
            <button className="primary" onClick={handleShareSite}><Share2 size={18} /> 分享给朋友</button>
            <button className="ghost" onClick={handleCreateCard} disabled={isCreatingCard}><ImageDown size={18} /> {isCreatingCard ? '生成中' : '生成结果图'}</button>
            <button className="ghost" onClick={handleCopyLink}><Copy size={18} /> 复制链接</button>
            <button className="ghost" onClick={onRestart}><RotateCcw size={18} /> 再测一次</button>
            <button className="ghost" onClick={onTypes}>看图鉴</button>
          </div>
          {notice && <p className="notice">{notice}</p>}
        </div>
      </article>
      <DimensionPanel result={result} />
      {sharePreview && <SharePreview imageUrl={sharePreview} onCopyLink={handleCopyLinkFromModal} onClose={() => setSharePreview('')} />}
      {showWeChatGuide && <WeChatShareGuide onCopyLink={handleCopyLinkFromModal} onClose={() => setShowWeChatGuide(false)} />}
    </section>
  );
}

function SharePreview({ imageUrl, onCopyLink, onClose }: { imageUrl: string; onCopyLink: () => void; onClose: () => void }) {
  return (
    <div className="shareModal" role="dialog" aria-modal="true" aria-label="结果图预览">
      <div className="shareModalPanel">
        <button className="modalClose" onClick={onClose} aria-label="关闭结果图预览"><X size={22} /></button>
        <img src={imageUrl} alt="奶龙TI结果分享图" />
        <p>长按图片保存，或直接截图分享。二维码可打开 nailongti.pages.dev</p>
        <div className="modalActions">
          <button className="primary" onClick={onCopyLink}><Copy size={18} /> 复制链接</button>
          <button className="ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

function WeChatShareGuide({ onCopyLink, onClose }: { onCopyLink: () => void; onClose: () => void }) {
  return (
    <div className="shareModal" role="dialog" aria-modal="true" aria-label="微信分享引导">
      <div className="shareModalPanel guidePanel">
        <button className="modalClose" onClick={onClose} aria-label="关闭微信分享引导"><X size={22} /></button>
        <div className="guideArrow">···</div>
        <h2>链接已复制</h2>
        <p>点击右上角菜单，选择“发送给朋友”或“分享到朋友圈”。也可以直接截图结果页发给朋友。</p>
        <div className="modalActions">
          <button className="primary" onClick={onClose}>我知道了</button>
          <button className="ghost" onClick={onCopyLink}><Copy size={18} /> 再复制一次</button>
        </div>
      </div>
    </div>
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
