// 第二章后半段题图修复：
// 1) q10～q43 优先使用题目自身的高清 image；
// 2) 若当前题库仍是旧版，则退回原题 sprite 裁切；
// 3) 禁止旧 hq35 异步覆盖层再次接管后半段题目。
(function () {
    const previousRenderQuestionImage = window.renderQuestionImage;

    function isLateChapterTwoQuestion(question) {
        const match = question && String(question.id || "").match(/^da-ch2-(\d{3})$/);
        return Boolean(match && Number(match[1]) >= 10);
    }

    function escapeAttr(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function renderDirectImage(question) {
        if (!question || !question.image) return "";
        return `
            <div class="question-image-wrap question-image-wrap-late-ch2">
                <img
                    class="question-original-image question-original-image-late-ch2"
                    src="${question.image}"
                    alt="${escapeAttr(question.sourceId || question.question || "原题") }"
                    loading="eager"
                    decoding="async"
                    style="display:block;width:min(100%,1000px);height:auto;margin:0 auto;image-rendering:auto;"
                >
            </div>
        `;
    }

    function renderOriginalQuestionCrop(question) {
        const img = question && question.questionImage;
        if (!img || !img.sprite) return "";

        const x = Number(img.x || 0);
        const y = Number(img.y || 0);
        const w = Number(img.w || img.sheetW || 1);
        const h = Number(img.h || img.sheetH || 1);
        const sheetW = Number(img.sheetW || w);
        const sheetH = Number(img.sheetH || h);
        const displayWidth = Math.min(1000, Math.max(650, w));

        return `
            <div class="question-image-wrap question-image-wrap-late-ch2">
                <svg
                    class="question-original-svg question-original-svg-late-ch2"
                    viewBox="${x} ${y} ${w} ${h}"
                    role="img"
                    aria-label="${escapeAttr(question.sourceId || question.question || "原题") }"
                    preserveAspectRatio="xMidYMid meet"
                    style="width:min(100%, ${displayWidth}px);height:auto;"
                >
                    <image
                        href="${img.sprite}"
                        x="0"
                        y="0"
                        width="${sheetW}"
                        height="${sheetH}"
                        preserveAspectRatio="none"
                        style="image-rendering:auto;"
                    ></image>
                </svg>
            </div>
        `;
    }

    window.renderQuestionImage = function (question) {
        if (isLateChapterTwoQuestion(question)) {
            // 新版题库：每题自带高清完整题面，永远优先使用。
            if (question.image) return renderDirectImage(question);
            // 旧版题库：至少绕过 hq35 错位覆盖，直接用原 sprite 坐标。
            if (question.questionImage) return renderOriginalQuestionCrop(question);
        }

        return typeof previousRenderQuestionImage === "function"
            ? previousRenderQuestionImage(question)
            : "";
    };

    if (window.DA_HQ_LAYOUT) {
        Object.keys(window.DA_HQ_LAYOUT).forEach(id => {
            const match = id.match(/^da-ch2-(\d{3})$/);
            if (match && Number(match[1]) >= 10) {
                delete window.DA_HQ_LAYOUT[id];
            }
        });
    }
})();
