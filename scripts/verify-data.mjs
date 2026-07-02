import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readTsArray = (file, name) => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const match = text.match(new RegExp(`export const ${name} = ([\\s\\S]*?) as const;`));
  if (!match) throw new Error(`Cannot parse ${name} from ${file}`);
  return JSON.parse(match[1]);
};

const dimensions = readTsArray('src/data/dimensions.ts', 'dimensions');
const questions = readTsArray('src/data/questions.ts', 'questions');
const specialQuestions = readTsArray('src/data/questions.ts', 'specialQuestions');
const types = readTsArray('src/data/types.ts', 'nilongTypes');
const levelValue = { L: 1, M: 2, H: 3 };

function scoreToLevel(score) {
  if (score <= 3) return 'L';
  if (score === 4) return 'M';
  return 'H';
}

function isLevelAtLeast(level, target) {
  return levelValue[level] >= levelValue[target];
}

function getType(code) {
  return types.find((type) => type['奶龙TI_code'] === code);
}

function resolveHiddenType(answers, levels) {
  const wantsMutation = answers.secret_q2 === 3;
  const abstractHit = answers.secret_q1 === 3;
  if (!wantsMutation) return undefined;

  const high = (dimensionId) => levels[dimensionId] === 'H';
  const midOrHigh = (dimensionId) => isLevelAtLeast(levels[dimensionId], 'M');

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

function compute(answers) {
  const scores = Object.fromEntries(dimensions.map((dim) => [dim.id, 0]));
  for (const [questionId, value] of Object.entries(answers)) {
    if (!questionId.startsWith('q')) continue;
    const questionNumber = Number(questionId.slice(1));
    const dimIndex = Math.floor((questionNumber - 1) / 2);
    const dim = dimensions[dimIndex];
    if (dim) scores[dim.id] += Number(value || 0);
  }
  const levels = Object.fromEntries(dimensions.map((dim) => [dim.id, scoreToLevel(scores[dim.id] || 0)]));
  const hiddenType = resolveHiddenType(answers, levels);
  if (hiddenType) return hiddenType;

  const userVector = dimensions.map((dim) => levelValue[levels[dim.id]]);
  const ranked = types
    .filter((type) => !type.pattern.includes('特殊'))
    .map((type) => {
      const vector = type.pattern.replaceAll('-', '').split('').map((item) => levelValue[item]);
      let distance = 0;
      let exact = 0;
      for (let index = 0; index < vector.length; index += 1) {
        const diff = Math.abs(userVector[index] - vector[index]);
        distance += diff;
        if (diff === 0) exact += 1;
      }
      const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
      return { type, distance, exact, similarity };
    })
    .sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity);
  return ranked[0].similarity < 60 ? getType('NL-HHHH') : ranked[0].type;
}

function answersForPattern(pattern) {
  const answers = {};
  pattern.replaceAll('-', '').split('').forEach((level, index) => {
    const value = level === 'L' ? 1 : level === 'M' ? 2 : 3;
    answers[`q${index * 2 + 1}`] = value;
    answers[`q${index * 2 + 2}`] = value;
  });
  return answers;
}

function answersForLevels(levels) {
  const answers = {};
  dimensions.forEach((dim, index) => {
    const level = levels[dim.id] || 'M';
    const value = level === 'L' ? 1 : level === 'M' ? 2 : 3;
    answers[`q${index * 2 + 1}`] = value;
    answers[`q${index * 2 + 2}`] = value;
  });
  return answers;
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(dimensions.length === 15, `Expected 15 dimensions, got ${dimensions.length}`);
assert(questions.length === 30, `Expected 30 questions, got ${questions.length}`);
assert(specialQuestions.length === 2, `Expected 2 special questions, got ${specialQuestions.length}`);
assert(types.length === 29, `Expected 29 types, got ${types.length}`);
assert(getType('NL-SIS'), 'Missing NL-SIS hidden type');
assert(getType('NL-JIAHAO'), 'Missing NL-JIAHAO hidden type');

for (let index = 0; index < questions.length; index += 1) {
  assert(questions[index].id === `q${index + 1}`, `Question id mismatch at ${index}`);
  assert(questions[index].options.length === 3, `Question ${questions[index].id} must have 3 options`);
}

const normalTypes = types.filter((type) => !type.pattern.includes('特殊'));
const hiddenTypes = types.filter((type) => type.pattern.includes('特殊'));
assert(normalTypes.length === 25, `Expected 25 normal types, got ${normalTypes.length}`);
assert(hiddenTypes.length === 4, `Expected 4 hidden/special types, got ${hiddenTypes.length}`);

for (const type of normalTypes) {
  assert(type.pattern.replaceAll('-', '').length === 15, `${type['奶龙TI类型名']} pattern length invalid`);
  const hit = compute(answersForPattern(type.pattern));
  assert(hit['奶龙TI_code'] === type['奶龙TI_code'], `${type['奶龙TI类型名']} unreachable; got ${hit['奶龙TI类型名']}`);
}

const allLowWithMutation = compute({ ...answersForLevels({}), secret_q1: 3, secret_q2: 3 });
assert(allLowWithMutation['奶龙TI_code'] !== 'NL-DRUNK', `Mutation alone should not force NL-DRUNK; got ${allLowWithMutation['奶龙TI_code']}`);

const sis = compute({
  ...answersForLevels({ F1: 'H', F3: 'H', C2: 'H', D1: 'H', S3: 'H' }),
  secret_q1: 3,
  secret_q2: 3,
});
assert(sis['奶龙TI_code'] === 'NL-SIS', `Expected NL-SIS, got ${sis['奶龙TI_code']}`);

const jiahao = compute({
  ...answersForLevels({ N2: 'H', F1: 'H', F3: 'H', C2: 'H', S3: 'H', D1: 'M' }),
  secret_q1: 3,
  secret_q2: 3,
});
assert(jiahao['奶龙TI_code'] === 'NL-JIAHAO', `Expected NL-JIAHAO, got ${jiahao['奶龙TI_code']}`);

console.log(JSON.stringify({
  ok: true,
  dimensions: dimensions.length,
  questions: questions.length,
  specialQuestions: specialQuestions.length,
  types: types.length,
  normalReachable: normalTypes.length,
  hiddenTypes: hiddenTypes.map((type) => type['奶龙TI类型名']),
  mutationAlone: allLowWithMutation['奶龙TI类型名'],
  hiddenSamples: [sis['奶龙TI类型名'], jiahao['奶龙TI类型名']],
}, null, 2));
