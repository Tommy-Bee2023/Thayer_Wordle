import words from '../data/words';
import kreyol from '../data/kreyol';
import paw from '../img/logo2.png';

(() => {

  const WORD_LENGTH = 5;
  const MAX_ROW_NUM = 6;
  const result = document.querySelector('.result');

  let answer;
  let row = 1;
  let col = 1;
  let currWord = '';

  init();

  function getWordIndex() {

    return Math.floor((new Date() - new Date('04/06/2022')) / 86400000) % (Object.keys(kreyol).length);

  }

  function init() {

    answer = kreyol[getWordIndex()];

    window.addEventListener("keydown", keyPressed);

    const onScreenKeys = document.querySelectorAll('.keyboard-key');
    onScreenKeys.forEach(key => {
      key.addEventListener('click', onScreenKeyClicked);

      key.addEventListener('touchstart', () => {
        document.querySelector('html').style.overflowY = 'hidden';
      });

      key.addEventListener('touchend', () => {
        document.querySelector('html').style.overflowY = 'scroll';
      });

    });

    showInfo();
    const infoButton = document.querySelector('.info-icon');
    infoButton.addEventListener('click', showInfo);

    const statsButton = document.querySelector('.stats-icon');
    statsButton.addEventListener('click', showStats);
    setInterval(updateTime, 1000);

    const shareButton = document.querySelector('.share-button');
    shareButton.addEventListener('click', copyToClipboard);

    retrieveStorage();

  }

  function storageAvailable(type) {
    let storage;
    try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    }
    catch(e) {
      return e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        (storage && storage.length !== 0);
    }
  }

  function retrieveStorage() {
    if (storageAvailable('localStorage')) {

      if (localStorage.getItem('gamesPlayed') === null) {
        localStorage.setItem('winCount', '0');
        localStorage.setItem('gamesPlayed', '0');
        localStorage.setItem('distribution', JSON.stringify(['0', '0', '0', '0', '0', '0']));
      }

      if (localStorage.getItem('prevAnswer') === null || localStorage.getItem('prevAnswer') !== answer) {
        localStorage.setItem('prevAnswer', answer);
        localStorage.setItem('prevRow','1');
        localStorage.setItem('prevLetters', JSON.stringify([]));
        localStorage.setItem('counted', JSON.stringify(false));
        localStorage.setItem('gameWin', JSON.stringify(false));
      } else {
        const letters = JSON.parse(localStorage.getItem("prevLetters"));
        for (const word of letters) {
          if (word !== undefined) {
            checkWord(word);
          }
        }
      }
    }
  }

  function showInfo() {
    hideStats();
    document.querySelector('.info').classList.remove('invisible');
    setTimeout(() => {
      window.addEventListener('click', hideInfo);
    }, 200);
  }

  function hideInfo() {
    const info = document.querySelector('.info');
    if (!info.classList.contains('invisible')) {
      info.classList.add('invisible');
    }
    window.removeEventListener('click', hideInfo);
  }

  function removeKeyBoardDetection() {
    window.removeEventListener("keydown", keyPressed);
    const onScreenKeys = document.querySelectorAll('.keyboard-key');
    onScreenKeys.forEach(key => {
      key.removeEventListener('click', onScreenKeyClicked);
    });
  }

  function onScreenKeyClicked(e) {
    keyPressed(e.target.getAttribute('data-key'));
  }

  function showAnswer() {
    result.querySelector('.word').textContent = answer;
    result.classList.remove('invisible');
  }

  function formatCountDownTime() {

    const date = new Date();
    const hours = date.getHours();
    const minute = date.getMinutes();
    const seconds = date.getSeconds();

    const leftHours = 23 - hours;
    const leftMinute = 59 - minute;
    const leftSecond = 59 - seconds;

    return `${leftHours < 10 ? '0' + leftHours : leftHours}:${leftMinute < 10 ? '0' + leftMinute : leftMinute}:${leftSecond < 10 ? '0' + leftSecond : leftSecond}`;
  }

  function updateTime() {
    const time = document.querySelector('.next-wordle');
    time.textContent = formatCountDownTime();
  }

  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }

  function copyToClipboard() {
    const warning = document.querySelector('.warning');
    if (storageAvailable('localStorage') && !JSON.parse(localStorage.getItem('counted'))) {
      warning.textContent = "You haven't completed the wordle yet!";
      warning.classList.remove('invisible');
      setTimeout(() => {
        warning.classList.add('invisible');
      }, 1500);
    } else {
      copyTextToClipboard(formatClipboard());
      warning.textContent = "Copied to clipboard!";
      warning.classList.remove('invisible');
      setTimeout(() => {
        warning.classList.add('invisible');
      }, 1500);
    }
  }

  function formatClipboard() {
    if (storageAvailable('localStorage') && !JSON.parse(localStorage.getItem('counted'))) {
      throw new Error('Not counted yet');
    }

    let result = (JSON.parse(localStorage.getItem('gameWin')))?
                    `Kreyol Wordle ${getWordIndex()} ${row}/6`
                        : `Kreyol Wordle ${getWordIndex()} X/6`;

    for (let r = 1; r <= row; r++) {

      result += '\n';

      const row = document.querySelector(`.row-${r}`);

      for (let c = 1; c <= WORD_LENGTH; c++) {
        const cell = row.querySelector(`.col-${c}`);

        if (cell.classList.contains('correct')) {
          result += '🟦';
        } else if (cell.classList.contains('present')) {
          result += '🟨';
        } else {
          result += '⬜';
        }
      }

    }

    return result;

  }

  function showStats() {

    hideInfo();

    const stats = document.querySelector('.stats');
    const gamesPlayed = localStorage.getItem('gamesPlayed');

    if (parseInt(gamesPlayed) === 0) {
      stats.querySelector('.win-percentage').textContent = '0';
    } else {
      const winCount = localStorage.getItem('winCount');
      stats.querySelector('.win-percentage').textContent = (winCount / gamesPlayed * 100).toFixed(1);
    }

    stats.querySelector('.games-played').textContent = gamesPlayed;

    const distribution = JSON.parse(localStorage.getItem('distribution'));
    let max = 0;
    for (let i = 0; i < MAX_ROW_NUM; i++) {
      const rowNum = i + 1;
      if (distribution[i] > max) max = distribution[i];
      document.querySelector(`.distribution-bar[data-key="${rowNum}"]`).textContent = distribution[i];
    }

    for (let i = 0; i < MAX_ROW_NUM; i++) {
      const rowNum = i + 1;
      document.querySelector(`.distribution-bar[data-key="${rowNum}"]`).style.width = (distribution[i] / max * 100).toFixed(1) + '%';
    }

    stats.classList.remove('invisible');

    setTimeout(() => {
      window.addEventListener('click', hideStats);
    }, 200);
  }

  function hideStats(e = new Event('click')) {

    if (e.target === document.querySelector('.share-button')) {
      return;
    }

    const stats = document.querySelector('.stats');
    if (!stats.classList.contains('invisible')) {
      stats.classList.add('invisible');
    }
    window.removeEventListener('click', hideStats);
  }

  function gameWin() {
    removeKeyBoardDetection();
    showAnswer();

    if (storageAvailable('localStorage') && JSON.parse(localStorage.getItem('counted')) === false) {
      localStorage.setItem('winCount', (parseInt(localStorage.getItem('winCount')) + 1).toString());
      localStorage.setItem('gamesPlayed', (parseInt(localStorage.getItem('gamesPlayed')) + 1).toString());

      const distribution = JSON.parse(localStorage.getItem('distribution'));
      distribution[row - 1] = parseInt(distribution[row - 1]) + 1;
      localStorage.setItem('distribution', JSON.stringify(distribution));

      localStorage.setItem('counted', JSON.stringify(true));
    }

    if (storageAvailable('localStorage')) {
      localStorage.setItem('gameWin', JSON.stringify(true));
    }

    showStats();
  }

  function gameLost() {
    removeKeyBoardDetection();
    showAnswer();

    if (storageAvailable('localStorage') && JSON.parse(localStorage.getItem('counted')) === false) {
      localStorage.setItem('gamesPlayed', (parseInt(localStorage.getItem('gamesPlayed')) + 1).toString());
      localStorage.setItem('counted', JSON.stringify(true));
      localStorage.setItem('gameWin', JSON.stringify(false));
    }

    showStats();
  }

  function flipWord(word) {

    const answerArray = answer.split('');
    const filled = [];

    for (let i = 0; i < word.length; i++) {
      filled.push(false);
    }

    const rowNodeList = document.querySelector(`.row-${row}`);
    for (let col = 1; col <= word.length; col++) {
      const node = rowNodeList.querySelector(`.col-${col}`);
      node.textContent = word[col - 1].toUpperCase();
    }

    for (let i = 0; i < word.length; i++) {
      const col = i + 1;
      const letter = word[i];
      if (letter === answerArray[i]) {
        answerArray[i] = "";
        filled[i] = true;
        const cell = document.querySelector(`.row-${row}`).querySelector(`.col-${col}`);
        cell.classList.add('correct');
        // cell.style.backgroundImage = `url(${paw})`;
        cell.style.backgroundSize = '60%';
        cell.style.backgroundRepeat = 'no-repeat';
        cell.style.backgroundPosition = 'center';

        const key = document.querySelector(`.keyboard-key[data-key="${letter.toUpperCase()}"]`);
        key.classList.remove('present');
        if (!key.classList.contains('correct')) {
          key.classList.add('correct');
        }
      }
    }

    for (let i = 0; i < word.length; i++) {
      const col = i + 1;
      const letter = word[i];
      if (!filled[i] && answerArray.includes(letter)) {
        answerArray[answerArray.indexOf(letter)] = "";
        filled[i] = true;
        document.querySelector(`.row-${row}`).querySelector(`.col-${col}`).classList.add('present');

        const key = document.querySelector(`.keyboard-key[data-key="${letter.toUpperCase()}"]`);
        if (!key.classList.contains('correct') && !key.classList.contains('present')) {
          key.classList.add('present');
        }
      }
    }

    for (let i = 0; i < word.length; i++) {
      const col = i + 1;
      const letter = word[i];
      if (filled[i] === false) {
        document.querySelector(`.row-${row}`).querySelector(`.col-${col}`).classList.add('incorrect');

        const key = document.querySelector(`.keyboard-key[data-key="${letter.toUpperCase()}"]`);
        if (!key.classList.contains('correct') && !key.classList.contains('present') && !key.classList.contains('incorrect')) {
          key.classList.add('incorrect');
        }
      }
    }

  }

  function checkWord(word) {

    flipWord(word);

    if (word === answer) gameWin();
    else {

      row++;
      col = 1;
      currWord = "";

      if (row > MAX_ROW_NUM) gameLost();

    }

  }

  function keyPressed(e) {

    const key = (e instanceof KeyboardEvent) ? e.key.toLowerCase() : e.toLowerCase();

    if (key === "enter" && col === WORD_LENGTH + 1) {

      if (currWord in words) {
        if (storageAvailable('localStorage')){
          const prevLetters = JSON.parse(localStorage.getItem('prevLetters'));
          prevLetters.push(currWord);
          localStorage.setItem('prevLetters', JSON.stringify(prevLetters));
          localStorage.setItem('prevRow', (row + 1).toString());
        }
        checkWord(currWord);
      }
      else {
        const warning = document.querySelector('.warning');
        warning.textContent = "Word not found";
        warning.classList.remove('invisible');
        setTimeout(() => {
          warning.classList.add('invisible');
        }, 500);
      }

    } else if (key === "backspace" && col > 1) {

      currWord = currWord.slice(0, -1);
      document.querySelector(`.row-${row}`).querySelector(`.col-${--col}`).textContent = "";

    } else if (col <= WORD_LENGTH && key.match(/^[a-pr-wyzòè]$/)) {

      currWord += key;
      document.querySelector(`.row-${row}`).querySelector(`.col-${col++}`).textContent = key.toUpperCase();

    }
  }

})();
