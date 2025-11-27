// 🌷 Checklist Learning Progress Script

const statements = [
  // Recognizing (1–8)
  "I can recognize the text's primary idea.",
  "I can remember key details that support the main idea.",
  "I can identify who, what, when, where, and why in the text.",
  "I can understand word meanings from context.",
  "I can describe the text's ideas or flow of events.",
  "Sentences make sense to me when read literally.",
  "I can identify information that is implied (inference).",
  "I can identify the author's motivation for writing.",
  // Applying (9–14)
  "I can connect details across different sections to form understanding.",
  "I can compare ideas in this text with another text on the same topic.",
  "I can answer comprehension questions using text details.",
  "I can use evidence from the text to support my opinions.",
  "I can provide a clear summary of the text.",
  "I can infer conclusions or predict outcomes from the text.",
  // Reflecting (15–20)
  "I can relate the text's ideas to my personal experiences.",
  "I can judge the accuracy or truth of the text's information.",
  "I can agree or disagree with the author and explain why.",
  "I can come away with new insights or ideas after reading.",
  "I can apply the text's lesson or moral to real situations.",
  "I can reflect on my reading process and identify when I understand or am confused."
];

// --- Build Likert Table ---
const tbody = document.getElementById('statementsBody');
statements.forEach((text, i) => {
  const id = `s${i+1}`;
  const tr = document.createElement('tr');
  const qcol = document.createElement('td');
  qcol.className = 'qcol';
  qcol.innerHTML = `<div class="qnum">${i+1}.</div><div class="qtext">${text}</div>`;
  tr.appendChild(qcol);
  for (let v = 1; v <= 5; v++) {
    const td = document.createElement('td');
    td.innerHTML = `<input type="radio" name="${id}" value="${v}" required>`;
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
});

// --- Helpers ---
function collectResponses() {
  return statements.map((_, i) => {
    const checked = document.querySelector(`input[name="s${i+1}"]:checked`);
    return checked ? Number(checked.value) : null;
  });
}

function computeScore(arr) {
  const valid = arr.filter(v => v != null);
  const total = valid.reduce((a,b) => a + b, 0);
  const max = statements.length * 5;
  const avg = (total / statements.length).toFixed(2);
  return { total, max, avg };
}

// --- Actions ---
document.getElementById('showScore').addEventListener('click', () => {
  const responses = collectResponses();
  if (responses.includes(null)) {
    alert("Please complete all statements first 💡");
    return;
  }
  const { total, max, avg } = computeScore(responses);
  document.getElementById('totalScore').textContent = total;
  document.getElementById('maxScore').textContent = max;
  document.getElementById('avgScore').textContent = avg;
  document.getElementById('resultRow').hidden = false;
  document.getElementById('resultRow').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('exportCSV').addEventListener('click', () => {
  const nameInput = document.getElementById('studentName');
  const studentName = nameInput.value.trim();
  if (!studentName) {
    alert("Please enter your name before exporting 🩷");
    nameInput.focus();
    return;
  }

  const responses = collectResponses();
  if (responses.includes(null)) {
    alert("Please answer all statements before exporting 📝");
    return;
  }

  const { total, max, avg } = computeScore(responses);
  const rows = [
    ['Student Name', studentName],
    ['Page', 'Checklist Learning Progress'],
    ['Timestamp', new Date().toLocaleString()],
    [],
    ['Statement #', 'Statement Text', 'Response (1-5)'],
    ...statements.map((s, i) => [i + 1, s, responses[i]]),
    [],
    ['Total', total],
    ['Max', max],
    ['Average', avg]
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const safeName = studentName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
  const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const filename = `${safeName}_ChecklistLearning_${ts}.csv`;

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
