// 国网判断题提交保险：答题结果显示前强制确认解析已经补齐。
(function () {
  if (window.__stateGridJudgeSubmitGuardInstalled) return;
  window.__stateGridJudgeSubmitGuardInstalled = true;

  function currentQuestion() {
    return (typeof currentReviewQuestions !== "undefined" && typeof currentQuestionIndex !== "undefined")
      ? currentReviewQuestions[currentQuestionIndex]
      : null;
  }

  function isStateGridJudge(question) {
    return Boolean(
      question &&
      question.type === "judge" &&
      String(question.taskId || "").startsWith("preoct300-")
    );
  }

  function hasDetailedExplanation(question) {
    const text = String(question?.explanation || "");
    if (!text.trim()) return false;
    if (String(question?.answer || "") === "B") {
      return /为什么错误|错在哪里/.test(text) && /正确说法|正确表述/.test(text);
    }
    return /为什么正确/.test(text) && /正确说法|正确表述/.test(text);
  }

  function forceApply() {
    if (typeof window.applyStateGridJudgeExplanations === "function") {
      window.applyStateGridJudgeExplanations();
    }
  }

  function loadFreshModule() {
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = `stategrid-judge-explanations.js?v=20260827-2&submit=${Date.now()}`;
      script.dataset.stategridJudgeSubmitGuardLoader = "true";
      script.onload = () => {
        forceApply();
        resolve();
      };
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });
  }

  const baseCheckAnswer = window.checkAnswer;
  if (typeof baseCheckAnswer !== "function") return;

  window.checkAnswer = function (...args) {
    const question = currentQuestion();
    if (!isStateGridJudge(question)) {
      return baseCheckAnswer.apply(this, args);
    }

    forceApply();
    if (hasDetailedExplanation(question)) {
      return baseCheckAnswer.apply(this, args);
    }

    // 极端情况下（旧缓存/加载顺序异常），先拉取最新解析模块再显示结果。
    const context = this;
    loadFreshModule().then(() => {
      const refreshed = currentQuestion();
      if (!hasDetailedExplanation(refreshed)) {
        const feedback = document.getElementById("answer-feedback");
        if (feedback) {
          feedback.innerHTML = `
            <div class="review-card answer-result wrong-result">
              <strong>判断题解析加载异常</strong>
              <p>这道题的“错误原因 + 正确说法”尚未成功载入。为避免只背对错，本次暂不提交答案，请刷新后重试。</p>
            </div>
          `;
        }
        return;
      }
      baseCheckAnswer.apply(context, args);
    });
  };
})();
