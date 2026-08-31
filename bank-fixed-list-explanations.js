// 国网固定清单型题目解析增强。
// 原则：凡答案只是“六个明确 / 六个领先 / 三个系统 / 五个环节”等集合名称，
// 解析必须继续展开“集合内每一项是什么 + 干扰项为什么不属于该集合”，避免只背答案标签。
// 本文件优先以当前 2026 题库同组题目中的完整列举为准，不把其他场景的同名口号强行混入。
(function () {
    const VERSION = 1;
    if (Number(window.__bankFixedListExplanationVersion || 0) >= VERSION) return;
    window.__bankFixedListExplanationVersion = VERSION;

    const SIX_CLEAR = [
        "明确以习近平新时代中国特色社会主义思想为指导",
        "明确坚持‘两个一以贯之’",
        "明确坚持以人民为中心的发展思想",
        "明确积极服务国家重大战略、支撑中国式现代化",
        "明确坚持高质量发展",
        "明确走出一条中国特色的电网发展道路"
    ];

    const SIX_LEADING = [
        "核心技术领先",
        "服务品质领先",
        "经营实力领先",
        "绿色发展领先",
        "企业治理领先",
        "品牌价值领先"
    ];

    const ENERGY_INTERNET_SYSTEMS = [
        "能源网架系统",
        "数智赋能系统",
        "价值创造系统"
    ];

    const CORE_FUNCTION_ROLES = [
        "能源电力保供国家队",
        "国民经济发展顶梁柱",
        "新型电力系统建设主力军",
        "能源领域国家战略科技力量",
        "电力现代化产业体系领头羊",
        "履行社会责任引领者"
    ];

    const CORE_COMPETITIVENESS = [
        "科技创新能力",
        "卓越服务能力",
        "价值创造能力",
        "能源转型引领能力",
        "现代企业治理能力",
        "卓著品牌建设能力"
    ];

    const STRATEGY_CONTROL_LOOP = [
        "战略引领",
        "规划统筹",
        "计划牵引",
        "预算约束",
        "考核评价"
    ];

    const WORLD_CLASS = [
        "产品卓越",
        "品牌卓著",
        "创新领先",
        "治理现代"
    ];

    const SIX_MUST_UPHOLD = [
        "人民至上",
        "自信自立",
        "守正创新",
        "问题导向",
        "系统观念",
        "胸怀天下"
    ];

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function listText(items) {
        return items.map((item, index) => `${index + 1}）${item}`).join("；");
    }

    function listHTML(items) {
        return items.map((item, index) => `${index + 1}）${item}`).join("<br>");
    }

    function isBank(question) {
        if (!question) return false;
        return String(question.taskId || "").startsWith("preoct300-w") || question.sourceSet === "10月前必学300题";
    }

    function correctText(question) {
        return String(question.answer || "")
            .split("")
            .map(key => normalize(question.options && question.options[key]))
            .filter(Boolean)
            .join("；");
    }

    function q88Knowledge() {
        return {
            explanation: `本题正确答案是“六个明确”。这里不能只记“六个明确”四个字，还要把六条内容一起掌握：${listText(SIX_CLEAR)}。也就是说，“具有中国特色”是战略目标的根本，而“六个明确”就是当前2026题库对这一根本内涵的展开。`,
            distinction: `A“五个明确”：不是本题“具有中国特色”内涵的固定名称；B“六个明确”：正确，对应上述六条；C“五个坚持”：在国家电网不同工作场景中可能出现其他“五个坚持”表述，但它不是本题战略目标“中国特色”的对应清单，不能把别的场景硬套进来；D“六个坚持”：也不是本题口径。最容易混的是党的二十大理论学习中的“六个必须坚持”——${listText(SIX_MUST_UPHOLD)}——那属于习近平新时代中国特色社会主义思想的世界观和方法论，与本题“六个明确”不是同一知识点。`,
            hook: "战略目标三段先定角色：中国特色=根本，国际领先=追求，能源互联网=方向；看到‘中国特色内涵有几个’→锁定‘六个明确’，再按‘思想—两个一以贯之—人民—国家战略/现代化—高质量—中国电网道路’顺序回忆。",
            source: "2026题库 Q88 + 同题库 Q138 完整列举；相邻‘六个必须坚持’辨析沿用已核验政治理论知识层。"
        };
    }

    const BY_SOURCE = {
        "2026-Q88": q88Knowledge(),
        "2026-Q138": {
            explanation: `本题直接考“具有中国特色”的六个明确。六条完整内容为：${listText(SIX_CLEAR)}。题目中的⑦“明确走中国特色国有企业改革发展道路”不是当前2026题库这组六个明确中的一项，所以正确组合是①②③④⑤⑥。`,
            distinction: "做这种序号组合题不要逐个凭印象判断。先把六条固定清单完整回忆出来，再去核对序号；本题唯一多出来的干扰项是⑦。",
            hook: "六个明确顺序：思想 → 两个一以贯之 → 人民 → 国家战略/中国式现代化 → 高质量 → 中国特色电网发展道路。",
            source: "2026题库 Q138。"
        },
        "2026-Q139": {
            explanation: `“具有中国特色”的六个明确是：${listText(SIX_CLEAR)}。因此“明确走现代企业改革发展道路”不是当前固定表述；题库采用的是“明确走出一条中国特色的电网发展道路”。`,
            distinction: "这类“不属于”题最容易被看起来方向正确、但措辞不是固定口径的选项迷惑。考试按固定表述判断，不要自行把近义表达视为等价。",
            hook: "看到‘现代企业改革发展道路’先警惕；本组六明确最后一条是‘中国特色的电网发展道路’。",
            source: "2026题库 Q138-Q139。"
        },
        "2026-Q140": {
            explanation: `“国际领先”是战略目标中的“追求”，当前2026题库把它展开为六个领先：${listText(SIX_LEADING)}。本题⑤“综合实力领先”不是这组六项之一，因此选①②③④⑥⑦。`,
            distinction: "不要把‘企业综合竞争力处于全球同行业最先进水平’中的“综合”二字误记成“综合实力领先”这一独立条目。总目标描述与六个领先的条目名称是两层概念。",
            hook: "六领先：技术—服务—经营—绿色—治理—品牌。",
            source: "2026题库 Q89、Q95、Q140、Q155。"
        },
        "2026-Q141": {
            explanation: `“能源互联网”是战略目标中的“方向”。当前2026题库列出的三个系统是：${listText(ENERGY_INTERNET_SYSTEMS)}。因此“信息支撑系统”不属于这三个固定系统。`,
            distinction: "“信息支撑系统”看起来很像数字化基础设施，但本题考的是战略目标中“能源互联网”的固定三系统名称，必须按题库口径选。",
            hook: "能源互联网三个系统：网架—数智—价值。",
            source: "2026题库 Q141、Q412。"
        },
        "2026-Q144": {
            explanation: `战略路径“增强核心功能”要求坚定当好六种角色：${listText(CORE_FUNCTION_ROLES)}。因此①“落实新发展理念的排头兵”不在本题这组六项中，正确组合为②③④⑤⑥⑦。`,
            distinction: "这组六项全是“公司要当好什么角色”，识别时抓住国家队、顶梁柱、主力军、战略科技力量、领头羊、引领者这六个角色词。",
            hook: "六角色关键词：国家队—顶梁柱—主力军—科技力量—领头羊—引领者。",
            source: "2026题库 Q116、Q144。"
        },
        "2026-Q145": {
            explanation: `战略路径“提升核心竞争力”包括六项能力：${listText(CORE_COMPETITIVENESS)}。本题④“市场竞争能力”不是当前这组六项中的固定条目，因此正确组合为①②③⑤⑥⑦。`,
            distinction: "“市场竞争能力”听起来合理，但这题不是问泛泛的竞争力构成，而是考国家电网当前战略路径的固定六项能力。",
            hook: "六能力：科技—服务—价值—转型—治理—品牌。",
            source: "2026题库 Q145。"
        },
        "2026-Q148": {
            explanation: `战略管控体系全过程闭环管控包含五个环节：${listText(STRATEGY_CONTROL_LOOP)}。题库把“风险防范”放在干扰位置，不属于这五个闭环环节。`,
            distinction: "不要因为风险防范在企业管理中重要，就自动把它放进“全过程闭环管控”这一固定清单。固定五环节以战略引领开始，以考核评价结束。",
            hook: "战略闭环五步：引—规—计—预—考。",
            source: "2026题库 Q148-Q149。"
        },
        "2026-Q149": {
            explanation: `全过程闭环管控五个环节为：${listText(STRATEGY_CONTROL_LOOP)}。所以“不包括”的是“风险防范”。`,
            distinction: "这道题与Q148其实是同一知识点的反向问法；把五步完整记住即可同时解决两题。",
            hook: "引—规—计—预—考；风险防范不在这五步里。",
            source: "2026题库 Q148-Q149。"
        },
        "2026-Q155": {
            explanation: `最新战略指标体系这里考的六个维度，与“国际领先”的六个领先一致：${listText(SIX_LEADING)}。⑤“行业发展领先”不是固定维度。`,
            distinction: "题库会把“综合实力领先”“行业发展领先”等看似合理的词塞进六个领先中；判断时必须回到六个固定名称。",
            hook: "六领先仍是：技术—服务—经营—绿色—治理—品牌。",
            source: "2026题库 Q140、Q155。"
        },
        "2026-Q173": {
            explanation: `世界一流企业的四个核心标准是：${listText(WORLD_CLASS)}。这四个词经常被拆开、换序或替换其中一项做干扰。`,
            distinction: "尤其注意“市场领先”“规模领先”等都不是这四个固定标准中的词。",
            hook: "世界一流四词：产品—品牌—创新—治理。",
            source: "2026题库 Q84、Q173、Q444。"
        }
    };

    function inferKnowledge(question) {
        if (!question || !isBank(question)) return null;
        if (BY_SOURCE[question.sourceId]) return BY_SOURCE[question.sourceId];

        const text = `${normalize(question.question)} ${Object.values(question.options || {}).map(normalize).join(" ")} ${correctText(question)}`;

        // 同类题共享固定清单：即使未来同一题换了编号/选项顺序，也仍能得到完整展开。
        if (/中国特色/.test(text) && /六个明确|五个明确|五个坚持|六个坚持/.test(text)) return q88Knowledge();
        if (/国际领先/.test(text) && /(核心技术领先|绿色发展领先|品牌价值领先|六个领先)/.test(text)) {
            return {
                explanation: `“国际领先”是追求，完整六个领先为：${listText(SIX_LEADING)}。`,
                distinction: "遇到“综合实力领先、行业发展领先、盈利能力领先、研发能力领先”等近义干扰词，要回到固定六项核对。",
                hook: "技术—服务—经营—绿色—治理—品牌。",
                source: "2026题库 Q89、Q95、Q140、Q155。"
            };
        }
        if (/能源互联网/.test(text) && /系统/.test(text)) {
            return {
                explanation: `“能源互联网”是方向，固定三个系统为：${listText(ENERGY_INTERNET_SYSTEMS)}。`,
                distinction: "“信息支撑系统”“骨干网架系统”等看似相关，但不是当前2026题库战略目标中的三系统固定名称。",
                hook: "网架—数智—价值。",
                source: "2026题库 Q141、Q412。"
            };
        }
        if (/增强核心功能/.test(text)) {
            return {
                explanation: `增强核心功能的六种角色为：${listText(CORE_FUNCTION_ROLES)}。`,
                distinction: "这类题重点区分“角色定位”和一般工作要求；固定角色词是国家队、顶梁柱、主力军、战略科技力量、领头羊、引领者。",
                hook: "国家队—顶梁柱—主力军—科技力量—领头羊—引领者。",
                source: "2026题库 Q116、Q144。"
            };
        }
        if (/提升核心竞争力/.test(text) && /(能力|关键要素)/.test(text)) {
            return {
                explanation: `提升核心竞争力的六项能力为：${listText(CORE_COMPETITIVENESS)}。`,
                distinction: "若题目问“关键要素”，还要另看科技、人才、创新等具体题干；不要把两个层级混成一张清单。",
                hook: "科技—服务—价值—转型—治理—品牌。",
                source: "2026题库 Q145-Q146、Q445。"
            };
        }
        if (/全过程闭环管控/.test(text)) {
            return {
                explanation: `战略管控全过程闭环五环节为：${listText(STRATEGY_CONTROL_LOOP)}。`,
                distinction: "风险防范不是这五个固定环节之一。",
                hook: "引—规—计—预—考。",
                source: "2026题库 Q148-Q149。"
            };
        }
        return null;
    }

    const baseGet = window.getBankMemoryKnowledge;
    window.getBankMemoryKnowledge = function (question) {
        const enhanced = inferKnowledge(question);
        if (enhanced) return enhanced;
        return typeof baseGet === "function" ? baseGet(question) : null;
    };

    // 普通刷题结果页直接读取 question.explanation，因此同步把固定清单展开写进题目解析。
    if (typeof questions !== "undefined" && Array.isArray(questions)) {
        questions.forEach(question => {
            const info = inferKnowledge(question);
            if (!info) return;
            question.explanation = `
                <strong>知识点展开：</strong>${info.explanation}
                <br><br><strong>易混辨析：</strong>${info.distinction}
                <br><br><strong>记忆：</strong>${info.hook}
            `;
        });
    }

    window.BANK_FIXED_LISTS = {
        sixClear: SIX_CLEAR.slice(),
        sixLeading: SIX_LEADING.slice(),
        energyInternetSystems: ENERGY_INTERNET_SYSTEMS.slice(),
        coreFunctionRoles: CORE_FUNCTION_ROLES.slice(),
        coreCompetitiveness: CORE_COMPETITIVENESS.slice(),
        strategyControlLoop: STRATEGY_CONTROL_LOOP.slice(),
        worldClass: WORLD_CLASS.slice()
    };
})();
