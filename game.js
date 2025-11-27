// game.js — consolidated & cleaned behaviour for Poster Detective

/* globals: expects html2canvas to be loaded in page (CDN already in game.html) */

/* ---------- Global score holders (exposed on window for rubric auto-fill) ---------- */
window.level1ScoreValue = 0; // 0..5
window.level2ScoreValue = 0; // 0..10
window.level3ScoreValue = 0; // 0..10

/* ---------- Utility functions ---------- */
function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/* ---------- Level navigation ---------- */
(function levelNavInit(){
  const levelBtns = qsa('.level-btn[data-level]');
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lvl = btn.dataset.level;
      if (!lvl) return;
      // toggle active class only for buttons that have data-level
      qsa('.level-btn[data-level]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      ['1','2','3'].forEach(n => {
        const el = document.getElementById('level' + n);
        if (el) el.style.display = (n === lvl) ? 'block' : 'none';
      });
    });
  });
})();

/* ---------- Drag & Drop helpers ---------- */
function enableDraggables(selector){
  qsa(selector).forEach(el=>{
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', (e)=>{
      el.classList.add('dragging');
      // store a simple id/type info so drops can check dataset values if needed
      try {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          id: el.id || null,
          impact: el.dataset.impact || null,
          modal: el.dataset.modal || null,
          reason: el.dataset.reason || null
        }));
      } catch(e){}
      // also set an html fallback
      try { e.dataTransfer.setData('text/html', el.outerHTML); } catch(e){}
    });
    el.addEventListener('dragend', ()=>el.classList.remove('dragging'));
  });
}

// initialize draggables for known pools
enableDraggables('.poster-card');
enableDraggables('#modalPool .card');
enableDraggables('#reasonPool .reason');

/* ---------- Generic drop helper ---------- */
function makeDropzone(id, acceptSelector, onDropAppend=true, maxChildren=null){
  const drop = document.getElementById(id);
  if(!drop) return;
  drop.addEventListener('dragover', e=> e.preventDefault());
  drop.addEventListener('drop', e=>{
    e.preventDefault();
    const dragging = document.querySelector(acceptSelector + '.dragging') || document.querySelector('.dragging');
    if(!dragging) return;
    if (maxChildren !== null && drop.querySelectorAll(acceptSelector.replace('.','')).length >= maxChildren) {
      // max limit reached (if a classname was used accidentally this won't be perfect, but keep it simple)
      alert('Batas terisi.');
      return;
    }
    if(onDropAppend) drop.appendChild(dragging);
  });
}

/* Poster drop zones */
makeDropzone('strongDrop', '.poster-card');
makeDropzone('mediumDrop', '.poster-card');
makeDropzone('weakDrop', '.poster-card');

/* Modal drop zones */
makeDropzone('mustNotBox', '#modalPool .card');
makeDropzone('cannotBox', '#modalPool .card');

/* Reasons justify box (limit 3) */
const justifyBox = document.getElementById('justifyBox');
if (justifyBox) {
  justifyBox.addEventListener('dragover', e=> e.preventDefault());
  justifyBox.addEventListener('drop', e=>{
    e.preventDefault();
    const dragging = document.querySelector('#reasonPool .reason.dragging');
    if(!dragging) return;
    if (justifyBox.querySelectorAll('.reason').length < 3) justifyBox.appendChild(dragging);
    else alert('Pick only top 3 reasons!');
  });
}
/* Allow returning reasons back to pool */
const reasonPool = document.getElementById('reasonPool');
if (reasonPool) {
  reasonPool.addEventListener('dragover', e=> e.preventDefault());
  reasonPool.addEventListener('drop', e=>{
    e.preventDefault();
    const dragging = document.querySelectorAll('.reason.dragging')[0];
    if(dragging) reasonPool.appendChild(dragging);
  });
}

/* ensure dragging class toggles for all draggables (some were added before) */
qsa('#modalPool .card, #reasonPool .reason, .poster-card').forEach(el=>{
  el.addEventListener('dragstart', ()=>el.classList.add('dragging'));
  el.addEventListener('dragend', ()=>el.classList.remove('dragging'));
});

