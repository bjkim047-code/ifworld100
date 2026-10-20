/**
 * "세계가 100명이라면" 생각 열기 웹앱.
 * 구글 시트의 [확장 프로그램 > Apps Script]에 붙여넣고 웹앱으로 배포합니다.
 */

var SHEET_NAME = '제출';

/** true로 바꾸면 제출 후 학생 화면에 문항별 정답도 보여줍니다. */
var SHOW_ANSWERS_AFTER_SUBMIT = false;

/** true면 같은 학번은 한 번만 제출할 수 있습니다. */
var BLOCK_DUPLICATE_SUBMISSION = true;

function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  template.questionData = JSON.stringify(getPublicQuestions());
  return template.evaluate()
    .setTitle('세계가 100명이라면')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;

  sheet = spreadsheet.insertSheet(SHEET_NAME);
  var header = ['제출 시각', '학번', '이름'];
  QUESTIONS.forEach(function (_, i) { header.push((i + 1) + '번 점수'); });
  header.push('합계');
  QUESTIONS.forEach(function (_, i) { header.push((i + 1) + '번 답'); });
  sheet.appendRow(header);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#e8f0fe');
  sheet.getRange('B:B').setNumberFormat('@');
  return sheet;
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

/** 시트에 =, +, -, @로 시작하는 값이 수식으로 해석되지 않게 막습니다. */
function safeCell_(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function hasSubmitted_(sheet, studentId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var ids = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues();
  return ids.some(function (row) { return row[0].trim() === studentId; });
}

/** 접속 화면에서 호출: 이미 제출한 학번인지 확인합니다. */
function checkStudent(studentId) {
  studentId = cleanText_(studentId, 20);
  if (!BLOCK_DUPLICATE_SUBMISSION) return { alreadySubmitted: false };
  return { alreadySubmitted: hasSubmitted_(getSheet_(), studentId) };
}

/** 학생 답안을 채점해서 시트에 기록하고 결과를 돌려줍니다. */
function submitAnswers(payload) {
  var studentId = cleanText_(payload && payload.studentId, 20);
  var name = cleanText_(payload && payload.name, 20);
  if (!studentId || !name) throw new Error('학번과 이름을 입력해 주세요.');

  var answers = QUESTIONS.map(function (q, i) {
    var given = (payload.answers && payload.answers[i]) || [];
    return q.fields.map(function (_, j) { return cleanText_(given[j], 30); });
  });
  var scores = scoreAnswers(answers);
  var total = scores.reduce(function (sum, s) { return sum + s; }, 0);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_();
    if (BLOCK_DUPLICATE_SUBMISSION && hasSubmitted_(sheet, studentId)) {
      return { alreadySubmitted: true };
    }
    var row = [new Date(), safeCell_(studentId), safeCell_(name)]
      .concat(scores)
      .concat([total])
      .concat(answers.map(function (a) { return safeCell_(a.join(' / ')); }));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  var result = { alreadySubmitted: false, scores: scores, total: total };
  if (SHOW_ANSWERS_AFTER_SUBMIT) {
    result.answerTexts = QUESTIONS.map(function (q) { return q.answerText; });
  }
  return result;
}
