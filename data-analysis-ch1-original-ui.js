(function () {
    const previousRenderQuestionImage = window.renderQuestionImage;

    function renderHighPositionChart() {
        const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
        const sales = [2828, 3111, 3375, 3647, 3919, 4196, 4330, 4774];
        const growth = [10.6, 10.0, 8.5, 8.0, 7.5, 7.1, 3.2, 10.3];
        const width = 980;
        const height = 480;
        const left = 82;
        const right = 76;
        const top = 52;
        const bottom = 92;
        const chartW = width - left - right;
        const chartH = height - top - bottom;
        const slot = chartW / years.length;
        const barW = Math.min(60, slot * 0.56);
        const salesMax = 7000;
        const growthMin = -8;
        const growthMax = 12;

        const salesTicks = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000].map(v => {
            const y = top + chartH - (v / salesMax) * chartH;
            return `
                <line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}" class="da-grid-line"></line>
                <text x="${left-12}" y="${y+5}" text-anchor="end" class="da-axis-text">${v}</text>
            `;
        }).join("");

        const bars = sales.map((v, i) => {
            const x = left + slot * i + (slot - barW) / 2;
            const h = (v / salesMax) * chartH;
            const y = top + chartH - h;
            return `
                <rect x="${x}" y="${y}" width="${barW}" height="${h}" class="da-bar"></rect>
                <text x="${x+barW/2}" y="${Math.max(top+14,y-8)}" text-anchor="middle" class="da-value-text">${v}</text>
                <text x="${x+barW/2}" y="${top+chartH+30}" text-anchor="middle" class="da-axis-text">${years[i]}</text>
            `;
        }).join("");

        const points = growth.map((v, i) => {
            const x = left + slot * i + slot / 2;
            const y = top + chartH - ((v - growthMin) / (growthMax - growthMin)) * chartH;
            return {x, y, v};
        });
        const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
        const dots = points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="5" class="da-line-point"></circle>
            <text x="${p.x}" y="${p.y-11}" text-anchor="middle" class="da-line-label">${p.v.toFixed(1)}</text>
        `).join("");

        const rightTicks = [-8,-4,0,4,8,12].map(v => {
            const y = top + chartH - ((v - growthMin) / (growthMax - growthMin)) * chartH;
            return `<text x="${width-right+12}" y="${y+5}" class="da-axis-text">${v}</text>`;
        }).join("");

        return `
            <div class="da-native-visual">
                <div class="da-visual-title">2014～2021年全国零售药店终端药品销售额和同比增速</div>
                <svg class="da-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="2014至2021年全国零售药店终端药品销售额和同比增速">
                    ${salesTicks}
                    <line x1="${left}" y1="${top+chartH}" x2="${width-right}" y2="${top+chartH}" class="da-axis-line"></line>
                    <line x1="${left}" y1="${top}" x2="${left}" y2="${top+chartH}" class="da-axis-line"></line>
                    <line x1="${width-right}" y1="${top}" x2="${width-right}" y2="${top+chartH}" class="da-axis-line"></line>
                    ${bars}
                    <polyline points="${polyline}" class="da-line-series"></polyline>
                    ${dots}
                    ${rightTicks}
                    <text x="${left}" y="28" class="da-unit-text">亿元</text>
                    <text x="${width-right}" y="28" text-anchor="end" class="da-unit-text">%</text>
                </svg>
                <div class="da-chart-legend">
                    <span><i class="da-legend-bar"></i>销售额</span>
                    <span><i class="da-legend-line"></i>同比增速</span>
                </div>
            </div>
        `;
    }

    function renderMaterial(question) {
        if (!question || !question.materialHtml) return "";
        return `
            <div class="da-source-material" aria-label="原题材料">
                <div class="da-source-material-label">原题材料</div>
                <div class="da-source-material-text">${question.materialHtml}</div>
            </div>
        `;
    }

    window.renderQuestionImage = function (question) {
        if (question && question.id === "da-ch1-002a") {
            return renderHighPositionChart();
        }

        if (question && question.materialHtml) {
            return renderMaterial(question);
        }

        return typeof previousRenderQuestionImage === "function"
            ? previousRenderQuestionImage(question)
            : "";
    };
})();