// 2026-08-23 计算机前沿知识补充：根据国网往年经验，补足深度学习、大模型与大数据分析理念。
(function () {
    if (!Array.isArray(window.studyPlan) && typeof studyPlan === "undefined") return;
    const plan = Array.isArray(window.studyPlan) ? window.studyPlan : studyPlan;

    const frontierTask = plan.find(task => task && task.id === "computer-013");
    if (!frontierTask) return;

    frontierTask.module = "第十一章后补充｜AI与大数据前沿专项";
    frontierTask.name = "第十一章后补充｜AI与大数据前沿专项（11-8 深度学习基础：神经网络、CNN、RNN、Transformer基本概念；11-9 生成式AI与大模型：LLM、预训练/微调、Token、Prompt、RAG、幻觉、多模态、AI Agent；11-10 大数据分析理念：数据采集→清洗→存储→分析→可视化→决策，描述性/诊断性/预测性/规范性分析；11-11 AI、机器学习、深度学习、大模型关系；11-12 前沿技术综合辨析：云计算/大数据/AI/物联网/区块链及数据-算法-算力、CPU/GPU/NPU、AI伦理与安全；专项练习：高校计算机/AI通识课章节选择题与判断题，只做概念、关系、特点、应用场景和基本原理，不做代码、梯度推导和模型训练细节）";

    frontierTask.studySources = [
        "国家高等教育智慧教育平台《大学计算机基础》：深度学习、生成式人工智能、大模型、Prompt、AI智能体相关章节与章节测验",
        "浙江大学《人工智能通识基础（社会科学）》：机器学习、神经网络、深度学习、大模型、数据链条与数据分析相关章节与作业测试"
    ];
    frontierTask.scopeRule = "国网概念题口径：掌握定义、关系、特点、应用场景、基本原理；跳过代码实现、反向传播公式推导、复杂模型训练。";
})();
