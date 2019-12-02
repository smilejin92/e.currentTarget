// CONSTANT
const URL = 'http://localhost:5000';
const TYPE = ['html', 'css', 'javascript', 'random'];

// STATE
let category;
let point;
let question;
let description = '';
let choice = [];
let answer;

let htmlProblems = [];
let cssProblems = [];
let jsProblems = [];
let randomProblems = [];
let problems;
let create = false;

// DOM
const $htmlQuiz = document.querySelector('.htmlQuiz');
const $cssQuiz = document.querySelector('.cssQuiz');
const $jsQuiz = document.querySelector('.jsQuiz');
const $randomQuiz = document.querySelector('.randomQuiz');
const $categoryList = document.querySelector('.category-list');
const domList = [$htmlQuiz, $cssQuiz, $jsQuiz, $randomQuiz];
const $pointList = document.querySelector('.point-list');
const $post = document.querySelector('.post');
const $put = document.querySelector('.put');
const $question = document.querySelector('#question');
const $description = document.querySelector('#description');
const $choice = document.querySelector('.choice-list');
const $answer = document.querySelector('#answer');
const $create = document.querySelector('.create');
const $database = document.querySelector('.database');
const $quizWrapper = document.querySelector('.quiz-wrapper');

// FUNCTIONS
const getParentId = target => target.parentNode.id;

const getMaxId = idx => Math.max(0, ...problems[idx].map(p => p.id)) + 1;

const formatText = p => {
  const indent = / {2}/g;
  const newLine = /\n/g;
  const greaterThan = />/g;
  const lessThan = /</g;

  return p
    .replace(indent, '&nbsp;&nbsp;')
    .replace(greaterThan, '&gt;')
    .replace(lessThan, '&lt;')
    .replace(newLine, '</br>');
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

const renderQuiz = async () => {
  htmlProblems = await fetch(`${URL}/html`).then(p => p.json());
  cssProblems = await fetch(`${URL}/css`).then(p => p.json());
  jsProblems = await fetch(`${URL}/javascript`).then(p => p.json());
  randomProblems = await fetch(`${URL}/random`).then(p => p.json());
  problems = [htmlProblems, cssProblems, jsProblems, randomProblems];

  problems.forEach((cat, idx) => {
    let html = '';
    cat.forEach(p => {
      const id = p.id;
      const category = p.category;
      const question = p.question;
      const point = p.point;
      const description = p.description;

      // <button class="edit">Edit</button>

      html += `<li>
        <div id=${p.id} class=${p.category}>
          <h3>${p.id}. (${p.point}) ${p.question}</h3>
          <p>${formatText(p.description)}</p>
          <button class="remove">X</button>
        </div>
      </li>`;
    });
    domList[idx].innerHTML = html;
  });
};

const toggleScreen = () => {
  create = !create;
  $create.textContent = '문제 생성';
  addClass('hide', $quizWrapper);
  removeClass('hide', $database);
  renderQuiz();
};

const resetValue = () => {
  [...$categoryList.children].forEach($li => {
    $li.firstElementChild.checked = false;
  });

  [...$pointList.children].forEach($li => {
    $li.firstElementChild.checked = false;
  });

  $question.value = '';
  $description.value = '';
  $answer.value = '';
};

// EVENT BINDING
window.onload = () => {
  renderQuiz();
};

// 문제 목록, 문제 생성 버튼 toggle
$create.onclick = ({ target }) => {
  create = !create;

  target.textContent = create ? '문제 목록' : '문제 생성';

  $database.classList.toggle('hide', create);
  $quizWrapper.classList.toggle('hide', !create);

  // if (create) {
  //   addClass('hide', $database);
  //   removeClass('hide', $quizWrapper);
  // } else {
  //   removeClass('hide', $database);
  //   addClass('hide', $quizWrapper);
  // }
};

// 카테고리 선택
$categoryList.onchange = ({ target }) => {
  if (target.classList.contains('category')) return;

  category = getParentId(target);
  console.log(category);
};

// 포인트 선택
$pointList.onchange = ({ target }) => {
  if (target.classList.contains('point')) return;

  point = +getParentId(target);
  console.log(point);
};

// 문제 제목
$question.onkeyup = ({ target }) => {
  const text = target.value.trim();
  question = text;
  console.log(question);
};

// 문제 본문
$description.onkeyup = ({ target }) => {
  // const text = `${target.value}`;
  const text = target.value;
  description = text;
  console.log(description);
};

// 정답
$answer.onkeyup = ({ target }) => {
  const text = target.value.trim();
  answer = text;
  console.log(answer);
};

// 퀴즈 생성
$post.onclick = async () => {
  // 객관식 보기
  [...$choice.children].forEach($li => {
    const selected = $li.lastElementChild.value.trim();
    choice = [...choice, selected];
    $li.lastElementChild.value = ''; // resetValue()
  });

  const payload = {
    id: getMaxId(TYPE.indexOf(category)),
    category,
    point,
    question,
    description,
    choice,
    answer,
    solved: false
  };

  // ajax('POST', payload);
  await fetch(`${URL}/${category}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  resetValue();
  toggleScreen();
};

domList.forEach(dom => {
  dom.onclick = async ({ target }) => {
    try {
      if (target.classList.contains('remove')) { // delete
        const cat = target.parentNode.className;
        const id = +getParentId(target);
        await fetch(`${URL}/${cat}/${id}`, { method: 'DELETE' });
      }
      // } else if (target.classList.contains('edit')) { // put
      //   addClass('hide', $database, $post);
      //   addClass('disable', $categoryList);
      //   removeClass('hide', $quizWrapper, $put);
      //   $create.textContent = '문제 목록';
      //   create = !create;
  
      //   const quiz = await fetch(`${URL}/${cat}/${id}`).then(q => q.json());
      //   console.log(quiz);
  
      //   // 카테고리 설정
      //   [...$categoryList.children].forEach($li => {
      //     if ($li.id === quiz.category) {
      //       $li.firstElementChild.checked = true;
      //       category = quiz.category;
      //     }
      //   });
  
      //   // 포인트 설정
      //   [...$pointList.children].forEach($li => {
      //     if (+$li.id === quiz.point) {
      //       $li.firstElementChild.checked = true;
      //       point = quiz.point;
      //     }
      //   });
  
      //   // 제목 설정
      //   $question.value = quiz.question;
      //   question = quiz.question;
  
      //   // 본문 설정
      //   $description.value = quiz.description;
      //   description = quiz.description;
  
      //   // 보기 설정
      //   let list = [];
      //   [...$choice.children].forEach(($li, idx) => {
      //     $li.lastElementChild.value = quiz.choice[idx];
      //     list = [...list, quiz.choice[idx]];
      //     choice = list;
      //   });
  
      //   // 정답 설정
      //   $answer.value = quiz.answer;
      //   answer = quiz.answer;
      // }
      await renderQuiz();
    } catch (e) {
      console.log(e);
    }
  };
});

// $put.onclick = async () => {
//   // 페이로드 설정
//   const payload = {
//     point,
//     question,
//     description,
//     choice,
//     answer
//   };
//   await fetch(`${URL}/${category}/${id}`, {
//     method: 'PUT',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify(payload)
//   });
//   renderQuiz();
//   toggleScreen();
// };
