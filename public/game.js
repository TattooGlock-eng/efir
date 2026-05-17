const socket = io();

// ===== СТАН =====
let myName = '';
let myRoomCode = '';
let isHost = false;
let myId = '';
let players = [];
let currentPlayerId = '';
let selectedVote = null;
let timerInterval = null;
let btnBehavior = 'normal';
let btnClickCount = 0;
let myScore = 0;
let currentRound = 0;

// ===== УТИЛІТИ =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function getAvatarClass(index) {
  return `av-${index % 8}`;
}

function getInitial(name) {
  return name.charAt(0).toUpperCase();
}

function getReaction(index) {
  const reactions = ['😂', '🤣', '😆', '💀', '😭', '🥲', '😹', '🔥'];
  return reactions[index % reactions.length];
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

// ===== КНОПКИ З ПРИКОЛАМИ =====
const BUTTON_TEXTS = {
  run: ['ПОЧАТИ ГРУ 🚀', 'ЕЙ СТІЙ!', 'НЕ ЖЕНИ!', 'ОК ДОБРЕ 🚀'],
  angry: ['ПОЧАТИ ГРУ 🚀', 'ТИ МЕНІ НЕ ТИКАЙ', 'СКАЗАЛА НІ!', 'НУ І ЩО ТИ ЗРОБИШ?', 'ОК ЗАПУСКАЮ 😤'],
  cry: ['ПОЧАТИ ГРУ 🚀', 'НЕВЖЕ ТИ НАТИСНЕШ? 🥺', 'МЕН БОЛЯЧЕ...', 'ОК ОК ЗАПУСКАЮ 😭'],
  lie: ['ПОЧАТИ ГРУ 🚀', 'ОБМАНУЛА ХА-ХА 😝', 'ЗАРАЗ ЗАПУЩУ... НІ', 'ОК РЕАЛЬНО ЗАПУСКАЮ'],
  flirt: ['ПОЧАТИ ГРУ 🚀', 'СПОЧАТКУ СКАЖИ ЩО Я ГАРНА', 'ЛАДНО ТАК І БУТИ 😏'],
  melt: ['ПОЧАТИ ГРУ 🚀', 'я.. тану.. 🫠', 'ок зібралась 🚀'],
  panic: ['ПОЧАТИ ГРУ 🚀', 'НЕ НАТИСКАЙ!!', 'СТІЙ!', 'ОЙ ВСЕ ОДНО НАТИСНУВ 😱'],
  flip: ['ПОЧАТИ ГРУ 🚀', 'ʞɔɐq ǝɯ pɐǝɹ', 'ЗАПУСКАЮ 🚀'],
  disappear: ['ПОЧАТИ ГРУ 🚀', '...', 'ТУТ Я!', 'ЗАПУСКАЮ 🚀'],
  joke: ['ПОЧАТИ ГРУ 🚀', 'ЧЕКАЙ АНЕКДОТ!', 'ЧОМУ КНОПКА НЕ СМІЄТЬСЯ? БО ЇЇ НАТИСКАЮТЬ 😂', 'ЗАПУСКАЮ 🚀'],
  broken: ['ПОЧАТИ ГРУ 🚀', 'ПМИЛКА 404', 'Ж@#ТУЮ ВСЕ ОК', 'ЗАПУСКАЮ 🚀'],
  password: ['ПОЧАТИ ГРУ 🚀', 'ВВЕДИ ПАРОЛЬ:', 'НЕПРАВИЛЬНО', 'ЛАДНО ПУСКАЮ 🚀'],
  countdown: ['ПОЧАТИ ГРУ 🚀', '3...', '2...', '1...', 'НІ! 😈', 'ЗАПУСКАЮ 🚀'],
  regret: ['ПОЧАТИ ГРУ 🚀', 'ЗАПУСТИЛА... ШКОДУЮ', 'АЛЕ ОК 🚀'],
  confirm: ['ПОЧАТИ ГРУ 🚀', 'ТИ ВПЕВНЕНИЙ?', 'ТОЧНО?', 'НУ ДОБРЕ 🚀']
};

function handleStartBtn() {
  const btn = document.getElementById('startBtn');
  const texts = BUTTON_TEXTS[btnBehavior] || BUTTON_TEXTS['angry'];

  if (btnBehavior === 'run') {
    if (btnClickCount < 3) {
      btn.classList.remove('running');
      void btn.offsetWidth;
      btn.classList.add('running');
      btn.textContent = texts[Math.min(btnClickCount + 1, texts.length - 2)];
      btnClickCount++;

      // Кнопка втікає — переміщуємо в рандомне місце
      const wrap = btn.parentElement;
      const maxX = wrap.offsetWidth - btn.offsetWidth - 20;
      const maxY = 40;
      btn.style.position = 'relative';
      btn.style.left = Math.random() * maxX - maxX/2 + 'px';
      btn.style.top = Math.random() * maxY - maxY/2 + 'px';
    } else {
      btn.style.left = '0';
      btn.style.top = '0';
      btn.textContent = texts[texts.length - 1];
      setTimeout(() => reallyStart(), 500);
    }
    return;
  }

  if (btnBehavior === 'angry') {
    if (btnClickCount < texts.length - 1) {
      btn.classList.remove('shaking');
      void btn.offsetWidth;
      btn.classList.add('shaking');
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'cry') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'lie') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'flirt') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'melt') {
    if (btnClickCount === 0) {
      btn.classList.add('melting');
      btn.textContent = texts[1];
      btnClickCount++;
      setTimeout(() => {
        btn.classList.remove('melting');
        btn.textContent = texts[2];
      }, 1000);
    } else if (btnClickCount === 1) {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'panic') {
    if (btnClickCount < texts.length - 1) {
      btn.classList.remove('shaking');
      void btn.offsetWidth;
      btn.classList.add('shaking');
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'flip') {
    if (btnClickCount === 0) {
      btn.classList.add('flipping');
      btn.textContent = texts[1];
      btnClickCount++;
      setTimeout(() => {
        btn.classList.remove('flipping');
        btn.textContent = texts[2];
      }, 600);
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'disappear') {
    if (btnClickCount === 0) {
      btn.classList.add('blinking');
      btn.textContent = texts[1];
      btnClickCount++;
      setTimeout(() => {
        btn.classList.remove('blinking');
        btn.textContent = texts[2];
      }, 1200);
    } else if (btnClickCount === 1) {
      btn.textContent = texts[3];
      btnClickCount++;
      setTimeout(() => reallyStart(), 300);
    }
    return;
  }

  if (btnBehavior === 'joke') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
      if (btnClickCount === 2) {
        // Показуємо анекдот — кнопка стає широкою
        btn.style.fontSize = '11px';
        btn.style.padding = '14px 8px';
      } else {
        btn.style.fontSize = '';
        btn.style.padding = '';
      }
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'broken') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
      if (btnClickCount === 1) {
        btn.style.background = '#999';
        btn.style.transform = 'skew(-5deg)';
      } else if (btnClickCount === 2) {
        btn.style.background = '';
        btn.style.transform = '';
      }
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'password') {
    if (btnClickCount === 0) {
      btn.textContent = texts[1];
      btnClickCount++;
    } else if (btnClickCount === 1) {
      btn.textContent = texts[2];
      btnClickCount++;
      setTimeout(() => {
        btn.textContent = texts[3];
        btnClickCount++;
      }, 1000);
    } else if (btnClickCount >= 3) {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'countdown') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
      if (btnClickCount === 4) {
        // "НІ!" — трясемо
        btn.classList.remove('shaking');
        void btn.offsetWidth;
        btn.classList.add('shaking');
      }
    } else {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'regret') {
    if (btnClickCount === 0) {
      btn.textContent = texts[1];
      btnClickCount++;
      setTimeout(() => {
        btn.textContent = texts[2];
        btnClickCount++;
      }, 1500);
    } else if (btnClickCount >= 2) {
      reallyStart();
    }
    return;
  }

  if (btnBehavior === 'confirm') {
    if (btnClickCount < texts.length - 1) {
      btn.textContent = texts[btnClickCount + 1];
      btnClickCount++;
    } else {
      reallyStart();
    }
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
  if (!name) { showError('Введи своє ім\'я!'); return; }
  myName = name;
  socket.emit('createRoom', { name });
});

