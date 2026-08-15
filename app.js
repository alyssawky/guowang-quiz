const STORAGE_KEY = "guowang-study-progress";


// ==================================================
// 工具：随机打乱数组
// ==================================================

function shuffleArray(array) {

    const newArray = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [
            newArray[i],
            newArray[j]
        ] = [
            newArray[j],
            newArray[i]
        ];
    }

    return newArray;
}


// ==================================================
// 读取学习进度
// ==================================================

function loadProgress() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    let savedProgress = {};

    if (saved) {

        try {

            savedProgress =
                JSON.parse(saved);

        } catch (error) {

            savedProgress = {};

        }
    }


    // 如果以后 plan.js 新增学习任务，
    // 自动把新任务加入学习进度
    studyPlan.forEach(task => {

        if (!(task.id in savedProgress)) {

            savedProgress[task.id] =
                task.defaultCompleted;

        }

    });


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedProgress)
    );


    return savedProgress;
}


let progress = loadProgress();


// ==================================================
// 保存学习进度
// ==================================================

function saveProgress() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
    );

}


// ==================================================
// 标记完成 / 取消完成
// ==================================================

function toggleTask(taskId) {

    progress[taskId] =
        !progress[taskId];

    saveProgress();

    render();

}


// ==================================================
// 显示学习计划
// ==================================================

function renderTasks() {

    const container =
        document.getElementById(
            "task-list"
        );


    container.innerHTML = "";


    studyPlan.forEach(task => {

        const completed =
            progress[task.id];


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "task-card";


        card.innerHTML = `

            <div class="task-info">

                <div class="task-module">
                    ${task.category} · ${task.module}
                </div>

                <div class="task-name">

                    ${completed ? "✓ " : ""}

                    ${task.name}

                </div>

                <div class="task-week">
                    ${task.week}
                </div>

            </div>


            <button
                class="${completed ? "completed" : ""}"
                onclick="toggleTask('${task.id}')"
            >

                ${
                    completed
                    ? "已完成"
                    : "标记完成"
                }

            </button>

        `;


        container.appendChild(card);

    });

}


// ==================================================
// 显示已解锁复习内容
// ==================================================

