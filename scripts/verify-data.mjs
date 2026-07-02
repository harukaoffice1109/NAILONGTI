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
  if (answers.secret_q1 === 3 && answers.secret_q2 === 3) {
    return types.find((type) => type['奶龙TI_code'] === 'NL-DRUNK');
  }
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
  return ranked[0].similarity < 60 ? types.find((type) => type['奶龙TI_code'] === 'NL-HHHH') : ranked[0].type;
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

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(dimensions.length === 15, `Expected 15 dimensions, got ${dimensions.length}`);
assert(questions.length === 30, `Expected 30 questions, got ${questions.length}`);
assert(specialQuestions.length === 2, `Expected 2 special questions, got ${specialQuestions.length}`);
assert(types.length === 27, `Expected 27 types, got ${types.length}`);

for (let index = 0; index < questions.length; index += 1) {
  assert(questions[index].id === `q${index + 1}`, `Question id mismatch at ${index}`);
  assert(questions[index].options.length === 3, `Question ${questions[index].id} must have 3 options`);
}

const normalTypes = types.filter((type) => !type.pattern.includes('特殊'));
assert(normalTypes.length === 25, `Expected 25 normal types, got ${normalTypes.length}`);
for (const type of normalTypes) {
  assert(type.pattern.replaceAll('-', '').length === 15, `${type['奶龙TI类型名']} pattern length invalid`);
  const hit = compute(answersForPattern(type.pattern));
  assert(hit['奶龙TI_code'] === type['奶龙TI_code'], `${type['奶龙TI类型名']} unreachable; got ${hit['奶龙TI类型名']}`);
}

const hidden = compute({ secret_q1: 3, secret_q2: 3 });
assert(hidden['奶龙TI_code'] === 'NL-DRUNK', `Hidden should be NL-DRUNK, got ${hidden['奶龙TI_code']}`);
console.log(JSON.stringify({ ok: true, dimensions: dimensions.length, questions: questions.length, specialQuestions: specialQuestions.length, types: types.length, normalReachable: normalTypes.length, hidden: hidden['奶龙TI类型名'] }, null, 2));
