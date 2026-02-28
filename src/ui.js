import { WEEKS, TAG } from './data.js';

export function taskKey(wi, si, ti) {
  return `${wi}_${si}_${ti}`;
}

export function setSyncStatus(text, cls) {
  const badge = document.getElementById('syncBadge');
  badge.className = 'sync-badge ' + cls;
  document.getElementById('syncText').textContent = text;
}

export function updateProgress(state) {
  let total = 0, done = 0;
  WEEKS.forEach((w, wi) =>
    w.sections.forEach((s, si) =>
      s.tasks.forEach((_, ti) => {
        total++;
        if (state.checked[taskKey(wi, si, ti)]) done++;
      })
    )
  );
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('pb').style.width = pct + '%';
  const pbm = document.getElementById('pbMobile');
  if (pbm) pbm.style.width = pct + '%';
  document.getElementById('progressVal').textContent = pct + '%';
  document.getElementById('progressLabel').textContent = `${done} / ${total} タスク`;
  const mPct = document.getElementById('mPct');
  if (mPct) mPct.textContent = pct + '%';
}

export function updateWeekNav(wi, state) {
  const w = WEEKS[wi];
  let done = 0, total = 0;
  w.sections.forEach((s, si) =>
    s.tasks.forEach((_, ti) => {
      total++;
      if (state.checked[taskKey(wi, si, ti)]) done++;
    })
  );
  const el = document.getElementById(`wnCnt_${wi}`);
  if (el) el.textContent = `${done}/${total}`;
}

export function updateSecCount(wi, si, state) {
  const s = WEEKS[wi].sections[si];
  const done = s.tasks.filter((_, ti) => state.checked[taskKey(wi, si, ti)]).length;
  const el = document.getElementById(`sCnt_${wi}_${si}`);
  if (el) el.textContent = `${done}/${s.tasks.length}`;
}

