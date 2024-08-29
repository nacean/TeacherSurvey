//here: 어떤 구글 스프레드시트를 쓸 것인지 이용.
//사용하고 싶은 구글 스프레드시트 페이지에 대한 url 주소에서 /d/ 뒤의 영어 코드를 복사해서 따옴표 안에 붙여넣기 해주시면 됩니다.
//                                                        ↓↓↓↓이 부분↓↓↓↓
//ex) https://docs.google.com/spreadsheets/d/14guQRbY12YkAVPsZt_0lcIZ-xh-DIMq-tKwXMcDPlWo
const spreadSheet = SpreadsheetApp.openById(
  "1bGh8iUf654aBEjNhwedhcPJC24ml82M4JwdeDJYhCdE"
); // spreadSheet id

//here: 시작하려는 날짜입니다.
//ex) startMonth = 6, startDay = 25 일 경우, 2024/06/25/00:00:00 부터 설문을 시작하는 것이 됩니다.
const startYear = 2024;
const startMonth = 8;
const startDay = 19;

//here : 이용자가 중복 설문을 하거나 초과 주차 설문조사 하는 것을 막기 위해 사용됩니다.
// waitDay : 한번 설문 제출 후 몇 일 동안 설문을 못하는지(ex. [waitDay = 7] -> 7일 동안 설문 불가능)
// maxWeek : 몇 주차까지 가능한지(몇변의 설문 조사를 해도 되는지)
//ex) waitDay = 7 이고, maxWeek = 3 이라면 '7일 간격으로 최대 3번의 설문조사' 가 이루어집니다.
const waitDay = 7;
const maxWeek = 4;

