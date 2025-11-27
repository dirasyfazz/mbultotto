const questions = [
  "Can I read and recognize common sight words without sounding them out?",
  "When I read aloud, do I notice when I mix up similar words (like 'pat' and 'bat')?",
  "Can I break down unfamiliar words into smaller sound parts (phonemes or syllables)?",
  "Do I pronounce every sound smoothly and clearly when reading aloud?",
  "Do I feel comfortable reading unfamiliar words?",
  "Do I sometimes substitute words while reading?",
  "Do I ever omit or misread words when reading aloud?",
  "Do I ever flip or reword letters (like reading 'was' as 'saw')?",
  "Do I acknowledge and correct my mistakes?",
  "Do I hesitate when unsure of a word?",
  "Do I focus on punctuation when reading aloud?",
  "Does my tone and expression match the text’s meaning?",
  "Do I occasionally read in a flat tone ignoring punctuation?",
  "Can I read fluently without frequent pauses?",
  "Do I know my reading fluency (words per minute)?",
  "Is my reading speed appropriate for my grade level?",
  "Do I comprehend most texts when reading independently?",
  "Do I sometimes need help understanding certain parts?",
  "Does my reading suffer from attention or decoding difficulties?",
  "Do I have trouble reading because of hearing, vision, or focus issues?"
];

// Build the Likert table dynamically
const tbody = document.getElementById('questionBody');
questions.forEach((q, i) => {
  const id = `q${i+1}`;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="qcol"><div class="qnum">${i+1}.</div><div class="qtext">${q}</div></td>
    ${[1,2,3,4,5].map(v => `<td><input type="radio" name="${id}" value="${v}" required></td>`).join('')}
  `;
  tbody.appendChild(tr);
});

// --- Helpers ---
function collectResponses() {
  return questions.map((_, i) => {
    const selected = document.querySelector(`input[name="q${i+1}"]:checked`);
    return selected ? Number(selected.value) : null;
  });
}
function computeScore(arr) {
  const valid = arr.filter(v => v != null);
  const total = valid.reduce((a,b)=>a+b,0);
  const max = questions.length * 5;
  const avg = (total / questions.length).toFixed(2);
  return { total, max, avg };
}

// --- Buttons ---
document.getElementById('showScore').addEventListener('click', () => {
  const responses = collectResponses();
  if (responses.includes(null)) { alert("Please answer all questions first 💬"); return; }
  const { total, max, avg } = computeScore(responses);
  document.getElementById('totalScore').textContent = total;
  document.getElementById('maxScore').textContent = max;
  document.getElementById('avgScore').textContent = avg;
  document.getElementById('resultRow').hidden = false;
  document.getElementById('resultRow').scrollIntoView({behavior:'smooth'});
});

document.getElementById('exportCSV').addEventListener('click', () => {
  const nameField = document.getElementById('studentName');
  const studentName = nameField.value.trim();
  if (!studentName) { alert("Please enter your name first 🩷"); nameField.focus(); return; }

  const responses = collectResponses();
  if (responses.includes(null)) { alert("Please answer all questions before exporting 📝"); return; }

  const { total, max, avg } = computeScore(responses);
  const rows = [
    ['Student Name', studentName],
    ['Page', 'Self Assessment'],
    ['Timestamp', new Date().toLocaleString()],
    [],
    ['Question #','Question Text','Response (1-5)'],
    ...questions.map((q,i)=>[i+1, q, responses[i]]),
    [],
    ['Total', total],
    ['Max', max],
    ['Average', avg]
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const safeName = studentName.replace(/\s+/g,'_').replace(/[^\w\-]/g,'');
  const ts = new Date().toISOString().replace(/\D/g,'').slice(0,14);
  const filename = `${safeName}_SelfAssessment_${ts}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
