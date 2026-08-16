// 国网必刷题记忆卡知识层。
// 原题库只有题干/选项/答案；这里把“只记答案字母”升级为“概念含义 + 易混辨析 + 记忆钩子”。
// 已核验条目优先使用中央/国务院国资委/国家能源局/国家电网公开口径；未核验题使用保守的固定表述记忆模板。
(function () {
    const VERIFIED = {
        "2026-Q38": {
            explanation: "习近平文化思想不是一个单独的文化口号，而是对新时代党领导文化建设实践经验的理论总结，并丰富和发展了马克思主义文化理论。题干问的是这一思想从哪里来、是什么性质，所以应抓住“文化建设实践经验的理论总结”这一完整表述。",
            distinction: "“文化强国”“文化繁荣”属于文化建设的目标或状态，不是这句话中被概括的实践领域；“道路建设”与题干所指的文化思想形成过程无关。",
            hook: "看到“习近平文化思想 + 实践经验的理论总结”→ 直接联想“文化建设”。",
            source: "官方口径参考：中国人大网、中央宣传思想文化工作相关公开学习材料"
        },
        "2026-Q39": {
            explanation: "“两个结合”具体指：①把马克思主义基本原理同中国具体实际相结合；②把马克思主义基本原理同中华优秀传统文化相结合。它回答的是“怎样不断推进马克思主义中国化时代化”的路径问题，因此题干出现“根本途径”时，应锁定“两个结合”。",
            distinction: "“七个着力”是2023年对宣传思想文化工作的七项着力要求；“六个必须坚持”是习近平新时代中国特色社会主义思想的世界观和方法论，即人民至上、自信自立、守正创新、问题导向、系统观念、胸怀天下；“九个坚持”是2018年对宣传思想工作规律性认识的概括。三者都重要，但层级和回答的问题不同。",
            hook: "两个结合 = 一个“实际” + 一个“文化”：中国具体实际 + 中华优秀传统文化。",
            source: "官方口径参考：党的二十大相关学习材料、共产党员网"
        },
        "2026-Q43": {
            explanation: "国家电网有限公司成立于2002年12月29日，是中央直接管理的国有独资公司，以投资建设运营电网为核心业务。考试通常只要求记年份，但把“2002年12月29日”作为完整时间点一起记更稳。",
            distinction: "2001、2003、2004都是相邻年份干扰项；这类题不要靠模糊年代感，直接固定记忆“2002-12-29”。",
            hook: "国家电网成立：2002年末——12月29日。",
            source: "官方口径参考：国务院国资委国家电网招聘公告、国家电网品牌介绍"
        },
        "2026-Q45": {
            explanation: "行为文化强调企业成员实际表现出来的行为方式和互动状态，所以会体现为经营作风、精神面貌、人际关系等“动态表现”。它是价值观和企业精神落到日常行为后的外在呈现。",
            distinction: "物质文化偏向可见的环境、设施、标识等；制度文化偏向规章制度和管理规范；精神文化偏向价值观、理念、企业精神。题干出现“经营作风、精神面貌、人际关系、动态体现”时，更符合行为文化。",
            hook: "“动态、作风、人际关系”→ 行为；“理念价值观”→ 精神；“规章”→ 制度；“看得见的载体”→ 物质。",
            source: "理解记忆：企业文化四层结构常见区分；答案仍以2026题库为准"
        },
        "2026-Q46": {
            explanation: "国家电网的企业宗旨是“人民电业为人民”。“宗旨”回答的是企业事业最终为了谁、服务谁，核心落点是人民，因此要和公司使命、企业精神分开记。",
            distinction: "“为美好生活充电，为美丽中国赋能”是企业使命；“努力超越、追求卓越”是企业精神。考试特别喜欢把宗旨、使命、精神互换做干扰项。",
            hook: "宗旨看“为谁”→ 人民电业为人民。",
            source: "官方口径参考：国家电网公开报道、国务院国资委"
        },
        "2026-Q47": {
            explanation: "“人民电业为人民”不是只背一句口号，它的价值落点是始终坚持以人民为中心的发展思想，把人民对美好生活的电力需求作为工作的出发点和落脚点。题目问“践行企业宗旨具体体现”，因此选“始终坚持以人民为中心的发展思想”。",
            distinction: "做大做优做强、科技创新、国企改革都可能是企业经营发展的重要任务，但不能直接解释“人民电业为人民”这一宗旨的核心价值指向。",
            hook: "人民电业为人民 → 以人民为中心。看到“宗旨如何践行”，先找“人民”。",
            source: "官方口径参考：国家电网公开报道、国务院国资委关于国家电网服务民生的公开材料"
        },
        "2026-Q48": {
            explanation: "国家电网企业使命是“为美好生活充电，为美丽中国赋能”。前半句对应满足人民美好生活的用电需要，后半句对应能源绿色低碳转型和美丽中国建设，因此这句话同时体现民生价值和绿色发展价值。",
            distinction: "“人民电业为人民”是企业宗旨，不是使命；“服务经济社会发展，提供可靠电力供应”更像职责性描述，不能替代国家电网现行使命的固定表述。",
            hook: "使命 = 两个“为”：为美好生活充电 + 为美丽中国赋能。",
            source: "官方口径参考：国家能源局、国务院国资委国家电网公开材料"
        },
        "2026-Q49": {
            explanation: "“为美好生活充电，为美丽中国赋能”落到供电企业的核心行动，就是提供安全、可靠、清洁、经济、可持续的电力供应，更好满足人民美好生活用电需要。它把“美好生活”落实到供电质量，也把“美丽中国”落实到清洁、可持续的能源电力发展。",
            distinction: "履行政治、经济、社会责任，服务党和国家大局，保障能源安全都属于央企的重要责任，但本题问的是企业使命的具体落点，D把使命中的“生活需要 + 清洁可持续供电”对应得最完整。",
            hook: "使命落地看五个词：安全、可靠、清洁、经济、可持续。",
            source: "官方口径参考：国家能源局、国务院国资委国家电网公开材料"
        }
    };

    const CONCEPTS = {
        "两个结合": "马克思主义基本原理同中国具体实际相结合、同中华优秀传统文化相结合。",
        "人民电业为人民": "国家电网企业宗旨，核心是坚持以人民为中心、服务人民美好生活用电需要。",
        "为美好生活充电，为美丽中国赋能": "国家电网企业使命：一端连接人民美好生活，一端连接绿色低碳转型和美丽中国建设。",
        "努力超越、追求卓越": "国家电网企业精神，强调不断超越过去、超越他人、超越自我，持续向更高质量、更高目标迈进。",
        "六个必须坚持": "人民至上、自信自立、守正创新、问题导向、系统观念、胸怀天下，是习近平新时代中国特色社会主义思想的立场观点方法的重要体现。",
        "七个着力": "对宣传思想文化工作的七项着力要求，属于工作部署层面的概括。",
        "九个坚持": "2018年全国宣传思想工作会议概括的宣传思想工作规律性认识。"
    };

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function answerText(question) {
        const keys = String(question.answer || "").split("").filter(Boolean);
        return keys.map(key => {
            const value = question.options && question.options[key];
            return value ? `${key}. ${normalize(value)}` : key;
        }).join("；");
    }

    function optionValueOnly(question) {
        const keys = String(question.answer || "").split("").filter(Boolean);
        return keys.map(key => normalize(question.options && question.options[key])).filter(Boolean).join("；");
    }

    function completeStem(question) {
        const correct = optionValueOnly(question);
        if (!correct) return normalize(question.question);
        const stem = normalize(question.question);
        const replaced = stem.replace(/[（(]\s*[）)]/, `（${correct}）`);
        return replaced === stem ? `${stem} → ${correct}` : replaced;
    }

    function genericKnowledge(question) {
        const correct = optionValueOnly(question);
        const concept = CONCEPTS[correct];
        const otherOptions = Object.entries(question.options || {})
            .filter(([key]) => !String(question.answer || "").includes(key))
            .map(([key, value]) => `${key}. ${normalize(value)}`)
            .join("；");

        return {
            explanation: concept
                ? `${concept} 本题应把它和题干一起记成完整表述：“${completeStem(question)}”。`
                : `这道旧题库原题没有提供解析。记忆时不要只背答案字母，至少先把正确项和题干连成完整表述：“${completeStem(question)}”。`,
            distinction: otherOptions
                ? `本题其他选项为：${otherOptions}。当前尚未为这些干扰项补充经官方材料核验的逐项释义，因此不把未经核验的解释冒充国网口径。`
                : "当前题目没有可供辨析的其他选项。",
            hook: correct ? `先记关键词：“${correct}”。再回到题干确认它回答的是哪一种固定表述。` : "先记完整固定表述，再记答案字母。",
            source: "原题库未附解析；此处为保守记忆模板，后续已核验条目会替换为详细知识解析。"
        };
    }

    function getKnowledge(question) {
        if (!question) return null;
        const verified = VERIFIED[question.sourceId];
        return verified || genericKnowledge(question);
    }

    window.getBankMemoryKnowledge = getKnowledge;
    window.BANK_MEMORY_VERIFIED = VERIFIED;
})();