document.getElementById('joinBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  const code = document.getElementById('roomCode').value.trim().toUpperCase();
  if (!name) { showError('Введи своє ім\'я!'); return; }
  if (!code) { showError('Введи код кімнати!'); return; }
  myName = name;
  socket.emit('joinRoom', { name, code });
});

document.getElementById('playerName').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('joinBtn').click();
});

document.getElementById('roomCode').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('joinBtn').click();
});

// ===== SOCKET EVENTS =====
socket.on('connect', () => {
  myId = socket.id;
});

socket.on('roomCreated', ({ code, btnBehavior: bh }) => {
  myRoomCode = code;
  isHost = true;
  btnBehavior = bh;
  document.getElementById('displayCode').textContent = code;
  document.getElementById('host-controls').style.display = 'block';
  document.getElementById('guest-waiting').style.display = 'none';

  const startBtn = document.getElementById('startBtn');
  startBtn.addEventListener('click', handleStartBtn);

  showScreen('screen-button');
});

socket.on('joinedRoom', ({ code, btnBehavior: bh }) => {
  myRoomCode = code;
  isHost = false;
  btnBehavior = bh;
  document.getElementById('displayCode').textContent = code;
  document.getElementById('host-controls').style.display = 'none';
  document.getElementById('guest-waiting').style.display = 'block';
  showScreen('screen-button');
});

