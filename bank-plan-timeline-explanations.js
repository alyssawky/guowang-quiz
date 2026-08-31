// 国网计划/阶段目标题：来源 + 时间轴 + 相邻节点 + 版本辨析。
// 当前首先覆盖 2026 题库中的“2030/2035 世界一流企业 + 新型电力系统”战略时间轴。
(function () {
    if (window.__bankPlanTimelineExplanationsInstalled) return;
    window.__bankPlanTimelineExplanationsInstalled = true;

    const CURRENT_TIMELINE = {
        2030: {
            enterprise: "建成产品卓越、品牌卓著、创新领先、治理现代的世界一流企业",
            powerSystem: "推动新型电力系统建设取得重要进展"
        },
        2035: {
            enterprise: "世界一流企业地位巩固提升",
            powerSystem: "保障新型电力系统基本建成"
        }
    };

    const CURRENT_SOURCE = "国家电网有限公司2026年面向专业投资者公开发行公司债券募集说明书（上海证券交易所披露）：到2030年，建成世界一流企业，推动新型电力系统建设取得重要进展；到2035年，世界一流企业地位巩固提升，保障新型电力系统基本建成。";
    const FOUR_FEATURE_SOURCE = "“产品卓越、品牌卓著、创新领先、治理现代”这一世界一流企业表述，来源可追溯至2022年2月28日中央全面深化改革委员会第二十四次会议审议通过《关于加快建设世界一流企业的指导意见》时提出的世界一流企业建设要求。";
    const VERSION_NOTE = "版本提醒：公开可见的国家电网《企业文化、电力与能源战略参考题库（2024版）》曾采用“2025年基本建成具有中国特色国际领先的能源互联网企业—2030年全面建成产品卓越、品牌卓著、创新领先、治理现代的世界一流企业—2035年全面建成具有中国特色国际领先的能源互联网企业”的旧版‘三步走’表述。你当前使用的是2026题库，作答必须以当前2026口径为准，不能把旧版“全面建成”带入Q84。";

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function isBankQuestion(question) {
        if (!question) return false;
        const task = typeof studyPlan !== "undefined"
            ? studyPlan.find(item => item.id === question.taskId)
            : null;
        return Boolean(
            String(question.taskId || "").startsWith("preoct300-w") ||
            question.sourceSet === "10月前必学300题" ||
            (task && (task.questionBank || task.category === "国网题库"))
        );
    }

    function isStrategyTimelineQuestion(question) {
        if (!isBankQuestion(question)) return false;
        const text = normalize(question.question);
        return (
            /(2030|2035)\s*年/.test(text) &&
            /(世界一流企业|产品卓越|品牌卓著|创新领先|治理现代|新型电力系统|巩固提升)/.test(text)
        );
    }

    function optionLines(question) {
        const answer = String(question.answer || "");
        return Object.entries(question.options || {}).map(([key, value]) => {
            const selected = answer.includes(key);
            const text = normalize(value);
            let why = "";
            if (/2030\s*年/.test(normalize(question.question)) && /(建成|初步建成|全面建成|力争建成)/.test(text)) {
                if (text === "建成") why = "当前2026题库口径：2030年“建成”世界一流企业。";
                else if (text === "全面建成") why = "这是旧版题库常见干扰。2024版曾出现“全面建成”，但当前2026题库已改为“建成”。";
                else why = "不符合当前2026题库的2030固定动词。";
            } else if (/2035\s*年/.test(normalize(question.question)) && /(凸显|提升|巩固)/.test(text)) {
                if (text === "巩固提升") why = "当前2026题库固定表述：2035年世界一流企业地位“巩固提升”。";
                else why = "不是当前2026题库2035阶段目标的固定搭配。";
            } else {
                why = selected ? "与当前2026题库阶段目标一致。" : "不符合当前阶段目标的固定表述。";
            }
            return `<div><strong>${key}. ${text}</strong>：${selected ? "正确。" : "错误。"}${why}</div>`;
        }).join("");
    }

    function buildExplanation(question) {
        const text = normalize(question.question);
        const asks2030 = /2030\s*年/.test(text);
        const asks2035 = /2035\s*年/.test(text);
        const point = asks2030 ? "2030阶段目标" : asks2035 ? "2035阶段目标" : "2030—2035战略时间轴";

        return `
            <div class="bank-plan-timeline-explanation">
                <p><strong>这题在考什么：</strong>${point}。这类题不要孤立背一个年份或一个动词，要把2030和2035放在同一条时间轴上。</p>
                <p><strong>当前2026题库时间轴：</strong><br>
                ① <strong>2030年</strong>：${CURRENT_TIMELINE[2030].enterprise}；同时${CURRENT_TIMELINE[2030].powerSystem}。<br>
                ② <strong>2035年</strong>：${CURRENT_TIMELINE[2035].enterprise}；同时${CURRENT_TIMELINE[2035].powerSystem}。</p>
                <p><strong>四个“一流”特征从哪里来：</strong>${FOUR_FEATURE_SOURCE}</p>
                <p><strong>知识来源（当前口径）：</strong>${CURRENT_SOURCE}</p>
                <p><strong>版本辨析：</strong>${VERSION_NOTE}</p>
                <div><strong>本题逐项辨析：</strong>${optionLines(question)}</div>
                <p><strong>考试记忆：</strong>2030记“<strong>建成 + 重要进展</strong>”；2035记“<strong>巩固提升 + 基本建成</strong>”。企业目标和新型电力系统目标要成对记。</p>
            </div>
        `;
    }

    const baseGetKnowledge = window.getBankMemoryKnowledge;
    if (typeof baseGetKnowledge === "function") {
        window.getBankMemoryKnowledge = function (question) {
            if (isStrategyTimelineQuestion(question)) {
                const old = baseGetKnowledge(question) || {};
                return {
                    ...old,
                    explanation: buildExplanation(question),
                    distinction: "2030与2035必须成对记忆；同时注意2024旧版题库与当前2026题库在‘全面建成/建成’等用词上存在版本差异。",
                    hook: "2030：建成一流 + 系统重要进展；2035：一流巩固提升 + 系统基本建成。",
                    source: `${CURRENT_SOURCE}；${FOUR_FEATURE_SOURCE}`
                };
            }
            return baseGetKnowledge(question);
        };
    }

    // 标准刷题页面有些路径直接读取 question.explanation，因此同步覆盖，保证不是只有曲线答题才看到完整解析。
    if (typeof questions !== "undefined" && Array.isArray(questions)) {
        questions.filter(isStrategyTimelineQuestion).forEach(question => {
            question.explanation = buildExplanation(question);
            question.planTimelineDetailed = true;
        });
    }

    window.BANK_STRATEGY_TIMELINE_2026 = CURRENT_TIMELINE;
})();