function doGet(e) {
  const startDate = getKoreanStartDate(startYear, startMonth, startDay);
  const nowDate = getKoreanNowTime();
  const nowExactWeek = calculateExactNowWeek(startDate, nowDate);

  const startPage = nowExactWeek === 1 ? "agreement" : "index";

  return HtmlService.createTemplateFromFile(startPage)
    .evaluate()
    .setTitle("설문조사")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getLogInPage() {
  return HtmlService.createHtmlOutputFromFile("index").getContent();
}

function getAgreementPage() {
  return HtmlService.createHtmlOutputFromFile("agreement").getContent();
}

function getBasicSurveyPage() {
  return HtmlService.createHtmlOutputFromFile("basicSurvey").getContent();
}

function getLastWeekSurveyPage() {
  return HtmlService.createHtmlOutputFromFile("lastWeekSurvey").getContent();
}

function getSocialSurveyPage() {
  return HtmlService.createHtmlOutputFromFile("socialSurvey").getContent();
}

function getListSurveyPage() {
  return HtmlService.createHtmlOutputFromFile("listSurvey").getContent();
}

function getAdvancedListSurveyPage() {
  return HtmlService.createHtmlOutputFromFile(
    "advancedListSurvey"
  ).getContent();
}

function getLastSurveyPage() {
  return HtmlService.createHtmlOutputFromFile("lastSurvey").getContent();
}

function getFinishPage() {
  return HtmlService.createHtmlOutputFromFile("finish").getContent();
}

// 한국 시간 계산 함수
function getKoreanNowTime() {
  const now = new Date();
  const timeZone = "Asia/Seoul";
  const formattedTime = Utilities.formatDate(
    now,
    timeZone,
    "yyyy-MM-dd'T'HH:mm:ss"
  );

  return formattedTime;
}

function getKoreanStartDate(year, month, day) {
  const rawDate = new Date(year, month - 1, day);
  const formattedDateStr = Utilities.formatDate(
    rawDate,
    "Asia/Seoul",
    "yyyy-MM-dd'T'HH:mm:ss"
  );

  return formattedDateStr;
}

// 날짜 차이 계산 함수
function calculateExactNowWeek(date1, date2) {
  // date1과 date2는 Date 객체여야 합니다.
  const oneDay = 24 * 60 * 60 * 1000; // 하루를 밀리초로 변환
  const date1Time = Date.parse(date1); // startDateStr을 밀리초로 변환
  const date2Time = Date.parse(date2); // nowDateStr을 밀리초로 변환

  const diffInTime = Math.abs(date2Time - date1Time); // 두 날짜의 차이를 밀리초로 계산
  const diffInDays = Number(Math.floor(diffInTime / oneDay)); // 차이를 일 수로 변환

  let exactNowWeek = Number(Math.floor(diffInDays / waitDay)) + 1;

  if (exactNowWeek > maxWeek) {
    exactNowWeek = maxWeek;
  }

  return Number(exactNowWeek);
}

function getMostFruitList(username, phone, maxCount) {
  const fruitMap = new Map();

  for (let week = 1; week <= maxWeek; week++) {
    //here: 마지막 설문 조사인 가장 많이 실행한 과일(목표) n개를 불러오는 기능입니다.
    // 시트 이름이 변경되었다면 해당 이름을 변경해주셔야합니다 (현재는 'n주차과일목록'에 대한 시트에 대해서 데이터를 수집하고 있습니다.).
    const sheet = spreadSheet.getSheetByName(`목표목록`);

    if (!sheet) {
      continue;
    }

    const fruitRange = sheet.getDataRange();
    const fruitData = fruitRange.getValues();

    let tempFruitList = null;

    for (let i = 0; i < fruitData.length; i++) {
      if (fruitData[i][1] === username && fruitData[i][2] === phone) {
        tempFruitList = fruitData[i].slice(3);
        break;
      }
    }

    if (tempFruitList == null) {
      continue;
    }

    tempFruitList.forEach((fruit) => {
      if (fruitMap.has(fruit)) {
        fruitMap.set(fruit, fruitMap.get(fruit) + 1);
      } else {
        fruitMap.set(fruit, 1);
      }
    });
  }

  const sortedFruitList = [...fruitMap].sort((a, b) => b[1] - a[1]);

  const mostFruitList = [];
  const mostFruitListCount = [];

  sortedFruitList.forEach((fruitSet) => {
    const fruitName = fruitSet[0];
    const fruitCount = fruitSet[1];

    if (mostFruitList.length < maxCount) {
      mostFruitList.push(fruitName);
      mostFruitListCount.push(fruitCount);
    } else if (mostFruitListCount[mostFruitList.length - 1] == fruitCount) {
      mostFruitList.push(fruitName);
      mostFruitListCount.push(fruitCount);
    }
  });

  return mostFruitList;
}

function getLastWeek(username, phone) {
  // 유저 이름과 전화번호로부터 특정 행을 찾습니다.
  const sheet = spreadSheet.getSheetByName("user");

  if (!sheet) {
    return 0;
  }

  const userRange = sheet.getDataRange(); // Assuming user data is in columns A, B, C, D
  const userData = userRange.getValues();
  let targetRow = -1;

  for (let i = 0; i < userData.length; i++) {
    if (userData[i][1] === username && userData[i][2] === phone) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return 0;
  }

  // 찾은 행에서 nowWeek 값을 가져옵니다.
  const lastWeek = sheet.getRange("D" + targetRow).getValue(); // Assuming nowWeek is in column D

  return lastWeek;
}

function setNowWeek(timestamp, username, phone, newWeek) {
  // 유저 이름과 전화번호로부터 특정 행을 찾습니다.
  const sheet = spreadSheet.getSheetByName("user");

  if (!sheet) {
    return false;
  }

  const userRange = sheet.getDataRange(); // Assuming user data is in columns A, B, C
  const userData = userRange.getValues();

  let targetRow = -1;

  for (let i = 0; i < userData.length; i++) {
    if (userData[i][1] === username && userData[i][2] === phone) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    Logger.log("해당 유저를 찾을 수 없습니다.");
    return false;
  }

  // 현재 nowWeek 값을 가져옵니다.
  const nowWeekCell = sheet.getRange("D" + targetRow); // Assuming nowWeek is in column D

  // 증가된 nowWeek 값을 업데이트합니다.
  nowWeekCell.setValue(newWeek);

  // 타임스탬프 위치 가져오기
  const timeStampCell = sheet.getRange("A" + targetRow);

  //타임스탬프 업데이트
  timeStampCell.setValue(timestamp);

  return true;
}

function isEarlyDayToSurvey(lastWeek, nowExactWeek) {
  if (lastWeek >= nowExactWeek) {
    return true;
  } else {
    return false;
  }
}

// 로그인 시 작동되는 함수
function checkLogin(name, phone) {
  let sheet = spreadSheet.getSheetByName("user");

  if (!sheet) {
    sheet = spreadSheet.insertSheet();
    sheet.setName("user");
  }

  const lastWeek = getLastWeek(name, phone);

  const startDate = getKoreanStartDate(startYear, startMonth, startDay);
  const nowDate = getKoreanNowTime();
  const nowExactWeek = calculateExactNowWeek(startDate, nowDate);

  const isEarlyDay = isEarlyDayToSurvey(lastWeek, nowExactWeek);

  const haveToAlert = lastWeek == maxWeek || isEarlyDay;

  //here: 중복 및 초과 설문을 막는 숫자입니다.
  //isTest = 0 -> 중복 및 초과 설문을 막는 기능이 활성화 됩니다.
  //isTest = 1 -> 중복 및 초과 설문을 막는 기능이 비활성화 됩니다. (테스트용)
  //현재는 테스트를 위해 비활성화 되어있습니다.
  const isTest = 0;

  let nowWeek = nowExactWeek;

  if (!isTest) {
    if (haveToAlert) {
      nowWeek = -1;
    } else if (
      lastWeek >= 2 &&
      lastWeek < maxWeek - 1 &&
      nowExactWeek === maxWeek
    ) {
      nowWeek = maxWeek - 1;
    } else if (lastWeek == 0 && nowExactWeek >= 2) {
      nowWeek = -2;
    } else if (lastWeek <= 1 && nowExactWeek >= maxWeek - 1) {
      nowWeek = -3;
    }
  }

  return { nowWeek: Number(nowWeek), maxWeek, waitDay };
}

function appendUserInfoRowToSpreadSheet(username, phone, nowWeek) {
  const timestamp = getKoreanNowTime();

  const stringPhone = "'" + phone;

  let sheet = spreadSheet.getSheetByName("user");

  if (!sheet) {
    sheet = spreadSheet.insertSheet();
    sheet.setName("user");
  }

  const lastRow = sheet.getLastRow();

  if (!lastRow) {
    sheet.appendRow(["타임스탬프", "성명", "전화번호", "주차"]);
  }

  if (Number(nowWeek) !== 1) {
    setNowWeek(timestamp, username, phone, nowWeek);
  } else {
    sheet.appendRow([timestamp, username, stringPhone, nowWeek]);
  }
}

function appendRowToSpreadSheet(sheetName, username, phone, titles, newRow) {
  const timestamp = getKoreanNowTime();

  const stringPhone = "'" + phone;

  let sheet = spreadSheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadSheet.insertSheet();
    sheet.setName(sheetName);
    sheet.appendRow(["타임스탬프", "성명", "전화번호", ...titles]);
  }

  const rowToAppend = [timestamp, username, stringPhone, ...newRow];

  sheet.appendRow(rowToAppend);
}

function getPreviousWeekFruitList(username, phone, nowWeek) {
  const previousWeek = Number(nowWeek - 1);

  //here: 직전 과일 목록을 얻어오는 sheet name이 변경될 경우 ${previousWeek}를 제외한 해당 이름을 변경해주세요.
  //ex) 현재 2주차 설문조사라면 이전 주차인 '1주차과일목록' 시트에서 과일목록을 가져옵니다.
  const previousWeekSheetName = `목표목록`;

  const sheet = spreadSheet.getSheetByName(previousWeekSheetName);

  if (!sheet) {
    return 0;
  }

  const userRange = sheet.getDataRange();
  const userData = userRange.getValues();

  let previousFruitList = null;
  let targetRow = -1;

  for (let i = 0; i < userData.length; i++) {
    if (userData[i][1] === username && userData[i][2] === phone) {
      previousFruitList = userData[i].slice(3);
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return [];
  }

  return previousFruitList;
}
