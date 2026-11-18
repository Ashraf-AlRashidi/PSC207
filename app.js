// ==================== منطق التفاعل لمنصة البشمهندس أشروووف ====================

let currentSection = 'home';
let partActiveTab = {}; // { part1: 'summary' | 'practice' | 'midterm' }
let partStudyMode = {}; // { part1_practice: false, part1_midterm: false }
let userPartAnswers = {}; // { qId: chosenIdx }

let fcIndex = 0;
let fcFlipped = false;

// حالة محاكي الامتحان
let examActive = false;
let examQuestions = [];
let examAnswers = {};
let examTimerInterval = null;
let examSecondsLeft = 0;

document.addEventListener('DOMContentLoaded', () => {
  COURSE_DATA.parts.forEach(p => {
    partActiveTab[p.id] = 'summary';
  });
  initHome();
  buildDynamicPartSections();
  renderBasmaga();
  renderPastExamPaper();
});

// ==================== التنقل بين الأقسام ====================
function switchSection(secId) {
  currentSection = secId;
  document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`sec-${secId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sec === secId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openPart(partId, subTab = 'summary') {
  partActiveTab[partId] = subTab;
  switchSection(partId);
  renderPartContent(partId);
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const btn = document.getElementById('themeToggleBtn');
  btn.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
}

// ==================== تهيئة الصفحة الرئيسية ====================
function initHome() {
  const partsGrid = document.getElementById('homePartsGrid');
  if (partsGrid) {
    partsGrid.innerHTML = COURSE_DATA.parts.map(p => `
      <div class="feature-card" style="cursor:default;">
        <div>
          <span class="feature-icon">${p.icon}</span>
          <div style="font-size:0.82rem; color:var(--gold); font-weight:800; margin-bottom:0.25rem;">${p.badge}</div>
          <h3 class="feature-title">${p.title}</h3>
          <p class="feature-desc">${p.subtitle}</p>
        </div>
        <div style="display:grid; gap:0.5rem; margin-top:0.75rem;">
          <button class="btn-primary" style="justify-content:center; padding:0.55rem;" onclick="openPart('${p.id}', 'summary')">
            📖 1. تلخيص الجزء
          </button>
          <button class="btn-outline" style="justify-content:center; padding:0.55rem; color:var(--text-main); border-color:var(--border-glass);" onclick="openPart('${p.id}', 'practice')">
            ❓ 2. أسئلة الجزء (${p.practiceQuestions.length} سؤال)
          </button>
          <button class="btn-gold" style="justify-content:center; padding:0.55rem;" onclick="openPart('${p.id}', 'midterm')">
            🎯 3. أسئلة الميد اللي فات (${p.midtermQuestions.length} سؤال)
          </button>
        </div>
      </div>
    `).join('');
  }

  const pdfContainer = document.getElementById('homePdfList');
  if (pdfContainer) {
    pdfContainer.innerHTML = COURSE_DATA.meta.pdfs.map(p => `
      <a class="pdf-item" href="${encodeURI(p.file)}" target="_blank">
        <span>📄 ${p.title}</span>
        <span style="color:var(--gold); font-weight:800;">فتح الملف ⬅️</span>
      </a>
    `).join('');
  }
}

// ==================== بناء أقسام الأجزاء المستقلة ====================
function buildDynamicPartSections() {
  const wrapper = document.getElementById('dynamicPartsWrapper');
  if (!wrapper) return;

  wrapper.innerHTML = COURSE_DATA.parts.map(p => `
    <section id="sec-${p.id}" class="section-view">
      <div class="hero-card" style="padding: 1.85rem 2rem; margin-bottom: 1.4rem;">
        <div class="hero-vip-ribbon">👑 ${p.badge} • البشمهندس أشروووف</div>
        <h2 style="font-size:1.9rem; font-weight:900; color:#fff; margin-bottom:0.35rem;">
          ${p.icon} ${p.title}
        </h2>
        <p style="color:#cbd5e1;">${p.subtitle}</p>
      </div>

      <!-- الثلاثة أقسام الفرعية داخل كل جزء -->
      <div class="part-subtabs" id="subtabs-${p.id}">
        <button class="part-subtab-btn active" data-tab="summary" onclick="openPart('${p.id}', 'summary')">
          📖 1. تلخيص الجزء
        </button>
        <button class="part-subtab-btn" data-tab="practice" onclick="openPart('${p.id}', 'practice')">
          ❓ 2. أسئلة الجزء (${p.practiceQuestions.length} سؤال)
        </button>
        <button class="part-subtab-btn midterm-tab" data-tab="midterm" onclick="openPart('${p.id}', 'midterm')">
          🎯 3. أسئلة الميد اللي فات على الجزء (${p.midtermQuestions.length} سؤال)
        </button>
      </div>

      <!-- محتوى التبويب النشط للجزء -->
      <div id="part-body-${p.id}"></div>
    </section>
  `).join('');

  COURSE_DATA.parts.forEach(p => renderPartContent(p.id));
}

function renderPartContent(partId) {
  const part = COURSE_DATA.parts.find(x => x.id === partId);
  if (!part) return;

  const activeTab = partActiveTab[partId] || 'summary';

  // تحديث أزرار التبويب الفرعية
  document.querySelectorAll(`#subtabs-${partId} .part-subtab-btn`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });

  const bodyEl = document.getElementById(`part-body-${partId}`);
  if (!bodyEl) return;

  if (activeTab === 'summary') {
    bodyEl.innerHTML = renderPartSummaryHTML(part);
  } else if (activeTab === 'practice') {
    bodyEl.innerHTML = renderPartQuestionsHTML(part, 'practice', part.practiceQuestions, `❓ بنك أسئلة ${part.navTitle} (اختيار من متعدد + صواب وخطأ)`);
  } else if (activeTab === 'midterm') {
    bodyEl.innerHTML = renderPartQuestionsHTML(part, 'midterm', part.midtermQuestions, `🎯 أسئلة الميدتيرم اللي فات على ${part.navTitle}`);
  }
}

