/* ------------------------- CONSTANT ------------------------- */
const URL = 'http://localhost:5000';
const TYPE = ['html', 'css', 'javascript', 'random'];

// 각 난이도 별 포인트 및 제한시간(초)
const EASY = [1000, 30];
const NORMAL = [2500, 45];
const HARD = [5000, 60];
const EXTREME = [10000, 75];

/* ------------------------- DOM ------------------------- */
const $ranking = document.querySelector('.ranking');
const $currentPoint = document.querySelector('.current-point');
const $bettingPoint = document.querySelector('.betting-point');
const $quizCategory = document.querySelector('.quiz-category');
const $categoryList = document.querySelector('.category-list');
const $quizScore = document.querySelector('.quiz-score');
const $scoreList = document.querySelector('.score-list');
const $selectError = document.querySelector('.select-error');
const $scoreError = document.querySelector('.score-error');
const $quizStart = document.querySelector('.quiz-start');
const $quizRestart = document.querySelector('.quiz-restart');
const $quizPrompt = document.querySelector('.quiz-prompt');
const $quizHeading = document.querySelector('.quiz-heading');
const $quizQuestion = document.querySelector('.quiz-question');
const $quizDescription = document.querySelector('.quiz-description');
const $quizWrapper = document.querySelector('.quiz-wrapper');
const $choiceList = document.querySelector('.choice-list');
const $submit = document.querySelector('.submit');
const $popup = document.querySelector('.popup');
const $timer = document.querySelector('.timer');

/* ------------------------- State ------------------------- */
let currentPoint = 10000; // 페이지 로드 시 보유 포인트를 n으로 설정
let bettingPoint = 0; // 선택한 퀴즈 스코어

let category; // 선택한 퀴즈 카테고리
let quiz; // 선택한 퀴즈 카테고리와 스코어에 해당하는 문제
let submittedAnswer; // 선택한 답

let minute; // 풀이 제한 시간(분)
let second; // 풀이 제한 시간(초)
let intervalId; // 타이머를 실행시킨 테스크의 id

// 문제 목록
let htmlProblems; // html 문제
let cssProblems; // css 문제
let jsProblems; // js 문제
let randomProblems; // random 문제
let problems; // 전체 문제

let ranking; // 랭킹 목록

/* ------------------------- Function ------------------------- */

// 스크롤을 최하단으로 위치시킨다. -- 수정 필요
const scrollDown = () => {
  window.scrollTo({
    // How to get the bottom Y coordinate?
    top: 1000,
    left: 0,
    behavior: 'smooth'
  });
};

// 랭킹 목록에 추가될 사용자의 id 값을 반환한다.
const getMaxUserId = () => Math.max(0, ...ranking.map(user => user.id)) + 1;

// TOP 10 랭킹 목록을 명예의 전당에 표시한다.
const renderHonorBoard = () => {
  ranking = ranking.sort((user1, user2) => user2.score - user1.score)
    .filter((user, idx) => idx < 10);
  // console.log(ranking);

  let html = `<tr class="row">
    <th>Rank</th>
    <th>Username</th>
    <th>Score</th>
  </tr>`;

  ranking.forEach((user, idx) => {
    html += `<tr class="row user">
    <td class="rank">${idx + 1}</td>
    <td class="username">${user.username}</td>
    <td class="score">${user.score}</td>
    </tr>`;
  });

  $ranking.innerHTML = html;
};

// 보유 포인트/베팅 포인트를 스코어 보드에 표시한다.
const renderPoint = () => {
  const evalPoint = currentPoint - bettingPoint < 0;

  bettingPoint = evalPoint ? 0 : bettingPoint;
  $bettingPoint.textContent = evalPoint ? 0 : bettingPoint;
  $currentPoint.textContent = evalPoint ? currentPoint : currentPoint - bettingPoint;
};

// DOM의 classList에 className을 추가한다.
const addClass = (className, ...domArr) => {
  // console.log(domArr);
  domArr.forEach(dom => {
    dom.classList.add(className);
  });
};

// DOM의 classList에 className을 삭제한다.
const removeClass = (className, ...domArr) => {
  // console.log(domArr);
  domArr.forEach(dom => {
    dom.classList.remove(className);
  });
};

