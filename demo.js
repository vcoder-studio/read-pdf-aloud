// Live demo: reads the sample paragraph with the browser's own voices and highlights each sentence
(function () {
  const textEl = document.getElementById('demoText');
  const playBtn = document.getElementById('demoPlay');
  const icon = document.getElementById('demoIcon');
  const voiceSelect = document.getElementById('demoVoice');
  const note = document.getElementById('demoNote');
  const synth = window.speechSynthesis;

  const PLAY = 'M8 5v14l11-7z';
  const PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';

  // Wrap each sentence in a span
  const p = textEl.querySelector('p');
  const sentences = p.textContent.match(/[^.!?]+[.!?]+/g).map(s => s.trim());
  p.innerHTML = '';
  const spans = sentences.map((s, i) => {
    const span = document.createElement('span');
    span.className = 's';
    span.textContent = s;
    span.addEventListener('click', () => start(i));
    p.appendChild(span);
    p.appendChild(document.createTextNode(' '));
    return span;
  });

  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    playBtn.disabled = true;
    voiceSelect.innerHTML = '<option>Not available</option>';
    note.textContent = 'Your browser has no text-to-speech voices. Open this page in Chrome to try the demo.';
    return;
  }

  let voices = [];
  let index = 0;
  let playing = false;
  let runId = 0;

  function voiceScore(v) {
    let score = 0;
    if (/^en[-_]US/i.test(v.lang)) score += 3;
    else if (/^en/i.test(v.lang)) score += 2;
    if (/google|natural|online/i.test(v.name)) score += 4;
    return score;
  }

  function loadVoices() {
    const all = synth.getVoices().filter(v => /^en/i.test(v.lang));
    if (!all.length) return;
    voices = all.sort((a, b) => voiceScore(b) - voiceScore(a));
    voiceSelect.innerHTML = '';
    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = v.name.replace(/^Microsoft /, '') + ' (' + v.lang + ')';
      voiceSelect.appendChild(opt);
    });
  }
  loadVoices();
  if ('onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;

  function setIcon(isPlaying) {
    icon.setAttribute('d', isPlaying ? PAUSE : PLAY);
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }

  function mark(i) {
    spans.forEach((s, n) => s.classList.toggle('on', n === i));
  }

  function speak(i, id) {
    if (id !== runId) return;
    if (i >= spans.length) { stop(); index = 0; return; }
    index = i;
    mark(i);
    const u = new SpeechSynthesisUtterance(sentences[i]);
    const v = voices[voiceSelect.value];
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
    u.onend = () => speak(i + 1, id);
    u.onerror = () => { if (id === runId) stop(); };
    synth.speak(u);
  }

  function start(i) {
    runId++;
    synth.cancel();
    playing = true;
    setIcon(true);
    speak(i, runId);
  }

  function stop() {
    runId++;
    playing = false;
    synth.cancel();
    setIcon(false);
    mark(-1);
  }

  playBtn.addEventListener('click', () => {
    if (playing) { const at = index; stop(); index = at; }
    else start(index);
  });
  voiceSelect.addEventListener('change', () => { if (playing) start(index); });
  window.addEventListener('pagehide', () => synth.cancel());
})();
