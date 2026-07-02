import { dimensions } from '../data/dimensions';
import { nilongTypes, type NilongType } from '../data/types';

export type Answers = Record<string, number>;
export type Level = 'L' | 'M' | 'H';

const levelValue: Record<Level, number> = { L: 1, M: 2, H: 3 };

export interface ComputedResult {
  type: NilongType;
  levels: Record<string, Level>;
  scores: Record<string, number>;
  similarity: number;
  exact: number;
  ranked: Array<{ type: NilongType; distance: number; exact: number; similarity: number }>;
  reason: 'pattern' | 'hidden' | 'fallback';
}

export function scoreToLevel(score: number): Level {
  if (score <= 3) return 'L';
  if (score === 4) return 'M';
  return 'H';
}

function patternToVector(pattern: string): number[] | null {
  if (pattern.includes('特殊')) return null;
  const compact = pattern.replaceAll('-', '') as string;
  if (compact.length !== dimensions.length) return null;
  return compact.split('').map((item) => levelValue[item as Level]);
}

function getType(code: string): NilongType | undefined {
  return nilongTypes.find((type) => type['奶龙TI_code'] === code);
}

function isLevelAtLeast(level: Level, target: Level): boolean {
  return levelValue[level] >= levelValue[target];
}

function resolveHiddenType(answers: Answers, levels: Record<string, Level>): NilongType | undefined {
  const wantsMutation = answers.secret_q2 === 3;
  const abstractHit = answers.secret_q1 === 3;
  if (!wantsMutation) return undefined;

  const high = (dimensionId: string) => levels[dimensionId] === 'H';
  const midOrHigh = (dimensionId: string) => isLevelAtLeast(levels[dimensionId], 'M');

  if (abstractHit && high('F1') && high('F3') && high('C2') && (high('D1') || high('D3')) && midOrHigh('S3')) {
    return getType('NL-SIS');
  }

  if (abstractHit && high('N2') && high('F1') && high('F3') && high('C2') && midOrHigh('S3') && levels.D1 !== 'H') {
    return getType('NL-JIAHAO');
  }

  if (abstractHit && high('F2') && high('S2') && high('S3')) {
    return getType('NL-DRUNK');
  }

  if (abstractHit && high('F2') && high('C2')) {
    return getType('NL-HHHH');
  }

  if (abstractHit && high('D1') && high('S3')) {
    return getType('NL-FW');
  }

  return undefined;
}

export function computeResult(answers: Answers): ComputedResult {
  const scores: Record<string, number> = Object.fromEntries(dimensions.map((dim) => [dim.id, 0]));

  for (const [questionId, value] of Object.entries(answers)) {
    if (!questionId.startsWith('q')) continue;
    const questionNumber = Number(questionId.slice(1));
    if (!Number.isFinite(questionNumber)) continue;
    const dimIndex = Math.floor((questionNumber - 1) / 2);
    const dim = dimensions[dimIndex];
    if (dim) scores[dim.id] += Number(value || 0);
  }

  const levels: Record<string, Level> = Object.fromEntries(
    dimensions.map((dim) => [dim.id, scoreToLevel(scores[dim.id] || 0)]),
  );

  const hiddenType = resolveHiddenType(answers, levels);
  if (hiddenType) {
    return { type: hiddenType, levels, scores, similarity: 100, exact: dimensions.length, ranked: [], reason: 'hidden' };
  }

  const userVector = dimensions.map((dim) => levelValue[levels[dim.id]]);
  const ranked = nilongTypes
    .map((type) => {
      const vector = patternToVector(type.pattern);
      if (!vector) return null;
      let distance = 0;
      let exact = 0;
      for (let index = 0; index < vector.length; index += 1) {
        const diff = Math.abs(userVector[index] - vector[index]);
        distance += diff;
        if (diff === 0) exact += 1;
      }
      const similarity = Math.max(0, Math.round((1 - distance / (dimensions.length * 2)) * 100));
      return { type, distance, exact, similarity };
    })
    .filter((item): item is { type: NilongType; distance: number; exact: number; similarity: number } => Boolean(item))
    .sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity);

  const best = ranked[0];
  const fallback = nilongTypes.find((type) => type['奶龙TI_code'] === 'NL-HHHH') || best.type;
  if (!best || best.similarity < 60) {
    return { type: fallback, levels, scores, similarity: best?.similarity || 0, exact: best?.exact || 0, ranked, reason: 'fallback' };
  }

  return { type: best.type, levels, scores, similarity: best.similarity, exact: best.exact, ranked, reason: 'pattern' };
}

export function buildAnswersForPattern(pattern: string): Answers {
  const compact = pattern.replaceAll('-', '');
  const answers: Answers = {};
  compact.split('').forEach((level, dimIndex) => {
    const firstQuestion = dimIndex * 2 + 1;
    const value = level === 'L' ? 1 : level === 'M' ? 2 : 3;
    answers[`q${firstQuestion}`] = value;
    answers[`q${firstQuestion + 1}`] = value;
  });
  return answers;
}
