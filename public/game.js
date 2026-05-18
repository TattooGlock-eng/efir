const socket = io();

let myName = '', myRoomCode = '', isHost = false, myId = '';
let players = [], currentPlayerId = '', secondPlayerId = '';
let timerInterval = null, btnBehavior = 'angry', myScore = 0;
let selectedDuelVote = null, rules = '';
let guestReady = false;

// ===== УТИЛІТИ =====
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

// ===== ТАЙМЕР =====
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
  run: ['ПОЧАТИ ГРУ 🚀', 'ЕЙ СТІЙ!', 'НЕ ЖЕНИ!', 'ОК ДОБРЕ 🚀'],
  angry: ['ПОЧАТИ ГРУ 🚀', 'ТИ МЕНІ НЕ ТИКАЙ', 'СКАЗАЛА НІ!', 'НУ І ЩО ТИ ЗРОБИШ?', 'ОК ЗАПУСКАЮ 😤'],
  cry: ['ПОЧАТИ ГРУ 🚀', 'НЕВЖЕ ТИ НАТИСНЕШ? 🥺', 'МЕНІ БОЛЯЧЕ...', 'ОК ОК ЗАПУСКАЮ 😭'],
  lie: ['ПОЧАТИ ГРУ 🚀', 'ОБМАНУЛА ХА-ХА 😝', 'ЗАРАЗ ЗАПУЩУ... НІ', 'ОК РЕАЛЬНО ЗАПУСКАЮ'],
  flirt: ['ПОЧАТИ ГРУ 🚀', 'СПОЧАТКУ СКАЖИ ЩО Я ГАРНА', 'ЛАДНО ТАК І БУТИ 😏'],
  melt: ['ПОЧАТИ ГРУ 🚀', 'я.. тану.. 🫠', 'ок зібралась 🚀'],
  panic: ['ПОЧАТИ ГРУ 🚀', 'НЕ НАТИСКАЙ!!', 'СТІЙ!', 'ОЙ ВСЕ ОДНО 😱'],
  flip: ['ПОЧАТИ ГРУ 🚀', 'ʞɔɐq ǝɯ pɐǝɹ', 'ЗАПУСКАЮ 🚀'],
  disappear: ['ПОЧАТИ ГРУ 🚀', '...', 'ТУТ Я!', 'ЗАПУСКАЮ 🚀'],
  joke: ['ПОЧАТИ ГРУ 🚀', 'ЧЕКАЙ АНЕКДОТ!', 'ЧОМУ КНОПКА НЕ СМІЄТЬСЯ? БО ЇЇ НАТИСКАЮТЬ 😂', 'ЗАПУСКАЮ 🚀'],
  broken: ['ПОЧАТИ ГРУ 🚀', 'ПМИЛКА 404', 'Ж@#ТУЮ ВСЕ ОК', 'ЗАПУСКАЮ 🚀'],
  password: ['ПОЧАТИ ГРУ 🚀', 'ВВЕДИ ПАРОЛЬ:', 'НЕПРАВИЛЬНО', 'ЛАДНО ПУСКАЮ 🚀'],
  countdown: ['ПОЧАТИ ГРУ 🚀', '3...', '2...', '1...', 'НІ! 😈', 'ЗАПУСКАЮ 🚀'],
  regret: ['ПОЧАТИ ГРУ 🚀', 'ЗАПУСТИЛА... ШКОДУЮ', 'АЛЕ ОК 🚀'],
  confirm: ['ПОЧАТИ ГРУ 🚀', 'ТИ ВПЕВНЕНИЙ?', 'ТОЧНО?', 'НУ ДОБРЕ 🚀']
};

