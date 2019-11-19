/* ------------------ CONSTANT ------------------ */
const URL = 'http://localhost:5000';

/* ------------------ DOM ------------------ */
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
const $quizPrompt = document.querySelector('.quiz-prompt');
const $quizWrapper = document.querySelector('.quiz-wrapper');
const $choiceList = document.querySelector('.choice-list');
const $submit = document.querySelector('.submit');
const $popup = document.querySelector('.popup');
const $timer = document.querySelector('.timer');
// const $popupCorrect = document.querySelector('.correct');
// const $popupWrong = document.querySelector('.wrong');
// const $popupHonor = document.querySelector('.honor');
// const $continue = document.querySelectorAll('.continue');
// const $quit = document.querySelectorAll('.quit');

/* ------------------ State ------------------ */
let category = ''; // 선택한 퀴즈 카테고리
let bettingPoint = 0; // 선택한 퀴즈 스코어
let submittedAnswer = ''; // 선택한 답
let quiz = {}; // 서버가 반환한 퀴즈 객체를 이 곳에 할당
let isPlaying = false; // 현재 퀴즈가 진행 중인지
let currentPoint = 50; // 페이지 로드 시 보유 포인트를 200으로 설정
// let evalPoint; bettingPoint > currentPoint;

let second;
let intervalId = 0;

// 문제 목록 - 서버가 응답한 문제를 parse하여 state로 보유
let problems = [];
let htmlProblems = [];
let cssProblems = [];
let jsProblems = [];

// 랭킹 정보
let ranking = [];

/* ------------------ Function ------------------ */
// 스크롤을 최하단으로 위치시킨다.
const scrollDown = () => {
  window.scrollTo({
    // How to get the bottom Y coordinate?
    top: 1000,
    left: 0,
    behavior: 'smooth'
  });
};

// 랭킹 정보를 명예의 전당에 추가한다.
const renderRanking = () => {
  // console.log(ranking);
  ranking.sort((user1, user2) => user2.score - user1.score);

  let html = '';
  ranking.forEach((user, idx) => {
    html += `<tr class="row user">
    <td class="rank">${idx + 1}</td>
    <td class="username">${user.username}</td>
    <td class="score">${user.score}</td>
    </tr>`;
  });
  $ranking.innerHTML += html;
};

// 보유 포인트/베팅 포인트를 표시한다.
const renderPoint = () => {
  const evalPoint = currentPoint - bettingPoint < 0;

  bettingPoint = evalPoint ? 0 : bettingPoint;
  $bettingPoint.textContent = evalPoint ? 0 : bettingPoint;
  $currentPoint.textContent = evalPoint ? currentPoint : currentPoint - bettingPoint;
};

// 팝업 표시 -- 수정 필요
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
      계속 진행하시겠습니까?</p>
      <div class="btn-group">
        <button class="continue">YES</button>
        <button class="quit">NO</button>
        <button class="double-down">Double Down</button>
      </div>`;
  } else if (type === 'allin') {
    html = `<p>오답입니다.<br>
    포인트를 모두 소진하였습니다.<br>
    분발하세요.</p>
    <div class="btn-group">
      <button class="allin">OK</button>
    </div>`;
  } else if (type === 'congrat') {
    html = `<p> 축하합니다! 모든 문제를 완료했습니다.</br>
    최종 포인트는 ${currentPoint}포인트 입니다.</br>
      명예의 전당에 등록하시겠습니까?</p>
      <div class="btn-group">
        <button class="honor-continue">YES</button>
        <button class="honor-quit">NO</button>
      </div>`;
  } else {
    html = `<p>최종 포인트는 ${currentPoint}포인트 입니다.</br>
      명예의 전당에 등록하시겠습니까?</p>
      <div class="btn-group">
        <button class="honor-continue">YES</button>
        <button class="honor-quit">NO</button>
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
    const type = idx === 0 ? 'html' : (idx === 1 ? 'css' : 'javascript');

    if (count) {
      html += `<li class="category" id=${type}>
      <input type="radio" id="category${idx + 1}" name="main-card">
      <label for="category${idx + 1}">${type.toUpperCase()}</label>`;
    }
  });

  if (!html) popup('congrat');
  $categoryList.innerHTML = html;
};