socket.on('error', (msg) => {
  showError(msg);
});

socket.on('updatePlayers', (updatedPlayers) => {
  players = updatedPlayers;
  renderPlayerChips();
});

function renderPlayerChips() {
  const container = document.getElementById('playersChips');
  container.innerHTML = '';
  players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = `player-chip chip-${i % 6}`;
    chip.textContent = p.name;
    container.appendChild(chip);
  });
}

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

socket.on('roundStarted', ({ playerName, playerId, format, formatLabel, task, roundNum, duration }) => {
  currentPlayerId = playerId;
  currentRound = roundNum;
  selectedVote = null;

  // Оновлюємо мій рахунок
  const me = players.find(p => p.id === myId);
  if (me) myScore = me.score;

  // Заголовок
  document.getElementById('roundPill').textContent = `Раунд ${roundNum}`;
  document.getElementById('scorePill').textContent = `⭐ ${myScore}`;

  // Спотлайт
  const playerIndex = players.findIndex(p => p.id === playerId);
  const avatar = document.getElementById('spotlightAvatar');
  avatar.className = `spotlight-avatar ${getAvatarClass(playerIndex)}`;
  avatar.textContent = getInitial(playerName);
  document.getElementById('spotlightName').textContent = playerName;

  // Формат
  const badge = document.getElementById('formatBadge');
  badge.textContent = formatLabel;
  badge.className = `format-badge format-${format}`;

  // Завдання
  document.getElementById('taskText').textContent = task;

  // Мій хід чи ні
  const isMyTurn = playerId === myId;
  document.getElementById('my-turn-actions').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('others-actions').style.display = isMyTurn ? 'none' : 'block';

  // Таймер
  startTimer(duration);

  showScreen('screen-round');
});

function startTimer(duration) {
  clearInterval(timerInterval);
  let remaining = duration;
  const fill = document.getElementById('timerFill');
  const val = document.getElementById('timerVal');

  fill.style.width = '100%';
  val.textContent = formatTime(remaining);

  // Колір таймера змінюється
  fill.style.background = 'linear-gradient(90deg, #95E1A3, #4ECDC4)';

  timerInterval = setInterval(() => {
    remaining--;
    const pct = (remaining / duration) * 100;
    fill.style.width = pct + '%';
    val.textContent = formatTime(remaining);

    // Червоніє коли мало часу
    if (remaining <= 10) {
      fill.style.background = 'linear-gradient(90deg, #FF6B35, #ff1a1a)';
    } else if (remaining <= 30) {
      fill.style.background = 'linear-gradient(90deg, #FFD93D, #FF6B35)';
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);
      val.textContent = '0:00';
      fill.style.width = '0%';
      // Показуємо голосування
      showVoting();
    }
  }, 1000);
}

