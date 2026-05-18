const socket = io();

let myName = '', myRoomCode = '', isHost = false, myId = '';
let players = [], currentPlayerId = '', secondPlayerId = '';
let timerInterval = null, btnBehavior = 'angry', btnClickCount = 0, myScore = 0;
let selectedDuelVote = null, rules = '';

// ===== УТИЛІТИ =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function getAvatarClass(i) { return `av-${i % 8}`; }
function getInitial(name) { return name.charAt(0).toUpperCase(); }

function formatTime(sec) {
  if (sec <= 0) return '0:00';
  return `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

// ===== ТАЙМЕР (синхронізований з сервером) =====
function startSyncTimer(startTime, duration, fillId, valId, onEnd) {
  clearInterval(timerInterval);
  const fill = document.getElementById(fillId);
  const val = document.getElementById(valId);

  function tick() {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsed);
    const pct = (remaining / duration) * 100;
    if (fill) fill.style.width = pct + '%';
    if (val) val.textContent = formatTime(Math.ceil(remaining));

    if (fill) {
      if (remaining <= 10) fill.style.background = 'linear-gradient(90deg,#FF6B35,#ff1a1a)';
      else if (remaining <= 30) fill.style.background = 'linear-gradient(90deg,#FFD93D,#FF6B35)';
      else fill.style.background = 'linear-gradient(90deg,#95E1A3,#4ECDC4)';
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);
      if (onEnd) onEnd();
    }
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
  panic: ['ПОЧАТИ ГРУ 🚀','НЕ НАТИСКАЙ!!','СТІЙ!','ОЙ ВСЕ ОДНО НАТИСНУВ 😱'],
  flip: ['ПОЧАТИ ГРУ 🚀','ʞɔɐq ǝɯ pɐǝɹ','ЗАПУСКАЮ 🚀'],
  disappear: ['ПОЧАТИ ГРУ 🚀','...','ТУТ Я!','ЗАПУСКАЮ 🚀'],
  joke: ['ПОЧАТИ ГРУ 🚀','ЧЕКАЙ АНЕКДОТ!','ЧОМУ КНОПКА НЕ СМІЄТЬСЯ? БО ЇЇ НАТИСКАЮТЬ 😂','ЗАПУСКАЮ 🚀'],
  broken: ['ПОЧАТИ ГРУ 🚀','ПМИЛКА 404','Ж@#ТУЮ ВСЕ ОК','ЗАПУСКАЮ 🚀'],
  password: ['ПОЧАТИ ГРУ 🚀','ВВЕДИ ПАРОЛЬ:','НЕПРАВИЛЬНО','ЛАДНО ПУСКАЮ 🚀'],
  countdown: ['ПОЧАТИ ГРУ 🚀','3...','2...','1...','НІ! 😈','ЗАПУСКАЮ 🚀'],
  regret: ['ПОЧАТИ ГРУ 🚀','ЗАПУСТИЛА... ШКОДУЮ','АЛЕ ОК 🚀'],
  confirm: ['ПОЧАТИ ГРУ 🚀','ТИ ВПЕВНЕНИЙ?','ТОЧНО?','НУ ДОБРЕ 🚀']
};

function handleStartBtn() {
  const btn = document.getElementById('startBtn');
  const texts = BUTTON_TEXTS[btnBehavior] || BUTTON_TEXTS['angry'];

  if (btnBehavior === 'run') {
    if (btnClickCount < 3) {
      btn.classList.remove('running'); void btn.offsetWidth; btn.classList.add('running');
      btn.textContent = texts[Math.min(btnClickCount+1, texts.length-2)];
      btnClickCount++;
      const wrap = btn.parentElement;
      const maxX = (wrap.offsetWidth - btn.offsetWidth - 20) || 80;
      btn.style.position = 'relative';
      btn.style.left = (Math.random()*maxX - maxX/2) + 'px';
      btn.style.top = (Math.random()*40 - 20) + 'px';
    } else {
      btn.style.left='0'; btn.style.top='0';
      btn.textContent = texts[texts.length-1];
      setTimeout(reallyStart, 500);
    }
    return;
  }

  if (['angry','cry','lie','flirt','joke','broken','countdown','confirm'].includes(btnBehavior)) {
    if (btnBehavior === 'angry' || btnBehavior === 'panic') {
      btn.classList.remove('shaking'); void btn.offsetWidth; btn.classList.add('shaking');
    }
    if (btnBehavior === 'broken' && btnClickCount === 1) {
      btn.style.background='#999'; btn.style.transform='skew(-5deg)';
    } else if (btnBehavior === 'broken' && btnClickCount === 2) {
      btn.style.background=''; btn.style.transform='';
    }
    if (btnClickCount < texts.length-1) {
      btn.textContent = texts[btnClickCount+1]; btnClickCount++;
    } else { reallyStart(); }
    return;
  }

  if (btnBehavior === 'melt') {
    if (btnClickCount === 0) {
      btn.classList.add('melting'); btn.textContent = texts[1]; btnClickCount++;
      setTimeout(() => { btn.classList.remove('melting'); btn.textContent = texts[2]; }, 1000);
    } else { reallyStart(); }
    return;
  }

  if (btnBehavior === 'flip') {
    if (btnClickCount === 0) {
      btn.classList.add('flipping'); btn.textContent = texts[1]; btnClickCount++;
      setTimeout(() => { btn.classList.remove('flipping'); btn.textContent = texts[2]; }, 600);
    } else { reallyStart(); }
    return;
  }

  if (btnBehavior === 'disappear') {
    if (btnClickCount === 0) {
      btn.classList.add('blinking'); btn.textContent = texts[1]; btnClickCount++;
      setTimeout(() => { btn.classList.remove('blinking'); btn.textContent = texts[2]; }, 1200);
    } else if (btnClickCount === 1) {
      btn.textContent = texts[3]; btnClickCount++;
      setTimeout(reallyStart, 300);
    }
    return;
  }

  if (btnBehavior === 'password') {
    if (btnClickCount === 0) { btn.textContent = texts[1]; btnClickCount++; }
    else if (btnClickCount === 1) {
      btn.textContent = texts[2]; btnClickCount++;
      setTimeout(() => { btn.textContent = texts[3]; btnClickCount++; }, 1000);
    } else if (btnClickCount >= 3) { reallyStart(); }
    return;
  }

  if (btnBehavior === 'regret') {
    if (btnClickCount === 0) {
      btn.textContent = texts[1]; btnClickCount++;
      setTimeout(() => { btn.textContent = texts[2]; btnClickCount++; }, 1500);
    } else if (btnClickCount >= 2) { reallyStart(); }
    return;
  }

  reallyStart();
}

function reallyStart() {
  const btn = document.getElementById('startBtn');
  btn.textContent = 'ЗАПУСКАЄМО... 🎉';
  btn.disabled = true;
  socket.emit('startGame', { code: myRoomCode });
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
  myName = name; myRoomCode = code;
  socket.emit('joinRoom', { name, code });
});

document.getElementById('rulesBtn').addEventListener('click', () => {
  document.getElementById('rulesText').textContent = rules || 'Правила завантажуються...';
  showScreen('screen-rules');
});

document.getElementById('closeRulesBtn').addEventListener('click', () => { showScreen('screen-enter'); });

// ===== SOCKET EVENTS =====
socket.on('connect', () => { myId = socket.id; });

socket.on('roomCreated', ({ code, btnBehavior: bh, rules: r }) => {
  myRoomCode = code; isHost = true; btnBehavior = bh; rules = r;
  document.getElementById('displayCode').textContent = code;
  document.getElementById('host-controls').style.display = 'block';
  document.getElementById('guest-waiting').style.display = 'none';
  document.getElementById('startBtn').addEventListener('click', handleStartBtn);
  showScreen('screen-button');
});

socket.on('joinedRoom', ({ code, btnBehavior: bh, rules: r }) => {
  myRoomCode = code; isHost = false; btnBehavior = bh; rules = r;
  document.getElementById('displayCode').textContent = code;
  document.getElementById('host-controls').style.display = 'none';
  document.getElementById('guest-waiting').style.display = 'block';
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
    chip.className = `player-chip chip-${i%6}`;
    chip.textContent = p.name;
    container.appendChild(chip);
  });
});

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
  avatar.className = `spotlight-avatar ${getAvatarClass(playerIndex)}`;
  avatar.textContent = getInitial(playerName);
  document.getElementById('spotlightName').textContent = playerName;

  const badge = document.getElementById('formatBadge');
  badge.textContent = formatLabel;
  badge.className = `format-badge format-${format}`;

  document.getElementById('taskText').textContent = task;
  document.getElementById('timerFill').style.background = 'linear-gradient(90deg,#95E1A3,#4ECDC4)';

  document.getElementById('my-turn-actions').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('others-actions').style.display = isMyTurn ? 'none' : 'block';
  document.getElementById('host-end-round').style.display = isHost ? 'block' : 'none';

  if (isMyTurn) {
    document.getElementById('skipsLeft').textContent = `${skipsLeft} пропуски`;
    document.getElementById('skipBtn').disabled = skipsLeft <= 0;
  }

  startSyncTimer(startTime, duration, 'timerFill', 'timerVal', null);
  showScreen('screen-round');
});

socket.on('taskSkipped', ({ task, skipsLeft }) => {
  document.getElementById('taskText').textContent = task;
  document.getElementById('skipsLeft').textContent = `${skipsLeft} пропуски`;
  if (skipsLeft <= 0) document.getElementById('skipBtn').disabled = true;
});

socket.on('noSkipsLeft', () => {
  document.getElementById('skipsLeft').textContent = '0 пропусків';
  document.getElementById('skipBtn').disabled = true;
});

document.getElementById('skipBtn').addEventListener('click', () => {
  socket.emit('skipTask', { code: myRoomCode });
});

document.getElementById('endRoundBtn').addEventListener('click', () => {
  socket.emit('endRoundEarly', { code: myRoomCode });
});

// ===== ДУЕЛЬ =====
socket.on('duelStarted', ({ player1, player2, roundNum }) => {
  clearInterval(timerInterval);
  currentPlayerId = player1.id;
  secondPlayerId = player2.id;
  document.getElementById('duelPlayers').textContent = `${player1.name} ⚡ ${player2.name}`;
  showScreen('screen-duel-announce');
});

socket.on('duelQuestion', ({ question, questionNum, totalQuestions, firstPlayer, secondPlayer, answeringId, duration, startTime }) => {
  document.getElementById('duelRoundPill').textContent = `Питання ${questionNum}/${totalQuestions}`;
  document.getElementById('duelQuestionText').textContent = question;
  document.getElementById('duelAnsweringName').textContent = firstPlayer.name;

  const isMyTurn = answeringId === myId;
  document.getElementById('duel-my-turn').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('duel-others-turn').style.display = isMyTurn ? 'none' : 'block';
  document.getElementById('host-end-duel').style.display = isHost ? 'block' : 'none';

  document.getElementById('duelTimerFill').style.background = 'linear-gradient(90deg,#95E1A3,#4ECDC4)';
  startSyncTimer(startTime, duration, 'duelTimerFill', 'duelTimerVal', null);
  showScreen('screen-duel-question');
});

socket.on('duelSecondAnswer', ({ answeringId, answeringName, duration, startTime }) => {
  document.getElementById('duelAnsweringName').textContent = answeringName;
  const isMyTurn = answeringId === myId;
  document.getElementById('duel-my-turn').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('duel-others-turn').style.display = isMyTurn ? 'none' : 'block';
  document.getElementById('duelTimerFill').style.background = 'linear-gradient(90deg,#95E1A3,#4ECDC4)';
  startSyncTimer(startTime, duration, 'duelTimerFill', 'duelTimerVal', null);
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

socket.on('duelResult', ({ winnerId, votes, players: updated }) => {
  players = updated;
  const winner = updated.find(p => p.id === winnerId);
  const isWinner = winnerId === myId;
  document.getElementById('resultEmoji').textContent = isWinner ? '🏆' : '👏';
  document.getElementById('resultTitle').textContent = isWinner ? 'Ти переміг у дуелі!' : `Переможець дуелі: ${winner ? winner.name : 'Нічия'}`;
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
    document.getElementById('voteSub').textContent = `Оціни виступ ${currentPlayerName}`;
    document.getElementById('scoreSlider').value = 5;
    document.getElementById('scoreDisplay').textContent = '5';
  }

  showScreen('screen-vote');
});

document.getElementById('scoreSlider').addEventListener('input', (e) => {
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
  const medals = ['🥇','🥈','🥉'];
  const colors = ['var(--orange)','var(--blue)','var(--purple)','var(--green)','var(--yellow)','var(--pink)'];
  const container = document.getElementById('scoreList');
  container.innerHTML = '';
  sorted.forEach((p, i) => {
    const pct = maxScore > 0 ? (p.score/maxScore)*100 : 0;
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <div class="score-rank">${medals[i]||(i+1)+'.'}</div>
      <div class="score-bar-wrap">
        <div class="score-player-name">${p.name}</div>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${pct}%;background:${colors[i%colors.length]}"></div></div>
      </div>
      <div class="score-points" style="color:${colors[i%colors.length]}">${p.score}</div>
    `;
    container.appendChild(row);
  });
}

document.getElementById('nextRoundBtn').addEventListener('click', () => {
  socket.emit('nextRound', { code: myRoomCode });
});

socket.on('gameEnded', ({ players: final }) => {
  clearInterval(timerInterval);
  const medals = ['🥇','🥈','🥉'];
  const colors = ['var(--orange)','var(--blue)','var(--purple)','var(--green)','var(--yellow)','var(--pink)'];
  const container = document.getElementById('finalList');
  container.innerHTML = '';
  final.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'final-row';
    row.innerHTML = `
      <div class="final-rank">${medals[i]||'🎖️'}</div>
      <div class="final-name">${p.name}</div>
      <div class="final-score" style="color:${colors[i%colors.length]}">${p.score} ⭐</div>
    `;
    container.appendChild(row);
  });
  showScreen('screen-final');
});

document.getElementById('playAgainBtn').addEventListener('click', () => { window.location.reload(); });
