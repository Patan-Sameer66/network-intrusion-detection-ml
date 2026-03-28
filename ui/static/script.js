/* ─────────────────────────────────────────────────────────────
   NIDS Shield — Frontend Logic
   Handles: drag-drop, file selection, /predict, /retrain calls
   ───────────────────────────────────────────────────────────── */

'use strict';

// ── Helpers ──────────────────────────────────────────────────

function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

function animateNumber(el, target, isFrac = false, suffix = '') {
  const start    = 0;
  const duration = 900;
  const startTs  = performance.now();

  function step(ts) {
    const progress = Math.min((ts - startTs) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    const val      = start + (target - start) * ease;
    el.textContent = isFrac ? (val * 100).toFixed(2) + '%' + suffix : Math.round(val).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Drop Zone Factory ─────────────────────────────────────────

function setupDropZone({ dropEl, inputEl, browseBtn, selectedEl, onFile }) {
  // Click anywhere on drop zone → open file picker
  dropEl.addEventListener('click', (e) => {
    if (e.target === browseBtn || browseBtn.contains(e.target)) return;
    inputEl.click();
  });
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    inputEl.click();
  });

  inputEl.addEventListener('change', () => {
    const file = inputEl.files[0];
    if (file) handleFile(file);
  });

  // Drag events
  dropEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropEl.classList.add('drag-over');
  });
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('drag-over'));
  dropEl.addEventListener('drop', (e) => {
    e.preventDefault();
    dropEl.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'txt'].includes(ext)) {
      selectedEl.textContent = '⚠️ Only .csv and .txt files are supported';
      selectedEl.style.color = 'var(--red)';
      return;
    }
    dropEl.classList.add('has-file');
    selectedEl.style.color = 'var(--green)';
    selectedEl.textContent = `📄 ${file.name}  (${(file.size / 1024).toFixed(1)} KB)`;
    onFile(file);
  }
}

// ── Predict Section ───────────────────────────────────────────

(function initPredict() {
  const dropEl     = document.getElementById('predict-drop');
  const inputEl    = document.getElementById('predict-file-input');
  const browseBtn  = document.getElementById('predict-browse-btn');
  const selectedEl = document.getElementById('predict-selected');
  const analyseBtn = document.getElementById('predict-btn');
  const loaderEl   = document.getElementById('predict-loader');
  const resultsEl  = document.getElementById('predict-results');
  const errorEl    = document.getElementById('predict-error');

  let selectedFile = null;

  setupDropZone({
    dropEl, inputEl, browseBtn, selectedEl,
    onFile(file) {
      selectedFile = file;
      analyseBtn.disabled = false;
      hide(resultsEl);
      hide(errorEl);
    }
  });

  analyseBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    hide(resultsEl);
    hide(errorEl);
    show(loaderEl);
    analyseBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res  = await fetch('/predict', { method: 'POST', body: formData });
      const data = await res.json();

      hide(loaderEl);

      if (!res.ok || data.error) {
        errorEl.textContent = '❌ ' + (data.error || 'Prediction failed.');
        show(errorEl);
        return;
      }

      // Populate stat cards
      const total   = data.total   || 0;
      const attacks = data.attacks || 0;
      const normals = data.normals || 0;
      const rate    = total ? attacks / total : 0;

      animateNumber(document.getElementById('stat-total'),   total);
      animateNumber(document.getElementById('stat-attacks'), attacks);
      animateNumber(document.getElementById('stat-normals'), normals);
      animateNumber(document.getElementById('stat-rate'),    rate, true);

      // User requested red font for attacks if > 0
      const statAttacksEl = document.getElementById('stat-attacks');
      if (attacks > 0) {
        statAttacksEl.style.color = 'var(--red, red)';
      } else {
        statAttacksEl.style.color = '';
      }

      // Progress bar
      const attackPct = total ? (attacks / total) * 100 : 0;
      const normalPct = total ? (normals / total) * 100 : 0;

      requestAnimationFrame(() => {
        document.getElementById('bar-attack-fill').style.width = attackPct + '%';
        document.getElementById('bar-normal-fill').style.width = normalPct + '%';
      });

      show(resultsEl);
    } catch (err) {
      hide(loaderEl);
      errorEl.textContent = '❌ Network error: ' + err.message;
      show(errorEl);
    } finally {
      analyseBtn.disabled = false;
    }
  });
})();

// ── Retrain Section ───────────────────────────────────────────

(function initRetrain() {
  const dropEl     = document.getElementById('retrain-drop');
  const inputEl    = document.getElementById('retrain-file-input');
  const browseBtn  = document.getElementById('retrain-browse-btn');
  const selectedEl = document.getElementById('retrain-selected');
  const retrainBtn = document.getElementById('retrain-btn');
  const loaderEl   = document.getElementById('retrain-loader');
  const resultsEl  = document.getElementById('retrain-results');
  const errorEl    = document.getElementById('retrain-error');

  let selectedFile = null;

  setupDropZone({
    dropEl, inputEl, browseBtn, selectedEl,
    onFile(file) {
      selectedFile = file;
      retrainBtn.disabled = false;
      hide(resultsEl);
      hide(errorEl);
    }
  });

  retrainBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    hide(resultsEl);
    hide(errorEl);
    show(loaderEl);
    retrainBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res  = await fetch('/retrain', { method: 'POST', body: formData });
      const data = await res.json();

      hide(loaderEl);

      if (!res.ok || data.error) {
        errorEl.textContent = '❌ ' + (data.error || 'Retraining failed.');
        show(errorEl);
        return;
      }

      // Populate metrics
      const fmt = (v) => (v * 100).toFixed(2) + '%';
      document.getElementById('metric-acc').textContent     = fmt(data.accuracy);
      document.getElementById('metric-f1').textContent      = fmt(data.f1_score);
      document.getElementById('metric-cv-mean').textContent = fmt(data.cv_mean);
      document.getElementById('metric-cv-std').textContent  = (data.cv_std * 100).toFixed(4) + '%';

      show(resultsEl);
    } catch (err) {
      hide(loaderEl);
      errorEl.textContent = '❌ Network error: ' + err.message;
      show(errorEl);
    } finally {
      retrainBtn.disabled = false;
    }
  });
})();