function showVoting() {
  const isMyTurn = currentPlayerId === myId;

  if (isMyTurn) {
    // Активний гравець чекає результатів
    document.getElementById('voteOptions').innerHTML = '';
    document.getElementById('voteSub').textContent = 'Це був твій виступ! Чекаємо голосів...';
    document.getElementById('submitVoteBtn').style.display = 'none';
    document.getElementById('voted-waiting').style.display = 'block';
    document.getElementById('voted-waiting').querySelector('.waiting-text').textContent = '🎤 Ти виступав! Чекаємо оцінок...';
    showScreen('screen-vote');
    return;
  }

  // Інші гравці голосують
  document.getElementById('submitVoteBtn').style.display = 'block';
  document.getElementById('submitVoteBtn').disabled = true;
  document.getElementById('voted-waiting').style.display = 'none';
  document.getElementById('voteSub').textContent = 'Хто був найсмішнішим? Гравець не бачить твій голос 😏';

  const container = document.getElementById('voteOptions');
  container.innerHTML = '';

  players.forEach((p, i) => {
    const option = document.createElement('div');
    option.className = 'vote-option';
    option.innerHTML = `
      <div class="vote-avatar ${getAvatarClass(i)}">${getInitial(p.name)}</div>
      <div class="vote-name">${p.name}</div>
      <div class="vote-reaction">${getReaction(i)}</div>
      <div class="vote-check">✓</div>
    `;
    option.addEventListener('click', () => {
      document.querySelectorAll('.vote-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedVote = p.id;
      document.getElementById('submitVoteBtn').disabled = false;
    });
    container.appendChild(option);
  });

  showScreen('screen-vote');
}

document.getElementById('submitVoteBtn').addEventListener('click', () => {
  if (!selectedVote) return;
  socket.emit('submitVote', { code: myRoomCode, votedFor: selectedVote });
  document.getElementById('submitVoteBtn').style.display = 'none';
  document.getElementById('voted-waiting').style.display = 'block';
  document.getElementById('voted-waiting').querySelector('.waiting-text').textContent = '✅ Голос прийнято! Чекаємо інших...';
});

socket.on('votingResult', ({ votes, winnerId, players: updatedPlayers }) => {
  players = updatedPlayers;
  clearInterval(timerInterval);

  // Переможець раунду
  const winner = updatedPlayers.find(p => p.id === winnerId);
  const winnerName = winner ? winner.name : 'Нічия!';
  const isWinner = winnerId === myId;

  document.getElementById('resultEmoji').textContent = isWinner ? '🏆' : '👏';
  document.getElementById('resultTitle').textContent = isWinner ? 'Ти переміг цей раунд!' : 'Переможець раунду:';
  document.getElementById('resultWinner').textContent = winnerName;

  // Оновлюємо свій рахунок
  const me = updatedPlayers.find(p => p.id === myId);
  if (me) {
    myScore = me.score;
    document.getElementById('scorePill').textContent = `⭐ ${myScore}`;
  }

  // Рахунок
  renderScoreList(updatedPlayers);

  // Хост може запустити наступний раунд
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
      <div class="score-rank">${medals[i] || (i + 1) + '️⃣'}</div>
      <div class="score-bar-wrap">
        <div class="score-player-name">${p.name}</div>
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
        </div>
      </div>
      <div class="score-points" style="color:${colors[i % colors.length]}">${p.score}</div>
    `;
    container.appendChild(row);
  });
}

document.getElementById('nextRoundBtn').addEventListener('click', () => {
  socket.emit('nextRound', { code: myRoomCode });
});

socket.on('gameEnded', ({ players: finalPlayers }) => {
  clearInterval(timerInterval);
  renderFinalList(finalPlayers);
  showScreen('screen-final');
});

function renderFinalList(playerList) {
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['var(--orange)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--yellow)', 'var(--pink)'];
  const container = document.getElementById('finalList');
  container.innerHTML = '';

  playerList.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'final-row';
    row.innerHTML = `
      <div class="final-rank">${medals[i] || '🎖️'}</div>
      <div class="final-name">${p.name}</div>
      <div class="final-score" style="color:${colors[i % colors.length]}">${p.score} ⭐</div>
    `;
    container.appendChild(row);
  });
}

document.getElementById('playAgainBtn').addEventListener('click', () => {
  window.location.reload();
});
