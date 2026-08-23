// 国网记忆钩子重构：长答案不再复述原文，而是压缩为真正可背、可还原的关键词链。
(function () {
    if (window.__bankMemoryHookUpgradeInstalled) return;
    window.__bankMemoryHookUpgradeInstalled = true;

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function correctText(question) {
        if (!question) return "";
        if (question.type === "short") return normalize(question.answerDisplay || question.answer);
        return String(question.answer || "")
            .split("")
            .filter(Boolean)
            .map(key => normalize(question.options && question.options[key]))
            .filter(Boolean)
            .join("；");
    }

    // 高频固定表述直接给人工设计的口诀，优先级高于自动压缩。
    const SPECIAL_MNEMONICS = [
        {
            test: text => /解放思想/.test(text) && /实事求是/.test(text) && /战略自信/.test(text) && /战略定力/.test(text) && /守正/.test(text) && /改革/.test(text),
            hook: "口诀：解实｜自定｜跟践｜创突守探｜改革开新\n还原：解实＝解放思想+实事求是；自定＝战略自信+战略定力；跟践＝紧跟时代+顺应实践；创突守探＝创新+突破+守正+探索；改革开新＝改革破题+打开新天地。"
        },
        {
            test: text => /富强/.test(text) && /民主/.test(text) && /文明/.test(text) && /和谐/.test(text) && /自由/.test(text) && /平等/.test(text) && /爱国/.test(text),
            hook: "口诀：国—富民文和｜社—自平公法｜人—爱敬诚友\n三层顺序：国家目标 → 社会取向 → 个人准则。"
        },
        {
            test: text => /人民至上/.test(text) && /自信自立/.test(text) && /守正创新/.test(text) && /问题导向/.test(text) && /系统观念/.test(text) && /胸怀天下/.test(text),
            hook: "口诀：人—自—守—问—系—胸\n还原：人民至上｜自信自立｜守正创新｜问题导向｜系统观念｜胸怀天下。"
        },
        {
            test: text => /安全/.test(text) && /可靠/.test(text) && /清洁/.test(text) && /经济/.test(text) && /可持续/.test(text),
            hook: "五词链：安—可—清—经—续\n还原：安全｜可靠｜清洁｜经济｜可持续。"
        },
        {
            test: text => /中国具体实际/.test(text) && /中华优秀传统文化/.test(text),
            hook: "两个结合＝一“实际”＋一“文化”\n实际：同中国具体实际相结合；文化：同中华优秀传统文化相结合。"
        }
    ];

    const LEADING_FILLER = /^(?:必须|坚持|坚定|保持|紧跟|顺应|敢于|勇于|始终|不断|全面|深入|积极|大力|着力|持续|加快|推动|促进|强化|提升|增强|切实|牢牢|努力|更好地?|要|应当|需要|通过|以|把|将)/;

    function shortenClause(raw) {
        let text = normalize(raw)
            .replace(/[“”"']/g, "")
            .replace(/[。；;，,：:]+$/g, "")
            .replace(LEADING_FILLER, "")
            .replace(/^在(.{1,8})的基础上/, "$1")
            .replace(/^用(.{1,8})的办法/, "$1")
            .trim();

        const semanticRules = [
            [/解放思想/, "解放"], [/实事求是/, "求实"], [/战略自信/, "自信"], [/战略定力/, "定力"],
            [/时代步伐/, "时代"], [/实践发展/, "实践"], [/守正.*探索/, "守正探索"], [/改革.*(?:瓶颈|难题)/, "改革破题"],
            [/新天地/, "开新"], [/人民至上/, "人民"], [/生命至上/, "生命"], [/问题导向/, "问题"],
            [/系统观念/, "系统"], [/胸怀天下/, "天下"], [/自信自立/, "自立"], [/守正创新/, "守创"],
            [/高质量发展/, "高质量"], [/科技创新/, "科创"], [/绿色低碳/, "绿低"], [/能源安全/, "能安"],
            [/党的领导/, "党领"], [/人民为中心/, "人民"], [/改革开放/, "改开"], [/共同富裕/, "共富"]
        ];
        for (const [pattern, label] of semanticRules) {
            if (pattern.test(text)) return label;
        }

        if (text.length <= 6) return text;

        // 优先保留较有辨识度的末尾名词性词组，避免“坚持/推动/加强”等空泛动词成为钩子。
        const tail = text.match(/([\u4e00-\u9fff]{2,6})(?:思想|理念|精神|战略|制度|体系|能力|发展|建设|改革|创新|安全|文化|服务|实践|目标|原则|道路|现代化)$/);
        if (tail) return tail[1] + text.slice(-2);

        return text.length <= 10 ? text : `${text.slice(0, 4)}…${text.slice(-2)}`;
    }

    function autoMnemonic(text) {
        const cleaned = normalize(text);
        if (!cleaned) return "";

        for (const item of SPECIAL_MNEMONICS) {
            if (item.test(cleaned)) return item.hook;
        }

        if (cleaned.length <= 18 && !/[；;，,、]/.test(cleaned)) {
            return `核心词：${cleaned}`;
        }

        const groups = cleaned
            .split(/[；;。]/)
            .map(group => group.trim())
            .filter(Boolean)
            .map(group => {
                const parts = group
                    .split(/[，,、]/)
                    .map(shortenClause)
                    .filter(Boolean);
                return [...new Set(parts)].slice(0, 5).join("·");
            })
            .filter(Boolean)
            .slice(0, 6);

        if (!groups.length) return `核心词：${shortenClause(cleaned)}`;
        return `关键词链：${groups.join("｜")}`;
    }

    const baseGetKnowledge = window.getBankMemoryKnowledge;
    if (typeof baseGetKnowledge === "function") {
        window.getBankMemoryKnowledge = function (question) {
            const info = baseGetKnowledge(question);
            if (!info) return info;

            const answer = correctText(question);
            const currentHook = normalize(info.hook);
            const shouldRebuild = Boolean(
                answer && (
                    currentHook.startsWith("先记关键词") ||
                    currentHook.startsWith("先记完整固定表述") ||
                    currentHook.length > 80 ||
                    (answer.length > 35 && currentHook.includes(answer.slice(0, Math.min(20, answer.length))))
                )
            );

            if (!shouldRebuild) return info;
            return Object.assign({}, info, { hook: autoMnemonic(answer) || currentHook });
        };
    }

    // 视觉修复：“记忆钩子”徽标真正做成圆形，并水平/垂直居中。
    if (!document.getElementById("bank-memory-hook-upgrade-style")) {
        const style = document.createElement("style");
        style.id = "bank-memory-hook-upgrade-style";
        style.textContent = `
            .bank-memory-hook {
                grid-template-columns: 72px minmax(0, 1fr) !important;
                align-items: center !important;
                gap: 14px !important;
            }
            .bank-memory-hook > span {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 72px !important;
                height: 72px !important;
                min-width: 72px !important;
                min-height: 72px !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                border-radius: 50% !important;
                text-align: center !important;
                line-height: 1.15 !important;
                white-space: nowrap !important;
            }
            .bank-memory-hook > strong {
                display: block !important;
                white-space: pre-line !important;
                line-height: 1.7 !important;
            }
            @media (max-width: 640px) {
                .bank-memory-hook {
                    grid-template-columns: 64px minmax(0, 1fr) !important;
                    gap: 11px !important;
                }
                .bank-memory-hook > span {
                    width: 64px !important;
                    height: 64px !important;
                    min-width: 64px !important;
                    min-height: 64px !important;
                    font-size: 10.5px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    if (typeof window.refreshBankMemoryKnowledge === "function") {
        window.refreshBankMemoryKnowledge();
    }
})();