// 선택 가능한 점수를 표시한다.
const renderScore = type => {
  let scoreCards = [];

  // 전달된 type(카테고리)의 문제를 scoreCards에 할당
  scoreCards = type === 'html' ? htmlProblems : (type === 'css' ? cssProblems : jsProblems);

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

// 카드에 모션을 추가하여 카드의 id 값을 반환한다.
const flipCard = target => {
  target.nextElementSibling.classList.toggle('active');

  return target.parentNode.id;
};

// 퀴즈 객체의 qustion과 description 프로퍼티 내 특정 문자열을 html entity로 변환한다.
const formatText = p => {
  const indent = / {2}/g;
  const newLine = /\n/g;
  const greaterThan = />/g;
  const lessThan = /</g;

  return p.replace(indent, '&nbsp;&nbsp;').replace(greaterThan, '&gt;').replace(lessThan, '&lt;').replace(newLine, '</br>');
};

// 시간을 표시한다
const displayTime = () => {
  $timer.textContent = `00:${(second + '').length > 1 ? second : '0' + second}`;
};

// 타이머를 실행한다
const decreaseSecond = () => {
  second -= 1;

  displayTime();

  if (!second) {
    bettingPoint = 0;
    quiz.solved = true;

    clearInterval(intervalId);
    popup(!currentPoint ? 'allin' : 'wrong');
    renderPoint();
  }
};

// 퀴즈를 생성한다.
const renderQuiz = () => {
  let problem = category === 'html' ? htmlProblems : (category === 'css' ? cssProblems : jsProblems);
  problem = problem.filter(q => !q.solved && q.point === bettingPoint);

  const random = Math.floor(Math.random() * problem.length);

  quiz = problem[random];
  second = 30;

  const formattedQuestion = formatText(quiz.question);
  const formattedDescription = formatText(quiz.description);

  $quizWrapper.innerHTML = `
    <h3 class="quiz-heading">${quiz.category.toUpperCase()} ${quiz.point}점 문제</h3>
    <h4>${formattedQuestion}</h4>
    <p class="quiz-description">${formattedDescription}</p>`;

  let choiceList = '';
  quiz.choice.forEach((choice, idx) => {
    choiceList += `
    <li class="choice">
      <input type="radio" id="choice-${idx + 1}" name="choice">
      <label for="choice-${idx + 1}">${choice}</label>
    </li>`;
  });

  $choiceList.innerHTML = choiceList;
  $timer.textContent = `00:${second}`;

  $quizPrompt.classList.remove('hide');
  intervalId = setInterval(decreaseSecond, 1000);
  scrollDown();
};

// 사용자가 제출한 답을 반환한다.
const getAnswer = () => {
  let res = '';
  [...$choiceList.children].forEach($li => {
    if ($li.firstElementChild.checked) res = $li.lastElementChild.textContent;
  });

  return res;
};

// toggle hide on quiz start btn & select error
// const toggleHide = domArr => {
const toggleHide = (domArr, test) => {
  domArr.forEach(dom => {
    dom.classList.toggle('hide', test);
    // console.log(dom);
  });
};

const addHide = domArr => {
  domArr.forEach(dom => {
    dom.classList.add('hide');
  });
};

const removeHide = domArr => {
  domArr.forEach(dom => {
    dom.classList.remove('hide');
  });
};

/* ------------------ Event Binding ------------------ */
window.onload = async () => {
  try {
    // 명예의 전당 정보 요청 및 표시
    ranking = await fetch(`${URL}/ranking`).then(rank => rank.json());
    renderRanking();

    // 문제 목록 요청 및 표시
    // 문제를 카테고리 별로 분류
    problems = await fetch(`${URL}/problems`).then(problems => problems.json());
    [htmlProblems, cssProblems, jsProblems] = problems;
    renderCategory();

    // 스코어 보드 표시
    renderPoint();
  } catch (e) {
    console.error(e);
  }
};

// 페이지 리로드 시 팝업
window.onbeforeunload = () => '';

// 카테고리 선택
$categoryList.onchange = ({ target }) => {
  if (target.classList.contains('category')) return;

  category = flipCard(target);
  bettingPoint = 0;

  // $quizStart에 hide 클래스를 삭제하고,
  // $scoreError에 hide 클래스를 추가한다.
  removeHide([$quizStart]);
  addHide([$scoreError]);

  renderPoint();
  renderScore(category);
};

// 스코어 선택
$scoreList.onchange = ({ target }) => {
  if (target.classList.contains('score')) return;

  bettingPoint = +flipCard(target);

  toggleHide([$quizStart, $scoreError], currentPoint < bettingPoint);

  // if (currentPoint < bettingPoint) {
  //   addHide([$quizStart]);
  //   removeHide([$scoreError]);
  // } else {
  //   addHide([$scoreError]);
  //   removeHide([$quizStart]);
  // }

  renderPoint();
};

// 퀴즈 스타트
$quizStart.onclick = ({ target }) => {
  if (!category || !bettingPoint) {
    $selectError.classList.remove('hide');
    return;
  }
  $submit.classList.remove('disable');
  $choiceList.classList.remove('disable');
  isPlaying = true;
  currentPoint -= bettingPoint;

  $choiceList.classList.remove('hide');
  $submit.classList.remove('hide');

  $selectError.classList.add('hide');
  $quizCategory.classList.add('hide');
  $quizScore.classList.add('hide');
  target.classList.add('hide');
  renderQuiz();
};

$submit.onclick = () => {
  // currentPoint -= quizPoint;
  isPlaying = false;

  // better idea?
  $submit.classList.add('disable');
  $choiceList.classList.add('disable');

  submittedAnswer = getAnswer();
  // 정답일 경우
  // console.log(submittedAnswer);
  clearInterval(intervalId);
  // isPlaying = false;

  if (submittedAnswer === quiz.answer) {
    popup('correct');

    // 포인트 추가
    currentPoint = bettingPoint * 2 + currentPoint;
    // yes -> set category, score, start as block
    // no -> popup honor
  }
  // 오답일 경우
  else {
  //   if (!currentPoint) popup('allin');
  //   else popup('wrong');
    popup(currentPoint === 0 ? 'allin' : 'wrong');
    // 포인트 차감 (already done)
    // yes or no?
  }
  bettingPoint = 0;
  quiz.solved = true;
  // console.log(quiz.solved);
  // console.log(htmlProblems);
  // console.log(category);
  renderPoint();
};

$popup.onclick = ({ target }) => {
  const btn = target.classList;
  if (!btn.contains('continue')
      && !btn.contains('quit')
      && !btn.contains('allin')
      && !btn.contains('honor-continue')
      && !btn.contains('honor-quit')) return;

  if (btn.contains('continue')) {
    $quizCategory.classList.remove('hide');
    $quizScore.classList.add('hide');
    $quizStart.classList.remove('hide');
    $quizPrompt.classList.add('hide');
    $popup.classList.add('hide');
    renderCategory();
  } else if (btn.contains('quit')) {
    console.log('quit');
    popup('honor');
  } else if (btn.contains('allin')) {
    // show restart button
    // 1. 팝업을 없앤다.
    // 2. start 버튼이 아닌 restart 버튼을 표시한다.
    // 3. restart 버튼을 누르면 상태를 초기화 시킨다.
    // 3. restart 버튼을 누르면 페이지가 리로드된다.
    console.log('all-in');
  } else if (btn.contains('honor-continue')) {
    console.log('honor-continue');
  } else if (btn.contains('honor-quit')) {
    console.log('honor-quit');
  }
};
