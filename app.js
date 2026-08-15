const STORAGE_KEY = "guowang-study-progress";
const ANSWER_HISTORY_KEY = "guowang-answer-history";


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


    // 如果以后 plan.js 增加新任务，
    // 自动补进去，不覆盖已有进度。

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
// 读取答题记录
// ==================================================

function loadAnswerHistory() {

    const saved =
        localStorage.getItem(
            ANSWER_HISTORY_KEY
        );


    if (!saved) {

        return {};

    }


    try {

        return JSON.parse(saved);

    } catch (error) {

        return {};

    }

}


let answerHistory =
    loadAnswerHistory();


// ==================================================
// 保存答题记录
// ==================================================

function saveAnswerHistory() {

    localStorage.setItem(
        ANSWER_HISTORY_KEY,
        JSON.stringify(answerHistory)
    );

}


// ==================================================
// 记录一道题的作答情况
// ==================================================

function recordAnswer(
    questionId,
    isCorrect
) {

    // 第一次做这道题时创建记录

    if (!answerHistory[questionId]) {

        answerHistory[questionId] = {

            attempts: 0,

            correct: 0,

            wrong: 0,

            lastCorrect: null,

            lastAnsweredAt: null

        };

    }


    const record =
        answerHistory[questionId];


    record.attempts++;


    if (isCorrect) {

        record.correct++;

    } else {

        record.wrong++;

    }


    record.lastCorrect =
        isCorrect;


    record.lastAnsweredAt =
        new Date().toISOString();


    saveAnswerHistory();

}


// ==================================================
// 标记学习任务完成 / 取消完成
// ==================================================

function toggleTask(taskId) {

    progress[taskId] =
        !progress[taskId];


    saveProgress();


    render();

}


// ==================================================
// 显示当前学习计划
// ==================================================

