const socket = io();

let myName = '', myRoomCode = '', isHost = false, myId = '';
let players = [], currentPlayerId = '';
let timerInterval = null, btnBehavior = 'angry', myScore = 0;
let rules = '', guestReady = false;
let selectedGuess = null, selectedSaboteur = null;
let currentFormat = null, currentRoundNum = 0;
let myFullTask = null, mySaboteurAction = null, iAmSaboteur = false;
let currentPlayerName = '';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function getAvatarClass(i) { return `av-${i % 8}`; }
function getInitial(name) { return name.charAt(0).toUpperCase(); }
function formatTime(sec) {
  if (sec <= 0) return '0:00';
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
}
function showError(msg) {
  const el = document.getElementById('error-msg');
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function startSyncTimer(startTime, duration, fillId, valId) {
  clearInterval(timerInterval);
  const fill = document.getElementById(fillId);
  const val = document.getElementById(valId);
  function tick() {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsed);
    const pct = (remaining / duration) * 100;
    if (fill) {
      fill.style.width = pct + '%';
      if (remaining <= 10) fill.style.background = 'linear-gradient(90deg,#FF6B35,#ff1a1a)';
      else if (remaining <= 30) fill.style.background = 'linear-gradient(90deg,#FFD93D,#FF6B35)';
      else fill.style.background = 'linear-gradient(90deg,#95E1A3,#4ECDC4)';
    }
    if (val) val.textContent = formatTime(Math.ceil(remaining));
    if (remaining <= 0) clearInterval(timerInterval);
  }
  tick();
  timerInterval = setInterval(tick, 500);
}

// ===== КНОПКИ З ПРИКОЛАМИ =====
const BUTTON_TEXTS = {
  run: ['ПОЧАТИ ГРУ 🚀','ЕЙ СТІЙ!','НЕ ЖЕНИ!','ОК ДОБРЕ 🚀'],
  angry: ['ПОЧАТИ ГРУ 🚀','ТИ МЕНІ НЕ ТИКАЙ','СКАЗАЛА НІ!','НУ І ЩО ТИ ЗРОБИШ?','ОК ЗАПУСКАЮ 😤'],
  cry: ['ПОЧАТИ ГРУ 🚀','НЕВЖЕ ТИ НАТИСНЕШ? 🥺','МЕНІ БОЛЯЧЕ...','ОК ОК ЗАПУСКАЮ 😭'],
  lie: ['ПОЧАТИ ГРУ 🚀','ОБМАНУЛА ХА-ХА 😝','ЗАРАЗ ЗАПУЩУ... НІ','ОК РЕАЛЬНО ЗАПУСКАЮ'],
  flirt: ['ПОЧАТИ ГРУ 🚀','СПОЧАТКУ СКАЖИ ЩО Я ГАРНА','ЛАДНО ТАК І БУТИ 😏'],
  melt: ['ПОЧАТИ ГРУ 🚀','я.. тану.. 🫠','ок зібралась 🚀'],
  panic: ['ПОЧАТИ ГРУ 🚀','НЕ НАТИСКАЙ!!','СТІЙ!','ОЙ ВСЕ ОДНО 😱'],
  flip: ['ПОЧАТИ ГРУ 🚀','ʞɔɐq ǝɯ pɐǝɹ','ЗАПУСКАЮ 🚀'],
  disappear: ['ПОЧАТИ ГРУ 🚀','...','ТУТ Я!','ЗАПУСКАЮ 🚀'],
  joke: ['ПОЧАТИ ГРУ 🚀','ЧЕКАЙ АНЕКДОТ!','ЧОМУ КНОПКА НЕ СМІЄТЬСЯ? БО ЇЇ НАТИСКАЮТЬ 😂','ЗАПУСКАЮ 🚀'],
  broken: ['ПОЧАТИ ГРУ 🚀','ПМИЛКА 404','Ж@#ТУЮ ВСЕ ОК','ЗАПУСКАЮ 🚀'],
  password: ['ПОЧАТИ ГРУ 🚀','ВВЕДИ ПАРОЛЬ:','НЕПРАВИЛЬНО','ЛАДНО ПУСКАЮ 🚀'],
  countdown: ['ПОЧАТИ ГРУ 🚀','3...','2...','1...','НІ! 😈','ЗАПУСКАЮ 🚀'],
  regret: ['ПОЧАТИ ГРУ 🚀','ЗАПУСТИЛА... ШКОДУЮ','АЛЕ ОК 🚀'],
  confirm: ['ПОЧАТИ ГРУ 🚀','ТИ ВПЕВНЕНИЙ?','ТОЧНО?','НУ ДОБРЕ 🚀']
};

