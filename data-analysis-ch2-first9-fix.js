// 第二章例题1～9：图片+文字双轨最终修复。
// 对应题库核对页总序号17～25。彻底移除旧低清整题截图，改为原题文字 + 高清网页原生图表。
(function () {
    const PATCH = {
        "da-ch2-001": {
            questionText: "2021年一季度，浙江软件业务收入累计值约为多少亿元？",
            options: { A: "1600", B: "1640", C: "1680", D: "1800" }
        },
        "da-ch2-002": {
            materialHtml: "2023年一季度，新疆外贸进出口总值680.7亿元，同比增长80.3%。其中，出口584.7亿元，同比增长86.9%。3月当月，新疆外贸进出口总值236.9亿元，同比增长70%。其中，出口203.4亿元，同比增长78.9%；进口33.5亿元，同比增长30.8%。",
            questionText: "2022年3月，新疆外贸出口值约为：",
            options: { A: "126亿元", B: "114亿元", C: "139亿元", D: "160亿元" }
        },
        "da-ch2-003": {
            materialHtml: "2024年8月份，我国规模以上工业原煤产量39872万吨，同比增长2.8%，日均产量1286.2万吨，进口煤炭4584万吨，同比增长3.4%。2024年1～8月份，我国规模以上工业原煤产量30.5亿吨，同比下降0.3%。",
            questionText: "2022年8月份，我国规模以上工业原煤产量为多少万吨？",
            options: { A: "38025", B: "37025", C: "38786", D: "36697" }
        },
        "da-ch2-004": {
            materialHtml: "2021年，我国规模以上互联网和相关服务企业完成业务收入15500亿元，同比增长21.2%，增速比上年加快8.7个百分点，两年平均增速为16.8%。",
            questionText: "2019年，我国规模以上互联网和相关服务企业完成业务收入约多少亿元？",
            options: { A: "12788.8", B: "12213.5", C: "11589.2", D: "11367.8" }
        },
        "da-ch2-005": {
            materialHtml: "注：全国彩票销售额为福利彩票销售额与体育彩票销售额之和。",
            questionText: "2021年上半年，全国彩票销售额共为多少亿元？",
            options: { A: "1780", B: "1810", C: "1840", D: "1880" }
        },
        "da-ch2-006": {
            questionText: "2021年公路交通固定资产投资额与水路交通固定资产投资额共：",
            options: { A: "不到2万亿元", B: "2～3万亿元", C: "3～4万亿元", D: "超过4万亿元" }
        },
        "da-ch2-007": {
            materialHtml: "2023年10月份，生产天然气190亿立方米，同比增长2.6%，增速比9月份回落6.7个百分点，日均产量6.1亿立方米。进口天然气879万吨，同比增长15.5%，增速比9月份加快15.1个百分点。1～10月份，生产天然气1896亿立方米，同比增长6.1%。进口天然气9651万吨，同比增长8.8%。",
            questionText: "2022年1～9月份，全国生产天然气约多少亿立方米？",
            options: { A: "1601", B: "1710", C: "1802", D: "1817" }
        },
        "da-ch2-008": {
            questionText: "2018年1月，我国摩托车产量比销量：",
            options: { A: "少10万辆以内", B: "少10万辆以上", C: "多10万辆以内", D: "多10万辆以上" }
        },
        "da-ch2-009": {
            materialHtml: "从棉区看，2016年黄河、长江流域棉区延续2015年减产较多的趋势。其中，黄河流域棉花播种面积减少147.8千公顷，下降约14.3%；单产每公顷增加63.3公斤，提高约6.0%；产量减少10.0万吨，下降约9.2%。长江流域棉花播种面积减少160.7千公顷，下降约19.8%；单产每公顷减少68.3公斤，下降约5.9%；产量减少23.0万吨，下降约24.6%。",
            questionText: "2015年，黄河流域的棉花单产为：",
            options: { A: "1118公斤/公顷", B: "1092公斤/公顷", C: "1055公斤/公顷", D: "1003公斤/公顷" }
        }
    };

    const TABLES = {
        "da-ch2-001": {
            title: "2022年一季度部分省市软件和信息技术服务业完成情况",
            headers: ["名称", "软件业务收入本年累计（亿元）", "同比增长（%）", "信息技术服务收入本年累计（亿元）", "同比增长（%）"],
            rows: [
                ["全国", "20059.67", "11.6", "13102.09", "13.7"],
                ["浙江", "1725.91", "5.4", "1357.55", "5.3"]
            ]
        },
        "da-ch2-005": {
            title: "2022年6月全国各类型彩票销售情况表",
            headers: ["类型", "6月销售额（亿元）", "6月同比（%）", "6月环比（%）", "1～6月累计销售额（亿元）", "1～6月累计同比（%）"],
            rows: [
                ["一、福利彩票", "130.8", "16.5", "-0.5", "748.6", "10.6"],
                ["（一）乐透数字型", "71.8", "3.7", "-8.3", "433.1", "-6"],
                ["（二）即开型", "28.3", "30.3", "11.8", "175.6", "33.2"],
                ["（三）基诺型", "30.7", "44.2", "10.2", "139.9", "65.5"],
                ["二、体育彩票", "189", "-19.2", "-3.7", "1072", "-3.2"],
                ["（一）乐透数字型", "58.6", "5", "-5", "330.9", "-13"],
                ["（二）竞猜型", "104.5", "-33.1", "-4.1", "580", "-3"],
                ["（三）即开型", "25.9", "18.5", "1.4", "161.1", "24.7"],
                ["（四）视频型", "0.0015", "143.4", "355.1", "0.0046", "-25.9"]
            ]
        },
        "da-ch2-006": {
            title: "2022年交通固定资产投资额及同比增长率",
            headers: ["项目", "交通固定资产投资额（亿元）", "同比增长率（%）"],
            rows: [
                ["铁路", "7109", "-5.1"], ["公路", "28527", "9.7"], ["其中：高速公路", "16262", "7.3"],
                ["普通国省道", "5973", "6.5"], ["农村公路", "4733", "15.6"], ["水路", "1679", "10.9"],
                ["其中：内河建设", "867", "16.7"], ["沿海建设", "794", "9.9"], ["民航", "1231", "0.7"]
            ]
        }
    };

    const COAL = {
        labels: ["2023年8月", "9月", "10月", "11月", "12月", "2024年1～2月", "3月", "4月", "5月", "6月", "7月", "8月"],
        values: [2.0, 0.4, 3.8, 4.6, 1.9, -4.2, -4.2, -2.9, -0.8, 3.6, 2.8, 2.8]
    };

    const MOTOR = {
        labels: ["18年7月", "8月", "9月", "10月", "11月", "12月", "19年1月", "2月", "3月", "4月", "5月", "6月"],
        production: [129.3, 122.4, 127.7, 115.8, 122.3, 135.7, 115.5, 82.2, 142.7, 139.9, 143.6, 147.7],
        productionRate: [-10.3, -10.4, -12.9, -13.5, -19.2, -12.3, -22.7, -10.6, -0.3, 1.1, -0.6, 8.1],
        sales: [130.3, 122.7, 128.1, 115.9, 120.9, 134.0, 117.2, 83.1, 142.8, 135.2, 141.1, 147.2],
        salesRate: [-0.6, -11.1, 14.1, -14.8, -17.2, -11.4, -12.0, -13.6, -0.9, -0.3, -1.3, 6.7]
    };

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function renderTable(spec) {
        return `<div class="da-native-visual"><div class="da-visual-title">${esc(spec.title)}</div><div class="da-table-scroll"><table class="da-data-table"><thead><tr>${spec.headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${spec.rows.map(row => `<tr>${row.map((cell, i) => `<${i === 0 ? "th" : "td"}>${esc(cell)}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
    }

    function renderSignedLine() {
        const w = 1040, h = 450, l = 82, r = 34, t = 52, b = 105, cw = w-l-r, ch = h-t-b;
        const min = -5.5, max = 5.5, slot = cw/(COAL.labels.length-1);
        const y = v => t + ch - (v-min)/(max-min)*ch;
        let svg = "";
        [-5,-3,-1,1,3,5].forEach(v => { const yy=y(v); svg += `<line x1="${l}" y1="${yy}" x2="${w-r}" y2="${yy}" stroke="#e5e7eb"/><text x="${l-10}" y="${yy+4}" text-anchor="end" font-size="12">${v}</text>`; });
        const zero=y(0); svg += `<line x1="${l}" y1="${zero}" x2="${w-r}" y2="${zero}" stroke="#555" stroke-width="1.5"/>`;
        const pts=COAL.values.map((v,i)=>({x:l+i*slot,y:y(v),v}));
        svg += `<polyline points="${pts.map(p=>`${p.x},${p.y}`).join(" ")}" fill="none" stroke="#111" stroke-width="2.2"/>`;
        pts.forEach((p,i)=>{ svg += `<rect x="${p.x-4}" y="${p.y-4}" width="8" height="8" fill="#111"/><text x="${p.x}" y="${p.y-11}" text-anchor="middle" font-size="12">${p.v}</text><text x="${p.x}" y="${t+ch+28+(i%2)*16}" text-anchor="middle" font-size="11">${esc(COAL.labels[i])}</text>`; });
        return `<div class="da-native-visual"><div class="da-visual-title">规模以上工业原煤产量增速月度走势（%）</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${svg}</svg></div>`;
    }

    function renderBarLine(title, bars, rates, barName) {
        const w=1040,h=470,l=76,r=76,t=54,b=94,cw=w-l-r,ch=h-t-b;
        const bmax=160, rmin=-25, rmax=20, slot=cw/bars.length, bw=Math.min(52,slot*.56);
        const ry=v=>t+ch-(v-rmin)/(rmax-rmin)*ch;
        let svg="";
        [0,50,100,150].forEach(v=>{const yy=t+ch-v/bmax*ch;svg+=`<line x1="${l}" y1="${yy}" x2="${w-r}" y2="${yy}" stroke="#e5e7eb"/><text x="${l-10}" y="${yy+4}" text-anchor="end" font-size="12">${v}</text>`});
        bars.forEach((v,i)=>{const x=l+i*slot+(slot-bw)/2,bh=v/bmax*ch,yy=t+ch-bh;svg+=`<rect x="${x}" y="${yy}" width="${bw}" height="${bh}" fill="#f4f4f4" stroke="#333"/><text x="${x+bw/2}" y="${yy-7}" text-anchor="middle" font-size="11">${v}</text><text x="${x+bw/2}" y="${t+ch+27+(i%2)*15}" text-anchor="middle" font-size="11">${esc(MOTOR.labels[i])}</text>`;});
        const pts=rates.map((v,i)=>({x:l+i*slot+slot/2,y:ry(v),v}));
        svg+=`<polyline points="${pts.map(p=>`${p.x},${p.y}`).join(" ")}" fill="none" stroke="#111" stroke-width="2"/>`;
        pts.forEach(p=>svg+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#111"/><text x="${p.x}" y="${p.y-9}" text-anchor="middle" font-size="11">${p.v}</text>`);
        return `<div class="da-native-visual"><div class="da-visual-title">${esc(title)}</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${svg}</svg><div class="da-chart-legend"><span>${esc(barName)}（万辆）</span><span>同比增速（%）</span></div></div>`;
    }

    function renderVisual(id) {
        if (TABLES[id]) return renderTable(TABLES[id]);
        if (id === "da-ch2-003") return renderSignedLine();
        if (id === "da-ch2-008") {
            return renderBarLine("2018年7月～2019年6月我国摩托车产量及同比增速", MOTOR.production, MOTOR.productionRate, "产量")
                + renderBarLine("2018年7月～2019年6月我国摩托车销量及同比增速", MOTOR.sales, MOTOR.salesRate, "销量");
        }
        return "";
    }

    questions.forEach(question => {
        const patch = PATCH[question.id];
        if (!patch) return;
        question.questionText = patch.questionText || "";
        question.materialHtml = patch.materialHtml || "";
        question.options = patch.options || question.options;
        question.optionLabelsOnly = false;
        question.imageOnlyOptions = false;
        question.shuffleOptions = false;
        question.lockOptionOrder = true;
        question.visualFirst = false;
        delete question.image;
        delete question.questionImage;
    });

    const previousRenderQuestionImage = window.renderQuestionImage;
    window.renderQuestionImage = function (question) {
        const patch = question && PATCH[question.id];
        if (!patch) {
            return typeof previousRenderQuestionImage === "function" ? previousRenderQuestionImage(question) : "";
        }
        const material = question.materialHtml
            ? `<div class="da-source-material"><div class="da-source-material-label">原题材料</div><div class="da-source-material-text">${question.materialHtml}</div></div>`
            : "";
        const visual = renderVisual(question.id);
        const stem = question.questionText
            ? `<div class="da-question-stem"><strong>问题：</strong>${esc(question.questionText)}</div>`
            : "";
        return material + visual + stem;
    };
})();