// 计算机章节显示修复：按教材章节而不是“第几个可复习任务”显示。
// 同时明确 computer-007 = 第四章 计算机软件，computer-012 = 第六章后补充。
(function () {
    const TASK_LABELS = {
        "computer-001": { chapter: "1", module: "第一章 计算机基础", name: "第一章 计算机基础（计算机系统组成）" },
        "computer-002": { chapter: "2", module: "第二章 数据的表示与运算" },
        "computer-003": { chapter: "2/3" },
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

    function applyTaskLabels() {
        if (!Array.isArray(window.studyPlan || (typeof studyPlan !== "undefined" ? studyPlan : null))) return;
        const list = window.studyPlan || studyPlan;
        list.forEach(task => {
            const label = TASK_LABELS[task.id];
            if (!label) return;
            if (label.module) task.module = label.module;
            if (label.name) task.name = label.name;
            task.textbookChapterLabel = label.chapter;
        });
    }

    function decorateComputerChapterIndexes() {
        document.querySelectorAll(".review-computer-group .review-chapter-row").forEach(row => {
            const button = row.querySelector("[data-review-task-id]") || row.querySelector("[data-view-task-id]");
            const taskId = button?.dataset.reviewTaskId || button?.dataset.viewTaskId;
            const label = TASK_LABELS[taskId];
            const index = row.querySelector(".review-chapter-index");
            if (index && label?.chapter) index.textContent = label.chapter;
        });
    }

    applyTaskLabels();

    window.addEventListener("DOMContentLoaded", () => {
        applyTaskLabels();

        const baseRenderSectionChooser = window.renderSectionChooser;
        if (typeof baseRenderSectionChooser === "function" && !baseRenderSectionChooser.__computerChapterLabelsWrapped) {
            const wrapped = function (...args) {
                applyTaskLabels();
                const result = baseRenderSectionChooser.apply(this, args);
                decorateComputerChapterIndexes();
                return result;
            };
            wrapped.__computerChapterLabelsWrapped = true;
            window.renderSectionChooser = wrapped;
        }

        if (typeof window.renderSectionChooser === "function") window.renderSectionChooser();
        if (typeof window.renderReviewPool === "function") window.renderReviewPool();
        if (typeof window.renderTasks === "function") window.renderTasks();
        decorateComputerChapterIndexes();
    });

    window.applyComputerChapterLabels = applyTaskLabels;
})();