function renderPartSummaryHTML(part) {
  return `
    <div class="summary-box">
      <div class="summary-header" style="justify-content:space-between;">
        <div>
          <span class="summary-badge">${part.icon} ${part.badge}</span>
          <h3 class="summary-title" style="margin-top:0.5rem;">${part.title}</h3>
        </div>
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
          <button class="btn-primary" onclick="openPart('${part.id}', 'practice')">
            ❓ انتقل لأسئلة الجزء (${part.practiceQuestions.length}) ⬅️
          </button>
          <button class="btn-gold" onclick="openPart('${part.id}', 'midterm')">
            🎯 أسئلة الميد اللي فات (${part.midtermQuestions.length}) ⬅️
          </button>
        </div>
      </div>

      ${part.summaryBlocks.map(block => `
        <div class="sub-section">
          <h4 class="sub-heading">📌 ${block.heading}</h4>

          ${block.items ? `
            <ul class="points-list">
              ${block.items.map((item, idx) => `
                <li>${block.ordered ? `<strong style="color:var(--gold); margin-left:0.4rem;">${idx + 1}.</strong> ` : ''}${item}</li>
              `).join('')}
            </ul>
          ` : ''}

          ${block.subBlocks ? block.subBlocks.map(sb => `
            <div class="sub-block-card">
              <div class="sub-block-title">🔹 ${sb.subTitle}</div>
              <ul class="points-list">
                ${sb.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          `).join('') : ''}
        </div>
      `).join('')}

      <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap; margin-top:2rem; padding-top:1.25rem; border-top:1px solid var(--border-glass);">
        <button class="btn-primary" onclick="openPart('${part.id}', 'practice')">
          ❓ اختبر نفسك الآن في أسئلة ${part.navTitle} (${part.practiceQuestions.length} سؤال)
        </button>
        <button class="btn-gold" onclick="openPart('${part.id}', 'midterm')">
          🎯 حل أسئلة الميد اللي فات على ${part.navTitle} (${part.midtermQuestions.length} سؤال)
        </button>
      </div>
    </div>
  `;
}

