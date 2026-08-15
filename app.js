const STORAGE_KEY = "guowang-study-progress";
const ANSWER_HISTORY_KEY = "guowang-answer-history";


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


// ==================================================
// 保存答题记录
// ==================================================

function saveAnswerHistory() {

    localStorage.setItem(
        ANSWER_HISTORY_KEY,
        JSON.stringify(answerHistory)
    );

}


let answerHistory =
    loadAnswerHistory();


// ==================================================
// 记录每一道题的答题情况
// ==================================================

function recordAnswer(questionId, isCorrect) {

    // 第一次做这道题时建立记录
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


    // 总做题次数
    record.attempts++;


    // 正确 / 错误次数
    if (isCorrect) {

        record.correct++;

    } else {

        record.wrong++;

    }


    // 最近一次结果
    record.lastCorrect =
        isCorrect;


    // 最近一次答题时间
    record.lastAnsweredAt =
        new Date().toISOString();


    saveAnswerHistory();

}


// ==================================================
// 工具：随机打乱数组
// ==================================================

function shuffleArray(array) {

    const newArray = [...array];


    for (
        let i = newArray.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
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
        localStorage.getItem(
            STORAGE_KEY
        );


    let savedProgress = {};


    if (saved) {

        try {

            savedProgress =
                JSON.parse(saved);

        } catch (error) {

            savedProgress = {};

        }

    }


    /*
        如果以后 plan.js 增加新任务，
        只添加新任务，
        不覆盖你原来已经保存的学习状态。
    */

    studyPlan.forEach(task => {

        if (
            !(task.id in savedProgress)
        ) {

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


let progress =
    loadProgress();


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


    if (!container) {
        return;
    }


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
                progress[task.id]
        );


    if (
        unlockedTasks.length === 0
    ) {

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
            task =>
                progress[task.id]
        ).length;


    /*
        “可复习”：
        已经完成学习，
        并且题库里确实有对应题目的任务数量。
    */

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
// 建立本次复习题目
// ==================================================

function buildReviewQuestions() {

    const reviewQuestions = [];


    /*
        按 plan.js 中的学习计划顺序处理。

        不同学习板块之间：
        保留学习计划顺序。

        同一个学习板块内部：
        随机打乱题目。
    */

    studyPlan.forEach(task => {

        // 没有完成学习的内容禁止出题
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
    // 随机排列当前题目的选项
    // ==================================================

    const originalOptions =
        Object.entries(
            question.options
        );


    const shuffledOptions =
        shuffleArray(
            originalOptions
        );


    /*
        无论原来选项是什么顺序，
        页面上重新标记成 A/B/C/D。
    */

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


    // ==================================================
    // 判断本题是否正确
    // ==================================================

    const isCorrect =
        selectedOriginalKey ===
        question.answer;


    // ==================================================
    // 把本次答案写入答题记录
    // ==================================================

    recordAnswer(
        question.id,
        isCorrect
    );


    // 用户选择的选项
    const selectedOption =
        currentOptionOrder.find(
            option =>
                option.originalKey ===
                selectedOriginalKey
        );


    // 当前随机顺序下的正确选项
    const correctOption =
        currentOptionOrder.find(
            option =>
                option.originalKey ===
                question.answer
        );


    /*
        一旦回答，
        禁止重复点击选项。

        这样同一道题不会被重复记录。
    */

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
// 刷新页面
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
