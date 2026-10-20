'use strict';
/* Study_Gateway AI — frontend prototype.
   Everything here runs in the browser. Nothing is sent anywhere, and there is no real login:
   the "demo workspace" button simply opens the screens so you can use and test them. */
(() => {
  /* ---------- settings you can edit ---------- */
  const CONFIG = {
    whatsappUrl: '', // paste your official WhatsApp channel link (https://...) to show the WhatsApp link
    focusMinutes: 25,
  };

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const store = {
    get(k, area = 'local') { try { return window[area + 'Storage'].getItem(k); } catch { return null; } },
    set(k, v, area = 'local') { try { window[area + 'Storage'].setItem(k, v); } catch { /* private mode / full: carry on */ } },
    del(k, area = 'local') { try { window[area + 'Storage'].removeItem(k); } catch { /* ignore */ } },
  };
  const KEY = { theme: 'sg-theme', history: 'sg-history-v1', tasks: 'sg-tasks-v1', session: 'sg-demo-session', view: 'sg-demo-view' };
  const names = { home: 'Home', studio: 'AI Studio', history: 'History', planner: 'Study Planner', focus: 'Focus Timer', profile: 'Profile' };
  const types = { notes: 'Smart Notes', mindmap: 'Mind Map', mcq: 'MCQs & Quiz', qa: 'Question Answers', ppt: 'Presentation', workflow: 'Study Workflow' };
  const baseTitle = document.title;

  function loadList(key, isValid, limit) {
    try {
      const data = JSON.parse(store.get(key) || '[]');
      return Array.isArray(data) ? data.filter(isValid).slice(0, limit) : [];
    } catch { return []; }
  }
  const isStr = (v, max) => typeof v === 'string' && v.length <= max;
  const isHistory = (x) => x && isStr(x.id, 80) && types[x.type] && isStr(x.title, 200) && isStr(x.source, 5000) && isStr(x.cls, 40) && isStr(x.subject, 60) && isStr(x.created, 60);
  const isTask = (t) => t && isStr(t.id, 80) && isStr(t.text, 120) && typeof t.done === 'boolean';

  /* ---------- state ---------- */
  let output = 'notes';
  let current = null;      // the resource shown in the Studio preview
  let currentSaved = false;
  let historyItems = loadList(KEY.history, isHistory, 100);
  let tasks = loadList(KEY.tasks, isTask, 100);
  const saveHistory = () => store.set(KEY.history, JSON.stringify(historyItems));
  const saveTasks = () => store.set(KEY.tasks, JSON.stringify(tasks));
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  /* ---------- navigation ---------- */
  function show(view, { focus = true } = {}) {
    if (!names[view]) return;
    $$('.view').forEach((el) => el.classList.toggle('hidden', el.id !== view));
    $('#crumb').textContent = names[view];
    $$('[data-view]').forEach((b) => {
      const on = b.dataset.view === view;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (view === 'history') renderHistory();
    if (view === 'planner') renderTasks();
    if (view === 'profile') renderStats();
    if (view === 'studio') selectOutput();
    store.set(KEY.view, view, 'session');
    const heading = $('#' + view + ' h1');
    if (heading && focus) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-view]');
    if (nav) { e.preventDefault(); show(nav.dataset.view); return; }
    const tool = e.target.closest('[data-tool]');
    if (tool) { output = tool.dataset.tool; show('studio'); return; }
    const open = e.target.closest('[data-open]');
    if (open) { openHistory(open.dataset.open); return; }
    const del = e.target.closest('[data-delete]');
    if (del) {
      historyItems = historyItems.filter((i) => i.id !== del.dataset.delete);
      saveHistory(); renderHistory(); renderRecent(); renderStats();
    }
  });

  /* ---------- login screen (demo only: never pretends to authenticate) ---------- */
  const message = $('#message');
  const say = (text) => { message.textContent = text; };

  function enterApp() {
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
    store.set(KEY.session, '1', 'session');
  }

  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#email'), password = $('#password');
    if (!email.value.trim() || !email.checkValidity()) { say('Please enter a valid email address.'); email.focus(); return; }
    if (!password.value) { say('Please enter your password.'); password.focus(); return; }
    password.value = ''; // never keep a typed password around
    say('Real sign-in is not connected yet, so this form cannot log you in. Tap “Explore the demo workspace” to look around.');
  });
  $('#demo').addEventListener('click', () => { enterApp(); show('home', { focus: false }); });
  $('#google').addEventListener('click', () => say('Google sign-in is not connected yet.'));
  $('#create').addEventListener('click', () => say('Account creation requires a real authentication provider.'));
  $('#forgot').addEventListener('click', () => say('Password recovery will work after authentication is connected.'));

  /* ---------- theme ---------- */
  function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    $('#theme').setAttribute('aria-pressed', String(dark));
  }
  const savedTheme = store.get(KEY.theme);
  applyTheme(savedTheme ? savedTheme === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));
  $('#theme').addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    applyTheme(dark);
    store.set(KEY.theme, dark ? 'dark' : 'light');
  });

  /* ---------- AI Studio (placeholder output, honestly labelled) ---------- */
  function selectOutput() {
    $$('[data-output]').forEach((b) => {
      const on = b.dataset.output === output;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  $$('[data-output]').forEach((b) => b.addEventListener('click', () => { output = b.dataset.output; selectOutput(); }));

  function buildBody(x) {
    const topic = esc(x.source.slice(0, 150));
    const meta = `<p class="muted tiny"><b>Class:</b> ${esc(x.cls)} · <b>Subject:</b> ${esc(x.subject)}</p>`;
    switch (x.type) {
      case 'mindmap': return `${meta}<h3>${topic}</h3><ul><li>Main idea</li><li>Key concepts</li><li>Examples</li><li>Revision keywords</li></ul>`;
      case 'mcq': return `${meta}<h3>Practice question</h3><p>Which option best explains ${topic}?</p><ol><li>Sample option A</li><li>Sample option B</li><li>Sample option C</li><li>Sample option D</li></ol>`;
      case 'qa': return `${meta}<h3>Short answer</h3><p>Explain ${topic} in 2–3 sentences.</p><h3>Long answer structure</h3><p>Introduction → key points → examples → conclusion.</p>`;
      case 'ppt': return `${meta}<h3>Presentation outline: ${topic}</h3><ol><li>Title and objectives</li><li>Core concepts</li><li>Definitions</li><li>Examples and diagrams</li><li>Summary and questions</li></ol><p>This is an outline, not a downloadable PPT file.</p>`;
      case 'workflow': return `${meta}<h3>Study workflow: ${topic}</h3><ol><li>Read source material</li><li>Identify key ideas</li><li>Create notes</li><li>Practise questions</li><li>Review mistakes</li></ol>`;
      default: return `${meta}<h3>${topic}</h3><h3>Key points</h3><ul><li>Definition and important terms</li><li>Main ideas in short points</li><li>Relevant examples</li><li>Quick revision summary</li></ul>`;
    }
  }

  function showResult(x, saved) {
    current = x; currentSaved = saved;
    $('#resultTitle').textContent = types[x.type] + ' preview';
    $('#resultBody').innerHTML = buildBody(x) + '<p class="muted tiny">Demo placeholder only. Connect a trusted AI backend to generate real, source-grounded content.</p>';
    $('#result').classList.remove('hidden');
    const save = $('#save');
    save.disabled = saved;
    save.textContent = saved ? 'Saved ✓' : 'Save to History';
  }

  $('#generate').addEventListener('click', () => {
    const source = $('#source'), err = $('#sourceErr');
    const text = source.value.trim();
    if (!text) { err.textContent = 'Enter a topic or paste source text first.'; source.setAttribute('aria-invalid', 'true'); source.focus(); return; }
    err.textContent = ''; source.removeAttribute('aria-invalid');
    showResult({ type: output, source: text, cls: $('#class').value, subject: $('#subject').value, title: text.split('\n')[0].slice(0, 100) || types[output] }, false);
  });
  $('#source').addEventListener('input', () => { $('#sourceErr').textContent = ''; $('#source').removeAttribute('aria-invalid'); });

  $('#save').addEventListener('click', () => {
    if (!current || currentSaved) return;
    const item = { id: uid(), type: current.type, title: current.title, source: current.source, cls: current.cls, subject: current.subject, created: new Date().toLocaleString() };
    historyItems.unshift(item);
    historyItems = historyItems.slice(0, 100);
    saveHistory(); renderHistory(); renderRecent(); renderStats();
    current = item; currentSaved = true;
    $('#save').disabled = true; $('#save').textContent = 'Saved ✓';
  });

  /* ---------- History ---------- */
  function renderHistory() {
    $('#historyList').innerHTML = historyItems.map((x) =>
      `<div class="row"><span><b>${esc(x.title)}</b><small class="hist-meta">${esc(types[x.type])} · ${esc(x.created)}</small></span>` +
      `<span class="row-actions"><button type="button" data-open="${esc(x.id)}">Open</button><button type="button" data-delete="${esc(x.id)}" aria-label="Delete ${esc(x.title)}">Delete</button></span></div>`
    ).join('') || 'Nothing saved yet. Create your first resource in AI Studio.';
  }
  function renderRecent() {
    $('#recent').innerHTML = historyItems.slice(0, 3).map((x) =>
      `<div class="row"><span><b>${esc(x.title)}</b><small class="hist-meta">${esc(types[x.type])}</small></span><button type="button" data-open="${esc(x.id)}">Open</button></div>`
    ).join('') || 'Your saved resources will appear here.';
  }
  function openHistory(id) {
    const x = historyItems.find((i) => i.id === id);
    if (!x) return;
    output = x.type;
    $('#source').value = x.source;
    [['#class', x.cls], ['#subject', x.subject]].forEach(([sel, val]) => { if ([...$(sel).options].some((o) => o.value === val)) $(sel).value = val; });
    show('studio');
    showResult(x, true);
  }
  $('#clear').addEventListener('click', () => {
    if (!historyItems.length) return;
    if (!confirm('Clear all saved history on this device?')) return;
    historyItems = []; saveHistory(); renderHistory(); renderRecent(); renderStats();
    if (current) showResult(current, false);
  });

  /* ---------- Planner ---------- */
  $('#taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#task'), text = input.value.trim();
    if (!text) { input.focus(); return; }
    if (tasks.length >= 100) { $('#goal').textContent = 'Task limit reached (100). Delete some to add more.'; return; }
    tasks.push({ id: uid(), text: text.slice(0, 120), done: false });
    input.value = '';
    saveTasks(); renderTasks(); input.focus();
  });
  function renderTasks() {
    $('#tasks').innerHTML = tasks.map((t) =>
      `<div class="task ${t.done ? 'done' : ''}"><input type="checkbox" id="t-${esc(t.id)}" data-check="${esc(t.id)}" ${t.done ? 'checked' : ''}>` +
      `<label for="t-${esc(t.id)}">${esc(t.text)}</label>` +
      `<button type="button" data-del-task="${esc(t.id)}" aria-label="Delete task: ${esc(t.text)}">×</button></div>`
    ).join('') || 'Add your first task.';
    const done = tasks.filter((t) => t.done).length, pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    $('#goal').textContent = tasks.length ? `${done} of ${plural(tasks.length, 'task')} completed` : 'No tasks yet';
    $('#bar').style.width = pct + '%';
    $('.progress').setAttribute('aria-valuenow', String(pct));
    renderStats();
  }
  $('#tasks').addEventListener('change', (e) => {
    const box = e.target.closest('[data-check]');
    const t = box && tasks.find((x) => x.id === box.dataset.check);
    if (t) { t.done = box.checked; saveTasks(); renderTasks(); }
  });
  $('#tasks').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-task]');
    if (b) { tasks = tasks.filter((t) => t.id !== b.dataset.delTask); saveTasks(); renderTasks(); }
  });

  function renderStats() {
    const el = $('#stats');
    if (el) el.textContent = `${plural(historyItems.length, 'saved resource')} · ${plural(tasks.length, 'task')}`;
  }

  /* ---------- Focus timer (uses the real clock, so it stays accurate if the tab sleeps) ---------- */
  const FULL = CONFIG.focusMinutes * 60;
  let remaining = FULL, endAt = 0, ticker = null, running = false;
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  function paintClock(s) { $('#clock').textContent = fmt(s); document.title = running ? `${fmt(s)} · ${baseTitle}` : baseTitle; }
  function stopTicker() { clearInterval(ticker); ticker = null; running = false; }
  function finish() {
    stopTicker(); remaining = FULL; paintClock(remaining);
    $('#start').textContent = 'Start focus';
    $('#timerMsg').textContent = 'Focus session complete. Take a short break! ✧';
  }
  function update() {
    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (left <= 0) { finish(); return; }
    remaining = left; paintClock(left);
  }
  $('#start').addEventListener('click', () => {
    if (running) {
      update(); stopTicker(); paintClock(remaining);
      $('#start').textContent = 'Resume focus'; $('#timerMsg').textContent = 'Paused.';
      return;
    }
    endAt = Date.now() + remaining * 1000;
    running = true; ticker = setInterval(update, 250);
    $('#start').textContent = 'Pause'; $('#timerMsg').textContent = 'Focus time. Keep this page open while the timer runs.';
    paintClock(remaining);
  });
  $('#reset').addEventListener('click', () => {
    stopTicker(); remaining = FULL; paintClock(remaining);
    $('#start').textContent = 'Start focus'; $('#timerMsg').textContent = 'Keep this page open while the timer runs.';
  });

  /* ---------- log out of the demo ---------- */
  $('#logout').addEventListener('click', () => {
    stopTicker(); remaining = FULL; paintClock(remaining);
    $('#start').textContent = 'Start focus';
    store.del(KEY.session, 'session'); store.del(KEY.view, 'session');
    $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
    $('#loginForm').reset();
    say('You have left the demo workspace.');
    window.scrollTo({ top: 0 });
  });

  /* ---------- footer links ---------- */
  if (/^https:\/\//i.test(CONFIG.whatsappUrl)) {
    $('#whatsapp').setAttribute('href', CONFIG.whatsappUrl);
    $('#waWrap').classList.remove('hidden');
  }

  /* ---------- start ---------- */
  selectOutput(); renderRecent(); renderStats(); renderTasks(); renderHistory();
  if (store.get(KEY.session, 'session') === '1') { enterApp(); show(store.get(KEY.view, 'session') || 'home', { focus: false }); }
})();
