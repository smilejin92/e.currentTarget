/* ------------------ State ------------------ */ 
let quizType = ''; // 선택한 퀴즈 카테고리
let quizScore = 0; // 선택한 퀴즈 스코어
let answer = ''; // 선택한 답
let quiz = {}; // 서버가 반환한 퀴즈 객체를 이 곳에 할당
let isPlaying = false; // 현재 퀴즈가 진행 중인지
let currentPoint = 200; // 페이지 로드 시 보유 포인트를 200으로 설정

/* ------------------ DOM Objects ------------------ */
const $currentPoint = document.querySelector('.current-point');
const $bettingPoint = document.querySelector('.betting-point');
const $quizCategory = document.querySelector('.quiz-category');
const $categoryList = document.querySelector('.category-list');
const $quizScore = document.querySelector('.quiz-score');
const $scoreList = document.querySelector('.score-list');
const $quizStart = document.querySelector('.quiz-start');
const $error = document.querySelector('.error');
const $quizPrompt = document.querySelector('.quiz-prompt');
const $quizWrapper = document.querySelector('.quiz-wrapper');
const $choiceList = document.querySelector('.choice-list');
const $timer = document.querySelector('.timer');
const $submit = document.querySelector('.submit');
const $popupCorrect = document.querySelector('.correct');
const $popupWrong = document.querySelector('.wrong');
const $popupHonor = document.querySelector('.honor');

/* ------------------ Functions ------------------ */
// 선택한 카드에 active 클래스 추가
const flipCard = target => {
  target.nextElementSibling.classList.toggle('active');
  return target.parentNode.id;
}

// quiz.description을 인수로 전달 받아 '  '를 인덴트로,
// 개행 문자('\n')를 </br> 태그로 변환하여 반환
const replaceDescription = d => {
  const indent = /  /g;
  const newLine = /\n/g;

  return d.replace(indent, '&nbsp;&nbsp;').replace(newLine, '</br>');
};

// 문제 생성 시 화면 최하단으로 스크롤 다운
// todo 1: top 속성에 화면의 Y 좌표 중 최하단을 취득하여 할당
const scrollDown = () => {
  window.scrollTo({
    // How to get the bottom Y coordinate?
    top: 1000,
    left: 0,
    behavior: 'smooth'
  });
};

// quiz 상태를 서버가 반환한 퀴즈 객체 q로 변경 후 화면에 그린다.
const renderQuiz = q => {
  quiz = q;
  // console.log(quiz);
  const replacedDescription = replaceDescription(q.description);
  $quizWrapper.innerHTML = `
    <h3 class="quiz-heading">${q.category} ${q.point}점 문제</h3>
    <h4>${q.question}</h4>
    <p class="quiz-description">${replacedDescription}</p>`;

  let choiceList = '';
  q.choice.forEach((choice, idx) => {
    choiceList += `
    <li class="choice">
      <input type="radio" id="choice-${idx + 1}" name="choice">
      <label for="choice-${idx + 1}">${choice}</label>
    </li>`;
  });
  $choiceList.innerHTML = choiceList;
  scrollDown();
};

/* ------------------ Event Handler ------------------ */
// quizType 상태를 선택된 카테고리로 설정 
$categoryList.onchange = ({ target }) => {
  if (target.classList.contains('category')) return;
  quizType = flipCard(target);
  // console.log(quizType);
};

// quizScore 상태를 선택된 점수로 설정, currentPoint와 bettingPoint 갱신
$scoreList.onchange = ({ target }) => {
  if (target.classList.contains('score')) return;
  quizScore = +flipCard(target);
  // todo 0: 만약 currentPoint를 초과하는 quizScore를 선택할 경우 에러 메시지 출력
  $currentPoint.textContent = `${currentPoint - quizScore}`;
  $bettingPoint.textContent = `${quizScore}`;
  // console.log(quizScore);
};

// 퀴즈 실행
$quizStart.onclick = ({ target }) => {
  // 1. 퀴즈 카테고리 혹은 점수를 선택하지 않았으면 에러 메시지를 표시한다.
  if (!quizType || !quizScore) {
    $error.style.display = 'block';
    return;
  }

  isPlaying = true; // 2. isPlaying 상태를 true 변경, 아직 어디에 쓰일 지 모름.
  $error.style.display = 'none'; // 3. error 메시지를 display: none 처리한다.

  // 4. json-server에 quizType과 quizScore 상태에 해당하는 문제를 요청한다.
  fetch('http://localhost:5000/problems/1')
    .then(problem => problem.json())
  // 5. 요청한 데이터(문제)를 문제 출제 영역에 innerHTML로 삽입한다.
    .then(parsedProblem => renderQuiz(parsedProblem))
    .catch(console.error);
  
  // 6. 문제가 끝나기 전까지는 카테고리/점수 선택 영역 및 start 버튼을 숨김 처리한다.
  // todo 2: 더 좋은 방법이 있는지?
  target.style.display = 'none';
  $quizCategory.style.display = 'none';
  $quizScore.style.display = 'none';

  // 7. 문제 출제 영역을 표시한다.
  $quizPrompt.style.display = 'block';
};

// answer 상태를 사용자가 선택한 보기로 설정
$choiceList.onchange = ({ target }) => {
  if (target.classList.contains('choice')) return;
  answer = target.nextElementSibling.textContent;
  // console.log(answer);
};

// 정답을 제출하면 정답/오답 상태에 따라 팝업을 표시한다.
$submit.onclick = () => {
  // 1. 사용자가 선택한 답안이 quiz 상태의 answer 프로퍼티와 일치하면
  if (answer === quiz.answer) {
    // 1.1 correct popup을 표시한다.
    $popupCorrect.style.display = 'block';
    // todo 3: 포인트 추가
    // todo 4: quiz 상태의 solved 프로퍼티를 true로 변경
    // quiz 객체에는 solved 프로퍼티가 없지만, 아마 필요할 것 같음.
    // solved가 true이면 다음 라운드에 출제되지 않아야하기 때문.
    // todo 5: patch 메소드로 서버에 현재 quiz 객체의 solved 프로퍼티를 true로 변경. 단, DB에서 모든 문제를 index.js에 불러놓고 시작하는 경우 이 과정은 생략 가능.
  }
  else $popupWrong.style.display = 'block';
};

// todo 6: correct popup 안의 각 버튼별 이벤트 처리
// todo 7: wrong popup 안의 각 버튼별 이벤트 처리
// todo 8: honor popup 안의 각 버튼별 이벤트 처리
// todo 9: honor popup 안에서 yes를 선택한 경우,
// Username을 입력 받을 input 영역이 필요함. 또한 서버에 post 메소드로
// Username과 최종 스코어를 전달해야하므로 이 두 가지 데이터를 담을 DB도 필요함.

// 현재 내 json-server의 db.json에 담겨 있는 데이터
// {
//   "problems": [
//     {
//       "id": 1,
//       "category": "Javascript",
//       "point": 50,
//       "question": "아래 코드의 실행 결과는?",
//       "description": "<code>const Animal = (function () {\n  let _animal = '';\n  function Animal(name) {\n    _animal = name;\n  }\n  \n  Animal.prototype.bark = function () {\n    console.log(`${_animal} says WOOF!`);\n  }\n  return Animal;\n}());\n\nconst doggy = new Animal('doggy');\ndoggy.bark();</code>",
//       "choice": [
//         "doggy says WOOF!",
//         "SyntaxError",
//         "undefined",
//         "referenceError"
//       ],
//       "answer": "doggy says WOOF!"
//     }
//   ]
// }