/* ---------- Level 1: Check ---------- */
(function level1CheckInit(){
  const btn = document.getElementById('checkLevel1');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const checkPoster = (dropId, expected) => {
      const drop = document.getElementById(dropId);
      if(!drop) return false;
      const cards = Array.from(drop.querySelectorAll('.poster-card'));
      // If there are no cards, treat as incorrect (the original code allowed empty but required inside ones to match)
      if (cards.length === 0) return false;
      return cards.every(c => c.dataset.impact === expected);
    };

    const postersOK = checkPoster('strongDrop','strong') && checkPoster('mediumDrop','medium') && checkPoster('weakDrop','weak');

    const mustNotBox = document.getElementById('mustNotBox');
    const cannotBox = document.getElementById('cannotBox');
    const mustNotOK = mustNotBox && Array.from(mustNotBox.querySelectorAll('.card')).every(c=>c.dataset.modal==='mustnot') && mustNotBox.querySelectorAll('.card').length>0;
    const cannotOK = cannotBox && Array.from(cannotBox.querySelectorAll('.card')).every(c=>c.dataset.modal==='cannot') && cannotBox.querySelectorAll('.card').length>0;

    const posterScore = postersOK ? 3 : 0;
    const modalScore = (mustNotOK?1:0) + (cannotOK?1:0);
    const total = posterScore + modalScore; // max 5
    window.level1ScoreValue = total;

    const res = document.getElementById('level1Result');
    if (res) {
      res.innerHTML = `Level 1 score: <strong>${total}/5</strong>. ` +
        (total===5 ? `<span class="success">Excellent analysis! 🎉</span>` : `<span class="small">Review wording and modal meanings, then try again.</span>`);
    }
  });
})();

/* ---------- Level 2: Politeness slider & check ---------- */
(function level2Init(){
  const politeness = document.getElementById('politeness');
  const politenessVal = document.getElementById('politenessVal');
  if (politeness && politenessVal) {
    politeness.addEventListener('input', ()=> politenessVal.innerHTML = `Current rating: <strong>${politeness.value}</strong>`);
  }

  document.getElementById('submitPoliteness')?.addEventListener('click', ()=>{
    const val = Number(politeness?.value || 6);
    let message = '';
    if(val <=4) message = 'You rated it quite impolite — correct: "You must not talk!" is stronger and less polite.';
    else if(val <=7) message = 'Moderately polite — many will see "Please don’t talk." as more polite.';
    else message = 'Very polite — good! "Please don’t talk." is polite and effective.';
    const out = document.getElementById('level2Result');
    if (out) out.innerHTML = `Politeness rating submitted: <strong>${val}</strong>. ${message}`;
    window._politenessValue = val;
  });

  document.getElementById('checkLevel2')?.addEventListener('click', ()=>{
    const chosen = Array.from(justifyBox.querySelectorAll('.reason')).map(r=>r.dataset.reason);
    const required = ['safety','clarity','compliance'];
    const matches = chosen.filter(c => required.includes(c)).length;

    const matchScore = Math.round((matches/3)*7); // 0..7
    const polit = window._politenessValue || Number(politeness?.value || 6);
    const politScore = Math.round(((politen-1)/9)*3) || Math.round(((polit-1)/9)*3); // caution fallback
    // but better compute properly:
    const politScoreCorrect = Math.round(((polit - 1) / 9) * 3);
    const final = Math.min(10, matchScore + politScoreCorrect);
    window.level2ScoreValue = final;
    const out = document.getElementById('level2Result');
    if (out) out.innerHTML = `You chose ${chosen.length} reason(s). Matches: ${matches}. Level 2 score: <strong>${final}/10</strong>.`;
  });
})();

