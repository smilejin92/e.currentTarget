/* -------------------------- CONSTANT -------------------------- */
const URL = 'http://localhost:5000';

/* -------------------------- DOM -------------------------- */
const $database = document.querySelector('.database');
const $postArea = document.querySelector('.post-area');
const $htmlList = document.querySelector('#html-list');
const $cssList = document.querySelector('#css-list');
const $javascriptList = document.querySelector('#javascript-list');
const $randomList = document.querySelector('#random-list');
const $categoryList = document.querySelector('.category-list');
const $pointList = document.querySelector('.point-list');
const $question = document.querySelector('#question');
const $description = document.querySelector('#description');
const $choiceList = document.querySelector('.choice-list');
const $answer = document.querySelector('#answer');
const $postError = document.querySelector('.post-error');
const $toggleScreen = document.querySelector('.toggle-screen');
const $post = document.querySelector('.post');
const $patch = document.querySelector('.patch');

const problemList = [$htmlList, $cssList, $javascriptList, $randomList];

/* -------------------------- State -------------------------- */
const newProblem = (() => {
  let _category = '';
  let _point = 0;
  let _question = '';
  let _description = '';
  let _choiceList = [];
  let _answer = '';

  $categoryList.onchange = ({ target }) => {
    if (target.classList.contains('category')) return;
    _category = target.parentNode.id;
    // console.log(_category);
  };

  $pointList.onchange = ({ target }) => {
    if (target.classList.contains('point')) return;
    _point = +target.parentNode.id;
    // console.log(_point);
  };

  $question.onkeyup = ({ target }) => {
    _question = target.value.trim();
    // console.log(_question);
  };

  $description.onkeyup = ({ target }) => {
    _description = target.value.trim();
    // console.log(_description);
  };

  $choiceList.onkeyup = () => {
    let tempChoiceList = [];
    [...$choiceList.children].forEach($choice => {
      tempChoiceList = [...tempChoiceList, $choice.firstElementChild.value.trim()];
    });
    _choiceList = tempChoiceList;
    // console.log(_choiceList);
  };

  $answer.onkeyup = ({ target }) => {
    _answer = target.value.trim();
    // console.log(_answer);
  };

  return {
    getCategory() {
      return _category;
    },
    setCategory(cat) {
      _category = cat;
      return _category;
    },
    getPoint() {
      return _point;
    },
    setPoint(pt) {
      _point = pt;
      return _point;
    },
    getQuestion() {
      return _question;
    },
    setQuestion(text) {
      _question = text;
      return _question;
    },
    getDescription() {
      return _description;
    },
    setDescription(text) {
      _description = text;
      return _description;
    },
    getChoiceList() {
      return _choiceList;
    },
    setChoiceList(arr) {
      _choiceList = arr;
      return _choiceList;
    },
    getAnswer() {
      return _answer;
    },
    setAnswer(text) {
      _answer = text;
      return _answer;
    }
  };
})();

let id;

/* -------------------------- FUNCTION -------------------------- */
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

const renderProblems = async () => {
  try {
    const htmlProblems = await fetch(`${URL}/html`).then(list => list.json());
    const cssProblems = await fetch(`${URL}/css`).then(list => list.json());
    const jsProblems = await fetch(`${URL}/javascript`).then(list => list.json());
    const randomProblems = await fetch(`${URL}/random`).then(list => list.json());
    const database = [htmlProblems, cssProblems, jsProblems, randomProblems];

    database.forEach((problems, idx) => {
      let html = '';
      problems.forEach(p => {
        html += `<li class="problem" id=${p.id}>
        <div class="problem-wrapper">
          <h3 class="heading">${p.id}. ${formatText(p.question)} (${p.point}점) 답:${p.answer}</h3>
          <p class="description">${formatText(p.description)}</p>
          <button class="remove">삭제</button>
          <button class="edit">수정</button>
        </div>
      </li>`;
      });
      problemList[idx].innerHTML = html;
    });
  } catch (e) {
    console.error(e);
  }
};

const fillData = p => {
  // 카테고리 선택 후 disable 클래스 추가
  [...$categoryList.children].forEach($category => {
    if ($category.id === p.category) {
      $category.firstElementChild.checked = true;
      newProblem.setCategory($category.id);
    }
  });
  $categoryList.classList.add('disable');

  // 포인트 선택
  [...$pointList.children].forEach($point => {
    if (+$point.id === p.point) {
      $point.firstElementChild.checked = true;
      newProblem.setPoint(+$point.id);
    }
  });

  // $question.value = p.question;
  // $description.value = p.description;
  $question.value = newProblem.setQuestion(p.question); // 문제 제목
  $description.value = newProblem.setDescription(p.description); // 문제 본문

  // 객관식 보기
  [...$choiceList.children].forEach(($choice, idx) => {
    $choice.firstElementChild.value = p.choice[idx];
  });
  newProblem.setChoiceList(p.choice);

  // $answer.value = p.answer;
  $answer.value = newProblem.setAnswer(p.answer); // 정답
};

