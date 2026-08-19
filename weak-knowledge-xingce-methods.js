// 行测错题方法解析：按“题型识别 → 同类题通法 → 常见误区 → 本题套用”复盘。
// 与计算机/国网必刷题的记忆型复习分离；行测不生成记忆句或记忆钩子。
(function () {
    if (window.__xingceWrongMethodInstalled) return;
    window.__xingceWrongMethodInstalled = true;

    const XINGCE_MODULES = ["资料分析", "判断推理", "言语理解", "数量关系"];

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function stripHTML(value) {
        return normalize(String(value == null ? "" : value).replace(/<[^>]*>/g, " "));
    }

    function getTask(question) {
        return studyPlan.find(task => task.id === question.taskId) || null;
    }

    function isXingceQuestion(question) {
        const task = getTask(question);
        return Boolean(question && task && task.category === "行测");
    }

    function weakScore(question) {
        const record = typeof answerHistory !== "undefined" ? answerHistory[question.id] : null;
        if (!record || Number(record.wrong || 0) <= 0) return 0;
        const wrong = Number(record.wrong || 0);
        const correct = Number(record.correct || 0);
        const blur = Number(record.memoryBlurred || 0);
        const base = wrong * 2 + blur - correct;
        return record.lastCorrect === false ? Math.max(2, base + 1) : Math.max(0, base);
    }

    function makeProfile(module, label, signal, steps, trap) {
        return { module, label, signal, steps, trap };
    }

    function verbalProfile(question) {
        const module = "言语理解";
        const text = normalize(question.question);
        const lecture = normalize(question.lectureType);
        let kind = "中心理解题";

        if (/标题|题目的是/.test(text) && /最适合|恰当/.test(text)) {
            kind = "标题拟定题";
        } else if (/接下来.*可能|下文.*可能|接下来最有可能/.test(text)) {
            kind = "下文推断题";
        } else if (/重新排列|语序正确|句子.*排列/.test(text)) {
            kind = "语句排序题";
        } else if (/填入.*横线|横线.*恰当|填入文中/.test(text)) {
            kind = "语句填入题";
        } else if (/细节|符合文意|不符合文意|理解正确|理解不正确/.test(text)) {
            kind = "细节判断题";
        } else if (/逻辑填空|依次填入|填入.*词语|最恰当的一组/.test(text)) {
            kind = "逻辑填空题";
        }

        if (kind === "标题拟定题") {
            return makeProfile(module, "标题拟定题",
                "题干要求给整段材料拟标题，重点通常是“核心对象 + 最有新闻价值/结论性的内容”，不是摘一句细节。",
                ["先判断文段到底在讲谁、讲什么新发现或核心结论。", "再看标题能否同时覆盖主题对象和重点信息。", "最后排除只写背景、只写局部细节、表述夸张或范围过大的选项。"],
                "把文中的一个醒目细节当成标题；或者只看措辞生动，不检查标题是否真正覆盖全文。"
            );
        }
        if (kind === "下文推断题") {
            return makeProfile(module, "下文推断题",
                "题干问“接下来最可能讲什么”。这类题不是概括全文，而是判断作者在当前结尾之后最自然会继续展开什么。",
                ["先看尾句停在哪个话题、概念或悬念上。", "再回看前文是否有首句设问、转折或尚未回应的问题。", "选择能承接尾句且前文尚未充分展开的内容；已经讲完的内容通常不再作为下文重点。"],
                "把全文主旨当成下文；或选择前文已经详细讲过的内容，只因为它与主题相关。"
            );
        }
        if (kind === "语句排序题") {
            return makeProfile(module, "语句排序题",
                "多个句子之间存在指代、关联词、时间顺序和话题推进关系。关键不是逐句硬排，而是先找稳定的句组。",
                ["先找适合做首句的总起句：通常无明显指代、能引出话题。", "抓“这/其/因此/同时/然而”等指代和关联词，把强绑定句先组合。", "再利用时间、空间、概念由大到小或逻辑推进关系排列句组。", "把候选顺序整体通读，检查主语、指代和逻辑是否连续。"],
                "从第一句开始逐个试排；忽略“这一”“该类”等指代必须有前文对象这一硬约束。"
            );
        }
        if (kind === "语句填入题") {
            return makeProfile(module, "语句填入题",
                "横线处承担承上、启下或承上启下功能，正确句必须同时满足话题一致和逻辑关系一致。",
                ["分别概括横线前一句和后一句在说什么。", "判断横线需要补结论、原因、转折、对策还是过渡。", "检查候选句的主体、关键词与前后文是否一致。", "代回原文通读，确认逻辑方向和语气都顺畅。"],
                "只看横线前文或只看后文；选了意思正确但无法承上启下的句子。"
            );
        }
        if (kind === "细节判断题") {
            return makeProfile(module, "细节判断题",
                "题目考查选项与原文信息是否一致，核心是逐项定位，而不是凭印象概括。",
                ["把每个选项拆成主体、关系、程度、范围、时态等信息点。", "回原文定位对应句，逐项一一核对。", "重点警惕偷换主体、扩大范围、程度绝对化、因果倒置和无中生有。"],
                "因为选项“听起来合理”就选；没有回到原文核对限定词和逻辑关系。"
            );
        }
        if (kind === "逻辑填空题") {
            return makeProfile(module, "逻辑填空题",
                "不仅考词义，还考词语与上下文的逻辑对应、感情色彩、搭配对象和语体。",
                ["先不看选项，判断空格在句中的逻辑功能和语义方向。", "利用前后文的解释、反义、并列、递进、因果等对应关系缩小范围。", "再比较词义侧重点、固定搭配、感情色彩和语体。", "最后把整句代入，优先选择上下文约束最严密的一组。"],
                "只比较几个词的字面近义关系，而忽略上下文已经给出的逻辑提示。"
            );
        }

        const structure = lecture && /结构|中心理解|新闻类/.test(lecture) ? lecture : "";
        if (/后对策/.test(structure)) {
            return makeProfile(module, "中心理解题 · 后对策结构",
                "前文通常先交代背景、问题或原因，后文用“需要/应该/必须/亟待/要”等提出解决办法。",
                ["先快速压缩前文：它是在交代背景还是指出问题。", "看到后段明确对策词后，把注意力移到对策主体、手段和目的。", "答案优先概括核心对策；前面的背景、现象和例子一般不是主旨。", "核对选项是否偷换对策主体、扩大范围或只写问题没写解决办法。"],
                "被前半段篇幅带跑，只概括问题或背景；或者选一个“方向正确”但主体、范围不对应的泛化对策。"
            );
        }
        if (/前对策/.test(structure)) {
            return makeProfile(module, "中心理解题 · 前对策结构",
                "作者先提出观点、要求或核心做法，后文主要是在解释其必要性、意义或具体展开。",
                ["先锁定前段出现的“要/应/必须/需要”等观点句。", "判断后文是不是在举例、解释原因或补充效果，而不是提出新的中心。", "主旨选项优先保留前面的核心观点，再用后文检查范围是否准确。"],
                "把后面的论据或效果当成主旨，忽略最先出现的总观点。"
            );
        }
        if (/总分总/.test(structure)) {
            return makeProfile(module, "中心理解题 · 总分总结构",
                "首句提出主题或观点，中间分层展开，尾句再次归纳或升华。",
                ["先读首句确定话题和初步观点。", "中间部分只提炼各分句共同服务的内容，不陷入细节。", "最后用尾句校准中心，选择能同时覆盖首尾共同信息的选项。"],
                "只抓首句或只抓尾句，导致漏掉作者最终限定的范围。"
            );
        }
        if (/分总/.test(structure)) {
            return makeProfile(module, "中心理解题 · 分总结构",
                "前文铺材料、列事实或分点说明，最后一句给出总结判断。",
                ["前文先只做压缩，不急着定主旨。", "重点寻找结尾的总结词、因果词或归纳性判断。", "用前面的材料检验尾句是否确实统摄全文，再选尾句的同义概括。"],
                "因为前文例子具体、篇幅长，就把某个例子误当成中心。"
            );
        }
        if (/总分/.test(structure)) {
            return makeProfile(module, "中心理解题 · 总分结构",
                "首句或前段先给总观点，后面通过例子、原因、分类或解释展开。",
                ["先锁定能够统领后文的总起句。", "判断后文每一部分是不是都在证明或展开它。", "选项优先做总句的准确同义替换，避免选择某个分论点。"],
                "只记住后文某个例子或分支，没有回到能够统领所有材料的总句。"
            );
        }
        if (/并列/.test(structure)) {
            return makeProfile(module, "中心理解题 · 并列结构",
                "多个分句地位相当，共同说明一个更上位的主题；没有哪一部分天然比其他部分更重要。",
                ["分别用短语概括每个并列部分。", "寻找这些部分的共同主体、共同作用或共同结论。", "答案要能同时覆盖所有并列项，而不是只概括其中一项。"],
                "看到其中一个熟悉或篇幅较长的分句就当作重点，造成以偏概全。"
            );
        }
        if (/转折|对比/.test(structure)) {
            return makeProfile(module, "中心理解题 · 转折/对比结构",
                "文段通过“但/然而/实际上/与……相比”等改变论述方向，转折后的信息通常承担更高权重。",
                ["先标出转折词并概括转折前后分别说什么。", "判断作者是在纠正旧认识、提出新问题，还是给出新结论。", "主旨优先概括转折后的核心，同时保留必要的对比关系。"],
                "前后信息都看到了，却没有区分作者真正要强调的是哪一侧。"
            );
        }
        if (/因果/.test(structure)) {
            return makeProfile(module, "中心理解题 · 因果结构",
                "材料围绕某个结果解释原因，或由若干原因推出结论。题目关键是先分清“因”和“果”。",
                ["圈出“因为/因此/导致/故而/所以”等因果标志。", "明确题干主体是在解释原因还是强调结果。", "根据题目问法选择与核心因果方向一致的概括。"],
                "因果两端都在原文里，于是把原因当结论、把结论当原因。"
            );
        }
        if (/背景|正文|新闻类/.test(structure)) {
            return makeProfile(module, "中心理解题 · 背景—正文结构",
                "前文介绍历史、常识或技术背景，真正的新信息往往从“目前/近年来/日前/最新/我国”等位置开始。",
                ["把背景压缩成一句，只确认它在为谁铺垫。", "寻找时间更新词或研究/政策动作，定位正文起点。", "优先概括正文的新发现、新进展或新做法。"],
                "背景知识很专业或篇幅很长，于是误把背景当成作者真正要传达的新信息。"
            );
        }
        return makeProfile(module, "中心理解题",
            "题干要求概括主旨、意图或主要观点。核心是判断文段结构和作者真正推进到的结论，而不是选一个“文中提到过”的选项。",
            ["先用关联词和句间关系判断结构：转折、因果、总分、并列、问题—对策等。", "找能够统领其他句子的观点句或结论句。", "把选项与中心句逐一比对主体、范围、程度和逻辑关系。", "排除只概括背景、例子、原因之一或范围过大的选项。"],
            "把“文中出现过”误当成“主旨”；没有区分中心句与背景、例证、解释句。"
        );
    }

    function reasoningProfile(question) {
        const module = "判断推理";
        const task = getTask(question);
        const topic = normalize(question.knowledgePoint || question.topic || task?.name);
        const text = `${normalize(question.question)} ${stripHTML(question.explanation)} ${topic}`;

        if (/归因/.test(topic) || /导致|因此.*结论|研究.*发现/.test(text)) {
            if (/继发关联/.test(topic) || /共同原因/.test(text)) {
                return makeProfile(module, topic || "归因论证 · 继发关联",
                    "题干看到 A 与 B 同时出现，就推成“A 导致 B”。继发关联型削弱要找第三个因素 C，同时导致 A 和 B。",
                    ["先把题干因果关系写成 A → B。", "检查选项是否提出共同原因 C，并且 C → A、C → B。", "若存在共同原因，则 A 与 B 的相关性不能证明 A 导致 B。", "排除只说“还有其他因素”但没有说明它与题干分组或结果有关的泛泛他因。"],
                    "把任何“其他因素”都当成强削弱。真正有力的继发关联必须解释为什么 A、B 会一起变化。"
                );
            }
            if (/另有他因/.test(topic) || /另一个可能影响|实验组|对照组|两组/.test(text)) {
                return makeProfile(module, topic || "归因论证 · 另有他因质疑",
                    "题干通常比较两组或观察某种现象后，把结果归因于一个因素。削弱时要找两组之间另一个真正不同、且能解释结果的变量。",
                    ["先找实验组/对照组或高组/低组的分组标准。", "写清题干归因：题干认为“差异 X → 结果 Y”。", "在选项中找另一个两组确实存在差异的因素 Z，且 Z 也能导致 Y。", "优先选择能直接解释结果的具体他因；只说某因素“也会影响 Y”但没说明两组有差异，通常力度弱。"],
                    "忽略“是否在两组之间形成差异”。这是归因题最常见的伪他因陷阱。"
                );
            }
            if (/因果倒置|反向因果/.test(topic + text)) {
                return makeProfile(module, topic || "归因论证 · 因果倒置",
                    "题干把 A 与 B 的关系写成 A → B，选项若能说明真实方向可能是 B → A，就直接动摇因果方向。",
                    ["先写出题干因果方向 A → B。", "找选项是否明确提出 B 会导致 A。", "确认它是在反转因果方向，而不是单纯说明 A、B 有关联。", "反向因果若能完整解释原现象，通常属于力度较强的削弱。"],
                    "只要看到因果两个变量都出现就选；必须确认方向确实反过来了。"
                );
            }
            return makeProfile(module, topic || "归因论证",
                "题干由实验、调查或相关关系推出因果结论。核心任务是检查这个“原因解释结果”的过程是否唯一、方向是否正确。",
                ["先把现象、原因和结论拆开，写出题干的因果箭头。", "削弱时优先找另有他因、共同原因、因果倒置、实验设计缺陷；支持时优先排除他因或补充机制。", "比较选项时看谁最直接作用于题干因果链，而不是谁提供的信息最丰富。"],
                "不先画出题干因果关系，直接凭选项内容“像不像反驳”作答。"
            );
        }
        if (/削弱|质疑/.test(text)) {
            return makeProfile(module, topic || "一般质疑",
                "题目要求削弱论证。要先拆出“论据 → 结论”，再寻找能让这条推理变得不可靠的信息。",
                ["先找结论，再找它依赖的主要论据。", "判断两者之间缺了哪一步联系。", "优先选择直接反驳结论、切断论据与结论、提出强他因或反向因果的选项。", "无关信息、只削弱背景、不触及核心推理的选项力度较弱。"],
                "只看选项语气是否“负面”，而没有检查它是否真正打到了题干论证链。"
            );
        }
        if (/支持|加强/.test(text)) {
            return makeProfile(module, topic || "支持论证",
                "题目要求让“论据 → 结论”更可靠，常见方式是补充正向机制、排除其他解释或增加新证据。",
                ["先写出题干结论和已有论据。", "找论据到结论之间缺少的连接。", "优先选择能建立联系、排除他因、补充机制或提供直接新证据的选项。", "比较力度时看选项是否直接服务于核心结论。"],
                "把“与结论方向一致”当成支持，却没有判断它是否提供了新的有效理由。"
            );
        }
        if (/前提|假设/.test(text)) {
            return makeProfile(module, topic || "前提论证",
                "前提题找的是论证成立不可缺少的条件，而不是一般的支持信息。",
                ["先拆出论据和结论。", "对候选项使用“否定代入”：假如该项不成立，原结论还能否从论据推出。", "一旦否定后论证链断裂，该项就是必要前提。", "若否定后只是让结论变弱但仍可成立，它更像一般支持项。"],
                "把“能支持结论”误当成“必须成立”。前提要求的是不可缺少。"
            );
        }
        if (/推出|翻译推理|逻辑关系/.test(topic + text)) {
            return makeProfile(module, topic || "推出推理",
                "题干给出形式化条件，重点是严格按逻辑规则推出，不能加入常识。",
                ["把条件翻译成清晰的逻辑关系。", "优先使用逆否、传递、且/或关系等确定规则。", "逐项检验是否必然成立，而不是“可能成立”。"],
                "凭现实常识补条件；把“可能”当成“必然”。"
            );
        }
        if (/分析推理/.test(topic + text)) {
            return makeProfile(module, topic || "分析推理",
                "题干给出多个对象和约束条件，需要通过列表、排除、代入等方式找到满足全部条件的安排。",
                ["先把对象和硬约束整理成表格或符号。", "从信息量最大的条件入手锁定位置或组合。", "必要时用选项代入，比从头穷举更快。", "每一步都检查是否与已有条件冲突。"],
                "在脑中同时记所有条件，导致漏条件或把“可能”误成“必须”。"
            );
        }
        if (/图形/.test(topic + text)) {
            return makeProfile(module, topic || "图形推理",
                "图形题要按规律维度逐层排查，而不是凭视觉相似度。",
                ["先看元素组成是否相同：相同优先位置规律，不同优先数量/属性规律。", "再查点、线、面、角、对称、曲直、封闭等常见数量与属性。", "立体题再用公共边、相对面、时针法等空间规则验证。"],
                "第一眼觉得“像”就选，没有用可重复验证的规律检查整组图形。"
            );
        }
        if (/定义判断/.test(topic + text)) {
            return makeProfile(module, topic || "定义判断",
                "定义判断的核心是把长定义拆成必要要件，再逐项匹配。",
                ["圈出主体、客体、方式、目的、条件、结果等关键限定。", "把定义压缩成若干必须同时满足的要件。", "逐项检查，缺一个必要要件就排除。"],
                "抓住一个关键词就认为符合定义，忽略其他必要限定。"
            );
        }
        if (/类比推理/.test(topic + text)) {
            return makeProfile(module, topic || "类比推理",
                "先抽象题干两词/多词之间的关系，再寻找关系层级和方向都一致的选项。",
                ["明确题干关系：种属、组成、功能、对应、因果、先后、职业工具等。", "检查关系方向是否一致。", "若多个选项都成立，再比较关系的精确层级和是否存在二级关系。"],
                "只看词语语义相关，而没有比较“关系类型”和“关系方向”。"
            );
        }
        return makeProfile(module, topic || task?.name || "判断推理",
            "先识别题目所属推理模型，再使用该模型的固定判断规则。",
            ["明确题目问的是削弱、支持、推出、匹配还是排序。", "把题干信息结构化，减少自然语言干扰。", "只选择能够满足该题型逻辑要求的选项。"],
            "没有先识别题型，就直接逐项凭感觉比较。"
        );
    }

    function extractDataSubtype(question) {
        const q = normalize(question.question);
        const ex = stripHTML(question.explanation);
        const prefix = q.match(/｜\s*(?:\d+(?:\.\d+)*\s*)?([^（(]+?)(?=\s*[（(]|$)/);
        if (prefix && normalize(prefix[1])) return normalize(prefix[1]);
        const method = ex.match(/按讲义[“"]([^”"]+)[”"]/);
        if (method && normalize(method[1])) return `速算技巧 · ${normalize(method[1])}`;
        const keywords = ["一般基期", "间隔基期", "基期和差", "已知变化情况求基期", "增长量", "增长率", "现期量", "基期量", "比重", "平均数", "倍数", "比较", "盐水类", "混合增长率"];
        const combined = `${q} ${ex}`;
        return keywords.find(key => combined.includes(key)) || "";
    }

    function dataProfile(question) {
        const module = "资料分析";
        const task = getTask(question);
        const subtype = extractDataSubtype(question) || normalize(question.knowledgePoint || question.topic || task?.name) || "资料分析";
        const combined = `${normalize(question.question)} ${stripHTML(question.explanation)} ${subtype}`;

        if (/尾数法/.test(combined)) return makeProfile(module, "速算技巧 · 尾数法", "多个整数精确加减，且选项末位/末两位差异明显时，可先用尾数快速排除。", ["只计算各数末位或末两位。", "把尾数结果与选项尾数比对排除。", "若仍有多个候选，再进行完整计算。"], "选项尾数不具区分度时仍硬用尾数法，反而增加步骤。");
        if (/高位叠加/.test(combined)) return makeProfile(module, "速算技巧 · 高位叠加", "题目只需判断大致区间、量级或选项差距较大时，不必从低位开始精算。", ["从最高位开始累计，先判断结果量级。", "一旦结果已能落入唯一选项区间即可停止。", "只有选项接近时才补算低位。"], "题目只需要区间判断，却从个位开始逐位精确相加。");
        if (/分段法/.test(combined)) return makeProfile(module, "速算技巧 · 分段法", "连续做三四位数减法、尤其容易多次借位时，可把数字按高低位拆段处理。", ["把数拆成高位段和低位段。", "先处理容易计算的部分，再合并结果。", "逐项与题干阈值比较，不必保留无用精度。"], "连续借位导致心算出错；或者算完全部差值后才比较阈值。");
        if (/乘法拆分/.test(combined)) return makeProfile(module, "速算技巧 · 乘法拆分", "百分数接近常见分数或整百分比时，可拆成易算部分再相加。", ["把百分比拆成 50%、25%、10%、5%、1% 等易算部分。", "分别计算后相加/相减。", "根据选项差距决定是否需要精确到个位。"], "为了追求精确直接做复杂乘法，忽略选项本身允许估算。");
        if (/415份数法/.test(combined)) return makeProfile(module, "速算技巧 · 415份数法", "增长率接近常见分数时，把基期、增长量、现期看作固定份数关系，可快速估增长量或基期。", ["先把增长率近似成简单分数。", "建立基期 A、增长量 X、现期 B 的份数关系。", "先估算，再根据原增长率与近似值的大小关系做修正。"], "只背“415”而不知道它来自 A、X、B 的比例关系，增长率一变就不会用。");
        if (/假设分配法/.test(combined)) return makeProfile(module, "速算技巧 · 假设分配法", "当 ABRX 关系式直接算不顺时，可先假设一个接近选项的量，再用关系式检验偏大偏小。", ["先明确 A、B、R、X 中已知和未知量。", "从接近的选项或易算数开始假设。", "代回 X=A×R、B=A+X 等关系检查。", "根据偏差方向修正并锁定选项。"], "把“假设值”误当成真实值；假设只是为了利用关系检验和逼近。");
        if (/间隔基期/.test(combined)) return makeProfile(module, "ABRX · 间隔基期", "题目要求跨两个或多个增长周期还原更早基期，不能只除一次 (1+r)。", ["先合成间隔增长率：R=(1+r₁)(1+r₂)-1。", "再用基期 A=B÷(1+R) 还原。", "若题目给平均增速，则按对应周期连乘。", "最后按选项精度取近似。"], "把两段增长率直接相加，忽略 r₁×r₂ 的交叉项；或只还原一个周期。");
        if (/基期和差/.test(combined)) return makeProfile(module, "ABRX · 基期和差", "题目要求多个对象在同一基期的和、差或一段累计值，必须先分别还原，再做加减。", ["对每个对象分别用 A=B÷(1+R) 还原到同一基期。", "确认单位和时间口径一致。", "再按题目要求求和、求差或“累计减单月”。", "最后匹配选项。"], "直接对现期量先加减再统一除增长率；不同对象增长率不同时这样做是错的。");
        if (/已知变化情况求基期/.test(combined) || /X=A×R|A=X÷R/.test(combined)) return makeProfile(module, "ABRX · 已知增长量求基期", "题干同时给增长量 X 和增长率 R，问基期量 A，可直接利用 X=A×R。", ["识别增长量 X 与增长率 R。", "由 X=A×R 得 A=X÷R。", "若还有第二个对象，分别求出基期后再进行题目要求的比较或作比。"], "把 A 错写成 B÷R。B 是现期量；只有增长量 X 才满足 X=A×R。");
        if (/一般基期/.test(combined) || /A=B÷\(1\+R\)/.test(combined)) return makeProfile(module, "ABRX · 一般基期", "题干给现期量 B 和同比/增长率 R，问上期/基期量 A。", ["先确认 B 是现期、R 是相对基期的增长率。", "套用 A=B÷(1+R)；下降时 R 为负，分母小于 1。", "计算后根据选项差距决定保留精度。"], "把基期错算成 B÷R；或看到“下降”时仍把分母写成 1+正增长率。");
        if (/增长量/.test(combined)) return makeProfile(module, "ABRX · 增长量", "题目问“增加/减少了多少”，目标是变化量 X，而不是增长率 R 或基期 A。", ["识别已知的是 B、A 还是 R。", "常用 X=B-A；若已知 B、R，则 X=B×R÷(1+R)。", "先判断正负和量级，再精算。"], "把“增长量”和“增长率”混为一谈；结果单位应是具体量，不是百分数。");
        if (/比重/.test(combined)) return makeProfile(module, subtype, "题目出现“占比/比重/其中……占……”等，核心是部分量÷整体量，并注意现期与基期口径。", ["先明确部分量和整体量。", "现期比重直接用部分÷整体。", "基期比重要分别还原或使用比重变化公式。", "比较题先判断分子、分母增速关系再决定比重升降。"], "分子分母主体搞反；或用现期数据直接回答基期比重。");
        if (/平均/.test(combined)) return makeProfile(module, subtype, "平均数题先找“总量/份数”关系，涉及基期时还要同时处理分子分母的增长率。", ["确定平均数=总量÷份数。", "把题干两个量的时间口径统一。", "若求基期平均数，分别还原总量与份数或使用对应公式。", "注意单位是否需要换算。"], "只还原分子不还原分母；或忽略“每、均、人均”等单位关系。");
        return makeProfile(module, subtype,
            "先判断题目究竟在问基期、现期、增长量、增长率、比重、平均数还是比较，再选择对应关系式。",
            ["先圈时间：现期与基期分别是哪一年/哪一段。", "再圈量：题目给的是 B、A、R、X 中哪些量。", "根据目标量选择公式或比较方法。", "利用计算器时先列式再输入，避免公式方向输反。"],
            "没完成“时间 + 所求量”的识别就直接按数字计算，最容易把公式方向用反。"
        );
    }

    function quantityProfile(question) {
        const module = "数量关系";
        const task = getTask(question);
        const topic = normalize(question.knowledgePoint || question.topic || task?.name) || "数量关系";
        const text = `${topic} ${normalize(question.question)}`;
        const rules = [
            [/工程|合作完工|效率/, "出现“若干人/机器完成工程、效率、合作多久”等，核心关系是工作总量 = 效率 × 时间。", ["把总工程量设为便于整除的值或直接设为1。", "根据已知时间求各对象效率。", "合作时效率相加，再用时间=总量÷总效率。", "若有先后工作，分阶段列式。"], "把合作时间直接相加减，忽略真正能相加的是工作效率。"],
            [/容斥/, "题目出现两个或三个集合的重复统计，目标是总数、至少一种、都不等。", ["先画集合或明确各集合含义。", "两集合用 A∪B=A+B-A∩B。", "三集合按题型使用容斥公式并注意三者交集。", "把“都不/至少/只”翻译清楚再代数。"], "重复部分加了两次却没有减回，或混淆“至少一种”和“只一种”。"],
            [/利润|售价|折扣|成本/, "出现成本、售价、利润率、折扣、销量变化等，先统一利润关系。", ["写出利润=售价-成本，利润率=利润÷成本。", "有折扣先换成实际售价。", "涉及总利润时乘销量。", "函数最值题再把总利润写成关于未知量的函数。"], "利润率分母用成售价；或者只比较单件利润而忘了销量变化。"],
            [/排列|组合|相邻|不相邻|环形/, "题目问不同安排、选法或顺序数量，关键先判断是否考虑顺序。", ["先判断是排列还是组合。", "相邻用捆绑法，不相邻常用插空法。", "特殊元素优先处理限制条件。", "环形排列注意消除整体旋转造成的重复。"], "没有判断顺序是否重要，直接套排列或组合公式。"],
            [/概率/, "题目问某事件发生概率，核心是有利情况数÷所有等可能情况数。", ["先确定样本空间是否等可能。", "分别计数总情况与有利情况。", "复杂事件可用对立事件：P(A)=1-P(非A)。", "有先后抽取时注意是否放回。"], "把不等可能情况按等可能计数；或忽略放回/不放回导致分母变化。"],
            [/周期|日期/, "事件按固定周期重复，或日期星期循环，关键是取模找余数。", ["先确定一个完整周期长度。", "把总次数/总天数除以周期取余。", "用余数定位最终状态。", "日期题注意起点是否计入。"], "周期长度找错，或出现“第1天”时发生计数偏差。"]
        ];
        const hit = rules.find(rule => rule[0].test(text));
        if (hit) return makeProfile(module, topic, hit[1], hit[2], hit[3]);
        return makeProfile(module, topic,
            "数量关系先识别模型，再把自然语言转换成数量关系或方程；计算器只能替代运算，不能替代建模。",
            ["明确未知量和题目真正所求。", "把条件翻译成等式、不等式、比例或计数关系。", "优先选择方程法、比例法或代入选项中最直接的一种。", "计算后回到原条件验算单位和范围。"],
            "一看到数字就计算，没有先建立关系式，导致运算很多但方向错误。"
        );
    }

    function getProfile(question) {
        if (!isXingceQuestion(question)) return null;
        const module = normalize(getTask(question)?.module);
        if (module === "言语理解") return verbalProfile(question);
        if (module === "判断推理") return reasoningProfile(question);
        if (module === "资料分析") return dataProfile(question);
        if (module === "数量关系") return quantityProfile(question);
        return makeProfile(module || "行测", normalize(question.topic) || "未分类题型", "先识别题型，再选择对应方法。", ["确定题目问法。", "结构化题干条件。", "按该题型规则求解并核对。"], "未识别题型就直接凭感觉作答。");
    }

    window.getXingceMethodProfile = getProfile;

    function questionMeta(question) {
        const record = typeof answerHistory !== "undefined" ? answerHistory[question.id] : null;
        return [normalize(question.sourceId), `错 ${Number(record?.wrong || 0)} 次`].filter(Boolean).join(" · ");
    }

    function questionApplicationHTML(question) {
        return `
            <article class="xingce-question-application">
                <div class="xingce-question-application-head"><strong>本题怎么套</strong><span>${escapeHTML(questionMeta(question))}</span></div>
                <div class="xingce-original-analysis">${question.explanation || "<p>该题暂无题库解析。</p>"}</div>
                ${question.note ? `<div class="xingce-method-note"><b>本题提醒</b>${escapeHTML(question.note)}</div>` : ""}
            </article>`;
    }

    function makeMethodItem(group) {
        const profile = getProfile(group.questions[0]);
        const recordWrong = group.questions.reduce((sum, q) => sum + Number((typeof answerHistory !== "undefined" ? answerHistory[q.id] : null)?.wrong || 0), 0);
        const score = group.questions.reduce((sum, q) => sum + weakScore(q), 0);
        const details = document.createElement("details");
        details.className = "weak-knowledge-item weak-xingce-method-item";
        details.dataset.xingceMethod = profile.label;
        details.innerHTML = `
            <summary>
                <div class="weak-summary-main"><div><strong>${escapeHTML(profile.label)}</strong><small>行测 · ${escapeHTML(profile.module)} · ${group.questions.length} 道关联错题 · 累计错 ${recordWrong} 次</small></div></div>
                <span class="weak-priority">${score >= 8 ? "重点理解" : score >= 4 ? "需要巩固" : "轻度薄弱"}</span>
            </summary>
            <div class="weak-knowledge-body xingce-method-body">
                <section class="xingce-method-overview">
                    <div class="xingce-method-block"><b>题型识别</b><p>${escapeHTML(profile.signal)}</p></div>
                    <div class="xingce-method-block"><b>同类题通法</b><ol>${profile.steps.map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol></div>
                    <div class="xingce-method-block xingce-method-trap"><b>常见误区</b><p>${escapeHTML(profile.trap)}</p></div>
                </section>
                <section class="xingce-applications">${group.questions.slice().sort((a, b) => weakScore(b) - weakScore(a)).map(questionApplicationHTML).join("")}</section>
            </div>`;
        return details;
    }

    function groupedByModuleAndType() {
        const modules = new Map(XINGCE_MODULES.map(name => [name, new Map()]));
        questions.forEach(question => {
            if (!isXingceQuestion(question) || weakScore(question) <= 0) return;
            const profile = getProfile(question);
            if (!modules.has(profile.module)) modules.set(profile.module, new Map());
            const typeMap = modules.get(profile.module);
            if (!typeMap.has(profile.label)) typeMap.set(profile.label, { label: profile.label, questions: [], score: 0 });
            const group = typeMap.get(profile.label);
            group.questions.push(question);
            group.score += weakScore(question);
        });
        return modules;
    }

    function transformXingceWeakSection() {
        const section = document.querySelector("#wrong-list .weak-knowledge-section");
        const major = section && section.querySelector(".weak-major-xingce");
        if (!section || !major) return;
        const grouped = groupedByModuleAndType();
        let totalTypes = 0;
        major.querySelectorAll(".weak-subgroup").forEach(subgroup => {
            const moduleName = normalize(subgroup.querySelector(".weak-subgroup-heading strong")?.textContent);
            const countNode = subgroup.querySelector(".weak-subgroup-heading span");
            const list = subgroup.querySelector(".weak-subgroup-list");
            if (!list) return;
            const typeMap = grouped.get(moduleName) || new Map();
            const groups = [...typeMap.values()].sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "zh-CN"));
            totalTypes += groups.length;
            list.innerHTML = "";
            if (!groups.length) list.innerHTML = `<div class="weak-subgroup-empty">暂无薄弱题型</div>`;
            else groups.forEach(group => list.appendChild(makeMethodItem(group)));
            if (countNode) countNode.textContent = `${groups.length} 类`;
        });
        const majorCount = major.querySelector(".weak-major-summary small");
        if (majorCount) majorCount.textContent = `${totalTypes} 个薄弱题型`;
        const heading = section.querySelector(".weak-knowledge-heading > div");
        if (heading && !heading.querySelector(".xingce-understanding-note")) {
            const note = document.createElement("span");
            note.className = "xingce-understanding-note";
            note.textContent = "行测按题型和解法复盘；计算机/国网仍按知识记忆复习";
            heading.appendChild(note);
        }
    }

    function installStyles() {
        if (document.getElementById("xingce-wrong-method-style")) return;
        const style = document.createElement("style");
        style.id = "xingce-wrong-method-style";
        style.textContent = `
            .weak-xingce-method-item > summary { background:#fbfcff!important; border-left:3px solid #6676a8; }
            .weak-xingce-method-item .weak-summary-main strong { color:#34446f!important; font-size:13px!important; font-weight:850!important; }
            .weak-xingce-method-item .weak-priority { background:#eef1f8; color:#53638f; }
            .xingce-method-body { display:grid!important; gap:12px!important; background:#fcfdff; }
            .xingce-method-overview { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; }
            .xingce-method-block { padding:11px 12px; border:1px solid #e2e7f1; border-radius:10px; background:#fff; }
            .xingce-method-block b,.xingce-question-application-head strong,.xingce-method-note b { color:#4d5f91; font-size:11px; font-weight:850; }
            .xingce-method-block p { margin:6px 0 0; color:#414b60; font-size:12px; line-height:1.75; }
            .xingce-method-block ol { margin:6px 0 0 18px; padding:0; color:#414b60; font-size:12px; line-height:1.75; }
            .xingce-method-block li+li { margin-top:3px; }
            .xingce-method-trap { background:#fffaf7; border-color:#eee1d8; }
            .xingce-method-trap b { color:#8a6247; }
            .xingce-applications { display:grid; gap:9px; }
            .xingce-question-application { padding:12px 13px; border:1px solid #e4e8ef; border-radius:10px; background:#fff; }
            .xingce-question-application-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding-bottom:7px; border-bottom:1px dashed #e0e5ec; }
            .xingce-question-application-head span { color:#9299a8; font-size:10px; }
            .xingce-original-analysis { margin-top:8px; color:#3f4859; font-size:12px; line-height:1.8; }
            .xingce-original-analysis strong { color:#34446f; }
            .xingce-method-note { margin-top:8px; padding-top:8px; border-top:1px dashed #e1e6ee; color:#566073; font-size:11px; line-height:1.7; }
            .xingce-method-note b { margin-right:6px; }
            .xingce-understanding-note { color:#66708a!important; }
            @media(max-width:820px){.xingce-method-overview{grid-template-columns:1fr;}}
            @media(max-width:680px){.xingce-question-application-head{align-items:flex-start;flex-direction:column;gap:3px;}}
        `;
        document.head.appendChild(style);
    }

    installStyles();
    const baseRenderWrongList = window.renderWrongList;
    if (typeof baseRenderWrongList === "function") {
        window.renderWrongList = function (...args) {
            const result = baseRenderWrongList.apply(this, args);
            transformXingceWeakSection();
            return result;
        };
    }
    transformXingceWeakSection();
})();