function renderPartQuestionsHTML(part, modeKey, qList, headingTitle) {
  const stateKey = `${part.id}_${modeKey}`;
  const isStudy = !!partStudyMode[stateKey];

  let answeredCount = 0;
  let correctCount = 0;
  qList.forEach(q => {
    if (userPartAnswers[q.id] !== undefined) {
      answeredCount++;
      if (userPartAnswers[q.id] === q.ans) correctCount++;
    }
  });

  return `
    <div class="controls-bar" style="border-color:var(--gold);">
      <div>
        <h3 style="font-size:1.25rem; font-weight:900; color:var(--gold);">${headingTitle}</h3>
        <div style="font-size:0.92rem; color:var(--text-muted); font-weight:700;">
          عدد الأسئلة: <strong>${qList.length}</strong> | تمت الإجابة على: <strong>${answeredCount}</strong> | إجابات صحيحة: <strong style="color:var(--emerald);">${correctCount}</strong> ✅
        </div>
      </div>
      <div style="display:flex; gap:0.65rem; flex-wrap:wrap;">
        <button class="${isStudy ? 'btn-primary' : 'btn-gold'}" onclick="togglePartStudyMode('${part.id}', '${modeKey}')">
          ${isStudy ? '🎯 التحويل لوضع الاختبار التفاعلي (إخفاء الحل)' : '📖 إظهار جميع الإجابات والتفسير فوراً'}
        </button>
        <button class="btn-outline" style="color:var(--text-main); border-color:var(--border-glass);" onclick="resetPartQuestions('${part.id}', '${modeKey}')">
          🔄 تصفير الإجابات
        </button>
      </div>
    </div>

    <div>
      ${qList.map((item, idx) => {
        const userChoice = userPartAnswers[item.id];
        const isAnswered = userChoice !== undefined;
        const showAns = isStudy || isAnswered;
        const badgeLabel = item.examRef ? `📌 ${item.examRef}` : `السؤال ${item.num || (idx + 1)}`;
        const subType = item.type ? `<span style="font-size:0.82rem; color:var(--gold); font-weight:800;">${item.type}</span>` : `<span style="font-size:0.82rem; color:var(--emerald); font-weight:800;">أسئلة الميد السابق</span>`;

        return `
          <div class="question-card">
            <div class="question-header">
              <span class="q-num">${badgeLabel}</span>
              ${subType}
            </div>
            <div class="q-text">${item.q}</div>
            <div class="options-list">
              ${item.options.map((opt, oIdx) => {
                let cls = 'option-btn';
                let icon = '';
                if (showAns) {
                  cls += ' disabled';
                  if (oIdx === item.ans) {
                    cls += ' correct';
                    icon = '✅ الإجابة الصحيحة';
                  } else if (isAnswered && oIdx === userChoice && userChoice !== item.ans) {
                    cls += ' wrong';
                    icon = '❌ اختيارك';
                  }
                }
                return `
                  <button class="${cls}" onclick="answerPartQuestion('${part.id}', '${item.id}', ${oIdx})">
                    <span>${opt}</span>
                    <span style="font-size:0.85rem;">${icon}</span>
                  </button>
                `;
              }).join('')}
            </div>
            <div class="q-exp ${showAns ? 'visible' : ''}">
              <strong>💡 التفسير (البشمهندس أشروووف):</strong> ${item.exp}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function answerPartQuestion(partId, qId, optIdx) {
  const activeTab = partActiveTab[partId];
  const stateKey = `${partId}_${activeTab}`;
  if (partStudyMode[stateKey] || userPartAnswers[qId] !== undefined) return;
  userPartAnswers[qId] = optIdx;
  renderPartContent(partId);
}

function togglePartStudyMode(partId, modeKey) {
  const stateKey = `${partId}_${modeKey}`;
  partStudyMode[stateKey] = !partStudyMode[stateKey];
  renderPartContent(partId);
}

function resetPartQuestions(partId, modeKey) {
  const part = COURSE_DATA.parts.find(x => x.id === partId);
  if (!part) return;
  const list = modeKey === 'practice' ? part.practiceQuestions : part.midtermQuestions;
  list.forEach(q => delete userPartAnswers[q.id]);
  renderPartContent(partId);
}

// ==================== قسم البصمجة 🔥 ====================
function renderBasmaga() {
  updateFlashcard();
  filterBasmagaTriggers();

  const numGrid = document.getElementById('basmagaNumbersGrid');
  if (numGrid) {
    numGrid.innerHTML = COURSE_DATA.basmaga.numbers.map(n => `
      <div class="num-card">
        <div class="num-val">${n.num}</div>
        <div class="num-label">${n.label}</div>
      </div>
    `).join('');
  }

  const trapsContainer = document.getElementById('basmagaTrapsList');
  if (trapsContainer) {
    trapsContainer.innerHTML = COURSE_DATA.basmaga.tfTraps.map(t => `
      <div class="trap-card">
        <div class="trap-stmt">⚠️ "${t.statement}"</div>
        <span class="trap-ans">${t.answer}</span>
        <div class="trap-fix">✔️ التصحيح والبصمجة: ${t.fix}</div>
      </div>
    `).join('');
  }
}

function filterBasmagaTriggers() {
  const search = (document.getElementById('basmagaSearch')?.value || '').trim().toLowerCase();
  const grid = document.getElementById('basmagaTriggersGrid');
  if (!grid) return;

  const list = COURSE_DATA.basmaga.triggers.filter(t =>
    !search || t.seen.toLowerCase().includes(search) || t.choose.toLowerCase().includes(search) || t.tag.toLowerCase().includes(search)
  );

  grid.innerHTML = list.map(t => `
    <div class="trigger-card">
      <span class="trigger-tag">🔥 ${t.tag}</span>
      <div class="trigger-seen">👁️ أول ما تشوف في السؤال: <strong style="color:var(--text-main);">${t.seen}</strong></div>
      <div class="trigger-choose">🎯 اختار فوراً: ${t.choose}</div>
    </div>
  `).join('');
}

function updateFlashcard() {
  const list = COURSE_DATA.basmaga.triggers;
  if (!list.length) return;
  const item = list[fcIndex];
  const box = document.getElementById('flashcardBox');
  if (!box) return;

  if (!fcFlipped) {
    box.innerHTML = `
      <div class="fc-hint">⚡ كارت بصمجة رقم (${fcIndex + 1} / ${list.length}) — اضغط على الكارت لإظهار الإجابة</div>
      <div class="fc-content">أول ما تشوف في الامتحان:<br><span style="color:var(--cyan); font-size:1.5rem;">« ${item.seen} »</span></div>
    `;
  } else {
    box.innerHTML = `
      <div class="fc-hint" style="color:var(--emerald);">✅ الإجابة الفورية (اضغط للعودة للسؤال)</div>
      <div class="fc-content" style="color:var(--gold-light); font-size:1.5rem;">🎯 ${item.choose}</div>
    `;
  }
}

function flipFlashcard() {
  fcFlipped = !fcFlipped;
  updateFlashcard();
}

function nextFlashcard(dir) {
  const len = COURSE_DATA.basmaga.triggers.length;
  fcIndex = (fcIndex + dir + len) % len;
  fcFlipped = false;
  updateFlashcard();
}

function randomFlashcard() {
  const len = COURSE_DATA.basmaga.triggers.length;
  fcIndex = Math.floor(Math.random() * len);
  fcFlipped = false;
  updateFlashcard();
}

// ==================== قسم امتحان السنة اللي فاتت ومحاكي الامتحان ====================
function showPastPaperMode() {
  clearInterval(examTimerInterval);
  examActive = false;
  document.getElementById('examSimulatorArea').style.display = 'none';
  document.getElementById('pastPaperArea').style.display = 'block';
}

function renderPastExamPaper() {
  const container = document.getElementById('pastPaperQuestions');
  if (!container) return;

  container.innerHTML = COURSE_DATA.questions.map(item => `
    <div class="question-card">
      <div class="question-header">
        <span class="q-num">السؤال ${item.id} (امتحان العام الماضي)</span>
        <span style="color:var(--emerald); font-weight:800; font-size:0.88rem;">✔ محلول ومراجع</span>
      </div>
      <div class="q-text">${item.q}</div>
      <div class="options-list">
        ${item.options.map((opt, idx) => `
          <div class="option-btn disabled ${idx === item.ans ? 'correct' : ''}">
            <span>${opt}</span>
            <span>${idx === item.ans ? '✅ الإجابة النموذجية' : ''}</span>
          </div>
        `).join('')}
      </div>
      <div class="q-exp visible">
        <strong>📌 التوضيح:</strong> ${item.exp}
      </div>
    </div>
  `).join('');
}

function startExamSimulator(count) {
  document.getElementById('pastPaperArea').style.display = 'none';
  document.getElementById('examSimulatorArea').style.display = 'block';
  document.getElementById('examCertificateContainer').innerHTML = '';

  const shuffled = [...COURSE_DATA.questions].sort(() => Math.random() - 0.5);
  examQuestions = count === 88 ? [...COURSE_DATA.questions] : shuffled.slice(0, count);
  examAnswers = {};
  examActive = true;
  examSecondsLeft = count * 45;

  clearInterval(examTimerInterval);
  updateTimerUI();
  examTimerInterval = setInterval(() => {
    examSecondsLeft--;
    updateTimerUI();
    if (examSecondsLeft <= 0) {
      finishExamSimulator();
    }
  }, 1000);

  renderSimulatorQuestions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTimerUI() {
  const mins = Math.floor(examSecondsLeft / 60);
  const secs = examSecondsLeft % 60;
  const el = document.getElementById('examTimerDisplay');
  if (el) {
    el.textContent = `⏱️ الوقت المتبقي: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

function selectExamOption(qId, optIdx) {
  if (!examActive) return;
  examAnswers[qId] = optIdx;
  renderSimulatorQuestions();
}

function renderSimulatorQuestions() {
  const container = document.getElementById('simulatorQuestionsList');
  if (!container) return;

  const answeredCount = Object.keys(examAnswers).length;
  const progEl = document.getElementById('examProgressText');
  if (progEl) {
    progEl.textContent = `تم حل ${answeredCount} من ${examQuestions.length} سؤال`;
  }

  container.innerHTML = examQuestions.map((item, index) => {
    const chosen = examAnswers[item.id];
    return `
      <div class="question-card">
        <div class="question-header">
          <span class="q-num">سؤال ${index + 1}</span>
          ${!examActive ? (chosen === item.ans ? '<span style="color:var(--emerald);font-weight:800;">✅ إجابة صحيحة</span>' : '<span style="color:var(--rose);font-weight:800;">❌ إجابة خاطئة</span>') : ''}
        </div>
        <div class="q-text">${item.q}</div>
        <div class="options-list">
          ${item.options.map((opt, idx) => {
            let cls = 'option-btn';
            if (examActive && chosen === idx) {
              cls += ' correct';
            } else if (!examActive) {
              cls += ' disabled';
              if (idx === item.ans) cls += ' correct';
              else if (chosen === idx) cls += ' wrong';
            }
            return `
              <button class="${cls}" onclick="selectExamOption(${item.id}, ${idx})">
                <span>${opt}</span>
                <span>${examActive && chosen === idx ? '☑️ تم الاختيار' : (!examActive && idx === item.ans ? '✅ الصح' : '')}</span>
              </button>
            `;
          }).join('')}
        </div>
        ${!examActive ? `<div class="q-exp visible"><strong>💡 الشرح:</strong> ${item.exp}</div>` : ''}
      </div>
    `;
  }).join('');
}

function finishExamSimulator() {
  clearInterval(examTimerInterval);
  examActive = false;

  let score = 0;
  examQuestions.forEach(q => {
    if (examAnswers[q.id] === q.ans) score++;
  });

  const pct = Math.round((score / examQuestions.length) * 100);
  let gradeTitle = '';
  if (pct >= 90) gradeTitle = 'امتياز مع مرتبة الشرف (بصمجي عالمي معتمد من البشمهندس أشروووف 👑)';
  else if (pct >= 80) gradeTitle = 'جيد جداً (أداء عالي يا بطل 🌟)';
  else if (pct >= 65) gradeTitle = 'جيد (شد حيلك شوية كمان في قسم البصمجة 💪)';
  else gradeTitle = 'يحتاج مراجعة سريعة لملخصات البشمهندس أشروووف 📚';

  const certContainer = document.getElementById('examCertificateContainer');
  certContainer.innerHTML = `
    <div class="certificate-box">
      <div style="font-size:2.8rem; margin-bottom:0.5rem;">👑🏆</div>
      <h2 style="color:var(--gold); font-family:'Reem Kufi', sans-serif; font-size:1.85rem; margin-bottom:0.5rem;">
        شهادة اجتياز من منصة البشمهندس أشروووف
      </h2>
      <p style="color:#cbd5e1; margin-bottom:1rem;">نتيجة اختبار مقرر القضايا الدولية المعاصرة (Global Issues - PSC207)</p>
      <div style="font-size:2.4rem; font-weight:900; color:var(--emerald); margin-bottom:0.5rem;">
        ${score} / ${examQuestions.length} (${pct}%)
      </div>
      <div style="font-size:1.15rem; font-weight:800; color:var(--gold-light); margin-bottom:1.25rem;">
        التقدير: ${gradeTitle}
      </div>
      <p style="font-size:0.9rem; color:#94a3b8;">راجِع إجاباتك والتصحيح التفصيلي بالأسفل ⬇️</p>
    </div>
  `;

  renderSimulatorQuestions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