const READY_TEXTS = {
  run: ['Я ГОТОВИЙ 🙋','ЩЕ НІ!','МАЙЖЕ!','ОК ГОТОВИЙ 🙋'],
  angry: ['Я ГОТОВИЙ 🙋','ТА ЯК Я МОЖУ','НУ ДОБРЕ 🙋'],
  cry: ['Я ГОТОВИЙ 🙋','Я БОЮСЬ 🥺','ОК ГОТОВИЙ 😭'],
  lie: ['Я ГОТОВИЙ 🙋','НЕ ГОТОВИЙ ХА-ХА','ОК РЕАЛЬНО 🙋'],
  flirt: ['Я ГОТОВИЙ 🙋','ЗАЛЕЖИТЬ ВІД ЗАВДАННЯ 😏','ДОБРЕ 🙋'],
  melt: ['Я ГОТОВИЙ 🙋','я тану 🫠','зібрався 🙋'],
  panic: ['Я ГОТОВИЙ 🙋','НЕ ГОТОВИЙ!!','ОЙ ВСЕ ОДНО 🙋'],
  flip: ['Я ГОТОВИЙ 🙋','ʎoʇoƃ ʎ','ГОТОВИЙ 🙋'],
  disappear: ['Я ГОТОВИЙ 🙋','...','ТУТ Я!','ГОТОВИЙ 🙋'],
  joke: ['Я ГОТОВИЙ 🙋','ЧЕКАЙ АНЕКДОТ!','ГОТОВИЙ 😂','ГОТОВИЙ 🙋'],
  broken: ['Я ГОТОВИЙ 🙋','ПМИЛКА 404','ВСЕ ОК','ГОТОВИЙ 🙋'],
  password: ['Я ГОТОВИЙ 🙋','ВВЕДИ ПАРОЛЬ:','НЕПРАВИЛЬНО','ГОТОВИЙ 🙋'],
  countdown: ['Я ГОТОВИЙ 🙋','3...','2...','1...','НІ! 😈','ГОТОВИЙ 🙋'],
  regret: ['Я ГОТОВИЙ 🙋','ГОТОВИЙ... ШКОДУЮ','АЛЕ ОК 🙋'],
  confirm: ['Я ГОТОВИЙ 🙋','ТИ ВПЕВНЕНИЙ?','ДОБРЕ 🙋']
};

