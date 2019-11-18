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

/* ------------------ State ------------------ */
let quizType = ''; // 선택한 퀴즈 카테고리
let quizScore = 0; // 선택한 퀴즈 스코어
let answer = ''; // 선택한 답
let quiz = {}; // 서버가 반환한 퀴즈 객체를 이 곳에 할당
let isPlaying = false; // 현재 퀴즈가 진행 중인지
let currentPoint = 50; // 페이지 로드 시 보유 포인트를 200으로 설정

// 문제 목록 - 서버가 응답한 문제를 parse하여 state로 보유
let problems = [];
let htmlProblems = [];
let cssProblems = [];
let jsProblems = [];

// 랭킹 테이블
let ranking = [];

/* ------------------ Function ------------------ */
// 랭킹 정보를 명예의 전당에 추가한다.
const renderRanking = () => {
  console.log(ranking);
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
  if (currentPoint - quizScore < 0) {
    quizScore = 0;
    $bettingPoint.textContent = quizScore;
    $currentPoint.textContent = currentPoint;
  } else {
    $currentPoint.textContent = currentPoint - quizScore;
    $bettingPoint.textContent = quizScore;
  }
};

// 선택 가능한 카테고리를 표시한다.
const renderCategory = () => {
  let html = '';

  problems.forEach((category, idx) => {
    const count = category.filter(problem => !problem.solved).length;
    const type = (idx === 0 ? 'html' : (idx === 1 ? 'css' : 'javascript'));

    if (count) {
      html += `<li class="category" id=${type}>
      <input type="radio" id="category${idx + 1}" name="main-card">
      <label for="category${idx + 1}">${type.toUpperCase()}</label>`;
    }
  });

  $categoryList.innerHTML = html;
};

// 선택 가능한 점수를 표시한다.
const renderScore = type => {
  let scoreCards = [];

  if (type === 'html') scoreCards = htmlProblems.map(p => p.point);
  else if (type === 'css') scoreCards = cssProblems.map(p => p.point);
  else scoreCards = jsProblems.map(p => p.point);

  scoreCards = scoreCards.reduce((pre, cur) => {
    if (pre.indexOf(cur) === -1) pre = [...pre, cur];
    return pre;
  }, []);

  scoreCards.sort((point1, point2) => point1 - point2);
  console.log(scoreCards);

  let html = '';

  scoreCards.forEach(point => {
    html += `<li class="score" id=${point}>
      <input type="radio" id="score${point}" name="point-card">
      <label for="score${point}">${point}</label>
    </li>`;
  });

  $scoreList.innerHTML = html;
};

// 카드에 모션을 추가하여 카드의 id 값을 반환한다.
const flipCard = target => {
  target.nextElementSibling.classList.toggle('active');

  return target.parentNode.id;
};

// 퀴즈 객체의 description 프로퍼티 내 특정 문자열을 html entity로 변환한다.
const replaceDescription = p => {
  const indent = / {2}/g;
  const newLine = /\n/g;
  const greaterThan = />/g;
  const lessThan = /</g;

  return p.replace(indent, '&nbsp;&nbsp;').replace(greaterThan, '&gt;').replace(lessThan, '&lt;').replace(newLine, '</br>');
};

// 스크롤을 최하단으로 위치시킨다.
const scrollDown = () => {
  window.scrollTo({
    // How to get the bottom Y coordinate?
    top: 1000,
    left: 0,
    behavior: 'smooth'
  });
};

// 퀴즈를 생성한다.
const renderQuiz = () => {
  let problem = quizType === 'html' ? htmlProblems : (quizType === 'css' ? cssProblems : jsProblems);
  problem = problem.filter(q => !q.solved && q.point === 50);
  const random = Math.floor(Math.random() * problem.length);
  problem = problem[random];
  const replacedDescription = replaceDescription(problem.description);

  $quizWrapper.innerHTML = `
    <h3 class="quiz-heading">${problem.category} ${problem.point}점 문제</h3>
    <h4>${problem.question}</h4>
    <p class="quiz-description">${replacedDescription}</p>`;

  let choiceList = '';
  problem.choice.forEach((choice, idx) => {
    choiceList += `
    <li class="choice">
      <input type="radio" id="choice-${idx + 1}" name="choice">
      <label for="choice-${idx + 1}">${choice}</label>
    </li>`;
  });

  $choiceList.innerHTML = choiceList;
  $quizPrompt.style.display = 'block';
  scrollDown();
};

/* ------------------ Event Binding ------------------ */
window.onload = async () => {
  try {
    // 명예의 전당 정보 요청 및 표시
    ranking = await fetch(`${URL}/ranking`).then(rank => rank.json());
    renderRanking();

    // 문제 목록 요청 및 표시
    problems = await fetch(`${URL}/problems`).then(problems => problems.json());
    // 문제를 카테고리 별로 분류
    htmlProblems = problems[0];
    cssProblems = problems[1];
    jsProblems = problems[2];
    renderCategory();

    // 스코어 보드 표시
    renderPoint();
  } catch (e) {
    console.log(e);
  }
};

$categoryList.onchange = ({ target }) => {
  if (target.classList.contains('category')) return;

  quizType = flipCard(target);
  quizScore = 0;

  renderPoint();
  renderScore(quizType);
};

$scoreList.onchange = ({ target }) => {
  if (target.classList.contains('score')) return;

  quizScore = +flipCard(target);

  if (quizScore > currentPoint) {
    $scoreError.style.display = 'block';
    $quizStart.style.display = 'none';
  } else {
    $quizStart.style.display = 'block';
    $scoreError.style.display = 'none';
  }

  renderPoint();
};

$quizStart.onclick = ({ target }) => {
  if (!quizType || !quizScore) {
    $selectError.style.display = 'block';
    return;
  }
  $selectError.style.display = 'none';
  $quizCategory.style.display = 'none';
  $quizScore.style.display = 'none';
  target.style.display = 'none';
  renderQuiz();
};
