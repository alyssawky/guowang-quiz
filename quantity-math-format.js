// 数量关系数学解析格式：审题 → 方法 → 分步列式 → 快速判断 → 易错点。
(function () {
  if (window.makeQuantityExplanation) return;

  const esc = value => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const mathLine = value => {
    let text = esc(value);
    text = text.replace(/\s*→\s*/g, '<span class="qty-arrow"> → </span>');
    text = text.replace(/✓/g, '<span class="qty-check">✓</span>');
    return text;
  };

  window.makeQuantityExplanation = function (cfg) {
    const steps = (cfg.steps || []).map((step, index) => `
      <div class="qty-step">
        <span class="qty-step-no">${index + 1}</span>
        <div class="qty-step-text">${mathLine(step)}</div>
      </div>`).join("");

    return `
      <div class="qty-solution">
        <section class="qty-solution-block qty-read">
          <div class="qty-block-title">① 审题：看到什么信号？</div>
          <p><strong>${esc(cfg.methodLabel || "数量关系")}</strong></p>
          <p>${esc(cfg.signal || "")}</p>
        </section>

        <section class="qty-solution-block qty-method">
          <div class="qty-block-title">② 为什么用这个方法？</div>
          <p>${esc(cfg.quick || "")}</p>
        </section>

        <section class="qty-solution-block qty-work">
          <div class="qty-block-title">③ 标准解法｜按数学答题步骤写</div>
          <div class="qty-steps">${steps}</div>
        </section>

        <section class="qty-solution-block qty-fast">
          <div class="qty-block-title">④ 考场怎么快速对应？</div>
          <p>${esc(cfg.fastCue || cfg.signal || "")}</p>
        </section>

        <section class="qty-solution-block qty-trap">
          <div class="qty-block-title">⑤ 易错点</div>
          <p>${esc(cfg.trap || "")}</p>
        </section>

        ${cfg.correction ? `
        <section class="qty-solution-block qty-correction">
          <div class="qty-block-title">⑥ 核对修正</div>
          <p>${esc(cfg.correction)}</p>
        </section>` : ""}

        <div class="qty-final-answer">
          <span>最终答案</span>
          <strong>${esc(cfg.answerDisplay || "")}</strong>
        </div>
      </div>`;
  };

  if (!document.getElementById("quantity-math-format-style")) {
    const style = document.createElement("style");
    style.id = "quantity-math-format-style";
    style.textContent = `
      .qty-solution {
        display:grid;
        gap:12px;
        margin-top:8px;
        color:#24332f;
        line-height:1.7;
      }
      .qty-solution-block {
        border:1px solid #dfe8e5;
        border-radius:12px;
        padding:12px 14px;
        background:#fbfdfc;
      }
      .qty-solution-block p { margin:6px 0 0; }
      .qty-block-title {
        font-size:13px;
        font-weight:850;
        color:#155f54;
        letter-spacing:.01em;
      }
      .qty-read { border-left:4px solid #6b9f95; }
      .qty-method { border-left:4px solid #7a91a8; }
      .qty-work { background:#fff; border-left:4px solid #266d62; }
      .qty-fast { border-left:4px solid #a1875c; background:#fffdf8; }
      .qty-trap { border-left:4px solid #b9827b; background:#fffafa; }
      .qty-correction { border-left:4px solid #9a6f4c; background:#fff8f2; }
      .qty-steps { display:grid; gap:9px; margin-top:10px; }
      .qty-step {
        display:grid;
        grid-template-columns:28px minmax(0,1fr);
        gap:9px;
        align-items:start;
      }
      .qty-step-no {
        width:24px;
        height:24px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#edf5f3;
        color:#17675c;
        font-size:12px;
        font-weight:850;
      }
      .qty-step-text {
        min-width:0;
        padding:1px 0 8px;
        border-bottom:1px dashed #e3ebe8;
        font-size:14px;
        overflow-wrap:anywhere;
      }
      .qty-step:last-child .qty-step-text { border-bottom:0; padding-bottom:0; }
      .qty-arrow { color:#2d7469; font-weight:850; padding:0 2px; }
      .qty-check { color:#187564; font-weight:900; }
      .qty-final-answer {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:12px 14px;
        border-radius:12px;
        background:#eef7f4;
        border:1px solid #cfe3dd;
      }
      .qty-final-answer span { color:#607b74; font-size:12px; font-weight:750; }
      .qty-final-answer strong { color:#0b6659; font-size:16px; }
      @media (max-width:680px) {
        .qty-solution-block { padding:11px 12px; }
        .qty-step { grid-template-columns:25px minmax(0,1fr); gap:7px; }
        .qty-step-text { font-size:13px; }
      }
    `;
    document.head.appendChild(style);
  }
})();