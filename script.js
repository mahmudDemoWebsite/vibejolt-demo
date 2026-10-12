(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const modalBackdrop = $('#modalBackdrop');
  const modalTitle = $('#modalTitle');
  const modalEyebrow = $('#modalEyebrow');
  const modalBody = $('#modalBody');
  const toast = $('#toast');

  const STORAGE_KEY = 'vibejolt-demo-state-v1';
  const defaultPlayers = ['You', 'Alex', 'Jamie', 'Sam'];
  const state = {
    activeRoom: null,
    players: [...defaultPlayers],
    score: 0,
    voteSelected: '',
    voteQuestionIndex: 0,
    emojiIndex: 0,
    emojiScore: 0,
    emojiAnswered: false,
    wheelRotation: 0,
    wheelSpinning: false
  };

  const voteQuestions = [
    'Who is most likely to accidentally become a meme?',
    'Who would survive a zombie apocalypse by pure luck?',
    'Who takes 47 business days to reply to a text?',
    'Who would get famous for the weirdest reason?',
    'Who says “I’m five minutes away” while still at home?',
    'Who would laugh at the worst possible moment?'
  ];

  const challenges = [
    { emoji: '🎤', title: 'Main character energy', detail: 'Sing the chorus of any song like you’re headlining a stadium.' },
    { emoji: '🤸', title: 'Award-winning drama', detail: 'Act like you just won an award for “Best Person Who Did Absolutely Nothing”.' },
    { emoji: '🗣️', title: 'Tongue-twister trouble', detail: 'Say “red lorry, yellow lorry” five times fast. No shortcuts.' },
    { emoji: '🕺', title: 'One-move dance party', detail: 'Invent one dance move. Give it a name. Demonstrate it with confidence.' },
    { emoji: '😎', title: 'Unbelievable flex', detail: 'Describe a very ordinary skill like it’s an Olympic achievement.' },
    { emoji: '🎭', title: 'Sound effects department', detail: 'Make three sound effects for a movie trailer your group invents.' },
    { emoji: '🫡', title: 'Royal announcement', detail: 'Announce what you had for breakfast as if addressing a kingdom.' },
    { emoji: '🧑‍🍳', title: 'Chef’s special', detail: 'Invent a fancy name for the strangest snack combination you can imagine.' }
  ];

  const emojiQuestions = [
    { emojis: '🦁 👑', prompt: 'Guess the movie', choices: ['The Lion King', 'Madagascar', 'Kung Fu Panda', 'Finding Nemo'], answer: 0, fact: 'A royal lion story. Hakuna Matata!' },
    { emojis: '🕷️ 👨', prompt: 'Guess the hero', choices: ['Batman', 'Spider-Man', 'Ant-Man', 'Iron Man'], answer: 1, fact: 'Friendly neighborhood hero, confirmed.' },
    { emojis: '🚢 🧊 💔', prompt: 'Guess the movie', choices: ['Frozen', 'Life of Pi', 'Titanic', 'Moana'], answer: 2, fact: 'That iceberg had one job.' },
    { emojis: '🐠 🔍 🌊', prompt: 'Guess the movie', choices: ['The Little Mermaid', 'Shark Tale', 'Finding Nemo', 'Luca'], answer: 2, fact: 'Just keep swimming!' },
    { emojis: '🧙‍♂️ 💍 🌋', prompt: 'Guess the story', choices: ['Harry Potter', 'The Lord of the Rings', 'Shrek', 'Avatar'], answer: 1, fact: 'One ring, a very long walk.' }
  ];

  const groupTypes = [
    { emoji: '🌪️', title: 'The Chaos Committee', detail: 'You never know what the plan is, but you know it’ll become a story. Somehow, it always works out.' },
    { emoji: '🧃', title: 'The Unpaid Therapists', detail: 'Half memes, half life advice, 100% available for a 2 a.m. crisis.' },
    { emoji: '🕵️', title: 'The Screenshot Society', detail: 'Nothing gets past this group. The receipts are organised. The tea is always hot.' },
    { emoji: '🐢', title: 'The Reply-Tomorrow Club', detail: 'Messages may take days. Friendship is forever. Typing bubbles are a rare sighting.' },
    { emoji: '🎬', title: 'The Main Character Cast', detail: 'Every small inconvenience becomes a season finale. The group chat is the writers’ room.' },
    { emoji: '🛸', title: 'The Beautiful Weirdos', detail: 'No context. Seven inside jokes. Somehow you all understand each other perfectly.' },
    { emoji: '🍟', title: 'The Snack Council', detail: 'Plans, opinions, and emergency meetings are all centred around what to eat next.' }
  ];

  function readSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.players) && saved.players.length) {
        state.players = saved.players.slice(0, 8);
        state.activeRoom = saved.activeRoom || null;
        state.score = Number.isFinite(saved.score) ? saved.score : 0;
      }
    } catch (error) {
      console.warn('VibeJolt demo state could not be restored.', error);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeRoom: state.activeRoom,
        players: state.players,
        score: state.score
      }));
    } catch (error) {
      // The demo still works for the current page if storage is unavailable.
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function openModal(title, eyebrow, html) {
    modalTitle.textContent = title;
    modalEyebrow.textContent = eyebrow;
    modalBody.innerHTML = html;
    modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#modalClose').focus();
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    document.body.style.overflow = '';
    state.wheelSpinning = false;
  }

  function makeCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code;
  }

  function openCreateRoom() {
    openModal('Create your room', 'LET’S GET THIS PARTY STARTED', `
      <form class="modal-form" id="createRoomForm">
        <div><label class="field-label" for="roomName">Give your room a name</label><input class="field-input" id="roomName" name="roomName" maxlength="32" placeholder="Friday Night Chaos" value="Friday Night Chaos" required /></div>
        <div><label class="field-label" for="playerName">Your nickname</label><input class="field-input" id="playerName" name="playerName" maxlength="18" placeholder="e.g. Mahmud" required /></div>
        <p class="helper-text">This demo keeps the room in this browser. Invite codes are for trying the flow, not live cross-device multiplayer yet.</p>
        <button class="button button-primary" type="submit">Create room <span>→</span></button>
      </form>`);
    $('#createRoomForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const roomName = $('#roomName').value.trim() || 'Untitled Chaos';
      const playerName = $('#playerName').value.trim() || 'You';
      state.activeRoom = { code: makeCode(), name: roomName, createdAt: Date.now() };
      state.players = [playerName, 'Alex', 'Jamie', 'Sam'];
      state.score = 0;
      saveState();
      showRoomCreated();
    });
  }

  function showRoomCreated() {
    const room = state.activeRoom;
    openModal('Your room is ready!', 'ROOM CREATED · DEMO MODE', `
      <div class="room-success">
        <div class="success-icon">✦</div>
        <h3>${escapeHTML(room.name)}</h3>
        <p>Your room code is ready. Send it to your crew!</p>
        <div class="room-code-box"><strong>${escapeHTML(room.code)}</strong><button type="button" id="copyRoomCode">Copy code</button></div>
        <div class="pill-row" style="justify-content:center;margin:0 0 18px">${state.players.map((player, index) => `<span class="player-pill ${index === 0 ? 'self' : ''}">${index === 0 ? '✦ ' : ''}${escapeHTML(player)}</span>`).join('')}</div>
        <button class="button button-primary" type="button" id="roomStartGame">Let’s play <span>→</span></button>
      </div>`);
    $('#copyRoomCode').addEventListener('click', () => copyText(room.code, 'Room code copied!'));
    $('#roomStartGame').addEventListener('click', () => openGame('vote'));
  }

  function openJoinRoom() {
    openModal('Join a room', 'YOUR CREW SENT YOU A CODE', `
      <form class="modal-form" id="joinRoomForm">
        <div><label class="field-label" for="joinCode">Room code</label><input class="field-input" id="joinCode" name="joinCode" maxlength="6" placeholder="ABC123" autocomplete="off" required /></div>
        <div><label class="field-label" for="joinName">Your nickname</label><input class="field-input" id="joinName" name="joinName" maxlength="18" placeholder="What should we call you?" required /></div>
        <p class="helper-text">In this front-end demo, the room join is simulated locally. A real shared room needs a backend.</p>
        <button class="button button-primary" type="submit">Join the chaos <span>→</span></button>
      </form>`);
    $('#joinCode').addEventListener('input', (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); });
    $('#joinRoomForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const code = $('#joinCode').value.trim().toUpperCase();
      const playerName = $('#joinName').value.trim() || 'Guest';
      if (code.length !== 6) { showToast('Enter a 6-character room code.'); return; }
      state.activeRoom = { code, name: 'Joined Demo Room', createdAt: Date.now() };
      state.players = [playerName, 'Alex', 'Jamie', 'Sam'].slice(0, 8);
      saveState();
      openModal('You’re in!', 'WELCOME TO THE ROOM', `<div class="room-success"><div class="success-icon">🎉</div><h3>Ready, ${escapeHTML(playerName)}?</h3><p>You joined demo room <strong>${escapeHTML(code)}</strong>. Let’s start with a game.</p><div class="pill-row" style="justify-content:center;margin-bottom:20px">${state.players.map((p,i)=>`<span class="player-pill ${i===0?'self':''}">${escapeHTML(p)}</span>`).join('')}</div><button type="button" class="button button-primary" id="joinPlayBtn">Choose a game →</button></div>`);
      $('#joinPlayBtn').addEventListener('click', () => openGame('vote'));
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  async function copyText(value, successMessage = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement('textarea');
        temporary.value = value;
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand('copy');
        temporary.remove();
        if (!copied) throw new Error('Clipboard not available');
      }
      showToast(successMessage);
    } catch (error) {
      showToast('Copy was blocked. Select and copy this text manually.');
    }
  }

  function inviteText() {
    const room = state.activeRoom;
    if (!room) return 'Come play VibeJolt with me!';
    return `Come play VibeJolt with me! Room: ${room.code} (${room.name}). Demo: ${window.location.href}`;
  }

  function openGame(game) {
    if (!state.activeRoom) {
      // Keep games instantly playable, while creating a local demo room behind the scenes.
      state.activeRoom = { code: makeCode(), name: 'Casual Chaos', createdAt: Date.now() };
      state.players = [...defaultPlayers];
      saveState();
    }
    if (game === 'vote') renderVoteGame();
    else if (game === 'wheel') renderWheelGame();
    else if (game === 'emoji') renderEmojiGame();
    else if (game === 'dna') renderDNAResult();
  }

  function gameHeader(kind, title) {
    const room = state.activeRoom;
    return `<div class="game-room-line"><span class="player-pill self">✦ ${escapeHTML(room ? room.name : 'Casual Chaos')}</span><span class="player-pill">CODE: ${escapeHTML(room ? room.code : '------')}</span></div>`;
  }

  function renderVoteGame() {
    const question = voteQuestions[state.voteQuestionIndex % voteQuestions.length];
    const candidates = state.players.length ? state.players : defaultPlayers;
    state.voteSelected = '';
    openModal('Who’s Most Likely?', 'THE GROUP CHAT', `${gameHeader('vote', 'Who’s Most Likely?')}<p class="game-intro">Pick the friend who fits the prompt best. In this demo, your vote reveals a playful result.</p><div class="game-question-card"><div class="question-label">ROUND ${(state.voteQuestionIndex % voteQuestions.length) + 1} · THE BIG QUESTION</div><h3>${escapeHTML(question)}</h3></div><div class="choice-list" id="voteChoices">${candidates.map((person, index) => `<button class="choice-button" type="button" data-person="${escapeHTML(person)}"><span class="choice-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHTML(person)}</span></button>`).join('')}</div><div class="game-actions"><button class="button button-primary" id="submitVoteBtn" disabled>Lock in vote →</button><button class="button button-outline" id="nextVoteQuestion">Next question ↻</button></div><div id="voteResult"></div>`);
    $$('#voteChoices .choice-button').forEach((button) => button.addEventListener('click', () => {
      state.voteSelected = button.dataset.person;
      $$('#voteChoices .choice-button').forEach((item) => item.classList.toggle('selected', item === button));
      $('#submitVoteBtn').disabled = false;
    }));
    $('#submitVoteBtn').addEventListener('click', () => {
      if (!state.voteSelected) return;
      const voted = state.voteSelected;
      const percent = 42 + Math.floor(Math.random() * 50);
      $('#voteResult').innerHTML = `<div class="result-panel"><strong>👀 ${escapeHTML(voted)} is under investigation!</strong><p>${percent}% of the imaginary room agrees. (Demo votes are randomized, not collected from other devices.)</p></div><div class="game-actions"><button class="button button-outline" id="shareVoteResult">Share result ↗</button><button class="button button-primary" id="replayVote">Another round →</button></div>`;
      $('#submitVoteBtn').disabled = true;
      state.score += 10;
      saveState();
      $('#shareVoteResult').addEventListener('click', () => shareText(`VibeJolt verdict: “${voted}” is most likely to ${question.replace(/^Who is most likely to /i, '').replace(/[?]$/, '')} 😂 Play with us! ${inviteText()}`));
      $('#replayVote').addEventListener('click', () => { state.voteQuestionIndex++; renderVoteGame(); });
    });
    $('#nextVoteQuestion').addEventListener('click', () => { state.voteQuestionIndex++; renderVoteGame(); });
  }

  function renderWheelGame() {
    const wheelItems = ['🎤','🤸','🗣️','🕺','😎','🎭','🫡','🧑‍🍳'];
    openModal('Chaos Wheel', 'PURE MAYHEM', `${gameHeader('wheel', 'Chaos Wheel')}<p class="game-intro">The wheel has no chill. Spin it and accept your very silly fate.</p><div class="wheel-play-area"><div class="big-wheel-pointer"></div><div class="big-wheel" id="bigWheel">${wheelItems.map((item,index)=>`<span>${item}</span>`).join('')}</div><div class="big-wheel-center">VJ</div><div class="wheel-result" id="wheelResult">Ready when you are. 👀</div></div><div class="game-actions"><button type="button" class="button button-primary" id="spinWheelBtn">Spin the wheel ✦</button><button type="button" class="button button-outline" id="shareWheelBtn">Invite friends ↗</button></div><div id="challengeDetail"></div>`);
    $('#spinWheelBtn').addEventListener('click', spinWheel);
    $('#shareWheelBtn').addEventListener('click', () => shareText(inviteText()));
  }

  function spinWheel() {
    if (state.wheelSpinning) return;
    state.wheelSpinning = true;
    const wheel = $('#bigWheel');
    const button = $('#spinWheelBtn');
    const result = $('#wheelResult');
    const detail = $('#challengeDetail');
    if (!wheel || !button) return;
    button.disabled = true;
    button.textContent = 'Spinning...';
    result.textContent = 'Consulting the chaos gods...';
    const index = Math.floor(Math.random() * challenges.length);
    const segmentDegrees = 360 / challenges.length;
    const target = 360 * (5 + Math.floor(Math.random() * 3)) + (360 - index * segmentDegrees - segmentDegrees / 2);
    state.wheelRotation += target;
    wheel.style.transform = `rotate(${state.wheelRotation}deg)`;
    window.setTimeout(() => {
      const challenge = challenges[index];
      result.textContent = `${challenge.emoji} ${challenge.title}`;
      detail.innerHTML = `<div class="result-panel"><strong>${challenge.emoji} ${escapeHTML(challenge.title)}</strong><p>${escapeHTML(challenge.detail)}</p></div><div class="game-actions"><button class="button button-outline" id="shareChallengeBtn">Share challenge ↗</button><button class="button button-primary" id="spinAgainBtn">Spin again ↻</button></div>`;
      $('#shareChallengeBtn').addEventListener('click', () => shareText(`My VibeJolt Chaos Wheel challenge: ${challenge.title} — ${challenge.detail} 😂`));
      $('#spinAgainBtn').addEventListener('click', spinWheel);
      state.wheelSpinning = false;
      button.disabled = false;
      button.textContent = 'Spin again ✦';
      state.score += 5;
      saveState();
    }, 3250);
  }

  function renderEmojiGame() {
    state.emojiIndex = 0;
    state.emojiScore = 0;
    state.emojiAnswered = false;
    showEmojiQuestion();
  }

  function showEmojiQuestion() {
    const index = state.emojiIndex;
    if (index >= emojiQuestions.length) { showEmojiFinalScore(); return; }
    const question = emojiQuestions[index];
    openModal('Emoji Decode', 'BRAIN GLITCH', `${gameHeader('emoji', 'Emoji Decode')}<div class="quiz-progress">QUESTION ${index + 1} OF ${emojiQuestions.length}<div class="quiz-progress-track"><span style="width:${(index / emojiQuestions.length) * 100}%"></span></div></div><p class="game-intro">Decode the emojis and choose your answer. No googling, detective.</p><div class="game-question-card" style="text-align:center;padding:23px 12px"><div class="question-label">${escapeHTML(question.prompt.toUpperCase())}</div><h3 style="font-size:38px;letter-spacing:4px;margin-top:13px">${question.emojis}</h3></div><div class="choice-list" id="emojiChoices">${question.choices.map((choice, i) => `<button type="button" class="choice-button" data-choice="${i}"><span class="choice-letter">${String.fromCharCode(65 + i)}</span><span>${escapeHTML(choice)}</span></button>`).join('')}</div><div id="emojiFeedback"></div><div class="game-actions"><button type="button" class="button button-primary" id="emojiSubmitBtn" disabled>Lock answer →</button></div>`);
    let selected = null;
    $$('#emojiChoices .choice-button').forEach((button) => button.addEventListener('click', () => {
      if (state.emojiAnswered) return;
      selected = Number(button.dataset.choice);
      $$('#emojiChoices .choice-button').forEach((item) => item.classList.toggle('selected', item === button));
      $('#emojiSubmitBtn').disabled = false;
    }));
    $('#emojiSubmitBtn').addEventListener('click', () => {
      if (selected === null || state.emojiAnswered) return;
      state.emojiAnswered = true;
      const correct = selected === question.answer;
      if (correct) state.emojiScore++;
      $$('#emojiChoices .choice-button').forEach((button) => {
        button.disabled = true;
        if (Number(button.dataset.choice) === question.answer) button.classList.add('selected');
      });
      $('#emojiFeedback').innerHTML = `<div class="result-panel"><strong>${correct ? '✅ Nailed it!' : '🫠 Not quite!'}</strong><p>${escapeHTML(question.fact)}</p></div>`;
      $('#emojiSubmitBtn').textContent = index === emojiQuestions.length - 1 ? 'See my score →' : 'Next question →';
      $('#emojiSubmitBtn').disabled = false;
      $('#emojiSubmitBtn').onclick = () => { state.emojiIndex++; state.emojiAnswered = false; showEmojiQuestion(); };
      state.score += correct ? 10 : 0;
      saveState();
    });
  }

  function showEmojiFinalScore() {
    const score = state.emojiScore;
    const total = emojiQuestions.length;
    const title = score === total ? 'Emoji Overlord' : score >= 3 ? 'Certified Decoder' : score >= 1 ? 'Emoji Apprentice' : 'Beautifully Confused';
    const emoji = score === total ? '🧠' : score >= 3 ? '🕵️' : score >= 1 ? '🧩' : '🫠';
    openModal('Quiz complete!', 'BRAIN GLITCH · RESULTS', `${gameHeader('emoji', 'Emoji Decode')}<div class="dna-result-card"><div class="dna-result-emoji">${emoji}</div><div class="dna-overline">YOUR OFFICIAL TITLE</div><h3>${title}</h3><p>You got ${score} out of ${total} correct. ${score === total ? 'Your brain needs its own group chat.' : 'Challenge your friends and see who tops the board.'}</p><div style="font-family:var(--font-head);font-size:29px;font-weight:700;margin-top:15px;color:#d6ff9f">${score * 100}% vibes</div></div><div class="game-actions"><button type="button" class="button button-outline" id="shareQuizBtn">Share result ↗</button><button type="button" class="button button-primary" id="replayQuizBtn">Play again ↻</button></div>`);
    $('#shareQuizBtn').addEventListener('click', () => shareText(`I got ${score}/${total} in VibeJolt Emoji Decode and earned the title “${title}” ${emoji} Can you beat me?`));
    $('#replayQuizBtn').addEventListener('click', renderEmojiGame);
  }

  function renderDNAResult() {
    const result = groupTypes[Math.floor(Math.random() * groupTypes.length)];
    openModal('Your group’s official vibe', 'FRIENDSHIP SCIENCE · 100% UNVERIFIED', `${gameHeader('dna', 'Group DNA')}<p class="game-intro">The highly questionable science of friendship has produced a result...</p><div class="dna-result-card"><div class="dna-result-emoji">${result.emoji}</div><div class="dna-overline">YOUR FRIEND GROUP TYPE</div><h3>${escapeHTML(result.title)}</h3><p>${escapeHTML(result.detail)}</p><div style="display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:17px">${state.players.slice(0,4).map((person) => `<span class="player-pill">${escapeHTML(person)}</span>`).join('')}</div></div><div class="game-actions"><button type="button" class="button button-outline" id="rerollDNA">Reroll vibe ↻</button><button type="button" class="button button-primary" id="shareDNA">Share the verdict ↗</button></div>`);
    $('#rerollDNA').addEventListener('click', renderDNAResult);
    $('#shareDNA').addEventListener('click', () => shareText(`Our VibeJolt friend group type is “${result.title}” ${result.emoji} ${result.detail}`));
  }

  async function shareText(text) {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'VibeJolt — One Link. Endless Laughs.', text });
      } else {
        await copyText(text, 'Share text copied! Send it to your group chat.');
      }
    } catch (error) {
      if (error && error.name !== 'AbortError') copyText(text, 'Share text copied! Send it to your group chat.');
    }
  }

  function bindEvents() {
    ['#headerCreateBtn', '#heroCreateBtn', '#stripCreateBtn', '#bottomCreateBtn'].forEach((selector) => $(selector).addEventListener('click', openCreateRoom));
    $('#joinRoomBtn').addEventListener('click', openJoinRoom);
    $('#heroExploreBtn').addEventListener('click', () => $('#games').scrollIntoView({ behavior: 'smooth' }));
    $$('.text-button[data-game]').forEach((button) => button.addEventListener('click', () => openGame(button.dataset.game)));
    $('#modalClose').addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal(); });
    $('#year').textContent = new Date().getFullYear();
  }

  readSavedState();
  bindEvents();
})();
