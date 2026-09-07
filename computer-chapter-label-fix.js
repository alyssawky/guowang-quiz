// 计算机章节显示：严格按教材章节号，不再用任务序号或“2/3”混合标识。
// v3：若浏览器仍拿到旧版 plan.js，则优先按任务内容判断教材章节，避免“第二章标题 + 第五章操作系统内容”的混搭。
(function () {
    const VERSION = 3;
    if (Number(window.__computerChapterLabelFixVersion || 0) >= VERSION) return;
    window.__computerChapterLabelFixVersion = VERSION;

    const TASK_LABELS = {
        "computer-001": { chapter: "1", module: "第一章 计算机基础", name: "第一章 计算机基础（计算机系统组成）" },
        "computer-002": { chapter: "2", module: "第二章 数据的表示与运算" },
        "computer-003": {
            chapter: "3",
            module: "第三章 计算机硬件",
            name: "第三章 计算机硬件（CPU · 冯·诺依曼体系；含机器数表示衔接题）"
        },
        "computer-004": { chapter: "2", module: "第二章 数据的表示与运算" },
        "computer-005": { chapter: "2", module: "第二章 数据的表示与运算" },
        "computer-006": { chapter: "3", module: "第三章 计算机硬件" },
        "computer-007": {
            chapter: "4",
            module: "第四章 计算机软件",
            name: "第四章 计算机软件（计算机软件分类 · 软件的工作模式 · 软件的安装方法 · 计算机软件生命周期 · 计算机软件开发过程模型 · 办公软件 · 多媒体创作软件 · 网页制作软件）"
        },
        "computer-008": { chapter: "5", module: "第五章 操作系统" },
        "computer-009": { chapter: "5", module: "第五章 操作系统" },
        "computer-010": { chapter: "5+", module: "第五章 操作系统补充" },
        "computer-011": { chapter: "6", module: "第六章 程序设计语言" },
        "computer-012": {
            chapter: "6+",
            module: "第六章后补充",
            name: "第六章后补充（编译/解释；源程序/目标程序/可执行程序；软件工程术语）"
        },
        "computer-013": { chapter: "9", module: "第九章 计算机网络" },
        "computer-014": { chapter: "9", module: "第九章 计算机网络" },
        "computer-015": { chapter: "9", module: "第九章 计算机网络" },
        "computer-016": { chapter: "9+", module: "第九章 网络补充" },
        "computer-017": { chapter: "10", module: "第十章 信息安全" },
        "computer-018": { chapter: "10", module: "第十章 信息安全" },
        "computer-019": { chapter: "10", module: "第十章 信息安全" },
        "computer-020": { chapter: "10+", module: "第十章 信息安全补充" },
        "computer-021": { chapter: "11", module: "第十一章 信息科学前沿" },
        "computer-022": { chapter: "11", module: "第十一章 信息科学前沿" },
        "computer-023": { chapter: "11+", module: "第十一章 AI补充" },
        "computer-024": { chapter: "11", module: "第十一章 信息科学前沿" }
    };

    function getPlan() {
        if (typeof studyPlan !== "undefined" && Array.isArray(studyPlan)) return studyPlan;
        if (Array.isArray(window.studyPlan)) return window.studyPlan;
        return [];
    }

    function taskText(task) {
        return `${task?.module || ""} ${task?.name || ""}`.toLowerCase();
    }

    function resolveLabel(task) {
        if (!task || task.category !== "计算机") return null;
        const text = taskText(task);

        // 内容优先：专门兜住旧版 plan.js 中“ID还是 computer-004，但内容已经是操作系统”的情况。
        if (/操作系统|windows|linux|\bdos\b|vmware|进程|内存管理|文件管理|系统安全/.test(text)) {
            if (/查漏|补充/.test(text)) return { chapter: "5+", module: "第五章 操作系统补充" };
            return { chapter: "5", module: "第五章 操作系统" };
        }
        if (/软件分类|软件的工作模式|软件安装|生命周期|开发过程模型|办公软件|多媒体|网页制作/.test(text)) {
            return { chapter: "4", module: "第四章 计算机软件" };
        }
        if (/程序设计语言|编译\s*vs\s*解释|源程序|目标程序|可执行程序/.test(text)) {
            if (/查漏|补充|软件工程术语/.test(text)) return { chapter: "6+", module: "第六章后补充" };
            return { chapter: "6", module: "第六章 程序设计语言" };
        }
        if (/cpu|冯.?诺依曼|存储器|外设|总线|性能指标/.test(text)) {
            return { chapter: "3", module: "第三章 计算机硬件" };
        }

        return TASK_LABELS[task.id] || null;
    }

    function applyTaskLabels() {
        getPlan().forEach(task => {
            const inferred = resolveLabel(task);
            const fixed = TASK_LABELS[task.id];
            if (!inferred && !fixed) return;

            const label = inferred || fixed;
            if (label.module) task.module = label.module;

            // 只有确认该ID对应当前正式计划时才替换完整name；
            // 内容优先纠错时保留旧任务自己的详细小节，避免把正确的操作系统目录抹掉。
            if (fixed?.name && inferred === fixed) task.name = fixed.name;
            if (fixed?.name && !inferred) task.name = fixed.name;

            task.textbookChapterLabel = label.chapter;
        });
    }

    function taskIdFromReviewRow(row) {
        const button = row.querySelector("[data-review-task-id]") || row.querySelector("[data-view-task-id]");
        return button?.dataset.reviewTaskId || button?.dataset.viewTaskId || "";
    }

    function decorateComputerChapterIndexes() {
        const plan = getPlan();
        document.querySelectorAll(".review-computer-group .review-chapter-row").forEach(row => {
            const taskId = taskIdFromReviewRow(row);
            const task = plan.find(item => item.id === taskId) || null;
            const label = resolveLabel(task) || TASK_LABELS[taskId];
            const index = row.querySelector(".review-chapter-index");
            if (index && label?.chapter) index.textContent = label.chapter;
        });
    }

    applyTaskLabels();

    window.addEventListener("DOMContentLoaded", () => {
        applyTaskLabels();

        const baseRenderSectionChooser = window.renderSectionChooser;
        if (typeof baseRenderSectionChooser === "function" && !baseRenderSectionChooser.__computerChapterLabelsWrappedV3) {
            const wrapped = function (...args) {
                applyTaskLabels();
                const result = baseRenderSectionChooser.apply(this, args);
                decorateComputerChapterIndexes();
                return result;
            };
            wrapped.__computerChapterLabelsWrappedV3 = true;
            window.renderSectionChooser = wrapped;
        }

        if (typeof window.renderSectionChooser === "function") window.renderSectionChooser();
        if (typeof window.renderReviewPool === "function") window.renderReviewPool();
        if (typeof window.renderTasks === "function") window.renderTasks();
        if (typeof window.renderCalendar === "function") window.renderCalendar();
        decorateComputerChapterIndexes();
    });

    window.applyComputerChapterLabels = applyTaskLabels;
    window.getComputerTextbookChapterLabel = taskId => {
        const task = getPlan().find(item => item.id === taskId) || null;
        return (resolveLabel(task) || TASK_LABELS[taskId])?.chapter || "";
    };
})();
