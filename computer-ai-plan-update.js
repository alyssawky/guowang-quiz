// 2026-08-23 计算机前沿知识补充：把深度学习、大模型与大数据分析安排为完整一周专项，同时保持11月30日第一轮验收。
(function () {
    if (!Array.isArray(window.studyPlan) && typeof studyPlan === "undefined") return;
    const plan = Array.isArray(window.studyPlan) ? window.studyPlan : studyPlan;

    function patchTask(id, changes) {
        const task = plan.find(item => item && item.id === id);
        if (!task) return;
        Object.assign(task, changes);
    }

    // Week 9：只完成原网课第十一章，不把新增AI内容挤进周末。
    patchTask("computer-012", {
        module: "第十一章 IT前沿技术",
        name: "第十一章 IT前沿技术（11-1 云计算；11-2 大数据；11-3 物联网；11-4 机器学习；11-5 人工智能；11-6 物联网应用；11-7 区块链） + 本章测验",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18"
    });

    // Week 10：新增内容独立占一整周，按天拆分；最后一天只做测验、错题和关系梳理。
    patchTask("computer-013", {
        module: "AI与大数据前沿专项",
        name: "AI与大数据前沿专项（10/19 AI→机器学习→深度学习→大模型关系 + 机器学习基本概念；10/20 神经网络与深度学习基础，掌握神经元/层/CNN/RNN的用途；10/21 Transformer与大语言模型基础，掌握Token、预训练、微调；10/22 生成式AI、Prompt与RAG；10/23 多模态、AI Agent、幻觉、AI伦理与安全，以及数据-算法-算力、CPU/GPU/NPU辨析；10/24 大数据分析理念：采集→清洗→存储→分析→可视化→决策，描述性/诊断性/预测性/规范性分析；10/25 只做高校通识课相关章节测验 + 错题复盘 + 前沿知识关系图）",
        week: "Week 10",
        startDate: "2026-10-19",
        endDate: "2026-10-25",
        studySources: [
            "国家高等教育智慧教育平台《大学计算机基础》：深度学习、生成式人工智能、大模型、Prompt、AI智能体相关章节与章节测验",
            "浙江大学《人工智能通识基础（社会科学）》：机器学习、神经网络、深度学习、大模型、数据链条与数据分析相关章节与作业测试"
        ],
        scopeRule: "国网概念题口径：掌握定义、关系、特点、应用场景和基本原理；跳过代码实现、反向传播公式推导、复杂模型训练。"
    });

    // Week 11：章级复盘和知识树本质上属于同一轮整理，合并在同一周完成，避免挤掉后续刷题时间。
    patchTask("computer-014", {
        module: "第一轮章级复盘",
        name: "第一轮章级复盘（第1→2→3→4→5→6→9→10→11章；按章重做错题；与五模块知识树同步整理）",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01"
    });

    patchTask("computer-015", {
        module: "五模块知识树",
        name: "五模块知识树（硬件 / 软件 / 网络 / 安全 / 前沿；作为章级复盘的输出，不额外占一周）",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01"
    });

    // 之后时间轴保持原计划，仍在11月30日完成第一轮验收。
    patchTask("computer-016", {
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08"
    });
    patchTask("computer-017", {
        week: "Week 13",
        startDate: "2026-11-09",
        endDate: "2026-11-15"
    });
    patchTask("computer-018", {
        week: "Week 14",
        startDate: "2026-11-16",
        endDate: "2026-11-22"
    });
    patchTask("computer-019", {
        week: "Week 15",
        startDate: "2026-11-23",
        endDate: "2026-11-29"
    });
    patchTask("computer-020", {
        week: "验收日",
        startDate: "2026-11-30",
        endDate: "2026-11-30"
    });
})();