// 정답 제출 후 팝업을 표시한다. -- 리팩토링 가능한지?
const popup = type => {
  let html = '';

  if (type === 'correct') {
    html = `<p>정답입니다.<br>
      ${bettingPoint * 2}포인트를 획득하였습니다.<br>
      계속 진행하시겠습니까?</p>
      <div class="btn-group">
        <button class="continue">YES</button>
        <button class="quit">NO</button>
      </div>`;
  } else if (type === 'wrong') {
    html = `<p>오답입니다.<br>
      ${bettingPoint}포인트를 차감합니다.<br>
      계속 진행하시겠습니까?<br>
      정답: ${quiz.answer}</p>
      <div class="btn-group">
        <button class="continue">YES</button>
        <button class="quit">NO</button>
      </div>`;
  } else if (type === 'allin') {
    html = `<p>오답입니다.<br>
      포인트를 모두 소진하였습니다.<br>
      분발하세요.<br>
      정답: ${quiz.answer}</p>
      <div class="btn-group">
        <button class="allin">OK</button>
      </div>`;
  } else if (type === 'congrat') {
    addClass('disable', $quizStart);
    html = `<p> 축하합니다! 모든 문제를 완료했습니다.</br>
      최종 포인트는 ${currentPoint}포인트 입니다.</br>
      명예의 전당에 등록하시겠습니까?</p>
      <div class="btn-group">
        <button class="honor-continue">YES</button>
        <button class="honor-quit">NO</button>
      </div>`;
  } else if (type === 'honor') {
    html = `<p>최종 포인트는 ${currentPoint}포인트 입니다.</br>
      명예의 전당에 등록하시겠습니까?</p>
      <div class="btn-group">
        <button class="honor-continue">YES</button>
        <button class="honor-quit">NO</button>
      </div>`;
  } else {
    html = `<p>명예의 전당에 등록할 닉네임을 입력 후</br>
      엔터 키를 눌러주세요.</p>
      <div class="ranker">
        <input type="text" class="ranker-name">
      </div>`;
  }

  $popup.innerHTML = html;
  $popup.classList.remove('hide');
};

// 선택 가능한 카테고리를 표시한다.
const renderCategory = () => {
  let html = '';

  // 안풀린 문제를 보유하는 카테고리를 필터하여 화면에 출력한다.
  problems.forEach((catArr, idx) => {
    const count = catArr.filter(problem => !problem.solved).length;
    // const type = idx === 0 ? 'html' : (idx === 1 ? 'css' : 'javascript');
    const type = TYPE[idx];

    if (count) {
      html += `<li class="category" id=${type}>
      <input type="radio" id="category${idx + 1}" name="main-card">
      <label for="category${idx + 1}">${type.toUpperCase()}</label>`;
    }
  });

  if (!html) popup('congrat');
  $categoryList.innerHTML = html;
};

// 카테고리별 선택 가능한 점수를 표시한다.
const renderScore = catIdx => {
  let scoreCards = problems[catIdx];
  console.log(scoreCards);

  // 전달된 type(카테고리)의 문제를 scoreCards에 할당
  // scoreCards = cat === 'html' ? htmlProblems : (cat === 'css' ? cssProblems : jsProblems);

  // 풀리지 않은 문제를 필터하여
  // 포인트 프로퍼티만 추출한 후
  // 중복되지 않은 포인트만 scoreCards에 재할당한다.
  scoreCards = scoreCards.filter(p => !p.solved)
    .map(p => p.point)
    .reduce((pre, cur) => {
      if (pre.indexOf(cur) === -1) pre = [...pre, cur];
      return pre;
    }, [])
    .sort((score1, score2) => score1 - score2); // mutator
  // console.log(scoreCards);

  let html = '';
  scoreCards.forEach(point => {
    html += `<li class="score" id=${point}>
      <input type="radio" id="score${point}" name="point-card">
      <label for="score${point}">${point}</label>
    </li>`;
  });

  $scoreList.innerHTML = html;
  $quizScore.classList.remove('hide');

  scrollDown();
};

// 카드에 모션을 추가하며 카드의 id 값을 반환한다.
const flipCard = target => {
  target.nextElementSibling.classList.toggle('active');

  return target.parentNode.id;
};

// 퀴즈 객체의 qustion과 description 프로퍼티 내 특정 문자열을 html entity로 변환한다.
const formatText = text => {
  const indent = / {2}/g;
  const newLine = /\n/g;
  const greaterThan = />/g;
  const lessThan = /</g;

  return text
    .replace(indent, '&nbsp;&nbsp;')
    .replace(greaterThan, '&gt;')
    .replace(lessThan, '&lt;')
    .replace(newLine, '</br>');
};