function runPrankBtn(btn, behavior, allTexts, onDone) {
  const texts = allTexts[behavior] || allTexts['angry'];
  let clicks = 0;
  function press() {
    if (behavior === 'run') {
      if (clicks < 3) {
        btn.classList.remove('running'); void btn.offsetWidth; btn.classList.add('running');
        btn.textContent = texts[Math.min(clicks + 1, texts.length - 2)];
        clicks++;
        btn.style.position = 'relative';
        btn.style.left = (Math.random() * 80 - 40) + 'px';
        btn.style.top = (Math.random() * 40 - 20) + 'px';
      } else {
        btn.style.left = '0'; btn.style.top = '0';
        btn.textContent = texts[texts.length - 1];
        btn.removeEventListener('click', press);
        setTimeout(onDone, 400);
      }
      return;
    }
    if (behavior === 'melt') {
      if (clicks === 0) { btn.classList.add('melting'); btn.textContent = texts[1]; clicks++; setTimeout(() => { btn.classList.remove('melting'); btn.textContent = texts[2]; }, 1000); }
      else { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (behavior === 'flip') {
      if (clicks === 0) { btn.classList.add('flipping'); btn.textContent = texts[1]; clicks++; setTimeout(() => { btn.classList.remove('flipping'); btn.textContent = texts[2]; }, 600); }
      else { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (behavior === 'disappear') {
      if (clicks === 0) { btn.classList.add('blinking'); btn.textContent = texts[1]; clicks++; setTimeout(() => { btn.classList.remove('blinking'); btn.textContent = texts[2]; }, 1200); }
      else if (clicks === 1) { btn.textContent = texts[3]; clicks++; btn.removeEventListener('click', press); setTimeout(onDone, 300); }
      return;
    }
    if (behavior === 'regret') {
      if (clicks === 0) { btn.textContent = texts[1]; clicks++; setTimeout(() => { btn.textContent = texts[2]; clicks++; }, 1500); }
      else if (clicks >= 2) { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (behavior === 'password') {
      if (clicks === 0) { btn.textContent = texts[1]; clicks++; }
      else if (clicks === 1) { btn.textContent = texts[2]; clicks++; setTimeout(() => { btn.textContent = texts[3]; clicks++; }, 1000); }
      else if (clicks >= 3) { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (['angry', 'panic'].includes(behavior)) { btn.classList.remove('shaking'); void btn.offsetWidth; btn.classList.add('shaking'); }
    if (behavior === 'broken' && clicks === 1) { btn.style.background = '#999'; btn.style.transform = 'skew(-5deg)'; }
    else if (behavior === 'broken' && clicks === 2) { btn.style.background = ''; btn.style.transform = ''; }
    if (clicks < texts.length - 1) { btn.textContent = texts[clicks + 1]; clicks++; }
    else { btn.removeEventListener('click', press); onDone(); }
  }
  btn.addEventListener('click', press);
}

// ===== ВХІД =====
document.getElementById('createBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  if (!name) { showError("Введи своє ім'я!"); return; }
  myName = name;
  socket.emit('createRoom', { name });
});

document.getElementById('joinBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  const code = document.getElementById('roomCode').value.trim().toUpperCase();
  if (!name) { showError("Введи своє ім'я!"); return; }
  if (!code) { showError('Введи код кімнати!'); return; }
  myName = name;
  socket.emit('joinRoom', { name, code });
});

document.getElementById('playerName').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('joinBtn').click(); });
document.getElementById('roomCode').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('joinBtn').click(); });

document.getElementById('rulesBtn').addEventListener('click', () => {
  document.getElementById('rulesText').textContent = rules || 'Завантаження...';
  showScreen('screen-rules');
});
document.getElementById('closeRulesBtn').addEventListener('click', () => { showScreen('screen-enter'); });

// ===== SOCKET =====
socket.on('connect', () => { myId = socket.id; });

socket.on('roomCreated', ({ code, btnBehavior: bh, rules: r }) => {
  myRoomCode = code; isHost = true; btnBehavior = bh; rules = r;
  document.getElementById('displayCode').textContent = code;
  document.getElementById('host-controls').style.display = 'block';
  document.getElementById('guest-controls').style.display = 'none';
  const startBtn = document.getElementById('startBtn');
  startBtn.textContent = BUTTON_TEXTS[bh] ? BUTTON_TEXTS[bh][0] : 'ПОЧАТИ ГРУ 🚀';
  runPrankBtn(startBtn, bh, BUTTON_TEXTS, () => {
    startBtn.textContent = 'ЗАПУСКАЄМО... 🎉';
    startBtn.disabled = true;
    socket.emit('startGame', { code: myRoomCode });
  });
  showScreen('screen-lobby');
});

socket.on('joinedRoom', ({ code, btnBehavior: bh, rules: r }) => {
  myRoomCode = code; isHost = false; btnBehavior = bh; rules = r;
  document.getElementById('displayCode').textContent = code;
  document.getElementById('host-controls').style.display = 'none';
  document.getElementById('guest-controls').style.display = 'block';
  const readyBtn = document.getElementById('readyBtn');
  readyBtn.textContent = READY_TEXTS[bh] ? READY_TEXTS[bh][0] : 'Я ГОТОВИЙ 🙋';
  runPrankBtn(readyBtn, bh, READY_TEXTS, () => {
    guestReady = true;
    readyBtn.textContent = '✅ ГОТОВИЙ!';
    readyBtn.style.background = 'var(--green)';
    readyBtn.style.color = 'var(--dark)';
    readyBtn.disabled = true;
    socket.emit('playerReady', { code: myRoomCode });
  });
  showScreen('screen-lobby');
});

socket.on('error', showError);

socket.on('updatePlayers', (updated) => {
  players = updated;
  const container = document.getElementById('playersChips');
  if (!container) return;
  container.innerHTML = '';
  players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = `player-chip chip-${i % 6}`;
    chip.textContent = p.ready ? `✅ ${p.name}` : `⏳ ${p.name}`;
    container.appendChild(chip);
  });
});