const resetState = () => {
  newProblem.setCategory('');
  newProblem.setPoint(0);
  newProblem.setQuestion('');
  newProblem.setDescription('');
  newProblem.setChoiceList([]);
  newProblem.setAnswer('');

  $categoryList.classList.remove('disable');

  [...$categoryList.children].forEach($category => {
    $category.firstElementChild.checked = false;
  });

  [...$pointList.children].forEach($point => {
    $point.firstElementChild.checked = false;
  });

  $question.value = '';
  $description.value = '';
  $answer.value = '';

  [...$choiceList.children].forEach($choice => {
    $choice.firstElementChild.value = '';
  });  
};

/* -------------------------- Event Binding -------------------------- */
window.onload = () => {
  renderProblems();
};

// 문제 추가 버튼을 클릭하면 문제 추가 양식을 표시한다.
// 이전 버튼을 클릭하면 문제 DB 목록을 표시한다.
$toggleScreen.onclick = ({ target }) => {
  if (target.textContent === '문제 추가') {
    $database.classList.add('hidden');
    target.textContent = '이전';
    $postArea.classList.remove('hidden');
    $post.classList.remove('hidden');
    $patch.classList.add('hidden');
    resetState();
  } else {
    $database.classList.remove('hidden');
    target.textContent = '문제 추가';
    $postArea.classList.add('hidden');
    $post.classList.add('hidden');
    $patch.classList.add('hidden');
  }
};

// 새 문제 추가 시 미입력 항목이 있는지 확인
const validateProblem = () => {
  // 카테고리 선택 유무 확인
  let count = 0;
  [...$categoryList.children].forEach($category => {
    if ($category.firstElementChild.checked) count += 1;
  });

  if (!count) {
    $postError.textContent = '카테고리를 선택해주세요.';
    return false;
  }

  // 포인트 선택 유무 확인
  count = 0;
  [...$pointList.children].forEach($point => {
    if ($point.firstElementChild.checked) count += 1;
  });

  if (!count) {
    $postError.textContent = '포인트를 선택해주세요.';
    return false;
  }

  // 문제 제목 유무 확인
  if (!newProblem.getQuestion()) {
    $postError.textContent = '제목을 입력해주세요.';
    return false;
  }

  // 정답 유무 확인
  if (!newProblem.getAnswer()) {
    $postError.textContent = '정답을 입력해주세요.';
    return false;
  }

  // 객관식 보기 확인
  count = 0;
  newProblem.getChoiceList().forEach(choice => {
    if (!choice) count += 1;
  });

  if (count) {
    $postError.textContent = '보기를 모두 입력해주세요.';
    return false;
  }

  return true;
};

// 추가 버튼을 클릭하면 DB에 새로운 문제가 추가된다.
$post.onclick = async () => {
  if (!validateProblem()) {
    $postError.classList.remove('hidden');
    return;
  }

  try {
    // console.log('post');
    $postError.classList.add('hidden');
    const category = newProblem.getCategory();

    await fetch(`${URL}/${category}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        point: newProblem.getPoint(),
        question: newProblem.getQuestion(),
        description: newProblem.getDescription(),
        choice: newProblem.getChoiceList(),
        answer: newProblem.getAnswer(),
        solved: false
      })
    });

    renderProblems();
    $toggleScreen.textContent = '문제 추가';
    $postArea.classList.add('hidden');
    $post.classList.add('hidden');
    $database.classList.remove('hidden');
  } catch (e) {
    console.error(e);
  }
};

// 삭제 버튼을 클릭하면 DB에 해당 문제가 삭제된다.
// 수정 버튼을 클릭하면 수정 페이지로 이동한다.
problemList.forEach($ul => {
  $ul.onclick = async ({ target }) => {
    id = +target.parentNode.parentNode.id;
    let category = target.parentNode.parentNode.parentNode.id;
    category = category.substring(0, category.indexOf('-'));
    // console.log(id, category);

    if (target.className === 'remove') { // 삭제
      try {
        await fetch(`${URL}/${category}/${id}`, { method: 'DELETE' });
        renderProblems();
      } catch (e) {
        console.error(e);
      }
    } else if (target.className === 'edit') { // 수정
      $database.classList.add('hidden');
      $postError.classList.add('hidden');
      $toggleScreen.textContent = '이전';
      $postArea.classList.remove('hidden');
      $post.classList.add('hidden');
      $patch.classList.remove('hidden');

      try {
        const targetProblem = await fetch(`${URL}/${category}/${id}`).then(p => p.json());
        id = targetProblem.id;
        fillData(targetProblem);
      } catch (e) {
        console.error(e);
      }
    }
  };
});

$patch.onclick = async () => {
  if (!validateProblem()) {
    $postError.classList.remove('hidden');
    return;
  }

  try {
    await fetch(`${URL}/${newProblem.getCategory()}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
        point: newProblem.getPoint(),
        question: newProblem.getQuestion(),
        description: newProblem.getDescription(),
        choice: newProblem.getChoiceList(),
        answer: newProblem.getAnswer()
      })
    });

    renderProblems();
    $database.classList.remove('hidden');
    $postError.classList.remove('hidden');
    $toggleScreen.textContent = '문제 추가';
    $postArea.classList.add('hidden');
    $post.classList.remove('hidden');
    $patch.classList.add('hidden');
  } catch (e) {
    console.error(e);
  }
};