// 타이머에 시간을 표시한다.
const displayTime = () => {
  // console.log(minute, second);
  $timer.textContent = `
  ${(minute + '').length > 1 ? minute : '0' + minute}:
  ${(second + '').length > 1 ? second : '0' + second}`;
};

// 타이머를 실행한다.
const runTimer = () => {
  if (second === 0 && minute > 0) {
    minute -= 1;
    second = 60;
  }

  if (!second) {
    quiz.solved = true;
    clearInterval(intervalId);
    popup(!currentPoint ? 'allin' : 'wrong');
    bettingPoint = 0;
    renderPoint();
  } else {
    second -= 1;
    displayTime();
  }
};

// 퀴즈를 생성한다.
const renderQuiz = catIdx => {
  // let problem = category === 'html' ? htmlProblems : (category === 'css' ? cssProblems : jsProblems);
  // problem = problem.filter(q => !q.solved && q.point === bettingPoint);
  const problem = problems[catIdx].filter(q => !q.solved && q.point === bettingPoint);
  const random = Math.floor(Math.random() * problem.length);

  quiz = problem[random];

  // 포인트별 제한 시간 설정
  if (quiz.point === EASY[0]) [, second] = EASY;
  else if (quiz.point === NORMAL[0]) [, second] = NORMAL;
  else if (quiz.point === HARD[0]) [, second] = HARD;
  else [, second] = EXTREME;

  minute = Math.floor(second / 60);
  second %= 60;

  // const formattedQuestion = formatText(quiz.question);
  // const formattedDescription = formatText(quiz.description);

  // 문제 생성
  // $quizWrapper.innerHTML = `
  //   <h3 class="quiz-heading">${quiz.category.toUpperCase()} ${quiz.point}점 문제</h3>
  //   <h4>${quiz.question}</h4>
  //   <p class="quiz-description">${quiz.description}</p>`;

  $quizHeading.textContent = `${quiz.category.toUpperCase()} ${quiz.point}점 문제`;
  $quizQuestion.textContent = quiz.question;
  $quizDescription.innerHTML = formatText(quiz.description);


  // 보기 생성
  let choiceList = '';
  quiz.choice.forEach((choice, idx) => {
    choiceList += `
    <li class="choice">
      <input type="radio" id="choice-${idx + 1}" name="choice">
      <label for="choice-${idx + 1}">${choice}</label>
    </li>`;
  });

  $choiceList.innerHTML = choiceList;
  $quizPrompt.classList.remove('hide');

  displayTime();
  intervalId = setInterval(runTimer, 100);
  scrollDown();
};

// 제출한 정답을 반환한다.
const getAnswer = () => {
  let res = '';
  [...$choiceList.children].forEach($li => {
    if ($li.firstElementChild.checked) res = $li.lastElementChild.textContent;
  });

  return res;
};

/* ------------------------- Event Binding ------------------------- */

// 페이지 로드 시 서버에 데이터를 요청하여
// 응답 받은 데이터를 상태에 저장한 후
// 브라우저에 표시한다.
window.onload = async () => {
  try {
    // fetch(`${URL}/problems`).then(res => res.json()).then(console.log);
    // 명예의 전당 정보 요청 및 표시
    ranking = await fetch(`${URL}/ranking`).then(rank => rank.json());
    // console.log(ranking);
    renderHonorBoard();

    // 문제 목록 요청
    // 문제를 카테고리 별로 분류
    // problems = await fetch(`${URL}/problems`).then(problems => problems.json());
    // [htmlProblems, cssProblems, jsProblems] = problems;
    htmlProblems = await fetch(`${URL}/html`).then(html => html.json());
    cssProblems = await fetch(`${URL}/css`).then(css => css.json());
    jsProblems = await fetch(`${URL}/javascript`).then(js => js.json());
    randomProblems = await fetch(`${URL}/random`).then(rnd => rnd.json());
    problems = [htmlProblems, cssProblems, jsProblems, randomProblems];
    console.log(problems);
    renderCategory();

    // 스코어 보드 표시
    renderPoint();
  } catch (e) {
    console.error(e);
  }
};

// 페이지 리로드 시 알림창
window.onbeforeunload = () => '';

// 카테고리 선택
$categoryList.onchange = ({ target }) => {
  if (target.classList.contains('category')) return;

  category = flipCard(target);
  bettingPoint = 0;

  removeClass('hide', $quizStart);
  addClass('hide', $scoreError, $selectError);

  renderPoint();
  renderScore(TYPE.indexOf(category));
};