socket.on('readyUpdate', ({ readyCount, total }) => {
  const el = document.getElementById('readyCount');
  if (el) el.textContent = `Готові: ${readyCount} / ${total}`;
});

// ===== РОЗІГРІВ =====
socket.on('gameStarted', () => {
  showScreen('screen-warmup');
  document.getElementById('warmupCard').style.display = 'none';
  document.getElementById('warmupWaiting').style.display = 'block';
});

socket.on('warmupMessage', ({ message }) => {
  document.getElementById('warmupText').textContent = message;
  document.getElementById('warmupCard').style.display = 'block';
  document.getElementById('warmupWaiting').style.display = 'none';
});

document.getElementById('warmupOkBtn').addEventListener('click', () => {
  document.getElementById('warmupCard').style.display = 'none';
  document.getElementById('warmupWaiting').style.display = 'block';
});

// ===== РАУНД ГОТОВИЙ =====
socket.on('roundReady', ({ format, formatLabel, topic, fullTask, playerId, playerName, roundNum, isMyturn, isSaboteur }) => {
  clearInterval(timerInterval);
  currentFormat = format;
  currentRoundNum = roundNum;
  currentPlayerId = playerId;  // ВАЖЛИВО: зберігаємо playerId
  currentPlayerName = playerName;
  myFullTask = fullTask || null;
  iAmSaboteur = isSaboteur || false;
  mySaboteurAction = null;

  const playerIndex = players.findIndex(p => p.id === playerId);
  const me = players.find(p => p.id === myId);
  if (me) myScore = me.score;

  document.getElementById('readyRoundPill').textContent = `Раунд ${roundNum}`;
  document.getElementById('readyScorePill').textContent = `⭐ ${myScore}`;

  const avatar = document.getElementById('readyAvatar');
  avatar.className = `spotlight-avatar ${getAvatarClass(playerIndex < 0 ? 0 : playerIndex)}`;
  avatar.textContent = getInitial(playerName);
  document.getElementById('readyPlayerName').textContent = playerName;

  const badge = document.getElementById('readyFormatBadge');
  badge.textContent = formatLabel;
  badge.className = `format-badge format-${format}`;

  document.getElementById('my-ready-wrap').style.display = 'none';
  document.getElementById('saboteur-ready-wrap').style.display = 'none';
  document.getElementById('others-ready-wrap').style.display = 'none';
  document.getElementById('host-end-ready').style.display = 'none';

  if (isMyturn) {
    document.getElementById('my-ready-wrap').style.display = 'block';
    document.getElementById('readyTopicText').textContent = topic || '';
    document.getElementById('readyFullTask').textContent = fullTask || '';
  } else if (isSaboteur) {
    document.getElementById('saboteur-ready-wrap').style.display = 'block';
    document.getElementById('saboteurTopicDisplay').textContent = topic || 'Гравець розповідає будь-що';
    // Текст місії прийде окремо через saboteurAssigned
  } else {
    document.getElementById('others-ready-wrap').style.display = 'block';
    document.getElementById('othersTopicText').textContent = topic || '';
    const sabWarn = document.getElementById('sabotage-warning');
    if (sabWarn) sabWarn.style.display = format === 'sabotage' ? 'block' : 'none';
    if (isHost) document.getElementById('host-end-ready').style.display = 'block';
  }

  showScreen('screen-ready');
});

socket.on('saboteurAssigned', ({ action }) => {
  mySaboteurAction = action;
  // Оновлюємо текст якщо вже на екрані
  const el = document.getElementById('saboteurActionText');
  if (el) el.textContent = action;
  const el2 = document.getElementById('saboteurTaskText');
  if (el2) el2.textContent = action;
});