const READY_TEXTS = {
  run: ['Я ГОТОВИЙ 🙋', 'ЩЕ НІ!', 'МАЙЖЕ!', 'ОК ГОТОВИЙ 🙋'],
  angry: ['Я ГОТОВИЙ 🙋', 'ТА ЯК Я МОЖУ БУТИ ГОТОВИМ', 'НУ ДОБРЕ 🙋'],
  cry: ['Я ГОТОВИЙ 🙋', 'Я БОЮСЬ 🥺', 'ОК ОК ГОТОВИЙ 😭'],
  lie: ['Я ГОТОВИЙ 🙋', 'НЕ ГОТОВИЙ ХА-ХА', 'ОК РЕАЛЬНО ГОТОВИЙ 🙋'],
  flirt: ['Я ГОТОВИЙ 🙋', 'ЗАЛЕЖИТЬ ВІД ЗАВДАННЯ 😏', 'ДОБРЕ 🙋'],
  melt: ['Я ГОТОВИЙ 🙋', 'я.. тану від хвилювання 🫠', 'зібрався 🙋'],
  panic: ['Я ГОТОВИЙ 🙋', 'НЕ ГОТОВИЙ!!', 'ОЙ ВСЕ ОДНО 😱', 'ГОТОВИЙ 🙋'],
  flip: ['Я ГОТОВИЙ 🙋', 'ʎoʇoƃ ʎ', 'ГОТОВИЙ 🙋'],
  disappear: ['Я ГОТОВИЙ 🙋', '...', 'ТУТ Я!', 'ГОТОВИЙ 🙋'],
  joke: ['Я ГОТОВИЙ 🙋', 'ЧЕКАЙ АНЕКДОТ!', 'ГОТОВИЙ БО ХОЧУ ВИГРАТИ 😂', 'ГОТОВИЙ 🙋'],
  broken: ['Я ГОТОВИЙ 🙋', 'ПМИЛКА 404', 'ВСЕ ОК', 'ГОТОВИЙ 🙋'],
  password: ['Я ГОТОВИЙ 🙋', 'ВВЕДИ ПАРОЛЬ:', 'НЕПРАВИЛЬНО', 'ГОТОВИЙ 🙋'],
  countdown: ['Я ГОТОВИЙ 🙋', '3...', '2...', '1...', 'НІ! 😈', 'ГОТОВИЙ 🙋'],
  regret: ['Я ГОТОВИЙ 🙋', 'ГОТОВИЙ... ШКОДУЮ', 'АЛЕ ОК 🙋'],
  confirm: ['Я ГОТОВИЙ 🙋', 'ТИ ВПЕВНЕНИЙ ЩО Я ГОТОВИЙ?', 'ДОБРЕ 🙋']
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
      if (clicks === 0) {
        btn.classList.add('melting'); btn.textContent = texts[1]; clicks++;
        setTimeout(() => { btn.classList.remove('melting'); btn.textContent = texts[2]; }, 1000);
      } else { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (behavior === 'flip') {
      if (clicks === 0) {
        btn.classList.add('flipping'); btn.textContent = texts[1]; clicks++;
        setTimeout(() => { btn.classList.remove('flipping'); btn.textContent = texts[2]; }, 600);
      } else { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (behavior === 'disappear') {
      if (clicks === 0) {
        btn.classList.add('blinking'); btn.textContent = texts[1]; clicks++;
        setTimeout(() => { btn.classList.remove('blinking'); btn.textContent = texts[2]; }, 1200);
      } else if (clicks === 1) {
        btn.textContent = texts[3]; clicks++;
        btn.removeEventListener('click', press);
        setTimeout(onDone, 300);
      }
      return;
    }
    if (behavior === 'regret') {
      if (clicks === 0) {
        btn.textContent = texts[1]; clicks++;
        setTimeout(() => { btn.textContent = texts[2]; clicks++; }, 1500);
      } else if (clicks >= 2) { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    if (behavior === 'password') {
      if (clicks === 0) { btn.textContent = texts[1]; clicks++; }
      else if (clicks === 1) {
        btn.textContent = texts[2]; clicks++;
        setTimeout(() => { btn.textContent = texts[3]; clicks++; }, 1000);
      } else if (clicks >= 3) { btn.removeEventListener('click', press); onDone(); }
      return;
    }
    // Sequential default
    if (['angry', 'panic'].includes(behavior)) {
      btn.classList.remove('shaking'); void btn.offsetWidth; btn.classList.add('shaking');
    }
    if (behavior === 'broken') {
      if (clicks === 1) { btn.style.background = '#999'; btn.style.transform = 'skew(-5deg)'; }
      else if (clicks === 2) { btn.style.background = ''; btn.style.transform = ''; }
    }
    if (clicks < texts.length - 1) {
      btn.textContent = texts[clicks + 1]; clicks++;
    } else {
      btn.removeEventListener('click', press);
      onDone();
    }
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

// ===== ПРАВИЛА — фікс: зберігаємо і відкриваємо по кнопці =====
document.getElementById('rulesBtn').addEventListener('click', () => {
  const text = rules || 'Правила завантажуються...';
  document.getElementById('rulesText').textContent = text;
  showScreen('screen-rules');
});
document.getElementById('closeRulesBtn').addEventListener('click', () => {
  showScreen('screen-enter');
});

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

  showScreen('screen-button');
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

  showScreen('screen-button');
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
  // Ховаємо картку — гравець чекає на екрані розігріву поки сервер стартує раунд
  document.getElementById('warmupCard').style.display = 'none';
  document.getElementById('warmupWaiting').style.display = 'block';
});

// ===== РАУНД =====
socket.on('roundStarted', ({ playerName, playerId, format, formatLabel, task, roundNum, duration, skipsLeft, startTime }) => {
  currentPlayerId = playerId;
  const isMyTurn = playerId === myId;
  const playerIndex = players.findIndex(p => p.id === playerId);
  const me = players.find(p => p.id === myId);
  if (me) myScore = me.score;

  document.getElementById('roundPill').textContent = `Раунд ${roundNum}`;
  document.getElementById('scorePill').textContent = `⭐ ${myScore}`;

  const avatar = document.getElementById('spotlightAvatar');
  avatar.className = `spotlight-avatar ${getAvatarClass(playerIndex < 0 ? 0 : playerIndex)}`;
  avatar.textContent = getInitial(playerName);
  document.getElementById('spotlightName').textContent = playerName;

  const badge = document.getElementById('formatBadge');
  badge.textContent = formatLabel;
  badge.className = `format-badge format-${format}`;
  document.getElementById('taskText').textContent = task;

  // Показуємо кнопки тільки тому хто виступає
  document.getElementById('my-turn-actions').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('others-actions').style.display = isMyTurn ? 'none' : 'block';
  // Кнопка дострокового завершення — тільки хосту
  document.getElementById('host-end-round').style.display = isHost ? 'block' : 'none';

  if (isMyTurn) {
    document.getElementById('skipsLeft').textContent = `${skipsLeft} пропуски`;
    const skipBtn = document.getElementById('skipBtn');
    skipBtn.disabled = false;
    skipBtn.style.opacity = '1';
  }

  startSyncTimer(startTime, duration, 'timerFill', 'timerVal');
  showScreen('screen-round');
});

socket.on('taskSkipped', ({ task, skipsLeft }) => {
  document.getElementById('taskText').textContent = task;
  document.getElementById('skipsLeft').textContent = `${skipsLeft} пропуски`;
  if (skipsLeft <= 0) {
    const skipBtn = document.getElementById('skipBtn');
    skipBtn.disabled = true;
    skipBtn.style.opacity = '0.4';
  }
});

socket.on('noSkipsLeft', () => {
  document.getElementById('skipsLeft').textContent = '0 пропусків';
  const skipBtn = document.getElementById('skipBtn');
  skipBtn.disabled = true;
  skipBtn.style.opacity = '0.4';
});

document.getElementById('skipBtn').addEventListener('click', () => {
  socket.emit('skipTask', { code: myRoomCode });
});

document.getElementById('endRoundBtn').addEventListener('click', () => {
  socket.emit('endRoundEarly', { code: myRoomCode });
});

// ===== ДУЕЛЬ =====
socket.on('duelStarted', ({ player1, player2 }) => {
  clearInterval(timerInterval);
  currentPlayerId = player1.id;
  secondPlayerId = player2.id;
  document.getElementById('duelPlayers').textContent = `${player1.name} ⚡ ${player2.name}`;
  showScreen('screen-duel-announce');
});

socket.on('duelQuestion', ({ question, questionNum, totalQuestions, firstPlayer, answeringId, duration, startTime }) => {
  document.getElementById('duelRoundPill').textContent = `Питання ${questionNum}/${totalQuestions}`;
  document.getElementById('duelQuestionText').textContent = question;
  document.getElementById('duelAnsweringName').textContent = firstPlayer.name;
  const isMyTurn = answeringId === myId;
  document.getElementById('duel-my-turn').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('duel-others-turn').style.display = isMyTurn ? 'none' : 'block';
  document.getElementById('host-end-duel').style.display = isHost ? 'block' : 'none';
  startSyncTimer(startTime, duration, 'duelTimerFill', 'duelTimerVal');
  showScreen('screen-duel-question');
});

socket.on('duelSecondAnswer', ({ answeringId, answeringName, duration, startTime }) => {
  document.getElementById('duelAnsweringName').textContent = answeringName;
  const isMyTurn = answeringId === myId;
  document.getElementById('duel-my-turn').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('duel-others-turn').style.display = isMyTurn ? 'none' : 'block';
  startSyncTimer(startTime, duration, 'duelTimerFill', 'duelTimerVal');
});

document.getElementById('endDuelBtn').addEventListener('click', () => {
  socket.emit('endRoundEarly', { code: myRoomCode });
});

socket.on('duelVoting', ({ player1, player2 }) => {
  clearInterval(timerInterval);
  selectedDuelVote = null;
  const container = document.getElementById('duelVoteOptions');
  container.innerHTML = '';
  const isParticipant = myId === player1.id || myId === player2.id;

  if (isParticipant) {
    document.getElementById('submitDuelVoteBtn').style.display = 'none';
    document.getElementById('duel-voted-waiting').style.display = 'block';
    document.getElementById('duel-voted-waiting').querySelector('.waiting-text').textContent = '⚡ Ти учасник дуелі! Чекаємо голосів...';
  } else {
    document.getElementById('submitDuelVoteBtn').style.display = 'block';
    document.getElementById('submitDuelVoteBtn').disabled = true;
    document.getElementById('duel-voted-waiting').style.display = 'none';
    [player1, player2].forEach((p, i) => {
      const opt = document.createElement('div');
      opt.className = 'duel-vote-option';
      opt.innerHTML = `
        <div class="duel-vote-avatar ${getAvatarClass(i)}">${getInitial(p.name)}</div>
        <div class="duel-vote-name">${p.name}</div>
        <div class="duel-vote-check">✓</div>
      `;
      opt.addEventListener('click', () => {
        document.querySelectorAll('.duel-vote-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedDuelVote = p.id;
        document.getElementById('submitDuelVoteBtn').disabled = false;
      });
      container.appendChild(opt);
    });
  }
  showScreen('screen-duel-vote');
});

document.getElementById('submitDuelVoteBtn').addEventListener('click', () => {
  if (!selectedDuelVote) return;
  socket.emit('submitDuelVote', { code: myRoomCode, winnerId: selectedDuelVote });
  document.getElementById('submitDuelVoteBtn').style.display = 'none';
  document.getElementById('duel-voted-waiting').style.display = 'block';
});

socket.on('duelResult', ({ winnerId, players: updated }) => {
  players = updated;
  const winner = updated.find(p => p.id === winnerId);
  const isWinner = winnerId === myId;
  document.getElementById('resultEmoji').textContent = isWinner ? '🏆' : '👏';
  document.getElementById('resultTitle').textContent = isWinner ? 'Ти переміг у дуелі!' : `Переможець: ${winner ? winner.name : 'Нічия'}`;
  document.getElementById('resultScore').textContent = '';
  renderScoreList(updated);
  document.getElementById('host-next').style.display = isHost ? 'block' : 'none';
  document.getElementById('guest-next').style.display = isHost ? 'none' : 'block';
  showScreen('screen-result');
});

// ===== ГОЛОСУВАННЯ 1-10 =====
socket.on('showVoting', ({ currentPlayerId: cpId, currentPlayerName }) => {
  clearInterval(timerInterval);
  const isMyTurn = cpId === myId;
  if (isMyTurn) {
    document.getElementById('scoreSliderWrap').style.display = 'none';
    document.getElementById('submitVoteBtn').style.display = 'none';
    document.getElementById('voted-waiting').style.display = 'block';
    document.getElementById('voted-waiting').querySelector('.waiting-text').textContent = '🎤 Ти виступав! Чекаємо оцінок...';
    document.getElementById('voteSub').textContent = 'Тебе оцінюють...';
  } else {
    document.getElementById('scoreSliderWrap').style.display = 'block';
    document.getElementById('submitVoteBtn').style.display = 'block';
    document.getElementById('voted-waiting').style.display = 'none';
    document.getElementById('voteSub').textContent = `Оціни виступ: ${currentPlayerName}`;
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

socket.on('votingResult', ({ playerId, playerName, avgScore, players: updated }) => {
  players = updated;
  const isMe = playerId === myId;
  document.getElementById('resultEmoji').textContent = isMe ? '🎤' : '📊';
  document.getElementById('resultTitle').textContent = isMe ? 'Твій результат!' : `${playerName} отримав:`;
  document.getElementById('resultScore').textContent = `${avgScore} / 10`;
  renderScoreList(updated);
  document.getElementById('host-next').style.display = isHost ? 'block' : 'none';
  document.getElementById('guest-next').style.display = isHost ? 'none' : 'block';
  showScreen('screen-result');
});

function renderScoreList(playerList) {
  const sorted = [...playerList].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0]?.score || 1;
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['var(--orange)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--yellow)', 'var(--pink)'];
  const container = document.getElementById('scoreList');
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
    row.innerHTML = `
      <div class="final-rank">${medals[i] || '🎖️'}</div>
      <div class="final-name">${p.name}</div>
      <div class="final-score" style="color:${colors[i % colors.length]}">${p.score} ⭐</div>
    `;
    container.appendChild(row);
  });
  showScreen('screen-final');
});

document.getElementById('playAgainBtn').addEventListener('click', () => { window.location.reload(); });
