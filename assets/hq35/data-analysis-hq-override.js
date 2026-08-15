(function () {
    const originalRenderQuestionImage = window.renderQuestionImage;
    const originalRenderQuestion = window.renderQuestion;

    function escapeAttr(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function renderBarChart(title, labels, values, options = {}) {
        const width = 920;
        const height = 410;
        const left = 78;
        const right = 28;
        const top = 46;
        const bottom = 82;
        const chartW = width - left - right;
        const chartH = height - top - bottom;
        const maxValue = options.maxValue || Math.max(...values);
        const tickStep = options.tickStep || Math.ceil(maxValue / 5);
        const slot = chartW / labels.length;
        const barW = Math.min(62, slot * 0.56);

        const ticks = [];
        for (let v = 0; v <= maxValue + 0.0001; v += tickStep) ticks.push(v);

        const grid = ticks.map(v => {
            const y = top + chartH - (v / maxValue) * chartH;
            return `
                <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="da-grid-line"></line>
                <text x="${left - 12}" y="${y + 5}" text-anchor="end" class="da-axis-text">${v}</text>
            `;
        }).join("");

        const bars = values.map((v, i) => {
            const x = left + slot * i + (slot - barW) / 2;
            const barH = (v / maxValue) * chartH;
            const y = top + chartH - barH;
            const cx = x + barW / 2;
            return `
                <rect x="${x}" y="${y}" width="${barW}" height="${barH}" class="da-bar"></rect>
                <text x="${cx}" y="${Math.max(top + 14, y - 8)}" text-anchor="middle" class="da-value-text">${v}</text>
                <text x="${cx}" y="${top + chartH + 30}" text-anchor="middle" class="da-axis-text">${labels[i]}</text>
            `;
        }).join("");

        return `
            <div class="da-native-visual">
                <div class="da-visual-title">${title}</div>
                <svg class="da-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(title)}">
                    ${grid}
                    <line x1="${left}" y1="${top + chartH}" x2="${width - right}" y2="${top + chartH}" class="da-axis-line"></line>
                    <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartH}" class="da-axis-line"></line>
                    ${bars}
                    ${options.unit ? `<text x="${left}" y="24" class="da-unit-text">${options.unit}</text>` : ""}
                </svg>
            </div>
        `;
    }

    function renderComboChart() {
        const labels = ["23/11", "23/12", "24/1", "24/2", "24/3", "24/4", "24/5", "24/6", "24/7", "24/8", "24/9", "24/10", "24/11"];
        const bars = [844, 952, 809, 497, 754, 759, 666, 861, 878, 782, 698, 477, 928];
        const line = [608.29, 444.37, 526.84, 234.82, 534.25, 518.72, 522.19, 410.37, 543.38, 690.80, 491.41, 324.49, 440.84];
        const width = 1040;
        const height = 470;
        const left = 78;
        const right = 78;
        const top = 50;
        const bottom = 96;
        const chartW = width - left - right;
        const chartH = height - top - bottom;
        const slot = chartW / labels.length;
        const barW = slot * 0.56;
        const leftMax = 2000;
        const rightMax = 800;

        const grid = [0, 400, 800, 1200, 1600, 2000].map(v => {
            const y = top + chartH - (v / leftMax) * chartH;
            return `
                <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="da-grid-line"></line>
                <text x="${left - 12}" y="${y + 5}" text-anchor="end" class="da-axis-text">${v}</text>
            `;
        }).join("");

        const barSvg = bars.map((v, i) => {
            const x = left + slot * i + (slot - barW) / 2;
            const h = (v / leftMax) * chartH;
            const y = top + chartH - h;
            return `
                <rect x="${x}" y="${y}" width="${barW}" height="${h}" class="da-bar"></rect>
                <text x="${x + barW / 2}" y="${y + 20}" text-anchor="middle" class="da-value-text da-value-inside">${v}</text>
                <text x="${x + barW / 2}" y="${top + chartH + 28}" text-anchor="middle" class="da-axis-text da-small-axis-text">${labels[i]}</text>
            `;
        }).join("");

        const points = line.map((v, i) => {
            const x = left + slot * i + slot / 2;
            const y = top + chartH - (v / rightMax) * chartH;
            return { x, y, v };
        });
        const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
        const pointSvg = points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="5" class="da-line-point"></circle>
            <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" class="da-line-label">${p.v.toFixed(2)}</text>
        `).join("");
        const rightTicks = [0, 200, 400, 600, 800].map(v => {
            const y = top + chartH - (v / rightMax) * chartH;
            return `<text x="${width - right + 12}" y="${y + 5}" class="da-axis-text">${v}</text>`;
        }).join("");

        return `
            <div class="da-native-visual">
                <div class="da-visual-title">2023年11月～2024年11月资管产品备案数量及设立规模</div>
                <svg class="da-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="资管产品数量和设立规模组合图">
                    ${grid}
                    <line x1="${left}" y1="${top + chartH}" x2="${width - right}" y2="${top + chartH}" class="da-axis-line"></line>
                    <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartH}" class="da-axis-line"></line>
                    <line x1="${width - right}" y1="${top}" x2="${width - right}" y2="${top + chartH}" class="da-axis-line"></line>
                    ${barSvg}
                    <polyline points="${polyline}" class="da-line-series"></polyline>
                    ${pointSvg}
                    ${rightTicks}
                    <text x="${left}" y="25" class="da-unit-text">左轴：产品数量（支）</text>
                    <text x="${width - right}" y="25" text-anchor="end" class="da-unit-text">右轴：设立规模（亿元）</text>
                </svg>
                <div class="da-chart-legend"><span><i class="da-legend-bar"></i>产品数量</span><span><i class="da-legend-line"></i>设立规模</span></div>
            </div>
        `;
    }

    function renderDataTable(title, headers, rows, note = "") {
        return `
            <div class="da-native-visual">
                <div class="da-visual-title">${title}</div>
                <div class="da-table-scroll">
                    <table class="da-data-table">
                        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                        <tbody>${rows.map(row => `<tr>${row.map((cell, index) => `<${index === 0 ? "th" : "td"}>${cell}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</tbody>
                    </table>
                </div>
                ${note ? `<div class="da-table-note">${note}</div>` : ""}
            </div>
        `;
    }

    function renderMotherBabyVisual() {
        const bar = renderBarChart(
            "中国母婴商品消费规模（单位：亿元）",
            ["2016", "2017", "2018", "2019", "2020", "2021"],
            [21015, 23613, 26593, 29919, 31231, 34591],
            { maxValue: 40000, tickStep: 5000, unit: "消费规模" }
        );

        const gradient = [
            ["服装鞋帽", 26.0, "#d8d8d8"],
            ["奶粉", 22.7, "#9c9c9c"],
            ["纸尿裤", 12.1, "#5f5f5f"],
            ["辅食", 9.3, "#bdbdbd"],
            ["其他", 8.6, "#eeeeee"],
            ["洗护用品", 6.9, "#c9c9c9"],
            ["喂养及床具", 5.1, "#f5f5f5"],
            ["玩具", 4.8, "#e2e2e2"],
            ["保健品", 4.5, "#ababab"]
        ];
        let start = 0;
        const stops = gradient.map(item => {
            const end = start + item[1];
            const part = `${item[2]} ${start}% ${end}%`;
            start = end;
            return part;
        }).join(", ");

        const legend = gradient.map(item => `<li><span style="background:${item[2]}"></span>${item[0]} <strong>${item[1].toFixed(1)}%</strong></li>`).join("");

        return `${bar}
            <div class="da-native-visual da-pie-visual">
                <div class="da-visual-title">2021年母婴商品消费结构</div>
                <div class="da-pie-layout">
                    <div class="da-pie" style="background:conic-gradient(${stops});" aria-label="2021年母婴商品消费结构饼图"></div>
                    <ul class="da-pie-legend">${legend}</ul>
                </div>
            </div>`;
    }

    function renderNativeDataAnalysisVisual(question) {
        if (!question) return "";

        switch (question.id) {
            case "da-ch1-001":
                return renderBarChart(
                    "2014～2019年各年末全国残疾人康复机构数量",
                    ["2014", "2015", "2016", "2017", "2018", "2019"],
                    [6914, 7111, 7858, 8334, 9036, 9775],
                    { maxValue: 10000, tickStep: 2000, unit: "机构数量" }
                );

            case "da-ch1-003":
                return renderComboChart();

            case "da-ch1-004":
                return renderDataTable(
                    "2021年2～12月各月末固定互联网宽带接入用户数（万户）",
                    ["月份", "接入用户", "其中：xDSL用户", "光纤用户", "其中：100Mbps速率以上用户"],
                    [
                        ["2月", "49222", "296", "46274", "44516"],
                        ["3月", "49726", "295", "46707", "45072"],
                        ["4月", "50061", "293", "47053", "45517"],
                        ["5月", "50516", "292", "47515", "46104"],
                        ["6月", "50961", "290", "47968", "46649"],
                        ["7月", "51374", "290", "48416", "47173"],
                        ["8月", "51865", "290", "48921", "47710"],
                        ["9月", "52629", "291", "49643", "48450"],
                        ["10月", "53146", "290", "50077", "49026"],
                        ["11月", "53540", "288", "50466", "49557"],
                        ["12月", "53579", "283", "50551", "49848"]
                    ]
                );

            case "da-ch1-005":
                return renderDataTable(
                    "2011～2020年全国城市生活垃圾无害化处理状况",
                    ["年份", "总清运量（万吨）", "无害化处理场（座）", "无害化处理能力（万吨/日）", "无害化处理量（万吨）"],
                    [
                        ["2011", "16395", "677", "40.91", "13090"],
                        ["2012", "17081", "701", "44.63", "14490"],
                        ["2013", "17239", "765", "49.23", "15394"],
                        ["2014", "17860", "818", "53.35", "16394"],
                        ["2015", "19142", "890", "57.69", "18013"],
                        ["2016", "20362", "940", "62.14", "19674"],
                        ["2017", "21521", "1013", "67.99", "21034"],
                        ["2018", "22802", "1091", "76.62", "22565"],
                        ["2019", "24206", "1183", "86.99", "24013"],
                        ["2020", "23512", "1287", "96.35", "23452"]
                    ]
                );

            case "da-ch1-006":
                return renderMotherBabyVisual();

            case "da-ch1-012":
                return renderDataTable(
                    "2018年1～5月社会消费品零售总额主要数据（节选）",
                    ["指标", "5月绝对量（亿元）", "5月同比增长（%）", "1～5月绝对量（亿元）", "1～5月同比增长（%）"],
                    [
                        ["社会消费品零售总额", "30359", "8.5", "149176", "9.5"],
                        ["商品零售额", "27038", "8.4", "133120", "9.4"],
                        ["其中：限额以上单位商品零售", "10736", "5.6", "53888", "7.8"],
                        ["粮油、食品类", "1038", "7.3", "5505", "9.2"]
                    ],
                    "原表中间还有其他商品类别，本题所需行已完整保留。"
                );

            case "da-ch1-013":
                return renderDataTable(
                    "2017年全国规模以上文化及相关产业企业营业收入情况",
                    ["行业", "1～12月绝对额", "1～12月增长%", "1～9月绝对额", "1～9月增长%", "1～6月绝对额", "1～6月增长%", "1～3月绝对额", "1～3月增长%"],
                    [
                        ["新闻出版发行服务", "3566", "7.2", "2301", "8.1", "1521", "5.9", "681", "4.8"],
                        ["广播电视电影服务", "1749", "6.1", "1186", "1.1", "762", "0.3", "323", "-4.0"],
                        ["文化艺术服务", "434", "17.1", "283", "16.3", "169", "14.7", "76", "15.8"],
                        ["文化信息传输服务", "7990", "34.6", "5503", "36.0", "3397", "32.7", "1506", "29.4"],
                        ["文化创意和设计服务", "11891", "8.6", "8046", "7.9", "5171", "6.3", "2287", "5.8"],
                        ["文化休闲娱乐服务", "1545", "14.7", "1070", "13.0", "640", "16.8", "276", "16.8"],
                        ["工艺美术品的生产", "16544", "7.5", "12756", "8.5", "8503", "10.5", "3976", "9.2"],
                        ["文化产品生产的辅助生产", "9399", "6.4", "7084", "8.8", "4593", "10.5", "2039", "9.0"],
                        ["文化用品的生产", "33665", "11.4", "25556", "13.4", "16626", "13.2", "7733", "13.0"],
                        ["文化专用设备的生产", "5168", "3.7", "3834", "-2.2", "2492", "2.2", "1028", "5.7"],
                        ["合计", "91950", "10.8", "67618", "11.4", "43874", "11.7", "19926", "11.0"]
                    ],
                    "绝对额单位：亿元。"
                );

            default:
                return "";
        }
    }

    window.renderQuestionImage = function (question) {
        // 第一章“图片 + 文字”双轨：需要识图的题优先用网页原生高清图表/表格。
        if (question && question.textOnly) {
            return renderNativeDataAnalysisVisual(question);
        }

        const layout = window.DA_HQ_LAYOUT && window.DA_HQ_LAYOUT[question && question.id];

        if (layout) {
            const [spriteIndex, x, y, w, h, sheetW, sheetH] = layout;
            const sprite = window.DA_HQ_SPRITES && window.DA_HQ_SPRITES[String(spriteIndex)];

            if (!sprite) {
                return `
                    <div class="question-image-loading" data-hq-question="${escapeAttr(question.id)}">
                        高清原题加载中…
                    </div>
                `;
            }

            const displayWidth = String(spriteIndex) === "1"
                ? Math.min(640, Math.round(w * 1.34))
                : Math.round(w);

            return `
                <div class="question-image-wrap question-image-wrap-hq">
                    <svg
                        class="question-original-svg question-original-svg-hq"
                        viewBox="${x} ${y} ${w} ${h}"
                        role="img"
                        aria-label="${escapeAttr(question.sourceId || question.question || "原题") }"
                        preserveAspectRatio="xMidYMid meet"
                        style="width:min(100%, ${displayWidth}px);height:auto;"
                    >
                        <image
                            href="${sprite}"
                            x="0"
                            y="0"
                            width="${sheetW}"
                            height="${sheetH}"
                            style="image-rendering:auto;"
                        ></image>
                    </svg>
                </div>
            `;
        }

        return typeof originalRenderQuestionImage === "function"
            ? originalRenderQuestionImage(question)
            : "";
    };

    window.renderQuestion = function () {
        if (typeof originalRenderQuestion !== "function") return;

        originalRenderQuestion();

        const question = window.currentReviewQuestions && window.currentReviewQuestions[window.currentQuestionIndex];
        if (!question || question.textOnly) return;

        const layout = window.DA_HQ_LAYOUT && window.DA_HQ_LAYOUT[question.id];
        if (!layout) return;

        const spriteIndex = String(layout[0]);
        const spriteReady = window.DA_HQ_SPRITES && window.DA_HQ_SPRITES[spriteIndex];
        if (spriteReady || !window.DA_HQ_READY) return;

        const renderedQuestionId = question.id;

        window.DA_HQ_READY.then(function () {
            const currentQuestion = window.currentReviewQuestions && window.currentReviewQuestions[window.currentQuestionIndex];
            if (currentQuestion && currentQuestion.id === renderedQuestionId) {
                window.renderQuestion();
            }
        }).catch(function (error) {
            console.error("高清资料分析题图加载失败：", error);
            const escapedId = window.CSS && CSS.escape
                ? CSS.escape(renderedQuestionId)
                : renderedQuestionId.replace(/"/g, "\\\"");
            const loading = document.querySelector(`.question-image-loading[data-hq-question="${escapedId}"]`);
            if (loading) {
                loading.textContent = "高清原题加载失败，请刷新页面重试。";
            }
        });
    };
})();