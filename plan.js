// 正式版学习计划
// 来源：03_行测课程打卡 + 04_计算机打卡
// 每个对象就是一个网站学习/复习单元；题目通过 taskId 与这里的 id 绑定。

const studyPlan = [
    {
        id: "xingce-001",
        category: "行测",
        module: "资料分析",
        name: "实用速算技巧",
        week: "启动期",
        startDate: "2026-08-14",
        endDate: "2026-08-16",
        defaultCompleted: true
    },
    {
        id: "xingce-002",
        category: "行测",
        module: "判断推理",
        name: "逻辑论证之归因论证",
        week: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        defaultCompleted: false
    },
    {
        id: "xingce-003",
        category: "行测",
        module: "言语理解",
        name: "片段阅读整体概述",
        week: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        defaultCompleted: false
    },
    {
        id: "xingce-004",
        category: "行测",
        module: "数量关系",
        name: "和差倍比与方程法",
        week: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        defaultCompleted: false
    },
    {
        id: "xingce-005",
        category: "行测",
        module: "资料分析",
        name: "高频考点之 ABRX 类",
        week: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        defaultCompleted: false
    },
    {
        id: "xingce-006",
        category: "行测",
        module: "判断推理",
        name: "逻辑论证之一般质疑",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "xingce-007",
        category: "行测",
        module: "言语理解",
        name: "中心理解题目之结构分析",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "xingce-008",
        category: "行测",
        module: "数量关系",
        name: "工程问题",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "xingce-009",
        category: "行测",
        module: "数量关系",
        name: "整除问题和合作完工问题",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "xingce-010",
        category: "行测",
        module: "判断推理",
        name: "逻辑论证之支持、前提、解释",
        week: "Week 3",
        startDate: "2026-08-31",
        endDate: "2026-09-06",
        defaultCompleted: false
    },
    {
        id: "xingce-011",
        category: "行测",
        module: "言语理解",
        name: "中心理解题目之抓住关键信息",
        week: "Week 3",
        startDate: "2026-08-31",
        endDate: "2026-09-06",
        defaultCompleted: false
    },
    {
        id: "xingce-012",
        category: "行测",
        module: "数量关系",
        name: "余数、平方数与等差数列",
        week: "Week 3",
        startDate: "2026-08-31",
        endDate: "2026-09-06",
        defaultCompleted: false
    },
    {
        id: "xingce-013",
        category: "行测",
        module: "资料分析",
        name: "高频考点之比重类",
        week: "Week 3",
        startDate: "2026-08-31",
        endDate: "2026-09-06",
        defaultCompleted: false
    },
    {
        id: "xingce-014",
        category: "行测",
        module: "判断推理",
        name: "推出推理",
        week: "Week 4",
        startDate: "2026-09-07",
        endDate: "2026-09-13",
        defaultCompleted: false
    },
    {
        id: "xingce-015",
        category: "行测",
        module: "言语理解",
        name: "中心理解题目之选项分析",
        week: "Week 4",
        startDate: "2026-09-07",
        endDate: "2026-09-13",
        defaultCompleted: false
    },
    {
        id: "xingce-016",
        category: "行测",
        module: "数量关系",
        name: "容斥问题",
        week: "Week 4",
        startDate: "2026-09-07",
        endDate: "2026-09-13",
        defaultCompleted: false
    },
    {
        id: "xingce-017",
        category: "行测",
        module: "数量关系",
        name: "溶液问题与十字交叉法",
        week: "Week 4",
        startDate: "2026-09-07",
        endDate: "2026-09-13",
        defaultCompleted: false
    },
    {
        id: "xingce-018",
        category: "行测",
        module: "判断推理",
        name: "分析推理",
        week: "Week 5",
        startDate: "2026-09-14",
        endDate: "2026-09-20",
        defaultCompleted: false
    },
    {
        id: "xingce-019",
        category: "行测",
        module: "言语理解",
        name: "片段阅读之标题拟定",
        week: "Week 5",
        startDate: "2026-09-14",
        endDate: "2026-09-20",
        defaultCompleted: false
    },
    {
        id: "xingce-020",
        category: "行测",
        module: "数量关系",
        name: "经济利润问题",
        week: "Week 5",
        startDate: "2026-09-14",
        endDate: "2026-09-20",
        defaultCompleted: false
    },
    {
        id: "xingce-021",
        category: "行测",
        module: "资料分析",
        name: "高频考点之盐水类（混合思维）",
        week: "Week 5",
        startDate: "2026-09-14",
        endDate: "2026-09-20",
        defaultCompleted: false
    },
    {
        id: "xingce-022",
        category: "行测",
        module: "判断推理",
        name: "推理方式与论证结构",
        week: "Week 6",
        startDate: "2026-09-21",
        endDate: "2026-09-27",
        defaultCompleted: false
    },
    {
        id: "xingce-023",
        category: "行测",
        module: "言语理解",
        name: "片段阅读之下文推断",
        week: "Week 6",
        startDate: "2026-09-21",
        endDate: "2026-09-27",
        defaultCompleted: false
    },
    {
        id: "xingce-024",
        category: "行测",
        module: "数量关系",
        name: "经济利润之函数最值、增长相关",
        week: "Week 6",
        startDate: "2026-09-21",
        endDate: "2026-09-27",
        defaultCompleted: false
    },
    {
        id: "xingce-025",
        category: "行测",
        module: "数量关系",
        name: "和定最值与最不利极限",
        week: "Week 6",
        startDate: "2026-09-21",
        endDate: "2026-09-27",
        defaultCompleted: false
    },
    {
        id: "xingce-026",
        category: "行测",
        module: "判断推理",
        name: "图形推理之常考规律",
        week: "Week 7",
        startDate: "2026-09-28",
        endDate: "2026-10-04",
        defaultCompleted: false
    },
    {
        id: "xingce-027",
        category: "行测",
        module: "言语理解",
        name: "片段阅读之语句填入",
        week: "Week 7",
        startDate: "2026-09-28",
        endDate: "2026-10-04",
        defaultCompleted: false
    },
    {
        id: "xingce-028",
        category: "行测",
        module: "数量关系",
        name: "周期循环与日期周期问题",
        week: "Week 7",
        startDate: "2026-09-28",
        endDate: "2026-10-04",
        defaultCompleted: false
    },
    {
        id: "xingce-029",
        category: "行测",
        module: "资料分析",
        name: "高频考点之比较类",
        week: "Week 7",
        startDate: "2026-09-28",
        endDate: "2026-10-04",
        defaultCompleted: false
    },
    {
        id: "xingce-030",
        category: "行测",
        module: "判断推理",
        name: "图形推理之常见类型与提示",
        week: "Week 8",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        defaultCompleted: false
    },
    {
        id: "xingce-031",
        category: "行测",
        module: "言语理解",
        name: "片段阅读之语句排序",
        week: "Week 8",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        defaultCompleted: false
    },
    {
        id: "xingce-032",
        category: "行测",
        module: "数量关系",
        name: "平面几何问题",
        week: "Week 8",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        defaultCompleted: false
    },
    {
        id: "xingce-033",
        category: "行测",
        module: "数量关系",
        name: "立体几何与特殊几何问题",
        week: "Week 8",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        defaultCompleted: false
    },
    {
        id: "xingce-034",
        category: "行测",
        module: "判断推理",
        name: "图形推理之立体图形",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18",
        defaultCompleted: false
    },
    {
        id: "xingce-035",
        category: "行测",
        module: "言语理解",
        name: "片段阅读之细节判断",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18",
        defaultCompleted: false
    },
    {
        id: "xingce-036",
        category: "行测",
        module: "数量关系",
        name: "基础排列组合",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18",
        defaultCompleted: false
    },
    {
        id: "xingce-037",
        category: "行测",
        module: "资料分析",
        name: "高频考点之平均倍数类",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18",
        defaultCompleted: false
    },
    {
        id: "xingce-038",
        category: "行测",
        module: "判断推理",
        name: "定义判断",
        week: "Week 10",
        startDate: "2026-10-19",
        endDate: "2026-10-25",
        defaultCompleted: false
    },
    {
        id: "xingce-039",
        category: "行测",
        module: "言语理解",
        name: "逻辑填空之词义辨析",
        week: "Week 10",
        startDate: "2026-10-19",
        endDate: "2026-10-25",
        defaultCompleted: false
    },
    {
        id: "xingce-040",
        category: "行测",
        module: "数量关系",
        name: "基础概率问题",
        week: "Week 10",
        startDate: "2026-10-19",
        endDate: "2026-10-25",
        defaultCompleted: false
    },
    {
        id: "xingce-041",
        category: "行测",
        module: "数量关系",
        name: "特殊情境之相邻/不相邻问题与环形排列",
        week: "Week 10",
        startDate: "2026-10-19",
        endDate: "2026-10-25",
        defaultCompleted: false
    },
    {
        id: "xingce-042",
        category: "行测",
        module: "判断推理",
        name: "类比推理",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01",
        defaultCompleted: false
    },
    {
        id: "xingce-043",
        category: "行测",
        module: "言语理解",
        name: "逻辑填空之逻辑对应",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01",
        defaultCompleted: false
    },
    {
        id: "xingce-044",
        category: "行测",
        module: "数量关系",
        name: "特殊情境之定序、相同元素分配、错位与重复排列",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01",
        defaultCompleted: false
    },
    {
        id: "xingce-045",
        category: "行测",
        module: "资料分析",
        name: "特殊考点：拉动增长、贡献率和容斥问题",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01",
        defaultCompleted: false
    },
    {
        id: "xingce-046",
        category: "行测",
        module: "言语理解",
        name: "逻辑填空之特殊技巧",
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        defaultCompleted: false
    },
    {
        id: "xingce-047",
        category: "行测",
        module: "数量关系",
        name: "特殊情境之平均分堆与特殊概率问题",
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        defaultCompleted: false
    },
    {
        id: "xingce-048",
        category: "行测",
        module: "数量关系",
        name: "行程问题（一）",
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        defaultCompleted: false
    },
    {
        id: "xingce-049",
        category: "行测",
        module: "数量关系",
        name: "行程问题（二）",
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        defaultCompleted: false
    },
    {
        id: "xingce-050",
        category: "行测",
        module: "数量关系",
        name: "趣味杂题（一）",
        week: "Week 13",
        startDate: "2026-11-09",
        endDate: "2026-11-15",
        defaultCompleted: false
    },
    {
        id: "xingce-051",
        category: "行测",
        module: "数量关系",
        name: "趣味杂题（二）",
        week: "Week 13",
        startDate: "2026-11-09",
        endDate: "2026-11-15",
        defaultCompleted: false
    },
    {
        id: "xingce-052",
        category: "行测",
        module: "数量关系",
        name: "考场提速蒙猜技巧",
        week: "Week 13",
        startDate: "2026-11-09",
        endDate: "2026-11-15",
        defaultCompleted: false
    },
    {
        id: "xingce-053",
        category: "行测",
        module: "资料分析",
        name: "资料分析常见“思维陷阱”",
        week: "Week 13",
        startDate: "2026-11-09",
        endDate: "2026-11-15",
        defaultCompleted: false
    },
    {
        id: "computer-001",
        category: "计算机",
        module: "硬件基础",
        name: "1-4 计算机系统组成",
        week: "启动期",
        startDate: "2026-08-14",
        endDate: "2026-08-16",
        defaultCompleted: false
    },
    {
        id: "computer-002",
        category: "计算机",
        module: "数据表示",
        name: "2-1 进位记数制 + 2-2 数制转换",
        week: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        defaultCompleted: false
    },
    {
        id: "computer-003",
        category: "计算机",
        module: "硬件基础",
        name: "2-3/2-4 机器数表示 + 3-1 CPU + 3-5 冯·诺依曼体系",
        week: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        defaultCompleted: false
    },
    {
        id: "computer-004",
        category: "计算机",
        module: "数据表示",
        name: "2-6 算术运算 + 2-7 溢出 + 2-8 逻辑运算",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "computer-005",
        category: "计算机",
        module: "数据表示",
        name: "2-9 ASCII + 2-10 Unicode + 2-11 汉字编码",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "computer-006",
        category: "计算机",
        module: "硬件基础",
        name: "3-2 存储器 + 3-3 外设 + 3-4 总线接口 + 3-6 性能指标",
        week: "Week 2",
        startDate: "2026-08-24",
        endDate: "2026-08-30",
        defaultCompleted: false
    },
    {
        id: "computer-007",
        category: "计算机",
        module: "软件基础",
        name: "4-1 软件分类 + 4-2 工作模式 + 4-4 生命周期 + 4-5 开发过程模型",
        week: "Week 3",
        startDate: "2026-08-31",
        endDate: "2026-09-06",
        defaultCompleted: false
    },
    {
        id: "computer-008",
        category: "计算机",
        module: "软件基础",
        name: "5-1 操作系统概述",
        week: "Week 3",
        startDate: "2026-08-31",
        endDate: "2026-09-06",
        defaultCompleted: false
    },
    {
        id: "computer-009",
        category: "计算机",
        module: "软件基础",
        name: "5-3 文件管理 + 5-4 程序管理 + 5-5 系统安全",
        week: "Week 4",
        startDate: "2026-09-07",
        endDate: "2026-09-13",
        defaultCompleted: false
    },
    {
        id: "computer-010",
        category: "计算机",
        module: "软件基础",
        name: "操作系统查漏：进程/内存/I-O/文件管理基本概念",
        week: "Week 4",
        startDate: "2026-09-07",
        endDate: "2026-09-13",
        defaultCompleted: false
    },
    {
        id: "computer-011",
        category: "计算机",
        module: "软件基础",
        name: "6-1 程序设计语言分类 + 6-2 程序设计过程",
        week: "Week 5",
        startDate: "2026-09-14",
        endDate: "2026-09-20",
        defaultCompleted: false
    },
    {
        id: "computer-012",
        category: "计算机",
        module: "软件基础",
        name: "编译 vs 解释；源程序/目标程序/可执行程序；软件工程术语查漏",
        week: "Week 5",
        startDate: "2026-09-14",
        endDate: "2026-09-20",
        defaultCompleted: false
    },
    {
        id: "computer-013",
        category: "计算机",
        module: "网络技术",
        name: "9-1 网络概述 + 9-2 网络分类 + 9-3 数据传输",
        week: "Week 6",
        startDate: "2026-09-21",
        endDate: "2026-09-27",
        defaultCompleted: false
    },
    {
        id: "computer-014",
        category: "计算机",
        module: "网络技术",
        name: "9-4 拓扑 + 9-5 网络体系结构 + 9-6 网络互连",
        week: "Week 6",
        startDate: "2026-09-21",
        endDate: "2026-09-27",
        defaultCompleted: false
    },
    {
        id: "computer-015",
        category: "计算机",
        module: "网络技术",
        name: "9-7 TCP/IP + 9-8 IP地址 + 9-9 DNS + 9-10 Internet服务",
        week: "Week 7",
        startDate: "2026-09-28",
        endDate: "2026-10-04",
        defaultCompleted: false
    },
    {
        id: "computer-016",
        category: "计算机",
        module: "网络技术",
        name: "网络理论样题小测：IP/DNS/TCP-IP/Internet服务",
        week: "Week 7",
        startDate: "2026-09-28",
        endDate: "2026-10-04",
        defaultCompleted: false
    },
    {
        id: "computer-017",
        category: "计算机",
        module: "信息安全",
        name: "10-1 信息安全概念 + 10-2 密码技术",
        week: "Week 8",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        defaultCompleted: false
    },
    {
        id: "computer-018",
        category: "计算机",
        module: "信息安全",
        name: "10-3 防火墙 + 10-4 恶意软件 + 10-5 入侵检测",
        week: "Week 8",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        defaultCompleted: false
    },
    {
        id: "computer-019",
        category: "计算机",
        module: "信息安全",
        name: "认证、访问控制、数据安全、备份与常见防护",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18",
        defaultCompleted: false
    },
    {
        id: "computer-020",
        category: "计算机",
        module: "信息安全",
        name: "信息安全相关法律法规 + 安全模块错题整理",
        week: "Week 9",
        startDate: "2026-10-12",
        endDate: "2026-10-18",
        defaultCompleted: false
    },
    {
        id: "computer-021",
        category: "计算机",
        module: "信息科学前沿",
        name: "11-1 云计算 + 11-2 大数据",
        week: "Week 10",
        startDate: "2026-10-19",
        endDate: "2026-10-25",
        defaultCompleted: false
    },
    {
        id: "computer-022",
        category: "计算机",
        module: "信息科学前沿",
        name: "11-4 机器学习 + 11-5 人工智能",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01",
        defaultCompleted: false
    },
    {
        id: "computer-023",
        category: "计算机",
        module: "信息科学前沿",
        name: "生成式AI/大模型 + 数据/算法/算力 + CPU/GPU/NPU + AI伦理",
        week: "Week 11",
        startDate: "2026-10-26",
        endDate: "2026-11-01",
        defaultCompleted: false
    },
    {
        id: "computer-024",
        category: "计算机",
        module: "信息科学前沿",
        name: "11-3 物联网 + 11-6 物联网应用",
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        defaultCompleted: false
    },
    {
        id: "computer-025",
        category: "计算机",
        module: "综合复盘",
        name: "建立五模块知识树：硬件→软件→网络→安全→前沿",
        week: "Week 12",
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        defaultCompleted: false
    },
    {
        id: "computer-026",
        category: "计算机",
        module: "综合复盘",
        name: "对照国网2027/现行考纲逐项查漏；华南课程必看项补欠",
        week: "Week 13",
        startDate: "2026-11-09",
        endDate: "2026-11-15",
        defaultCompleted: false
    },
    {
        id: "computer-027",
        category: "计算机",
        module: "样题训练",
        name: "NCRE相关理论样题第一轮：硬件/软件/网络/安全/AI",
        week: "Week 14",
        startDate: "2026-11-16",
        endDate: "2026-11-22",
        defaultCompleted: false
    },
    {
        id: "computer-028",
        category: "计算机",
        module: "样题训练",
        name: "相关样题二做 + 错题归类；目标正确率75%–80%+",
        week: "Week 15",
        startDate: "2026-11-23",
        endDate: "2026-11-29",
        defaultCompleted: false
    },
    {
        id: "computer-029",
        category: "计算机",
        module: "验收",
        name: "五模块无首次听说概念；记录12月需要二刷的薄弱点",
        week: "验收日",
        startDate: "2026-11-30",
        endDate: "2026-11-30",
        defaultCompleted: false
    }
];
