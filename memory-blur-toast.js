// 错题/“记忆模糊”操作后的轻量确认提示。
// 仅负责提示，不再加载或修改任何“今日曲线”按钮/题池逻辑。
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
                max-width: min(430px, calc(100vw - 32px));
                padding: 12px 16px;
                border: 1px solid #d8c5a7;
                border-radius: 12px;
                background: rgba(255, 252, 246, .99);
                box-shadow: 0 12px 34px rgba(84, 57, 24, .16);
                color: #66451f;
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
                background: #f5e9d7;
                color: #8a5521;
                font-size: 15px;
                font-weight: 900;
            }
            .memory-blur-toast-copy {
                display: grid;
                gap: 1px;
            }
            .memory-blur-toast-copy small {
                color: #8a7357;
                font-size: 11px;
                font-weight: 600;
            }
            .memory-blur-toast[data-priority="critical"] {
                border-color: #e0b3ae;
                background: rgba(255, 249, 248, .99);
                color: #7e302b;
            }
            .memory-blur-toast[data-priority="critical"] .memory-blur-toast-icon {
                background: #f8dedb;
                color: #a43c34;
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

    function showMemoryBlurToast(options = {}) {
        installStyles();
        const kind = options && options.kind ? options.kind : "generic";
        const count = Math.max(0, Number(options && options.count || 0));
        const priority = options && options.priority ? options.priority : "";

        let title = "该题已自动计入错题库";
        let detail = "";
        let priorityStyle = "";

        if (kind === "memory-blur") {
            const repeated = count >= 2;
            title = repeated
                ? `再次计入错题库 · 记忆模糊第 ${count} 次`
                : "已计入错题库 · 记忆模糊 1 次";
            detail = priority || (repeated ? "错误等级已继续提高" : "错误等级已提高");
            priorityStyle = repeated ? "critical" : "high";
        }

        let toast = document.getElementById("memory-blur-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "memory-blur-toast";
            toast.className = "memory-blur-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }

        toast.dataset.priority = priorityStyle;
        toast.innerHTML = `
            <span class="memory-blur-toast-icon">✓</span>
            <span class="memory-blur-toast-copy">
                <span>${title}</span>
                ${detail ? `<small>${detail}</small>` : ""}
            </span>
        `;

        if (hideTimer) window.clearTimeout(hideTimer);
        toast.classList.remove("is-visible");
        void toast.offsetWidth;
        toast.classList.add("is-visible");

        hideTimer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 3000);
    }

    window.showMemoryBlurToast = showMemoryBlurToast;
})();