document.getElementById('startSpeakingBtn').addEventListener('click', () => {
  socket.emit('playerStarted', { code: myRoomCode });
  showMyRoundScreen();
});

document.getElementById('endReadyBtn').addEventListener('click', () => {
  socket.emit('endRoundEarly', { code: myRoomCode });
});

function showMyRoundScreen() {
  const isMyTurn = currentPlayerId === myId;

  document.getElementById('roundPill').textContent = `Раунд ${currentRoundNum}`;
  document.getElementById('scorePill').textContent = `⭐ ${myScore}`;

  const playerIndex = players.findIndex(p => p.id === currentPlayerId);
  const avatar = document.getElementById('spotlightAvatar');
  avatar.className = `spotlight-avatar ${getAvatarClass(playerIndex < 0 ? 0 : playerIndex)}`;
  avatar.textContent = getInitial(currentPlayerName);
  document.getElementById('spotlightName').textContent = currentPlayerName;

  document.getElementById('my-turn-task').style.display = 'none';
  document.getElementById('saboteur-task').style.display = 'none';
  document.getElementById('others-turn').style.display = 'none';
  document.getElementById('host-end-round').style.display = 'none';

  if (isMyTurn && myFullTask) {
    document.getElementById('my-turn-task').style.display = 'block';
    document.getElementById('myTaskText').textContent = myFullTask;
  } else if (iAmSaboteur && mySaboteurAction) {
    document.getElementById('saboteur-task').style.display = 'block';
    document.getElementById('saboteurTaskText').textContent = mySaboteurAction;
  } else {
    document.getElementById('others-turn').style.display = 'block';
  }

  if (isHost) document.getElementById('host-end-round').style.display = 'block';
  showScreen('screen-round');
}

socket.on('roundTimerStart', ({ startTime, duration }) => {
  // Не активний гравець переходить на екран раунду
  if (currentPlayerId !== myId) {
    document.getElementById('roundPill').textContent = `Раунд ${currentRoundNum}`;
    document.getElementById('scorePill').textContent = `⭐ ${myScore}`;

    const playerIndex = players.findIndex(p => p.id === currentPlayerId);
    const avatar = document.getElementById('spotlightAvatar');
    avatar.className = `spotlight-avatar ${getAvatarClass(playerIndex < 0 ? 0 : playerIndex)}`;
    avatar.textContent = getInitial(currentPlayerName);
    document.getElementById('spotlightName').textContent = currentPlayerName;

    document.getElementById('my-turn-task').style.display = 'none';
    document.getElementById('host-end-round').style.display = isHost ? 'block' : 'none';

    if (iAmSaboteur && mySaboteurAction) {
      document.getElementById('saboteur-task').style.display = 'block';
      document.getElementById('saboteurTaskText').textContent = mySaboteurAction;
      document.getElementById('others-turn').style.display = 'none';
    } else {
      document.getElementById('saboteur-task').style.display = 'none';
      document.getElementById('others-turn').style.display = 'block';
    }

    showScreen('screen-round');
  }
  startSyncTimer(startTime, duration, 'timerFill', 'timerVal');
});

document.getElementById('endRoundBtn').addEventListener('click', () => {
  socket.emit('endRoundEarly', { code: myRoomCode });
});