/* ---------- Level 3: Generate poster preview & scoring ---------- */
(function level3Init(){
  const genBtn = document.getElementById('generatePoster');
  if (!genBtn) return;

  genBtn.addEventListener('click', ()=>{
    const ob = qs('#sloganOb')?.value.trim() || '';
    const pro = qs('#sloganPro')?.value.trim() || '';
    const r1 = qs('#rule1')?.value.trim() || '';
    const r2 = qs('#rule2')?.value.trim() || '';
    const r3 = qs('#rule3')?.value.trim() || '';

    if(!ob && !pro && !r1 && !r2 && !r3){
      qs('#createResult').innerText = 'Please enter at least one slogan or rule to generate the poster.';
      return;
    }

    const posterBody = qs('#posterBody');
    if(!posterBody) return;
    posterBody.innerHTML = '';
    if(ob) posterBody.innerHTML += `<p style="font-weight:800;color:${'#e6007e'};font-size:18px">${escapeHtml(ob)}</p>`;
    if(pro) posterBody.innerHTML += `<p style="font-weight:700;color:#ff4da6">${escapeHtml(pro)}</p>`;
    const rules = [r1,r2,r3].filter(Boolean);
    if(rules.length){
      posterBody.innerHTML += '<ul style="text-align:left;margin:8px auto;display:inline-block">';
      rules.forEach(r=> posterBody.innerHTML += `<li style="margin:6px 0">${escapeHtml(r)}</li>`);
      posterBody.innerHTML += '</ul>';
    }
    // compute level3 score: number of filled fields mapped to 0..10
    const filled = [ob,pro,r1,r2,r3].filter(Boolean).length;
    window.level3ScoreValue = Math.min(10, Math.round((filled/5)*10));
    qs('#createResult').innerHTML = `<span class="success">Poster preview updated! Level 3 score suggestion: <strong>${window.level3ScoreValue}/10</strong></span>`;
  });

  /* Poster preview quick download button (separate panel) */
  document.getElementById('savePoster')?.addEventListener('click', ()=> {
    const node = document.getElementById('posterCanvas');
    if(!node) { alert('No poster content to save.'); return; }
    html2canvas(node, { scale: 2 }).then(canvas => {
      canvas.toBlob(function(blob){
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'poster_preview_canvas.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    }).catch(err => alert('Export failed: '+err));
  });

  /* Poster preview (right-hand posterPreview panel) */
  document.getElementById('downloadPoster')?.addEventListener('click', ()=>{
    const node = document.getElementById('posterPreview');
    if(!node) { alert('No poster content to save.'); return; }
    html2canvas(node, { scale: 2 }).then(canvas => {
      canvas.toBlob(function(blob){
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'poster_preview.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    }).catch(err => alert('Export failed: '+err));
  });
})();

/* ---------- Teacher Rubric: Open panel, auto-fill, print, export CSV ---------- */
(function rubricInit(){
  // Helper to safely get numbers
  const getSafeNumber = v => (typeof v === 'number' ? v : (Number(v) || 0));

  // build printable HTML for rubric (simple)
  function buildRubricHTML(printMode = false){
    const s1 = Math.round((getSafeNumber(window.level1ScoreValue) / 5) * 10);
    const s2 = getSafeNumber(window.level2ScoreValue);
    const s3 = getSafeNumber(window.level3ScoreValue);
    const total = s1 + s2 + s3;
    const createdAt = new Date().toLocaleString();

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Rubric — Poster Detective</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#222}
          h1{color:#e6007e}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#ffd6ea;color:#e6007e}
          .total{font-weight:800}
          .no-print{margin-top:16px}
        </style>
      </head>
      <body>
        <h1>Teacher Scoring Rubric — Poster Detective</h1>
        <div>Date: ${createdAt}</div>
        <table>
          <thead><tr><th>Criteria</th><th>Max</th><th>Score</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Level 1 — Analyze & Compare (Q21–23)</td><td>10</td><td>${s1}</td><td></td></tr>
            <tr><td>Level 2 — Evaluate (Q24–26)</td><td>10</td><td>${s2}</td><td></td></tr>
            <tr><td>Level 3 — Create (Q27–30)</td><td>10</td><td>${s3}</td><td></td></tr>
            <tr class="total"><td>Total</td><td>30</td><td>${total}</td><td></td></tr>
          </tbody>
        </table>
        <div class="no-print" ${printMode ? 'style="display:none"' : ''}>
          <button onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `;
  }

  document.getElementById('openRubricPanel')?.addEventListener('click', ()=>{
    const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    w.document.write(buildRubricHTML(false));
    w.document.close();
  });

  document.getElementById('autoFillRubric')?.addEventListener('click', ()=>{
    const s1 = Math.round((getSafeNumber(window.level1ScoreValue) / 5) * 10);
    const s2 = getSafeNumber(window.level2ScoreValue);
    const s3 = getSafeNumber(window.level3ScoreValue);

    const el1 = document.getElementById('rubricScore1');
    const el2 = document.getElementById('rubricScore2');
    const el3 = document.getElementById('rubricScore3');
    const totalEl = document.getElementById('rubricTotal');

    if (el1) el1.value = s1;
    if (el2) el2.value = s2;
    if (el3) el3.value = s3;
    if (totalEl) totalEl.value = (s1 + s2 + s3);

    alert('Rubric auto-filled. Open "Print Rubric" to review and print.');
  });

  document.getElementById('printRubricBtn')?.addEventListener('click', ()=>{
    const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    w.document.write(buildRubricHTML(true));
    w.document.close();
    setTimeout(()=> w.print(), 400);
  });

  /* Download CSV of student/score data (pulls rubric inputs if present) */
  document.getElementById('downloadAllData')?.addEventListener('click', ()=>{
    const rows = [
      ['Criteria','Score','Notes'],
      ['Level1', document.getElementById('rubricScore1')?.value || window.level1ScoreValue, document.getElementById('rubricNote1')?.value || ''],
      ['Level2', document.getElementById('rubricScore2')?.value || window.level2ScoreValue, document.getElementById('rubricNote2')?.value || ''],
      ['Level3', document.getElementById('rubricScore3')?.value || window.level3ScoreValue, document.getElementById('rubricNote3')?.value || '']
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poster_detective_scores.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

})();

/* ---------- Reset Game (minimal reset of dynamic areas) ---------- */
document.getElementById('resetAll')?.addEventListener('click', ()=>{
  // reload page for simple clean state (safe & simple)
  if(confirm('Reset semua aktivitas? Hal ini akan memuat ulang halaman.')) location.reload();
});
