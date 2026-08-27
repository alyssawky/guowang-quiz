// 国网300题｜判断题解析补全。
// 原题库判断题只有题干/正确错误/答案；统一补 explanation。
// 错误判断题必须给出“错在哪 + 正确表述”；正确判断题保留整句固定表述并提示核对重点。
(() => {
  const VERSION = 2;
  const normalize = value => String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  const stripJudgeBlank = value => normalize(value)
    .replace(/[（(]\s*[）)]\s*$/, "")
    .replace(/[。；;]\s*$/, "")
    .trim();

  const WRONG = {
    "2026-Q625": {
      wrong: "把企业宗旨和企业使命混淆了。",
      correct: "国家电网有限公司的企业宗旨是“人民电业为人民”；“为美好生活充电，为美丽中国赋能”是企业使命。",
      distinction: "宗旨回答“为了谁、服务谁”→ 人民电业为人民；使命回答“企业要承担什么价值使命”→ 为美好生活充电、为美丽中国赋能。"
    },
    "2026-Q627": {
      wrong: "“改革为本、发展为要”不是国家电网有限公司的治企理念。",
      correct: "国家电网有限公司的治企理念是“以人为本、守正创新”。",
      distinction: "治企理念固定记“以人为本 + 守正创新”。“改革为本、发展为要”不是这一固定表述。"
    },
    "2026-Q644": {
      wrong: "错误点在“企业软实力处于全球同行业最先进水平”。“国际领先”并非只强调软实力。",
      correct: "“国际领先”是追求，致力于企业综合竞争力处于全球同行业最先进水平，公司硬实力和软实力充分彰显。",
      distinction: "看到“国际领先”要抓住“企业综合竞争力”，不是只记硬实力或只记软实力。"
    },
    "2026-Q693": {
      wrong: "金融业务发展定位中的关键词被替换了：不是“聚焦主业、……创造效益”。",
      correct: "国家电网金融业务的发展定位是“根植主业、服务实业、以融强产、创造价值”。",
      distinction: "四个词按顺序记：根植主业 → 服务实业 → 以融强产 → 创造价值。题干把“根植”换成“聚焦”、把“价值”换成“效益”，因此错误。"
    },
    "2026-Q709": {
      wrong: "错误点在“一般不具备机组惯性”。太阳能热发电与光伏发电的并网特性不能混为一谈。",
      correct: "太阳能热发电通常通过热力循环驱动汽轮发电机组，能够提供旋转惯量；同时可配置大容量储热装置，使出力更加平稳、可控。",
      distinction: "光伏主要通过电力电子设备并网，天然旋转惯量弱；光热发电包含汽轮发电机组，可提供转动惯量。"
    },
    "2026-Q727": {
      wrong: "把抽水蓄能的用途缩窄成“主要用于一次调频”了。",
      correct: "抽水蓄能是电力系统中广泛应用的储能和调节方式，典型功能包括调峰填谷、调频、调相、事故备用、黑启动和提供备用容量等。",
      distinction: "抽蓄不是单一“调频设备”，它的核心考法是“一机多用、综合调节”。"
    },
    "2026-Q728": {
      wrong: "题干给出的其实更接近“非化石能源占一次能源消费的比重”，不是“可再生能源发电利用率”的定义。",
      correct: "可再生能源发电利用率通常表示可再生能源实际发电量与可用发电量的比值，用来反映可再生能源电力实际被利用的程度。",
      distinction: "“利用率”看实际发了多少 / 本来可发多少；“能源消费占比”才看某类能源占一次能源消费总量多少。"
    },
    "2026-Q732": {
      wrong: "错误点在“应收取费用”。",
      correct: "电网企业对可再生能源发电项目进行并网及运行安全检查不收取费用。",
      distinction: "本题记一个反向关键词即可：并网及运行安全检查 → 不收费。"
    },
    "2026-Q734": {
      wrong: "错误点在“新能源场站不需参与调节”。随着新能源占比提高，新能源场站同样需要参与系统调节。",
      correct: "电力系统要统筹建设足够的调节能力；常规电厂应具备必要的调峰、调频、调压能力，新能源场站也应按系统运行需要参与相应调节。",
      distinction: "不要形成“只有火电水电负责调节、新能源完全不用调节”的旧印象。"
    },
    "2026-Q744": {
      wrong: "错误点在“只能”。太阳能发电不只有光伏发电一种技术路线。",
      correct: "太阳能发电既包括利用光生伏打效应直接发电的光伏发电，也包括先把太阳辐射能转化为热能、再发电的太阳能热发电（光热发电）等方式。",
      distinction: "光伏：光 → 电；光热：光 → 热 → 机械能/电。看到“只能通过光伏效应”通常要警惕。"
    },
    "2026-Q754": {
      wrong: "错误点在“新增输电通道应当尽量集中”。过度集中会增加同送端、同受端直流集中带来的安全稳定风险。",
      correct: "直流送端要合理分群，控制同送端、同受端直流输电规模，新增输电通道要避免过于集中。",
      distinction: "固定抓词：“合理分群 + 控制规模 + 避免过于集中”。"
    },
    "2026-Q757": {
      wrong: "错误点在“合理接入高压配电网”。充电设施应根据容量和场景合理分层接入，而不是一律引导接入高压配电网。",
      correct: "满足大规模电动汽车等新型复合用电需求，应建立配电网可接入充电设施容量的信息发布机制，引导充电设施合理分层接入中低压配电网。",
      distinction: "题眼是“分层接入”，不要记成“统一接高压”。"
    },
    "2026-Q617": {
      wrong: "题干把固定表述最后一部分错写成了“初心和使命”。",
      correct: "习近平总书记指出，坚持党的领导、加强党的建设，是我国国有企业的光荣传统，是国有企业的“根”和“魂”，是我国国有企业的独特优势。",
      distinction: "固定三段：光荣传统 → “根”和“魂” → 独特优势。"
    }
  };

  function topicTip(topic) {
    const t = normalize(topic);
    if (t === "企业文化") return "企业文化判断题重点核对固定名称及归属：企业宗旨、企业使命、企业精神、治企理念最容易互换设错。";
    if (t === "公司战略") return "公司战略判断题重点核对战略目标、根本/追求/方向以及各业务发展定位中的固定关键词。";
    if (t === "新型电力系统") return "新型电力系统判断题会通过“只、必须、一律、不需”等绝对化词语或技术概念偷换来设错。";
    if (t === "品牌建设") return "品牌建设判断题重点核对固定表述，少一个限定词或偷换对象都可能判错。";
    if (t === "形势政策") return "形势政策判断题以题库固定表述为准，重点防止概念替换和原句后半句偷换。";
    return "判断题不要只背“对/错”，要把整句正确表述和最容易被替换的关键词一起记住。";
  }

  function applyJudgeExplanations() {
    if (!Array.isArray(questions)) return null;

    let total = 0;
    let falseTotal = 0;
    let wrongDetailed = 0;
    const missingFalseIds = [];

    questions.forEach(question => {
      if (!question || question.type !== "judge" || !String(question.taskId || "").startsWith("preoct300-")) return;
      total += 1;

      const stem = stripJudgeBlank(question.question);
      const correction = WRONG[question.sourceId];
      const isFalse = String(question.answer || "") === "B";
      if (isFalse) falseTotal += 1;

      if (correction) {
        wrongDetailed += 1;
        question.explanation = [
          `<strong>判断：错误。</strong>`,
          `<strong>为什么错误：</strong>${correction.wrong}`,
          `<strong>正确说法：</strong>${correction.correct}`,
          `<strong>怎么区分：</strong>${correction.distinction}`,
          `<strong>本题记忆：</strong>不要只记“B. 错误”，要记住上面的正确表述。`
        ].join("<br><br>");
        question.note = "判断题：错误题必须记“错误原因 + 正确表述”，不能只记对错。";
        return;
      }

      if (!isFalse) {
        question.explanation = [
          `<strong>判断：正确。</strong>`,
          `<strong>正确说法：</strong>${stem}。`,
          `<strong>为什么正确：</strong>本题题干与当前题库采用的固定表述一致，没有偷换核心概念、对象或限定条件。`,
          `<strong>复习重点：</strong>${topicTip(question.topic)}`,
          `<strong>本题记忆：</strong>把整句作为正确表述记忆，而不是只记“A. 正确”。`
        ].join("<br><br>");
        return;
      }

      missingFalseIds.push(question.sourceId || question.id || "unknown");
      question.explanation = [
        `<strong>判断：错误。</strong>`,
        `<strong>为什么错误：</strong>该题题干与题库标准口径不一致。`,
        `<strong>正确说法：</strong>⚠️ 该题尚未录入人工校正后的完整正确表述，请不要只背“错误”。`,
        `<strong>处理状态：</strong>已自动进入缺失校正清单。`
      ].join("<br><br>");
      question.note = "检测到错误判断题缺少人工正确表述，请补充后再作为记忆材料。";
    });

    const report = {
      version: VERSION,
      total,
      falseTotal,
      wrongDetailed,
      missingFalseIds,
      generatedAt: new Date().toISOString()
    };
    window.__stateGridJudgeExplanationVersion = VERSION;
    window.stateGridJudgeExplanationReport = report;
    console.info("国网判断题解析补全", report);
    if (missingFalseIds.length) console.error("存在未补正确表述的国网错误判断题", missingFalseIds);
    return report;
  }

  window.applyStateGridJudgeExplanations = applyJudgeExplanations;
  window.STATE_GRID_JUDGE_WRONG_CORRECTIONS = WRONG;

  // 无论是同步载入还是后置动态载入，都立即尝试一次；DOMContentLoaded 再复核一次。
  applyJudgeExplanations();
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", applyJudgeExplanations, { once: true });
  }
})();
