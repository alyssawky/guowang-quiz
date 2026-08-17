// “记忆模糊”操作成功后的轻量确认提示。
// 不使用 MutationObserver；只在 markMemoryBlurred 真正新增一次错误记录后显示。
(function () {
    if (window.__memoryBlurToastInstalled) return;
    window.__memoryBlurToastInstalled = true;

    let hideTimer = null;

    function installStyles() {
        if (document.getElementById("memory-blur-toast-style")) return;
        const style = document.createElement("style");
        style.id = "memory-blur-toast-style";
        style.textContent = `
            .memory-blur-toast {
                position: fixed;
                right: 24px;
                bottom: 24px;
                z-index: 5000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: min(390px, calc(100vw - 32px));
                padding: 12px 16px;
                border: 1px solid #b9d9d4;
                border-radius: 12px;
                background: rgba(248, 253, 252, .98);
                box-shadow: 0 12px 34px rgba(20, 77, 71, .16);
                color: #194d46;
                font-size: 13px;
                font-weight: 700;
                line-height: 1.5;
                opacity: 0;
                transform: translateY(10px);
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease;
            }
            .memory-blur-toast.is-visible {
                opacity: 1;
                transform: translateY(0);
            }
            .memory-blur-toast-icon {
                width: 24px;
                height: 24px;
                flex: 0 0 24px;
                display: grid;
                place-items: center;
                border-radius: 50%;
                background: #dff2ee;
                color: #087466;
                font-size: 15px;
                font-weight: 900;
            }
            @media (max-width: 640px) {
                .memory-blur-toast {
                    left: 16px;
                    right: 16px;
                    bottom: 18px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function showMemoryBlurToast() {
        installStyles();
        let toast = document.getElementById("memory-blur-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "memory-blur-toast";
            toast.className = "memory-blur-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            toast.innerHTML = `
                <span class="memory-blur-toast-icon">✓</span>
                <span>该题已自动计入错题库</span>
            `;
            document.body.appendChild(toast);
        }

        if (hideTimer) window.clearTimeout(hideTimer);
        toast.classList.remove("is-visible");
        void toast.offsetWidth;
        toast.classList.add("is-visible");

        hideTimer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 2600);
    }

    const baseMarkMemoryBlurred = window.markMemoryBlurred;
    if (typeof baseMarkMemoryBlurred !== "function") return;

    window.markMemoryBlurred = function (...args) {
        const question = (typeof currentReviewQuestions !== "undefined" && typeof currentQuestionIndex !== "undefined")
            ? currentReviewQuestions[currentQuestionIndex]
            : null;
        const beforeWrong = question && typeof answerHistory !== "undefined" && answerHistory[question.id]
            ? Number(answerHistory[question.id].wrong || 0)
            : 0;

        const result = baseMarkMemoryBlurred.apply(this, args);

        const afterWrong = question && typeof answerHistory !== "undefined" && answerHistory[question.id]
            ? Number(answerHistory[question.id].wrong || 0)
            : 0;
        if (afterWrong > beforeWrong) showMemoryBlurToast();

        return result;
    };

    window.showMemoryBlurToast = showMemoryBlurToast;
})();

// 稳定加载首页累计池同步补丁：让“累计记忆”显示与 memory-curve.js 的真实答题池完全一致。
(function () {
    if (document.querySelector('script[data-daily-curve-pool-sync-loader]')) return;
    const script = document.createElement('script');
    script.src = `daily-curve-pool-sync.js?v=20260817-1&reload=${Date.now()}`;
    script.setAttribute('data-daily-curve-pool-sync-loader', 'true');
    document.body.appendChild(script);
})();
