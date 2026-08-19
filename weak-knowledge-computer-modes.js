// 计算机错题：纯记忆 / 方法理解 双模式复盘。
(function () {
  if (window.__computerWrongModesInstalled) return;
  window.__computerWrongModesInstalled = true;

  const n = v => String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  const strip = v => n(String(v == null ? "" : v).replace(/<[^>]*>/g, " "));
  const esc = v => String(v == null ? "" : v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const taskOf = q => studyPlan.find(t => t.id === q.taskId) || null;
  const isComputer = q => Boolean(q && taskOf(q)?.category === "计算机");

  function score(q) {
    const r = typeof answerHistory !== "undefined" ? answerHistory[q.id] : null;
    if (!r || Number(r.wrong || 0) <= 0) return 0;
    const base = Number(r.wrong || 0) * 2 + Number(r.memoryBlurred || 0) - Number(r.correct || 0);
    return r.lastCorrect === false ? Math.max(2, base + 1) : Math.max(0, base);
  }

  function answerText(q) {
    if (q.type === "short") return n(q.answerDisplay || q.answer);
    return String(q.answer || "").split("").filter(Boolean)
      .map(k => q.options?.[k] ? n(q.options[k]) : k).join("；");
  }

  function isMethod(q) {
    if (q.computerReviewMode === "method") return true;
    if (q.computerReviewMode === "memory") return false;
    const topic = n(q.topic);
    const question = n(q.question);

    // 真正需要“做步骤”的题才进入方法区；定义、标准、名称、分类默认留在纯记忆。
    if (/转换|换算|计算|结果|真值|规格化|溢出|清\s*0|置\s*1|逻辑加|逻辑或运算|执行下列|等式.*成立|表示范围|能用.*位.*表示/.test(question)) return true;
    if (/属于非法数字|非法数字|最小的数/.test(question)) return true;
    if (/补码是|补码格式为|的补码|已知.*补码/.test(question)) return true;
    if (/已知.*(区位码|国标码|机内码)|(?:区位码|国标码|机内码).*则其/.test(question)) return true;
    if (/点阵|字模|字库/.test(question) && /字节|占用|存储/.test(question)) return true;
    if (/哪种BCD编码是有权|有权编码/.test(question)) return true;
    if (/适合于|适用于|应采用|可采用|一批数据/.test(question)) return true;

    // 逻辑运算中只有涉及逐位运算或掩码功能的题属于方法题。
    if (/某些位清|某些位置\s*1|10101010|按位|异或/.test(question)) return true;

    // 可人工覆盖未来新增题：computerReviewMode = "method" / "memory"。
    return false;
  }
  window.isComputerMethodQuestion = isMethod;

  function profile(q) {
    const t = `${n(q.question)} ${n(q.topic)}`;
    if (/八进制.*十六进制|十六进制.*八进制/.test(t)) return ["进制转换",
      "八进制和十六进制互转，优先借助二进制分组。",
      ["每位八进制拆成3位二进制；每位十六进制拆成4位二进制。","按目标进制重新分组：转十六进制每4位一组，转八进制每3位一组。","把每组二进制换成对应数字。"],
      "不要绕道完整十进制计算；分组更快也更不易错。"]; 
    if (/二进制.*十进制|十进制.*二进制|转换成十进制|转换成二进制/.test(t)) return ["进制转换",
      "二进制与十进制互转：二进制按权展开，十进制整数除2取余。",
      ["二进制→十进制：小数点左边权值2⁰、2¹…；右边2⁻¹、2⁻²…。","十进制整数→二进制：连续除2取余，余数倒序读取。","最后检查结果数量级是否合理。"],
      "二进制小数点右侧是负指数，例如0.11₂=1/2+1/4。"]; 
    if (/非法数字|基本数元|数制 R|等式.*成立/.test(t)) return ["进制规则判断",
      "用R进制的基本规则判断：每一位只能出现0～R-1。",
      ["先确定该进制允许的最大数字R-1。","逐位检查是否出现≥R的数字。","若要求求R，把各数按位权写成关于R的式子，再检查R大于所有已出现数字。"],
      "不要因为数字长得像十进制就忽略右下角的进制标记。"]; 
    if (/补码|反码|原码|移码|机器数|真值/.test(t)) return ["机器数 / 补码",
      "先固定字长、看最高位判断正负，再决定是否取反加1。",
      ["补码最高位0表示非负，1表示负数。","负数补码→真值：取反加1得到绝对值，再加负号。","负数真值→补码：绝对值写成定长二进制，再取反加1。","移码通常可由同字长补码最高位取反得到。"],
      "最高位1时不能把剩余位直接当绝对值，那是原码思路。"]; 
    if (/规格化|浮点/.test(t)) return ["浮点数规格化",
      "规格化的核心是移动小数点，同时用阶码补偿，保证数值不变。",
      ["先写成尾数×2^阶码。","移动小数点使尾数满足教材的规格化要求。","小数点每移动一位，阶码反向补偿一位。"],
      "只移小数点却不改阶码，会把数值改掉。" ];
    if (/溢出/.test(t)) return ["定长运算溢出",
      "先看字长对应的可表示范围，再判断结果有没有越界。",
      ["n位补码范围：-2^(n-1)～2^(n-1)-1；8位是-128～127。","先按数学真值算结果。","结果越界就是溢出；同号相加结果变号也可作为判断信号。"],
      "最高位有进位不等于有符号补码溢出。" ];
    if (/逻辑|清\s*0|置\s*1|异或/.test(t)) return ["逻辑运算",
      "逻辑运算逐位独立，不产生进位。",
      ["AND：1与1才得1；OR：有1就得1；XOR：不同得1；NOT：0/1翻转。","清0用AND掩码：要清的位置放0。","置1用OR掩码：要置1的位置放1。"],
      "不要按普通二进制加法处理逻辑运算。" ];
    if (/BCD|8421|5211|余\s*3|格雷/.test(t)) return ["BCD 编码判断",
      "判断是否有权码，看各位是否具有固定权值。",
      ["8421权值为8、4、2、1；5211权值为5、2、1、1。","能用各位×固定权值求数值的是有权码。","余3码和格雷码不属于BCD有权码。"],
      "不要看到四位编码就默认是8421码。" ];
    if (/区位码|国标码|机内码/.test(t)) return ["汉字编码换算",
      "区位码、国标码、机内码是固定偏移换算题。",
      ["区位码→国标码：区号、位号各加32十进制，即20H。","国标码→机内码：两个字节各加80H。","反向换算按相反方向减；同时确认题目是十进制还是十六进制。"],
      "20H=32十进制，不要把“加20H”误当成“加20十进制”。" ];
    if (/点阵|字模|字库/.test(t) && /字节|存储|占用/.test(t)) return ["点阵字库存储量",
      "N×N点阵的每个点只占1 bit。",
      ["先算N×N得到总bit数。","再除以8换成Byte。","不能整除时实际存储按字节向上取整。"],
      "N×N得到的是bit，不是Byte；24×24=576bit=72Byte。" ];
    if (/CRC|循环冗余|海明|奇校验|偶校验|校验编码/.test(t)) return ["校验方式选择",
      "先判断题目要简单检错、批量数据检错，还是定位并纠错。",
      ["奇偶校验：一个校验位，适合简单检错。","CRC：把一批数据作为整体做模2除法，适合数据块/数据帧检错。","海明码：多个校验位定位错误，典型特点是能纠正一位错误。"],
      "不要把所有“校验码”当成同一种用途；要记场景→功能。" ];
    if (/8 位|位二进制|表示范围/.test(t)) return ["位数与表示范围",
      "先分清无符号数还是补码有符号数，再比较范围。",
      ["无符号n位：0～2^n-1。","n位补码：-2^(n-1)～2^(n-1)-1。","把题目数与边界比较即可。"],
      "无符号范围和补码范围不能混用。" ];
    return [n(q.topic) || "规则应用题","这道题考的是条件→规则→结果，而不是孤立记答案。",
      ["圈出题干对象、条件和要求。","找到对应定义/公式/规则。","按规则逐步处理，再用选项校验。"],
      "只记答案字母，换数字或换问法就不会做。" ];
  }

  function memorySentence(q) {
    let stem = n(q.question).replace(/[？?]\s*$/, "").replace(/\s*。\s*$/, "");
    const a = answerText(q);
    const blank = /（\s*[　_＿—-]*\s*）|\(\s*[　_＿—-]*\s*\)/;
    return a ? (blank.test(stem) ? `${stem.replace(blank, `（${a}）`)}。` : `${stem}（${a}）。`) : stem;
  }

  function memoryCard(q) {
    const r = answerHistory?.[q.id];
    const meta = [n(taskOf(q)?.module), n(q.topic), q.sourceId || "", Number(r?.wrong || 0) > 1 ? `错 ${r.wrong} 次` : ""].filter(Boolean).join(" · ");
    return `<article class="cw-memory"><i></i><div><p>${esc(memorySentence(q))}</p>${meta ? `<small>${esc(meta)}</small>` : ""}</div></article>`;
  }

  function methodCard(q) {
    const [kind, signal, steps, trap] = profile(q);
    const r = answerHistory?.[q.id];
    const meta = [q.sourceId || "", `答案：${answerText(q)}`, Number(r?.wrong || 0) > 1 ? `错 ${r.wrong} 次` : ""].filter(Boolean).join(" · ");
    return `<details class="cw-method"><summary><div><span>${esc(kind)}</span><strong>${esc(q.question)}</strong><small>${esc([n(taskOf(q)?.module), n(q.topic)].filter(Boolean).join(" · "))}</small></div><b>⌄</b></summary><div class="cw-method-body"><section><h5>题型识别</h5><p>${esc(signal)}</p></section><section><h5>同类题怎么做</h5><ol>${steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></section><section><h5>本题怎么套</h5><div>${q.explanation || `正确答案：${esc(answerText(q))}`}</div></section><section class="trap"><h5>易错点</h5><p>${esc(trap)}</p></section>${meta ? `<em>${esc(meta)}</em>` : ""}</div></details>`;
  }

  function chapterGroups(list, renderer) {
    const m = new Map();
    list.forEach(q => { const c = n(taskOf(q)?.module) || "未分类章节"; if (!m.has(c)) m.set(c, []); m.get(c).push(q); });
    if (!list.length) return `<div class="cw-empty">目前没有这一类计算机薄弱题。</div>`;
    return [...m].map(([c, qs]) => `<section class="cw-chapter"><header><strong>${esc(c)}</strong><span>${qs.length} 道</span></header><div>${qs.map(renderer).join("")}</div></section>`).join("");
  }

  function mode(type, title, sub, list, renderer) {
    return `<details class="cw-mode ${type}"><summary><div><strong>${title}</strong><small>${sub}</small></div><span>${list.length} 道</span></summary><div class="cw-mode-body">${chapterGroups(list, renderer)}</div></details>`;
  }

  function transform() {
    const major = document.querySelector("#wrong-list .weak-major-computer");
    if (!major) return;
    const list = questions.filter(q => isComputer(q) && score(q) > 0);
    const method = list.filter(isMethod), memory = list.filter(q => !isMethod(q));
    const body = major.querySelector(".weak-major-body"), count = major.querySelector(".weak-major-summary small");
    if (!body) return;
    if (count) count.textContent = `${list.length} 道薄弱题 · 记忆 ${memory.length} / 方法 ${method.length}`;
    body.innerHTML = `<div class="cw-intro">计算机错题分为 <strong>纯记忆</strong> 和 <strong>方法理解</strong>：前者直接记结论；后者重点掌握题型识别和解题步骤，不背本题答案。</div>${mode("memory","纯记忆","标准、定义、名称、分类、固定事实：压缩成直接结论。",memory,memoryCard)}${mode("method","方法理解","计算、转换、规则应用、场景判断：题型识别 → 步骤 → 本题套用 → 易错点。",method,methodCard)}`;
  }

  function styles() {
    if (document.getElementById("cw-mode-style")) return;
    const s = document.createElement("style"); s.id = "cw-mode-style";
    s.textContent = `.cw-intro{padding:10px 12px;border:1px solid #dfe9e6;border-radius:10px;background:#f8fbfa;color:#52645f;font-size:11.5px;line-height:1.65}.cw-mode{border:1px solid #dce7e4;border-radius:12px;background:#fff;overflow:hidden}.cw-mode>summary{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;cursor:pointer;list-style:none}.cw-mode>summary::-webkit-details-marker{display:none}.cw-mode.memory>summary{background:#f4faf8;border-left:4px solid #168373}.cw-mode.method>summary{background:#f7f8fb;border-left:4px solid #64748b}.cw-mode>summary strong{display:block;color:#243d37;font-size:14px}.cw-mode>summary small{display:block;margin-top:3px;color:#7b8b86;font-size:10px}.cw-mode>summary>span{color:#71817c;font-size:11px;font-weight:750}.cw-mode-body{display:grid;gap:12px;padding:12px 14px 14px}.cw-chapter>header{display:flex;justify-content:space-between;padding:0 1px 6px;border-bottom:1px solid #e5ecea}.cw-chapter>header strong{color:#40534e;font-size:12px}.cw-chapter>header span{color:#95a19d;font-size:10px}.cw-chapter>div{display:grid;gap:7px;margin-top:7px}.cw-empty{padding:10px 2px;color:#9ba5a2;font-size:11px}.cw-memory{display:flex;gap:9px;padding:8px 3px;border-bottom:1px solid #edf2f0}.cw-memory i{width:5px;height:5px;margin-top:8px;border-radius:50%;background:#70a79e;flex:none}.cw-memory p{margin:0;color:#30423e;font-size:12.5px;line-height:1.6}.cw-memory small{display:block;margin-top:3px;color:#9aa5a1;font-size:9.5px}.cw-method{border:1px solid #e1e6eb;border-radius:10px;background:#fff;overflow:hidden}.cw-method>summary{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;cursor:pointer;list-style:none}.cw-method>summary::-webkit-details-marker{display:none}.cw-method>summary div{display:grid;gap:4px}.cw-method>summary span{width:max-content;padding:2px 6px;border-radius:999px;background:#eef2f6;color:#526274;font-size:9px;font-weight:750}.cw-method>summary strong{color:#2f3b45;font-size:12px;line-height:1.55}.cw-method>summary small{color:#9099a2;font-size:9.5px}.cw-method>summary b{color:#77838f}.cw-method-body{display:grid;gap:9px;padding:0 11px 11px}.cw-method-body section{padding:9px 10px;border-radius:8px;background:#f8fafb}.cw-method-body section.trap{background:#fbf8f5}.cw-method-body h5{margin:0 0 5px;color:#52606c;font-size:10px}.cw-method-body p,.cw-method-body li,.cw-method-body section div{color:#43515b;font-size:11px;line-height:1.65}.cw-method-body p{margin:0}.cw-method-body ol{margin:0;padding-left:18px}.cw-method-body em{color:#9aa3aa;font-size:9px;font-style:normal}@media(max-width:680px){.cw-mode-body{padding:10px 11px 12px}.cw-mode>summary{padding:11px 12px}}`;
    document.head.appendChild(s);
  }

  styles();
  const base = window.renderWrongList;
  if (typeof base === "function") window.renderWrongList = function(...args){ const r = base.apply(this,args); transform(); return r; };
  transform();
})();
