(function () {
  'use strict';

  var hero = document.querySelector('[data-profile-captions]');
  var data = document.getElementById('profile-caption-data');
  if (!hero || !data) return;

  var phrases;
  try { phrases = JSON.parse(data.textContent); } catch (error) { return; }
  if (!Array.isArray(phrases) || !phrases.length) return;

  var caption = hero.querySelector('[data-caption]');
  var lines = caption.querySelectorAll('[data-caption-line]');
  var label = caption.querySelector('[data-caption-label]');
  var toggle = hero.querySelector('[data-caption-toggle]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var tones = ['lime', 'coral', 'lilac', 'ice'];
  var directions = ['left', 'right', 'up'];
  var queue = [];
  var recentPhrases = [];
  var recentLimit = Math.min(5, phrases.length - 1);
  var lastTone = -1;
  var userPaused = false;
  var inView = !window.IntersectionObserver;
  var timer = null;
  var deadline = 0;
  var remaining = 0;
  var phase = '';
  var started = false;

  // Use a shuffled deck, excluding the last five even across round boundaries.
  function nextPhrase() {
    if (!queue.length) {
      queue = phrases.map(function (_, index) { return index; });
      for (var i = queue.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var value = queue[i];
        queue[i] = queue[j];
        queue[j] = value;
      }
    }
    var next = queue.findIndex(function (index) { return recentPhrases.indexOf(index) === -1; });
    var selected = queue.splice(next, 1)[0];
    recentPhrases.push(selected);
    if (recentPhrases.length > recentLimit) recentPhrases.shift();
    return phrases[selected];
  }

  function showPhrase() {
    var phrase = nextPhrase();
    lines.forEach(function (line, index) { line.textContent = phrase.lines[index] || ''; });
    label.textContent = phrase.label;
    label.lang = phrase.lang === 'en' ? 'zh-CN' : 'en';
    caption.lang = phrase.lang || 'zh-CN';
    caption.dataset.layout = phrase.layout || 'right';
    caption.classList.toggle('is-single', phrase.lines.length === 1);
    // Pick a new accent each time, with no immediate color repeats.
    lastTone = lastTone < 0 ? Math.floor(Math.random() * tones.length) :
      (lastTone + 1 + Math.floor(Math.random() * (tones.length - 1))) % tones.length;
    caption.dataset.tone = tones[lastTone];
    caption.dataset.motion = directions[Math.floor(Math.random() * directions.length)];
    caption.style.setProperty('--caption-hold', '4200ms');
    caption.hidden = false;
    hero.classList.add('has-captions');
    started = true;
  }

  function running() {
    return inView && !document.hidden && !userPaused && !motion.matches;
  }

  function schedule() {
    if (!running() || timer !== null) return;
    deadline = performance.now() + remaining;
    timer = window.setTimeout(advance, remaining);
  }

  function setPhase(next, duration) {
    phase = next;
    caption.dataset.state = next;
    remaining = duration;
    schedule();
  }

  function advance() {
    timer = null;
    if (phase === 'enter') setPhase('hold', 4200);
    else if (phase === 'hold') setPhase('leave', 480);
    else {
      showPhrase();
      setPhase('enter', 920);
    }
  }

  function syncPlayback() {
    if (timer !== null && !running()) {
      window.clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, deadline - performance.now());
    }
    hero.classList.toggle('is-caption-paused', !running());
    toggle.hidden = motion.matches || phrases.length < 2;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Resume captions' : 'Pause captions');
    if (motion.matches) {
      if (!started) showPhrase();
      // Keep one random title still when the visitor requests less motion.
      phase = 'hold';
      caption.dataset.state = 'hold';
      remaining = 4200;
    } else if (inView && !started) {
      showPhrase();
      setPhase('enter', 920);
    }
    schedule();
  }

  toggle.addEventListener('click', function () {
    userPaused = !userPaused;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', syncPlayback);

  if (window.IntersectionObserver) {
    var observer = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0 });
    observer.observe(hero);
  }
  syncPlayback();
})();
