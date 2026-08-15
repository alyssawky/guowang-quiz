// 第二章后半段原题图修复：
// da-ch2-010～043 不再使用 hq35 的低分辨率覆盖图，
// 直接使用题库文件中保留的 900px 原题 sprite 裁切坐标。
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
        if (isLateChapterTwoQuestion(question) && question.questionImage) {
            return renderOriginalQuestionCrop(question);
        }

        return typeof previousRenderQuestionImage === "function"
            ? previousRenderQuestionImage(question)
            : "";
    };

    // 防止旧 hq35 的异步完成后再次把后半段题目换回低清图。
    if (window.DA_HQ_LAYOUT) {
        Object.keys(window.DA_HQ_LAYOUT).forEach(id => {
            const match = id.match(/^da-ch2-(\d{3})$/);
            if (match && Number(match[1]) >= 10) {
                delete window.DA_HQ_LAYOUT[id];
            }
        });
    }
})();
