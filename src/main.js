import './style.css';
import { WEEKS } from './data.js';
import { loadFromFirebase, saveToFirebase } from './firebase.js';
import {
  taskKey, setSyncStatus,
  updateProgress, updateWeekNav, updateSecCount, updateReviewList,
  refreshUI, render, initOpenSections, updateCountdown, initResizableSidebar,
} from './ui.js';

// --- State ---
let state = { checked: {}, weak: {}, memos: {} };
let saveTimer = null;

// --- Save ---
function debounceSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      setSyncStatus('保存中...', 'syncing');
      await saveToFirebase(state);
      setSyncStatus('同期済み', 'synced');
    } catch {
      setSyncStatus('オフライン', 'error');
    }
    try { localStorage.setItem('boki2_local', JSON.stringify(state)); } catch { /* noop */ }
  }, 1200);
}

// --- Load ---
async function loadData() {
  try {
    const data = await loadFromFirebase();
    if (data) state = data;
    setSyncStatus('同期済み', 'synced');
  } catch {
    setSyncStatus('オフライン', 'error');
    try {
      const s = localStorage.getItem('boki2_local');
      if (s) state = JSON.parse(s);
    } catch { /* noop */ }
  }
  refreshUI(state);
}

// --- Event delegation ---
document.addEventListener('click', e => {
  // Check button
  const chk = e.target.closest('.btn-check');
  if (chk) {
    const { wi, si, ti } = chk.dataset;
    const key = taskKey(wi, si, ti);
    state.checked[key] = !state.checked[key];
    if (!state.checked[key]) delete state.checked[key];
    const row = document.getElementById(`tr_${key}`);
    if (state.checked[key]) { row.classList.add('done'); chk.classList.add('checked'); chk.textContent = '✓'; }
    else { row.classList.remove('done'); chk.classList.remove('checked'); chk.textContent = ''; }
    updateProgress(state);
    updateWeekNav(Number(wi), state);
    updateSecCount(Number(wi), Number(si), state);
    debounceSave();
    return;
  }

  // Weak button
  const wbtn = e.target.closest('.btn-weak');
  if (wbtn) {
    const { wi, si, ti } = wbtn.dataset;
    const key = taskKey(wi, si, ti);
    state.weak[key] = !state.weak[key];
    if (!state.weak[key]) delete state.weak[key];
    const row = document.getElementById(`tr_${key}`);
    if (state.weak[key]) { row.classList.add('weak'); wbtn.classList.add('active'); }
    else { row.classList.remove('weak'); wbtn.classList.remove('active'); }
    updateReviewList(state);
    debounceSave();
    return;
  }

  // Memo toggle
  const mt = e.target.closest('.memo-toggle');
  if (mt) {
    const { wi, si, ti } = mt.dataset;
    const key = taskKey(wi, si, ti);
    const box = document.getElementById(`mb_${key}`);
    const row = document.getElementById(`tr_${key}`);
    box.classList.toggle('open');
    if (box.classList.contains('open')) {
      mt.textContent = '📝 閉じる';
      row.classList.add('memo-open');
      document.getElementById(`mta_${key}`).focus();
    } else {
      mt.textContent = state.memos[key] ? '📝 メモあり' : '📝 メモを追加';
      row.classList.remove('memo-open');
    }
    return;
  }

  // Memo save
  const msave = e.target.closest('.memo-save');
  if (msave) {
    const { wi, si, ti } = msave.dataset;
    const key = taskKey(wi, si, ti);
    const val = document.getElementById(`mta_${key}`).value;
    state.memos[key] = val;
    if (!val) delete state.memos[key];
    const mtEl = document.getElementById(`mt_${key}`);
    mtEl.className = 'memo-toggle' + (val ? ' has-memo' : '');
    const saved = document.getElementById(`ms_${key}`);
    saved.style.display = 'inline';
    setTimeout(() => { saved.style.display = 'none'; }, 1500);
    updateReviewList(state);
    debounceSave();
    return;
  }

  // Section toggle
  const hdr = e.target.closest('.section-hdr');
  if (hdr) {
    const { wi, si } = hdr.dataset;
    document.getElementById(`sec_${wi}_${si}`).classList.toggle('open');
    return;
  }
});

// --- Init ---
render();
updateCountdown();
initOpenSections();
initResizableSidebar();
loadData();
