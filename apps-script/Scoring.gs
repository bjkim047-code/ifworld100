/**
 * 문항 정의와 채점 규칙.
 *
 * 정답과 채점 함수는 서버(Apps Script)에만 있고, 학생 화면에는
 * getPublicQuestions()로 문제 문구와 입력 칸 정보만 전달합니다.
 */

var INTRO_TEXT = '80억 지구, 만약 세계가 100명이라면?';

/** 정답에서 10% 단위로 몇 칸 떨어져 있는지 (10% 이내면 1, 20% 이내면 2 ...). */
function stepsAway(value, reference) {
  var diff = Math.abs(value - reference);
  if (diff === 0) return 0;
  return Math.ceil(diff * 10 / reference - 1e-9);
}

/** 정답이면 max점, 10% 벗어날 때마다 perStep점씩 감점 (최소 0점). */
function percentScore(value, answer, max, perStep) {
  if (!isFinite(value)) return 0;
  return Math.max(0, max - perStep * stepsAway(value, answer));
}

/** lo~hi 범위 안이면 max점, 벗어나면 가까운 경계값 기준 10%마다 perStep점씩 감점. */
function rangePercentScore(value, lo, hi, max, perStep) {
  if (!isFinite(value)) return 0;
  if (value >= lo && value <= hi) return max;
  var reference = value < lo ? lo : hi;
  return Math.max(0, max - perStep * stepsAway(value, reference));
}

/** 입력값별 점수표로 채점 (표에 없는 값은 0점). */
function tableScore(value, table) {
  return Object.prototype.hasOwnProperty.call(table, value) ? table[value] : 0;
}

/** 공백·문장부호를 없애고 소문자로 바꿔서 비교하기 쉽게 만듭니다. */
function normalizeText(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[\s.,!?·()\[\]{}'"~\-_/]/g, '');
}

function textMatches(text, accepted) {
  var normalized = normalizeText(text);
  return accepted.some(function (answer) {
    return normalizeText(answer) === normalized;
  });
}

function toNumber(value) {
  if (value === '' || value == null) return NaN;
  return Number(value);
}

var QUESTIONS = [
  {
    text: '여성은 50명, 남성은 50명, 어린이는 25명 성인은 75명 이중 65세 이상 노인은 몇 명일까?',
    fields: [{ label: '65세 이상 노인 수', type: 'number' }],
    answerText: '10명',
    score: function (a) { return percentScore(toNumber(a[0]), 10, 10, 2); }
  },
  {
    text: '아프리카는 18명, 아메리카는 13명, 사람이 가장 많이 사는 대륙은 어디일까?',
    fields: [
      { label: '사람이 가장 많이 사는 대륙', type: 'text' },
      { label: '그 대륙에 사는 사람 수', type: 'number' }
    ],
    answerText: '아시아, 60명',
    score: function (a) {
      var name = textMatches(a[0], ['아시아', '아시아대륙', 'asia']) ? 5 : 0;
      return name + percentScore(toNumber(a[1]), 60, 5, 1);
    }
  },
  {
    text: '기독교는 31명, 힌두교는 15명, 불교는 7명, 두 번째로 많이 믿는 종교는 무엇일까?',
    fields: [
      { label: '두 번째로 많이 믿는 종교', type: 'text' },
      { label: '그 종교를 믿는 사람 수', type: 'number' }
    ],
    answerText: '이슬람교, 25명',
    score: function (a) {
      var name = textMatches(a[0], ['이슬람', '이슬람교']) ? 5 : 0;
      return name + percentScore(toNumber(a[1]), 25, 5, 1);
    }
  },
  {
    text: '대학 학위를 가진 사람은 39명, 인터넷을 이용하는 사람은 65명, 글을 읽고 쓸 수 있는 사람은 몇 명일까?',
    fields: [{ label: '글을 읽고 쓸 수 있는 사람 수', type: 'number' }],
    answerText: '87명',
    score: function (a) { return percentScore(toNumber(a[0]), 87, 10, 2); }
  },
  {
    text: '세계에서 가장 많이 사용되는 언어는 무엇일까?',
    fields: [
      { label: '가장 많이 사용되는 언어', type: 'text' },
      { label: '그 언어를 사용하는 사람 수', type: 'number' }
    ],
    answerText: '중국어, 12명',
    score: function (a) {
      var name = textMatches(a[0], ['중국', '중국어']) ? 5 : 0;
      return name + percentScore(toNumber(a[1]), 12, 5, 1);
    }
  },
  {
    text: '하루 3달러(한화 약 4000원) 미만의 극심한 빈곤에 처한 사람은 몇 명일까?',
    fields: [{ label: '극심한 빈곤에 처한 사람 수', type: 'number' }],
    answerText: '10명',
    score: function (a) { return percentScore(toNumber(a[0]), 10, 10, 2); }
  },
  {
    text: '전쟁에 노출된 사람의 수는 몇 명일까?',
    fields: [{ label: '전쟁에 노출된 사람 수', type: 'number' }],
    answerText: '10명',
    score: function (a) { return percentScore(toNumber(a[0]), 10, 10, 2); }
  },
  {
    text: '어린 나이에 일을 하고 있는 아동 노동자의 수는?',
    fields: [{ label: '아동 노동자 수', type: 'number' }],
    answerText: '2명',
    score: function (a) {
      return tableScore(toNumber(a[0]), { 0: 6, 1: 8, 2: 10, 3: 8, 4: 6, 5: 4, 6: 2 });
    }
  },
  {
    text: '기후 변화에 매우 취약한 환경에 처한 사람의 수는?',
    fields: [{ label: '기후 변화에 취약한 사람 수', type: 'number' }],
    answerText: '40~44명',
    score: function (a) { return rangePercentScore(toNumber(a[0]), 40, 44, 10, 2); }
  },
  {
    text: '(연간) 말라리아에 감염되는 사람의 수는?',
    fields: [{ label: '말라리아에 감염되는 사람 수', type: 'number' }],
    answerText: '3~4명',
    score: function (a) {
      return tableScore(toNumber(a[0]), { 0: 4, 1: 6, 2: 8, 3: 10, 4: 10, 5: 8, 6: 6, 7: 4, 8: 2 });
    }
  }
];

/** 학생 화면에 보낼 문항 정보 (정답·채점 규칙 제외). */
function getPublicQuestions() {
  return {
    intro: INTRO_TEXT,
    questions: QUESTIONS.map(function (q) {
      return { text: q.text, fields: q.fields };
    })
  };
}

/** answers[i]는 i번 문항의 입력값 배열입니다. 문항별 점수 배열을 돌려줍니다. */
function scoreAnswers(answers) {
  return QUESTIONS.map(function (q, i) {
    return q.score(answers[i] || []);
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    QUESTIONS: QUESTIONS,
    scoreAnswers: scoreAnswers,
    getPublicQuestions: getPublicQuestions,
    percentScore: percentScore,
    rangePercentScore: rangePercentScore,
    normalizeText: normalizeText
  };
}
