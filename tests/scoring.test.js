// 채점 규칙 테스트: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Apps Script의 .gs 파일은 일반 JS이므로 그대로 불러와서 실행합니다.
const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Scoring.gs'), 'utf8');
const context = { module: { exports: {} } };
vm.runInNewContext(source, context);
const { QUESTIONS } = context.module.exports;

function score(no, ...values) {
  return QUESTIONS[no - 1].score(values.map(String));
}

test('1번: 정답 10명, 10%마다 2점 감점', () => {
  assert.deepStrictEqual([10, 9, 11, 8, 12, 5, 15, 0, 100].map((v) => score(1, v)), [10, 8, 8, 6, 6, 0, 0, 0, 0]);
});

test('2번: 아시아 5점 + 60명 기준 10%마다 1점 감점', () => {
  assert.strictEqual(score(2, '아시아', 60), 10);
  assert.strictEqual(score(2, ' 아시아 대륙', 60), 10);
  assert.strictEqual(score(2, '유럽', 60), 5);
  assert.strictEqual(score(2, '아시아', 54), 9);
  assert.strictEqual(score(2, '아시아', 66), 9);
  assert.strictEqual(score(2, '아시아', 53), 8);
  assert.strictEqual(score(2, '아시아', 30), 5);
});

test('3번: 이슬람(교) 5점 + 25명 기준 10%마다 1점 감점', () => {
  assert.strictEqual(score(3, '이슬람', 25), 10);
  assert.strictEqual(score(3, '이슬람교', 23), 9);
  assert.strictEqual(score(3, '불교', 22), 3);
});

test('4번: 정답 66명', () => {
  assert.deepStrictEqual([66, 60, 59, 73, 80].map((v) => score(4, v)), [10, 8, 6, 6, 4]);
});

test('5번: 중국(어) 5점 + 12명', () => {
  assert.strictEqual(score(5, '중국어', 12), 10);
  assert.strictEqual(score(5, '중국', 11), 9);
  assert.strictEqual(score(5, '영어', 10), 3);
});

test('6·7번: 정답 10명', () => {
  assert.deepStrictEqual([10, 9, 12].map((v) => score(6, v)), [10, 8, 6]);
  assert.deepStrictEqual([10, 11, 8].map((v) => score(7, v)), [10, 8, 6]);
});

test('8번: 정답 2명, 1명 차이마다 2점 감점', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6, 7].map((v) => score(8, v)), [6, 8, 10, 8, 6, 4, 2, 0]);
});

test('9번: 40~44명 10점, 범위 밖은 가까운 경계 기준 10%마다 2점 감점', () => {
  assert.deepStrictEqual([40, 44, 39, 36, 35, 45, 48, 49].map((v) => score(9, v)), [10, 10, 8, 8, 6, 8, 8, 6]);
});

test('10번: 3~4명 10점, 점수표대로', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => score(10, v)), [0, 6, 8, 10, 10, 8, 6, 4, 2, 0]);
});

test('빈 칸이나 숫자가 아닌 값은 0점', () => {
  assert.strictEqual(score(1, ''), 0);
  assert.strictEqual(score(2, '', 'abc'), 0);
  assert.strictEqual(score(8, ''), 0);
});

test('전부 정답이면 100점', () => {
  const answers = [['10'], ['아시아', '60'], ['이슬람교', '25'], ['66'], ['중국어', '12'], ['10'], ['10'], ['2'], ['42'], ['3']];
  const total = context.module.exports.scoreAnswers(answers).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 100);
});