// 스코어 선택
$scoreList.onchange = ({ target }) => {
  if (target.classList.contains('score')) return;

  bettingPoint = +flipCard(target);
  addClass('hide', $selectError);

  if (currentPoint < bettingPoint) {
    addClass('hide', $quizStart);
    removeClass('hide', $scoreError);
  } else {
    removeClass('hide', $quizStart);
    addClass('hide', $scoreError);
  }

  renderPoint();
};

// 퀴즈 시작
$quizStart.onclick = ({ target }) => {
  if (!category || !bettingPoint) {
    removeClass('hide', $selectError);
    return;
  }

  currentPoint -= bettingPoint;

  removeClass('disable', $submit, $choiceList);
  removeClass('hide', $submit, $choiceList);
  addClass('hide', $selectError, $quizCategory, $quizScore, target);
  renderQuiz(TYPE.indexOf(category));
};

// 답 제출
$submit.onclick = () => {
  clearInterval(intervalId);
  addClass('disable', $submit, $choiceList);

  submittedAnswer = getAnswer();

  if (submittedAnswer === quiz.answer) {
    popup('correct');
    currentPoint = bettingPoint * 2 + currentPoint;
  } else {
    popup(currentPoint === 0 ? 'allin' : 'wrong');
  }

  bettingPoint = 0;
  quiz.solved = true;

  renderPoint();
};

// 제출한 답의 상태에 따라 팝업을 표시
$popup.onclick = ({ target }) => {
  const btn = target.classList;
  if (!(btn.contains('continue')
      || btn.contains('quit')
      || btn.contains('allin')
      || btn.contains('honor-continue')
      || btn.contains('honor-quit'))) return;

  if (btn.contains('continue')) { // 계속 진행할 경우
    removeClass('hide', $quizCategory, $quizStart);
    addClass('hide', $quizScore, $quizPrompt, $popup);
    renderCategory();
  } else if (btn.contains('quit')) { // 종료할 경우 (currentPoint > 0)
    popup('honor');
  } else if (btn.contains('allin')) { // 종료할 경우 (currentPoint === 0)
    // 방법 1. 페이지를 리로드한다.
    // window.location.reload();


    // 방법 2. restart 버튼을 표시한다.
    // - 팝업을 없앤다.
    // - 카테고리 선택 영역과 스코어 선택 영역을 숨김 처리한다.
    // - start 버튼을 restart 버튼으로 대체한다.
    addClass('hide', $popup, $quizCategory, $quizScore, $quizStart, $quizPrompt);
    removeClass('hide', $quizRestart);
    currentPoint = 0;
    renderPoint();
    // - restart 버튼을 클릭하면
    //   - 모든 상태를 초기화한다.
  } else if (btn.contains('honor-continue')) { // 종료 후 명예의 전당에 등록할 경우
    popup('ranker');
  } else if (btn.contains('honor-quit')) { // 종료 후 명예의 전당에 등록하지 않을 경우
    // 방법 1. 페이지를 리로드한다.
    // window.location.reload();


    // 방법 2. restart 버튼을 표시한다.
    // - 팝업을 없앤다.
    // - 카테고리 선택 영역과 스코어 선택 영역을 숨김 처리한다.
    // - start 버튼을 restart 버튼으로 대체한다.
    addClass('hide', $popup, $quizCategory, $quizScore, $quizStart, $quizPrompt);
    removeClass('hide', $quizRestart);
    // - restart 버튼을 클릭하면
    //   - 모든 상태를 초기화한다.
    currentPoint = 0;
    renderPoint();
  }
};

// db.json에 ranking 테이블에 username, score를 추가한다.
$popup.onkeyup = async ({ target, keyCode }) => {
  const username = target.value.trim();
  if (!username || keyCode !== 13) return;
  // console.log(username);
  try {
    await fetch(`${URL}/ranking`, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ id: getMaxUserId(), username, score: currentPoint })
    });
    ranking = await fetch(`${URL}/ranking`).then(res => res.json());
    console.log(ranking);
    addClass('hide', $quizPrompt, $popup, $quizStart);
    removeClass('hide', $quizRestart);
    // window.location.reload();
    renderHonorBoard();
    // 숨길거 숨기고 보일거 보이고
    // restart 버튼
  } catch (e) {
    console.log(e);
  }
};

// restart 버튼을 클릭하면 페이지를 리로드한다.
$quizRestart.onclick = () => {
  window.onbeforeunload = null;
  window.location.reload();
};