export function updateReviewList(state) {
  const list = document.getElementById('reviewList');
  const items = [];
  WEEKS.forEach((w, wi) =>
    w.sections.forEach((s, si) =>
      s.tasks.forEach((t, ti) => {
        const key = taskKey(wi, si, ti);
        if (state.weak[key]) {
          items.push({ text: t.text, loc: `${w.title} › ${s.title}`, memo: state.memos[key] || '' });
        }
      })
    )
  );
  if (!items.length) {
    list.innerHTML = '<div class="review-empty">苦手マークした項目がここに表示されます</div>';
    return;
  }
  list.innerHTML = items.map(it => `
    <div class="review-item">
      <div class="review-item-text">⚠ ${it.text}</div>
      <div class="review-item-loc">${it.loc}</div>
      ${it.memo ? `<div class="review-item-memo">${it.memo.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>` : ''}
    </div>
  `).join('');
}

export function refreshUI(state) {
  updateProgress(state);
  updateReviewList(state);
  WEEKS.forEach((_, wi) => {
    updateWeekNav(wi, state);
    WEEKS[wi].sections.forEach((_, si) => {
      updateSecCount(wi, si, state);
      WEEKS[wi].sections[si].tasks.forEach((_, ti) => {
        const key = taskKey(wi, si, ti);
        const row = document.getElementById(`tr_${key}`);
        if (!row) return;
        const chk = document.getElementById(`tc_${key}`);
        const wbtn = document.getElementById(`tw_${key}`);
        const mt = document.getElementById(`mt_${key}`);
        const mta = document.getElementById(`mta_${key}`);

        if (state.checked[key]) {
          row.classList.add('done');
          if (chk) { chk.classList.add('checked'); chk.textContent = '✓'; }
        } else {
          row.classList.remove('done');
          if (chk) { chk.classList.remove('checked'); chk.textContent = ''; }
        }

        if (state.weak[key]) {
          row.classList.add('weak');
          if (wbtn) wbtn.classList.add('active');
        } else {
          row.classList.remove('weak');
          if (wbtn) wbtn.classList.remove('active');
        }

        const memo = state.memos[key] || '';
        if (mta) mta.value = memo;
        if (mt) {
          mt.className = 'memo-toggle' + (memo ? ' has-memo' : '');
          mt.textContent = memo ? '📝 メモあり' : '📝 メモを追加';
        }
      });
    });
  });
}

export function render() {
  // Week nav
  const nav = document.getElementById('weekNav');
  WEEKS.forEach((w, wi) => {
    const item = document.createElement('div');
    item.className = 'week-nav-item';
    item.id = `wn_${wi}`;
    item.onclick = () =>
      document.getElementById(`ws_${wi}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    item.innerHTML = `
      <div class="week-nav-badge" style="background:${w.cbg};color:${w.color}">${w.label}</div>
      <div class="week-nav-info">
        <div class="week-nav-title">${w.title}</div>
        <div class="week-nav-date">${w.date}</div>
      </div>
      <div class="week-nav-cnt" id="wnCnt_${wi}">0/0</div>`;
    nav.appendChild(item);
  });

  // Week sections
  const main = document.getElementById('weekSections');
  WEEKS.forEach((w, wi) => {
    const sec = document.createElement('div');
    sec.className = 'week-section';
    sec.id = `ws_${wi}`;

    const sectionsHTML = w.sections.map((s, si) => {
      const tasksHTML = s.tasks.map((t, ti) => {
        const key = taskKey(wi, si, ti);
        const tag = TAG[t.tag];
        return `<div class="task-row" id="tr_${key}">
          <div class="task-controls">
            <div class="btn-check" id="tc_${key}" data-wi="${wi}" data-si="${si}" data-ti="${ti}" title="完了チェック"></div>
            <div class="btn-weak" id="tw_${key}" data-wi="${wi}" data-si="${si}" data-ti="${ti}" title="苦手マーク">⚠</div>
          </div>
          <div class="task-content">
            <div class="task-text">${t.text}</div>
            <div class="task-meta">
              <span class="task-book">📖 ${t.book}</span>
              ${t.v ? `<a class="task-video" href="${t.v}" target="_blank" rel="noopener">▶ 動画で確認</a>` : ''}
            </div>
            <div class="memo-section">
              <button class="memo-toggle" id="mt_${key}" data-wi="${wi}" data-si="${si}" data-ti="${ti}">📝 メモを追加</button>
              <div class="memo-box" id="mb_${key}">
                <textarea class="memo-textarea" id="mta_${key}" placeholder="間違えた内容・解き方のポイントなど..."></textarea>
                <div class="memo-actions">
                  <button class="memo-save" data-wi="${wi}" data-si="${si}" data-ti="${ti}">保存する</button>
                  <span class="memo-saved" id="ms_${key}">✓ 保存しました</span>
                </div>
              </div>
            </div>
          </div>
          <div class="task-tag" style="color:${tag.color};background:${tag.bg}">${tag.label}</div>
        </div>`;
      }).join('');

      return `<div class="section-card" id="sec_${wi}_${si}">
        <div class="section-hdr" data-wi="${wi}" data-si="${si}">
          <div class="section-hdr-title">${s.title}</div>
          <div class="section-hdr-right">
            <span class="section-cnt" id="sCnt_${wi}_${si}">0/${s.tasks.length}</span>
            <span class="section-arrow">▼</span>
          </div>
        </div>
        <div class="section-body">${tasksHTML}</div>
      </div>`;
    }).join('');

    sec.innerHTML = `
      <div class="week-section-header">
        <div class="week-badge-lg" style="background:${w.cbg};color:${w.color}">${w.label}</div>
        <div>
          <div class="week-section-title" style="color:${w.color}">${w.title}</div>
          <div class="week-section-date">${w.date}</div>
        </div>
      </div>
      <div class="week-goal" style="border-left-color:${w.color};color:${w.color}">${w.goal}</div>
      ${sectionsHTML}`;
    main.appendChild(sec);
  });
}

export function initOpenSections() {
  const starts = [
    new Date('2026-02-22'), new Date('2026-03-01'),
    new Date('2026-03-08'), new Date('2026-03-15'),
  ];
  const now = new Date();
  let idx = 0;
  starts.forEach((d, i) => { if (now >= d) idx = i; });
  WEEKS[idx].sections.forEach((_, si) =>
    document.getElementById(`sec_${idx}_${si}`).classList.add('open')
  );
  document.getElementById(`wn_${idx}`).classList.add('active');
}

export function updateCountdown() {
  const diff = Math.ceil((new Date('2026-03-22') - new Date()) / 86400000);
  const val = diff > 0 ? diff : 0;
  const el = document.getElementById('cdNum');
  if (el) el.textContent = val;
  const mCd = document.getElementById('mCd');
  if (mCd) mCd.textContent = val;
}

export function initResizableSidebar() {
  const handle = document.getElementById('resizeHandle');
  if (!handle) return;
  let dragging = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    if (window.innerWidth < 900) return;
    dragging = true;
    startX = e.clientX;
    startW = document.querySelector('.sidebar').offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const newW = Math.min(600, Math.max(200, startW + e.clientX - startX));
    document.querySelector('.layout').style.setProperty('--sw', newW + 'px');
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}