function renderReviewPool() {

    const container =
        document.getElementById(
            "review-list"
        );


    container.innerHTML = "";


    const unlockedTasks =
        studyPlan.filter(
            task => progress[task.id]
        );


    if (unlockedTasks.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                还没有已经解锁的复习内容

            </div>

        `;

        return;

    }


    unlockedTasks.forEach(task => {

        const questionCount =
            questions.filter(
                question =>
                    question.taskId ===
                    task.id
            ).length;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "review-card";


        card.innerHTML = `

            <strong>
                ${task.name}
            </strong>

            <span>

                ${task.category}
                ·
                ${task.module}

                ${
                    questionCount > 0
                    ? ` · ${questionCount} 道题`
                    : " · 暂无题目"
                }

            </span>

        `;


        container.appendChild(card);

    });

}


// ==================================================
// 顶部统计
// ==================================================

function renderSummary() {

    const completed =
        studyPlan.filter(
            task => progress[task.id]
        ).length;


    const reviewable =
        studyPlan.filter(task => {

            if (!progress[task.id]) {

                return false;

            }

            return questions.some(
                question =>
                    question.taskId ===
                    task.id
            );

        }).length;


    document
        .getElementById(
            "completed-count"
        )
        .textContent =
        completed;


    document
        .getElementById(
            "review-count"
        )
        .textContent =
        reviewable;


    document
        .getElementById(
            "total-count"
        )
        .textContent =
        studyPlan.length;

}


// ==================================================
// 复习系统状态
// ==================================================

let currentReviewQuestions = [];

let currentQuestionIndex = 0;


// 当前题目的随机选项顺序
let currentOptionOrder = [];


// ==================================================
// 建立本次复习题目
// ==================================================

function buildReviewQuestions() {

    const reviewQuestions = [];


    /*
        按 studyPlan 的顺序处理学习任务。

        这样：
        不同学习板块仍然按照计划顺序出现，

        但每个板块内部的题目会随机排列。
    */

    studyPlan.forEach(task => {

        // 没学过的内容直接跳过
        if (!progress[task.id]) {

            return;

        }


        // 找到这个学习任务对应的全部题目
        const taskQuestions =
            questions.filter(
                question =>
                    question.taskId ===
                    task.id
            );


        // 只随机这个板块内部的题目
        const shuffledTaskQuestions =
            shuffleArray(
                taskQuestions
            );


        reviewQuestions.push(
            ...shuffledTaskQuestions
        );

    });


    return reviewQuestions;
}


// ==================================================
// 开始复习
// ==================================================

function startReview() {

    currentReviewQuestions =
        buildReviewQuestions();


    currentQuestionIndex = 0;


    const quizArea =
        document.getElementById(
            "quiz-area"
        );


    if (
        currentReviewQuestions.length === 0
    ) {

        quizArea.innerHTML = `

            <div class="empty-message">

                当前还没有可以复习的题目

            </div>

        `;

        return;

    }


    renderQuestion();

}


// ==================================================
// 显示当前题目
// ==================================================

function renderQuestion() {

    const quizArea =
        document.getElementById(
            "quiz-area"
        );


    const question =
        currentReviewQuestions[
            currentQuestionIndex
        ];


    const task =
        studyPlan.find(
            task =>
                task.id ===
                question.taskId
        );


    // ----------------------------------------------
    // 随机选项
    // ----------------------------------------------

    const originalOptions =
        Object.entries(
            question.options
        );


    const shuffledOptions =
        shuffleArray(
            originalOptions
        );


    const displayLabels =
        ["A", "B", "C", "D"];


    /*
        originalKey：
        原题里的答案编号，
        用来判断真正的正确答案。

        displayKey：
        当前随机之后显示给你的 A/B/C/D。

        所以正确答案字母每次都可能变化。
    */

    currentOptionOrder =
        shuffledOptions.map(
            (
                [originalKey, value],
                index
            ) => {

                return {

                    originalKey:
                        originalKey,

                    displayKey:
                        displayLabels[index],

                    value:
                        value

                };

            }
        );


    const optionsHTML =
        currentOptionOrder
        .map(option => {

            return `

                <button
                    class="option-btn"
                    onclick="
                        checkAnswer(
                            '${option.originalKey}',
                            '${option.displayKey}'
                        )
                    "
                >

                    ${option.displayKey}.
                    ${option.value}

                </button>

            `;

        })
        .join("");


    quizArea.innerHTML = `

        <div class="task-card">

            <div style="width: 100%;">


                <div class="task-module">

                    ${task.category}
                    ·
                    ${task.module}

                </div>


                <div class="task-week">

                    ${task.name}

                </div>


                <p>

                    第
                    ${currentQuestionIndex + 1}
                    /
                    ${currentReviewQuestions.length}
                    题

                </p>


                <h3>

                    ${question.question}

                </h3>


                <div
                    style="
                        display: grid;
                        gap: 10px;
                        margin-top: 20px;
                    "
                >

                    ${optionsHTML}

                </div>


                <div
                    id="answer-feedback"
                    style="margin-top: 20px;"
                >
                </div>


            </div>

        </div>

    `;

}


// ==================================================
// 判断答案
// ==================================================

function checkAnswer(
    selectedOriginalKey,
    selectedDisplayKey
) {

    const question =
        currentReviewQuestions[
            currentQuestionIndex
        ];


    const feedback =
        document.getElementById(
            "answer-feedback"
        );


    // 找到用户选中的完整选项
    const selectedOption =
        currentOptionOrder.find(
            option =>
                option.originalKey ===
                selectedOriginalKey
        );


    // 找到当前随机排列后的正确选项
    const correctOption =
        currentOptionOrder.find(
            option =>
                option.originalKey ===
                question.answer
        );


    // 防止同一道题反复点击
    document
        .querySelectorAll(
            ".option-btn"
        )
        .forEach(button => {

            button.disabled = true;

        });


    // ----------------------------------------------
    // 回答正确
    // ----------------------------------------------

    if (
        selectedOriginalKey ===
        question.answer
    ) {

        feedback.innerHTML = `

            <div class="review-card">


                <strong>

                    ✓ 回答正确

                </strong>


                <p>

                    正确答案：

                    ${correctOption.displayKey}.
                    ${correctOption.value}

                </p>


                <p>

                    ${question.explanation}

                </p>


                <button
                    onclick="nextQuestion()"
                >

                    下一题

                </button>


            </div>

        `;

    }


    // ----------------------------------------------
    // 回答错误
    // ----------------------------------------------

    else {

        feedback.innerHTML = `

            <div class="review-card">


                <strong>

                    ✕ 回答错误

                </strong>


                <p>

                    你的答案：

                    ${selectedDisplayKey}.
                    ${selectedOption.value}

                </p>


                <p>

                    正确答案：

                    ${correctOption.displayKey}.
                    ${correctOption.value}

                </p>


                <p>

                    ${question.explanation}

                </p>


                <button
                    onclick="nextQuestion()"
                >

                    下一题

                </button>


            </div>

        `;

    }

}


// ==================================================
// 下一题
// ==================================================

function nextQuestion() {

    currentQuestionIndex++;


    if (
        currentQuestionIndex >=
        currentReviewQuestions.length
    ) {

        document
            .getElementById(
                "quiz-area"
            )
            .innerHTML = `

                <div class="review-card">

                    <strong>

                        本次复习完成 ✓

                    </strong>


                    <p>

                        共完成
                        ${currentReviewQuestions.length}
                        道题。

                    </p>


                    <button
                        onclick="startReview()"
                    >

                        再复习一次

                    </button>

                </div>

            `;


        return;

    }


    renderQuestion();

}


// ==================================================
// 刷新页面内容
// ==================================================

function render() {

    renderTasks();

    renderReviewPool();

    renderSummary();

}


// ==================================================
// 网站启动
// ==================================================

render();


const startReviewButton =
    document.getElementById(
        "start-review-btn"
    );


if (startReviewButton) {

    startReviewButton.addEventListener(
        "click",
        startReview
    );

}
