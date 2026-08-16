// 第二章后半段网页原生图表渲染：彻底绕过旧 sprite / hq35
(function(){
const PATCH=window.DA_CH2_PATCH||{};
const VISUALS=window.DA_CH2_VISUALS||{};
    function escapeHtml(value) {
        return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function niceMax(values) {
        const m=Math.max(...values.map(Number),1); const p=Math.pow(10,Math.floor(Math.log10(m))); return Math.ceil(m/p)*p;
    }
    function renderTable(spec) {
        return `<div class="da-native-visual"><div class="da-visual-title">${escapeHtml(spec.title)}</div><div class="da-table-scroll"><table class="da-data-table"><thead><tr>${spec.headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${spec.rows.map(r=>`<tr>${r.map((c,i)=>`<${i===0?'th':'td'}>${escapeHtml(c)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    }
    function renderBar(spec) {
        const w=980,h=430,l=76,r=28,t=50,b=78, cw=w-l-r,ch=h-t-b; const vals=spec.values.map(Number), max=niceMax(vals); const slot=cw/spec.labels.length, bw=Math.min(58,slot*.58);
        const grid=[0,.25,.5,.75,1].map(fr=>{const y=t+ch*(1-fr);const v=Math.round(max*fr*10)/10;return `<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#e5e7eb"/><text x="${l-10}" y="${y+5}" text-anchor="end" font-size="12" fill="#667085">${v}</text>`}).join('');
        const bars=vals.map((v,i)=>{const x=l+i*slot+(slot-bw)/2,bh=v/max*ch,y=t+ch-bh;return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#c7cbd1" stroke="#555"/><text x="${x+bw/2}" y="${Math.max(t+14,y-7)}" text-anchor="middle" font-size="12" fill="#333">${v}</text><text x="${x+bw/2}" y="${t+ch+28}" text-anchor="middle" font-size="12" fill="#555">${escapeHtml(spec.labels[i])}</text>`}).join('');
        return `<div class="da-native-visual"><div class="da-visual-title">${escapeHtml(spec.title)}</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${grid}<line x1="${l}" y1="${t+ch}" x2="${w-r}" y2="${t+ch}" stroke="#333"/>${bars}</svg></div>`;
    }
    function renderGrouped(spec) {
        const w=1000,h=450,l=76,r=30,t=50,b=92,cw=w-l-r,ch=h-t-b; const all=spec.series.flatMap(s=>s.values.map(Number)); const max=niceMax(all); const slot=cw/spec.labels.length, groupW=slot*.72,bw=groupW/spec.series.length;
        const grid=[0,.25,.5,.75,1].map(fr=>{const y=t+ch*(1-fr),v=Math.round(max*fr*10)/10;return `<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#e5e7eb"/><text x="${l-10}" y="${y+5}" text-anchor="end" font-size="12" fill="#667085">${v}</text>`}).join('');
        const fills=['#d9dce1','#8f959e','#b7bbc2'];
        let bars=''; spec.labels.forEach((lab,i)=>{spec.series.forEach((s,j)=>{const v=Number(s.values[i]),x=l+i*slot+(slot-groupW)/2+j*bw,bh=v/max*ch,y=t+ch-bh;bars+=`<rect x="${x}" y="${y}" width="${Math.max(4,bw-4)}" height="${bh}" fill="${fills[j%fills.length]}" stroke="#555"/><text x="${x+(bw-4)/2}" y="${Math.max(t+13,y-6)}" text-anchor="middle" font-size="11" fill="#333">${v}</text>`});bars+=`<text x="${l+i*slot+slot/2}" y="${t+ch+28}" text-anchor="middle" font-size="12" fill="#555">${escapeHtml(lab)}</text>`});
        const legend=spec.series.map((s,j)=>`<span style="margin-right:18px"><i style="display:inline-block;width:16px;height:10px;background:${fills[j%fills.length]};border:1px solid #666;margin-right:5px"></i>${escapeHtml(s.name)}</span>`).join('');
        return `<div class="da-native-visual"><div class="da-visual-title">${escapeHtml(spec.title)}</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${grid}<line x1="${l}" y1="${t+ch}" x2="${w-r}" y2="${t+ch}" stroke="#333"/>${bars}</svg><div class="da-chart-legend">${legend}</div></div>`;
    }
    function renderBarLine(spec) {
        const w=1040,h=470,l=76,r=76,t=54,b=92,cw=w-l-r,ch=h-t-b; const bars=spec.bars.map(Number),line=spec.line.map(Number), bmax=niceMax(bars); let lmin=Math.min(0,...line),lmax=Math.max(0,...line); if(lmax===lmin)lmax=lmin+1; const slot=cw/spec.labels.length,bw=Math.min(54,slot*.55);
        let svg=''; [0,.25,.5,.75,1].forEach(fr=>{const y=t+ch*(1-fr),v=Math.round(bmax*fr);svg+=`<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#e5e7eb"/><text x="${l-10}" y="${y+5}" text-anchor="end" font-size="12" fill="#667085">${v}</text>`});
        bars.forEach((v,i)=>{const x=l+i*slot+(slot-bw)/2,bh=v/bmax*ch,y=t+ch-bh;svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#e1e3e6" stroke="#555"/><text x="${x+bw/2}" y="${Math.max(t+14,y-7)}" text-anchor="middle" font-size="11" fill="#333">${v}</text><text x="${x+bw/2}" y="${t+ch+28}" text-anchor="middle" font-size="11" fill="#555">${escapeHtml(spec.labels[i])}</text>`});
        const pts=line.map((v,i)=>{const x=l+i*slot+slot/2,y=t+ch-(v-lmin)/(lmax-lmin)*ch;return {x,y,v}}); svg+=`<polyline points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#111" stroke-width="2"/>`; pts.forEach(p=>svg+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#111"/><text x="${p.x}" y="${p.y-9}" text-anchor="middle" font-size="11" fill="#222">${p.v}</text>`);
        return `<div class="da-native-visual"><div class="da-visual-title">${escapeHtml(spec.title)}</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${svg}</svg><div class="da-chart-legend"><span>${escapeHtml(spec.barName)}</span><span>${escapeHtml(spec.lineName)}</span></div></div>`;
    }
    function renderStacked(spec, normalize=false) {
        const w=980,h=450,l=88,r=30,t=58,b=92,cw=w-l-r,ch=h-t-b; const totals=spec.labels.map((_,i)=>spec.series.reduce((a,s)=>a+Number(s.values[i]),0)); const max=normalize?100:niceMax(totals); const slot=cw/spec.labels.length,bw=Math.min(90,slot*.55),fills=['#eeeeee','#cfd3d8','#9da3aa','#747b84','#444b55']; let svg='';
        spec.labels.forEach((lab,i)=>{let acc=0;spec.series.forEach((s,j)=>{let v=Number(s.values[i]); const bh=(normalize?v/max:v/max)*ch,y=t+ch-acc-bh,x=l+i*slot+(slot-bw)/2;svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${fills[j%fills.length]}" stroke="#777"/>`;if(bh>22)svg+=`<text x="${x+bw/2}" y="${y+bh/2+4}" text-anchor="middle" font-size="11" fill="#222">${v}${normalize?'%':''}</text>`;acc+=bh;});svg+=`<text x="${l+i*slot+slot/2}" y="${t+ch+28}" text-anchor="middle" font-size="12">${escapeHtml(lab)}</text>`});
        const legend=spec.series.map((s,j)=>`<span style="margin-right:16px"><i style="display:inline-block;width:14px;height:10px;background:${fills[j%fills.length]};border:1px solid #777;margin-right:4px"></i>${escapeHtml(s.name)}</span>`).join('');
        return `<div class="da-native-visual"><div class="da-visual-title">${escapeHtml(spec.title)}</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${svg}</svg><div class="da-chart-legend">${legend}</div></div>`;
    }
    function renderLines(spec) {
        const w=980,h=430,l=76,r=30,t=50,b=82,cw=w-l-r,ch=h-t-b; const all=spec.series.flatMap(s=>s.values.map(Number)),max=niceMax(all),slot=cw/(spec.labels.length-1||1), strokes=['#111','#737982','#aeb3ba']; let svg='';
        [0,.25,.5,.75,1].forEach(fr=>{const y=t+ch*(1-fr),v=Math.round(max*fr*10)/10;svg+=`<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#e5e7eb"/><text x="${l-10}" y="${y+5}" text-anchor="end" font-size="12">${v}%</text>`}); spec.labels.forEach((lab,i)=>svg+=`<text x="${l+i*slot}" y="${t+ch+28}" text-anchor="middle" font-size="12">${escapeHtml(lab)}</text>`);
        spec.series.forEach((s,j)=>{const pts=s.values.map((v,i)=>({x:l+i*slot,y:t+ch-Number(v)/max*ch,v}));svg+=`<polyline points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${strokes[j%strokes.length]}" stroke-width="2.2"/>`;pts.forEach(p=>svg+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="${strokes[j%strokes.length]}"/><text x="${p.x}" y="${p.y-9}" text-anchor="middle" font-size="11">${p.v}%</text>`);});
        return `<div class="da-native-visual"><div class="da-visual-title">${escapeHtml(spec.title)}</div><svg class="da-chart-svg" viewBox="0 0 ${w} ${h}">${svg}</svg><div class="da-chart-legend">${spec.series.map(s=>`<span>${escapeHtml(s.name)}</span>`).join('')}</div></div>`;
    }
    function renderCombo(spec) {
        const grouped=renderGrouped({type:'grouped',title:spec.title,labels:spec.labels,series:spec.bars}); const lines=renderLines({type:'lines',title:'同期不良贷款率（%）',labels:spec.labels,series:spec.lines}); return grouped+lines;
    }
    function renderSpec(spec) { if(spec.type==='table')return renderTable(spec); if(spec.type==='bar')return renderBar(spec); if(spec.type==='grouped')return renderGrouped(spec); if(spec.type==='barline')return renderBarLine(spec); if(spec.type==='stacked')return renderStacked(spec,false); if(spec.type==='stacked100')return renderStacked(spec,true); if(spec.type==='lines')return renderLines(spec); if(spec.type==='combo')return renderCombo(spec); return ''; }

const previousRenderQuestionImage=window.renderQuestionImage;
window.renderQuestionImage=function(question){
 if(question&&PATCH[question.id]){
  const material=question.materialHtml?`<div class="da-source-material"><div class="da-source-material-label">原题材料</div><div class="da-source-material-text">${question.materialHtml}</div></div>`:'';
  const visual=(VISUALS[question.id]||[]).map(renderSpec).join('');
  const stem=question.questionText?`<div class="da-question-stem"><strong>问题：</strong>${escapeHtml(question.questionText)}</div>`:'';
  return material+visual+stem;
 }
 return typeof previousRenderQuestionImage==='function'?previousRenderQuestionImage(question):'';
};
})();