function renderTasks() {

    const container =
        document.getElementById(
            "task-list"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    studyPlan.forEach(task => {

        const completed =
            Boolean(progress[task.id]);


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "task-card";


        card.innerHTML = `

            <div class="task-info">

                <div class="task-module">

                    ${task.category}
                    ·
                    ${task.module}

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
// 显示已经解锁的复习内容
// ==================================================

function renderReviewPool() {

    const container =
        document.getElementById(
            "review-list"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const unlockedTasks =
        studyPlan.filter(
            task =>
                Boolean(
                    progress[task.id]
                )
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
// 显示错题本
// ==================================================

function renderWrongList() {

    const container =
        document.getElementById(
            "wrong-list"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    // 只要历史上错过至少一次，
    // 就进入错题本。

    const wrongQuestions =
        questions.filter(question => {

            const record =
                answerHistory[
                    question.id
                ];


            return Boolean(
                record &&
                Number(record.wrong) > 0
            );

        });


    if (wrongQuestions.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                暂时没有错题

            </div>

        `;

        return;
    }


    wrongQuestions.forEach(question => {

        const record =
            answerHistory[
                question.id
            ];


        const task =
            studyPlan.find(
                task =>
                    task.id ===
                    question.taskId
            );


        const attempts =
            Number(
                record.attempts || 0
            );


        const correct =
            Number(
                record.correct || 0
            );


        const wrong =
            Number(
                record.wrong || 0
            );


        const accuracy =
            attempts > 0

                ? Math.round(
                    correct /
                    attempts *
                    100
                )

                : 0;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "review-card";


        card.innerHTML = `

            <div style="width: 100%;">


                <div class="task-module">

                    ${
                        task
                            ? `${task.category} · ${task.module}`
                            : ""
                    }

                </div>


                <strong
                    style="
                        display: block;
                        margin-top: 8px;
                        line-height: 1.6;
                    "
                >

                    ${question.question}

                </strong>


                <div
                    style="
                        margin-top: 14px;
                        line-height: 1.9;
                    "
                >

                    <span>
                        做题次数：
                        ${attempts}
                    </span>

                    <br>


                    <span>
                        正确：
                        ${correct}
                    </span>

                    <br>


                    <span>
                        错误：
                        ${wrong}
                    </span>

                    <br>


                    <span>
                        正确率：
                        ${accuracy}%
                    </span>

                    <br>


                    <span>
                        最近一次：
                        ${
                            record.lastCorrect === true
                                ? "正确"
                                : record.lastCorrect === false
                                    ? "错误"
                                    : "暂无"
                        }
                    </span>

                </div>


            </div>

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
            task =>
                Boolean(
                    progress[task.id]
                )
        ).length;


    // 可复习：
    // 已经完成学习，并且题库里有题

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


    const completedElement =
        document.getElementById(
            "completed-count"
        );


    const reviewElement =
        document.getElementById(
            "review-count"
        );


    const totalElement =
        document.getElementById(
            "total-count"
        );


    if (completedElement) {

        completedElement.textContent =
            completed;

    }


    if (reviewElement) {

        reviewElement.textContent =
            reviewable;

    }


    if (totalElement) {

        totalElement.textContent =
            studyPlan.length;

    }

}


// ==================================================
// 当前复习状态
// ==================================================

let currentReviewQuestions = [];

let currentQuestionIndex = 0;

let currentOptionOrder = [];


// ==================================================
// 创建本次复习题目
// ==================================================

function buildReviewQuestions() {

    const reviewQuestions = [];


    /*
        规则：

        1. 未学习内容绝不出题。
        2. 不同学习板块按 plan.js 顺序。
        3. 同一学习板块内部随机出题。
    */

    studyPlan.forEach(task => {

        if (!progress[task.id]) {

            return;

        }


        const taskQuestions =
            questions.filter(
                question =>
                    question.taskId ===
                    task.id
            );


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


    if (!quizArea) {

        return;

    }


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


    if (!quizArea) {

        return;

    }


    const question =
        currentReviewQuestions[
            currentQuestionIndex
        ];


    if (!question) {

        return;

    }


    const task =
        studyPlan.find(
            task =>
                task.id ===
                question.taskId
        );


    // ==================================================
    // 随机排列选项
    // ==================================================

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

                    ${
                        task
                            ? `${task.category} · ${task.module}`
                            : ""
                    }

                </div>


                <div class="task-week">

                    ${
                        task
                            ? task.name
                            : ""
                    }

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
                    style="
                        margin-top: 20px;
                    "
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


    if (!question) {

        return;

    }


    const feedback =
        document.getElementById(
            "answer-feedback"
        );


    if (!feedback) {

        return;

    }


    const isCorrect =
        selectedOriginalKey ===
        question.answer;


    // ==================================================
    // 保存答题记录
    // ==================================================

    recordAnswer(
        question.id,
        isCorrect
    );


    // 立即刷新错题本

    renderWrongList();


    const selectedOption =
        currentOptionOrder.find(
            option =>
                option.originalKey ===
                selectedOriginalKey
        );


    const correctOption =
        currentOptionOrder.find(
            option =>
                option.originalKey ===
                question.answer
        );


    // 回答后锁定全部选项，
    // 避免同一道题被重复记录。

    document
        .querySelectorAll(
            ".option-btn"
        )
        .forEach(button => {

            button.disabled = true;

        });


    // ==================================================
    // 回答正确
    // ==================================================

    if (isCorrect) {

        feedback.innerHTML = `

            <div class="review-card">


                <strong>

                    ✓ 回答正确

                </strong>


                <p>

                    正确答案：

                    ${
                        correctOption
                            ? correctOption.displayKey
                            : ""
                    }.

                    ${
                        correctOption
                            ? correctOption.value
                            : ""
                    }

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


    // ==================================================
    // 回答错误
    // ==================================================

    else {

        feedback.innerHTML = `

            <div class="review-card">


                <strong>

                    ✕ 回答错误

                </strong>


                <p>

                    你的答案：

                    ${
                        selectedOption
                            ? selectedDisplayKey
                            : ""
                    }.

                    ${
                        selectedOption
                            ? selectedOption.value
                            : ""
                    }

                </p>


                <p>

                    正确答案：

                    ${
                        correctOption
                            ? correctOption.displayKey
                            : ""
                    }.

                    ${
                        correctOption
                            ? correctOption.value
                            : ""
                    }

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

        const quizArea =
            document.getElementById(
                "quiz-area"
            );


        if (!quizArea) {

            return;

        }


        quizArea.innerHTML = `

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
// 刷新整个网页
// ==================================================

function render() {

    renderTasks();

    renderReviewPool();

    renderSummary();

    renderWrongList();

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