// ===== ВГАДУВАННЯ =====
socket.on('showGuessing', ({ options, format, currentPlayerId: cpId }) => {
  clearInterval(timerInterval);
  selectedGuess = null;
  const isMe = cpId === myId;

  document.getElementById('guessingEmoji').textContent = format === 'story' ? '🤔' : '🎭';
  document.getElementById('guessingTitle').textContent = format === 'story' ? 'Яка була заковирка?' : 'Ким був гравець?';
  document.getElementById('guessingSub').textContent = 'Вибери правильний варіант';

  const container = document.getElementById('guessOptions');
  container.innerHTML = '';

  document.getElementById('submitGuessBtn').style.display = isMe ? 'none' : 'block';
  document.getElementById('submitGuessBtn').disabled = true;
  document.getElementById('guess-waiting').style.display = 'none';
  document.getElementById('guess-performer-wait').style.display = isMe ? 'block' : 'none';

  if (!isMe) {
    options.forEach((opt, i) => {
      const el = document.createElement('div');
      el.className = 'guess-option';
      el.innerHTML = `<div class="guess-option-text">${opt}</div><div class="guess-check">✓</div>`;
      el.addEventListener('click', () => {
        document.querySelectorAll('.guess-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        selectedGuess = i;
        document.getElementById('submitGuessBtn').disabled = false;
      });
      container.appendChild(el);
    });
  }
  showScreen('screen-guessing');
});

document.getElementById('submitGuessBtn').addEventListener('click', () => {
  if (selectedGuess === null) return;
  socket.emit('submitGuess', { code: myRoomCode, guessIndex: selectedGuess });
  document.getElementById('submitGuessBtn').style.display = 'none';
  document.getElementById('guess-waiting').style.display = 'block';
});

socket.on('guessingResult', ({ correctIndex, correctAnswer, results, players: updated }) => {
  players = updated;
  document.getElementById('guessCorrectAnswer').textContent = correctAnswer;

  const container = document.getElementById('guessResultList');
  container.innerHTML = '';
  players.forEach(p => {
    if (p.id === currentPlayerId) return;
    const correct = results[p.id];
    const row = document.createElement('div');
    row.className = 'guess-result-row';
    row.innerHTML = `<span class="guess-result-icon">${correct ? '✅' : '❌'}</span><span style="flex:1;font-size:14px;font-weight:800;">${p.name}</span><span style="font-size:13px;color:var(--muted);font-weight:700;">${correct ? '+1 бал' : ''}</span>`;
    container.appendChild(row);
  });
  showScreen('screen-guess-result');
});

// ===== ГОЛОСУВАННЯ 1-10 =====
socket.on('showVoting', ({ currentPlayerId: cpId, currentPlayerName: cpName }) => {
  clearInterval(timerInterval);
  currentPlayerId = cpId;
  const isMe = cpId === myId;

  if (isMe) {
    document.getElementById('scoreSliderWrap').style.display = 'none';
    document.getElementById('submitVoteBtn').style.display = 'none';
    document.getElementById('voted-waiting').style.display = 'block';
    document.getElementById('voted-waiting').querySelector('.waiting-text').textContent = '🎤 Тебе оцінюють...';
    document.getElementById('voteSub').textContent = 'Чекай результатів!';
  } else {
    document.getElementById('scoreSliderWrap').style.display = 'block';
    document.getElementById('submitVoteBtn').style.display = 'block';
    document.getElementById('voted-waiting').style.display = 'none';
    document.getElementById('voteSub').textContent = `Оціни виступ: ${cpName}`;
    document.getElementById('scoreSlider').value = 5;
    document.getElementById('scoreDisplay').textContent = '5';
  }
  showScreen('screen-vote');
});

document.getElementById('scoreSlider').addEventListener('input', e => {
  document.getElementById('scoreDisplay').textContent = e.target.value;
});

document.getElementById('submitVoteBtn').addEventListener('click', () => {
  const score = parseInt(document.getElementById('scoreSlider').value);
  socket.emit('submitVote', { code: myRoomCode, score });
  document.getElementById('submitVoteBtn').style.display = 'none';
  document.getElementById('scoreSliderWrap').style.display = 'none';
  document.getElementById('voted-waiting').style.display = 'block';
});

// ===== ВГАДУВАННЯ САБОТАЖНИКА =====
socket.on('showSaboteurGuessing', ({ hint, players: updatedPlayers, saboteurId, avgScore, performerName }) => {
  players = updatedPlayers;
  selectedSaboteur = null;
  const isSaboteur = myId === saboteurId;

  document.getElementById('saboteurHintText').textContent = `Підказка: "${hint}"`;

  const container = document.getElementById('saboteurOptions');
  container.innerHTML = '';
  document.getElementById('submitSaboteurBtn').style.display = isSaboteur ? 'none' : 'block';
  document.getElementById('submitSaboteurBtn').disabled = true;
  document.getElementById('saboteur-voted-wait').style.display = 'none';
  document.getElementById('saboteur-is-waiting').style.display = isSaboteur ? 'block' : 'none';

  if (!isSaboteur) {
    players.forEach((p, i) => {
      if (p.id === currentPlayerId) return;
      const el = document.createElement('div');
      el.className = 'guess-option';
      el.innerHTML = `
        <div class="${getAvatarClass(i)}" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:white;flex-shrink:0;background:var(--orange);">${getInitial(p.name)}</div>
        <div class="guess-option-text">${p.name}</div>
        <div class="guess-check">✓</div>
      `;
      el.addEventListener('click', () => {
        document.querySelectorAll('#saboteurOptions .guess-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        selectedSaboteur = p.id;
        document.getElementById('submitSaboteurBtn').disabled = false;
      });
      container.appendChild(el);
    });
  }
  showScreen('screen-saboteur-guess');
});

document.getElementById('submitSaboteurBtn').addEventListener('click', () => {
  if (!selectedSaboteur) return;
  socket.emit('submitSaboteurGuess', { code: myRoomCode, suspectId: selectedSaboteur });
  document.getElementById('submitSaboteurBtn').style.display = 'none';
  document.getElementById('saboteur-voted-wait').style.display = 'block';
});

socket.on('saboteurResult', ({ saboteurId, saboteurName, action, caught, players: updated }) => {
  players = updated;
  document.getElementById('saboteurResultEmoji').textContent = caught ? '🎉' : '😈';
  document.getElementById('saboteurResultTitle').textContent = caught ? 'Саботажника впіймали!' : 'Саботажник переміг!';
  document.getElementById('saboteurResultName').textContent = saboteurName;
  document.getElementById('saboteurActionCard').textContent = `Місія була: "${action}"`;
  renderScoreList(updated, 'saboteurScoreList');
  document.getElementById('host-next-saboteur').style.display = isHost ? 'block' : 'none';
  document.getElementById('guest-next-saboteur').style.display = isHost ? 'none' : 'block';
  showScreen('screen-saboteur-result');
});

document.getElementById('nextRoundBtnSaboteur').addEventListener('click', () => {
  socket.emit('nextRound', { code: myRoomCode });
});

// ===== РЕЗУЛЬТАТ =====
socket.on('roundResult', ({ avgScore, playerName, players: updated }) => {
  players = updated;
  const isMe = currentPlayerId === myId;
  document.getElementById('resultEmoji').textContent = isMe ? '🎤' : '📊';
  document.getElementById('resultTitle').textContent = isMe ? 'Твій результат!' : `${playerName} отримав:`;
  document.getElementById('resultScore').textContent = `${avgScore} / 10`;
  renderScoreList(updated, 'scoreList');
  document.getElementById('host-next').style.display = isHost ? 'block' : 'none';
  document.getElementById('guest-next').style.display = isHost ? 'none' : 'block';
  showScreen('screen-result');
});

function renderScoreList(playerList, containerId) {
  const sorted = [...playerList].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0]?.score || 1;
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['var(--orange)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--yellow)', 'var(--pink)'];
  const container = document.getElementById(containerId || 'scoreList');
  if (!container) return;
  container.innerHTML = '';
  sorted.forEach((p, i) => {
    const pct = maxScore > 0 ? (p.score / maxScore) * 100 : 0;
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <div class="score-rank">${medals[i] || (i + 1) + '.'}</div>
      <div class="score-bar-wrap">
        <div class="score-player-name">${p.name}</div>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div></div>
      </div>
      <div class="score-points" style="color:${colors[i % colors.length]}">${p.score}</div>
    `;
    container.appendChild(row);
  });
}

document.getElementById('nextRoundBtn').addEventListener('click', () => {
  socket.emit('nextRound', { code: myRoomCode });
});

socket.on('gameEnded', ({ players: final }) => {
  clearInterval(timerInterval);
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['var(--orange)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--yellow)', 'var(--pink)'];
  const container = document.getElementById('finalList');
  container.innerHTML = '';
  final.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'final-row';
    row.innerHTML = `<div class="final-rank">${medals[i] || '🎖️'}</div><div class="final-name">${p.name}</div><div class="final-score" style="color:${colors[i % colors.length]}">${p.score} ⭐</div>`;
    container.appendChild(row);
  });
  showScreen('screen-final');
});

document.getElementById('playAgainBtn').addEventListener('click', () => { window.location.reload(); });
