const problem = {
  id: 1,
  category: "HTML",
  point: 50,
  question: `<h4>아래 코드의 실행 결과는 무엇인가요?</h4>`,
  description: `<code>
    String.prototype.getPizza = () => {</br>
      &nbsp;return 'pizza already';</br>
    };</br>
  </br>
    const name = 'Lee';</br>
  </br>
    console.log(name.getPizza());</br>
  </br>
  </code>`,
  choice: [
    "undefined",
    "TypeError: not a function",
    "SyntaxError",
    "pizza already!"
  ],
  answer: "pizza already!"
};

// 퀴즈 제목 삽입
const $quizWrapper = document.querySelector('.quiz-wrapper');
$quizWrapper.innerHTML = problem.question + $quizWrapper.innerHTML;

// 퀴즈 삽입
const $quiz = document.querySelector('.quiz-description');
$quiz.innerHTML += problem.description;

// 보기 삽입
const $choiceList = document.querySelector('.choice-list');
let html = '';
problem.choice.forEach((choice, idx) => {
  html += `<li class="choice">
    <input type="radio" id="choice-${idx + 1}" name="choice">
    <label for="choice-${idx + 1}">${choice}</label>
  </li>`;
});
$choiceList.innerHTML = html;

// 정답 확인
// [...$choiceList.children].forEach($li => {
//   const answer = $li.lastElementChild.textContent;
//   if (answer === 특정 problem.answer && $li.firstElementChild.checked) 
// });