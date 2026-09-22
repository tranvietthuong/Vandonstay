let currentMonth = "01 January";
let currentDayIndex = 0;
let currentMode = "MP3";
let isPlaying = false;
let showTrans = false;

let practiceCount = 1;
let totalSentences = 0;

let targetRepeatCount = 1;
let currentRepeatIndex = 0;
let currentSpeedVal = 1.0;

let aiCurrentSentenceIdx = 0;
let isAiInterrupted = false;
let modalSelectedMonth = "01 January";

const ALL_MONTHS = [
  { key: "01 January", title: "Tháng 1", prefix: "A01" },
  { key: "02 February", title: "Tháng 2", prefix: "A02" },
  { key: "03 March", title: "Tháng 3", prefix: "A03" },
  { key: "04 April", title: "Tháng 4", prefix: "A04" },
  { key: "05 May", title: "Tháng 5", prefix: "A05" },
  { key: "06 June", title: "Tháng 6", prefix: "A06" },
  { key: "07 July", title: "Tháng 7", prefix: "A07" },
  { key: "08 August", title: "Tháng 8", prefix: "A08" },
  { key: "09 September", title: "Tháng 9", prefix: "A09" },
  { key: "10 October", title: "Tháng 10", prefix: "A10" },
  { key: "11 November", title: "Tháng 11", prefix: "A11" },
  { key: "12 December", title: "Tháng 12", prefix: "A12" }
];

const selectMonth = document.getElementById("selectMonth");
const selectDay = document.getElementById("selectDay");
const imgDisplay = document.getElementById("imgDisplay");
const storyTitle = document.getElementById("storyTitle");
const textContent = document.getElementById("textContent");
const audioElement = document.getElementById("audioElement");

const btnToggleMode = document.getElementById("btnToggleMode");
const aiToolBar = document.getElementById("aiToolBar");
const btnPracticeCount = document.getElementById("btnPracticeCount");
const lblCount = document.getElementById("lblCount");
const btnToggleTrans = document.getElementById("btnToggleTrans");

const btnOpenIndex = document.getElementById("btnOpenIndex");
const btnCloseIndex = document.getElementById("btnCloseIndex");
const indexModal = document.getElementById("indexModal");
const indexListContainer = document.getElementById("indexListContainer");
const modalTitle = document.getElementById("modalTitle");

const btnPlay = document.getElementById("btnPlay");
const iconPlay = document.getElementById("iconPlay");
const iconPause = document.getElementById("iconPause");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");

const btnRepeat = document.getElementById("btnRepeat");
const menuRepeat = document.getElementById("menuRepeat");
const lblRepeat = document.getElementById("lblRepeat");

const btnSpeed = document.getElementById("btnSpeed");
const menuSpeed = document.getElementById("menuSpeed");
const lblSpeed = document.getElementById("lblSpeed");

function initDayList() {
  selectDay.innerHTML = "";
  const list = (typeof STORIES_DATA !== "undefined" && STORIES_DATA[currentMonth]) ? STORIES_DATA[currentMonth] : [];

  if (list.length === 0) {
    const opt = document.createElement("option");
    opt.value = 0;
    opt.textContent = "Chưa có bài";
    selectDay.appendChild(opt);
    storyTitle.textContent = "Đang cập nhật dữ liệu...";
    textContent.innerHTML = "<div style='color:var(--text-muted);text-align:center;padding:15px;'>Dữ liệu tháng này chưa được nạp.</div>";
    imgDisplay.src = "";
    return;
  }

  list.forEach((item, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `Bài ${String(item.day).padStart(2, "0")}`;
    selectDay.appendChild(opt);
  });
}

function loadStory(idx) {
  const list = (typeof STORIES_DATA !== "undefined" && STORIES_DATA[currentMonth]) ? STORIES_DATA[currentMonth] : [];
  if (!list || list.length === 0) {
    storyTitle.textContent = "Đang cập nhật dữ liệu...";
    textContent.innerHTML = "<div style='color:var(--text-muted);text-align:center;padding:15px;'>Chưa có dữ liệu bài học.</div>";
    imgDisplay.src = "";
    return;
  }

  currentDayIndex = idx;
  stopAll();

  const story = list[idx];
  imgDisplay.src = story.image;

  imgDisplay.onerror = function () {
    this.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D'400'%20height%3D'200'%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'%230c241b'%2F%3E%3Ctext%20x%3D'50%25'%20y%3D'50%25'%20fill%3D'%2334d399'%20font-size%3D'13'%20text-anchor%3D'middle'%20dy%3D'.3em'%3EChưa có ảnh%3C%2Ftext%3E%3C%2Fsvg%3E";
  };

  storyTitle.textContent = `Bài ${story.day}: ${story.title}`;

  // Tự động chuẩn hóa đường dẫn file Audio theo chuẩn thư mục
  let audioPath = story.audio;
  if (!audioPath) {
    const mObj = ALL_MONTHS.find(m => m.key === currentMonth);
    const prefix = mObj ? mObj.prefix : "A01";
    const dayStr = String(story.day).padStart(2, "0");
    audioPath = `${currentMonth}/audio/${prefix}${dayStr} ${story.title}.mp3`;
  }
  audioElement.src = audioPath;

  totalSentences = story.sentences.length;
  practiceCount = 1;
  updatePracticeBtnLabel();

  renderSentences();
  selectDay.value = idx;
}

function renderSentences() {
  textContent.innerHTML = "";
  const list = (typeof STORIES_DATA !== "undefined" && STORIES_DATA[currentMonth]) ? STORIES_DATA[currentMonth] : [];
  if (!list[currentDayIndex]) return;

  const story = list[currentDayIndex];

  story.sentences.forEach((sObj, sIdx) => {
    const isSelectedInAI = currentMode === "AI" && sIdx < practiceCount;
    const block = document.createElement("div");
    block.className = "sentence-block" + (isSelectedInAI ? " in-practice" : "");
    block.dataset.index = sIdx;

    const enDiv = document.createElement("div");
    enDiv.className = "sentence-en";
    const words = sObj.en.split(" ");
    words.forEach((w) => {
      if (w.trim() === "") return;
      const span = document.createElement("span");
      span.className = "word-unit";
      span.textContent = w + " ";
      enDiv.appendChild(span);
    });
    block.appendChild(enDiv);

    const shouldShow = showTrans && (currentMode === "MP3" || isSelectedInAI);
    if (shouldShow) {
      if (sObj.ipa) {
        const ipaDiv = document.createElement("div");
        ipaDiv.className = "sentence-ipa";
        ipaDiv.textContent = sObj.ipa;
        block.appendChild(ipaDiv);
      }
      if (sObj.vi) {
        const viDiv = document.createElement("div");
        viDiv.className = "sentence-vi";
        viDiv.textContent = sObj.vi;
        block.appendChild(viDiv);
      }
    }
    textContent.appendChild(block);
  });
}

function updatePracticeBtnLabel() {
  lblCount.textContent = practiceCount === totalSentences ? `Tất cả (${totalSentences} câu)` : `${practiceCount} câu`;
}

if (selectMonth) {
  selectMonth.addEventListener("change", (e) => {
    currentMonth = e.target.value;
    initDayList();
    loadStory(0);
  });
}

selectDay.addEventListener("change", (e) => loadStory(parseInt(e.target.value)));

btnPracticeCount.addEventListener("click", () => {
  if (practiceCount < totalSentences) practiceCount++;
  else practiceCount = 1;
  updatePracticeBtnLabel();
  renderSentences();
  stopAll();
});

btnToggleTrans.addEventListener("click", () => {
  showTrans = !showTrans;
  btnToggleTrans.classList.toggle("active", showTrans);
  renderSentences();
});

function renderIndexModal() {
  indexListContainer.innerHTML = "";
  modalTitle.textContent = "Mục Lục 12 Tháng";

  const monthGrid = document.createElement("div");
  monthGrid.className = "index-month-grid";

  ALL_MONTHS.forEach((m) => {
    const list = (typeof STORIES_DATA !== "undefined" && STORIES_DATA[m.key]) ? STORIES_DATA[m.key] : [];
    const btn = document.createElement("button");
    btn.className = "month-tab-btn" + (m.key === modalSelectedMonth ? " active" : "");
    btn.textContent = `${m.title} (${list.length > 0 ? list.length : 0})`;

    btn.addEventListener("click", () => {
      modalSelectedMonth = m.key;
      renderIndexModal();
    });
    monthGrid.appendChild(btn);
  });
  indexListContainer.appendChild(monthGrid);

  const daysContainer = document.createElement("div");
  daysContainer.className = "index-days-grid";

  const activeList = (typeof STORIES_DATA !== "undefined" && STORIES_DATA[modalSelectedMonth]) ? STORIES_DATA[modalSelectedMonth] : [];

  if (activeList.length > 0) {
    activeList.forEach((item, idx) => {
      const isCurrentDay = (modalSelectedMonth === currentMonth && idx === currentDayIndex);
      const itemDiv = document.createElement("div");
      itemDiv.className = "index-item" + (isCurrentDay ? " current" : "");
      itemDiv.innerHTML = `
        <div>
          <span class="index-day-badge">Bài ${String(item.day).padStart(2, "0")}</span>
          <span class="index-item-title">${item.title}</span>
        </div>
        <span style="color:var(--text-muted); font-size: 0.8rem;">➔</span>
      `;
      itemDiv.addEventListener("click", () => {
        currentMonth = modalSelectedMonth;
        if (selectMonth) selectMonth.value = modalSelectedMonth;
        initDayList();
        loadStory(idx);
        indexModal.classList.add("hidden");
      });
      daysContainer.appendChild(itemDiv);
    });
  } else {
    daysContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:0.9rem;">Nội dung tháng này đang được hoàn thiện.</div>`;
  }

  indexListContainer.appendChild(daysContainer);
}

btnOpenIndex.addEventListener("click", () => {
  modalSelectedMonth = currentMonth;
  renderIndexModal();
  indexModal.classList.remove("hidden");
});

btnCloseIndex.addEventListener("click", () => indexModal.classList.add("hidden"));
indexModal.addEventListener("click", (e) => {
  if (e.target === indexModal) indexModal.classList.add("hidden");
});

function playMP3() {
  audioElement.playbackRate = currentSpeedVal;
  audioElement.play().catch((err) => console.log("Lỗi phát audio:", err));
  setPlayState(true);
}

audioElement.onended = () => {
  currentRepeatIndex++;
  if (currentRepeatIndex < targetRepeatCount) {
    audioElement.currentTime = 0;
    audioElement.play();
  } else {
    currentRepeatIndex = 0;
    setPlayState(false);
  }
};

function playAI() {
  if (!("speechSynthesis" in window)) {
    alert("Trình duyệt không hỗ trợ đọc giọng nói Web Speech!");
    return;
  }
  isAiInterrupted = false;
  aiCurrentSentenceIdx = 0;
  speakAiNextSentence();
  setPlayState(true);
}

function speakAiNextSentence() {
  if (isAiInterrupted) return;

  const list = STORIES_DATA[currentMonth];
  if (!list || !list[currentDayIndex]) return;

  const sentences = list[currentDayIndex].sentences;
  const maxSentences = Math.min(practiceCount, sentences.length);

  if (aiCurrentSentenceIdx >= maxSentences) {
    clearAiHighlights();
    currentRepeatIndex++;
    if (currentRepeatIndex < targetRepeatCount) {
      aiCurrentSentenceIdx = 0;
      setTimeout(() => {
        if (!isAiInterrupted) speakAiNextSentence();
      }, 500);
    } else {
      currentRepeatIndex = 0;
      setPlayState(false);
    }
    return;
  }

  highlightAiSentence(aiCurrentSentenceIdx);

  const sText = sentences[aiCurrentSentenceIdx].en;
  const utter = new SpeechSynthesisUtterance(sText);
  utter.lang = "en-US";
  utter.rate = currentSpeedVal;

  utter.onend = function () {
    if (isAiInterrupted) return;
    aiCurrentSentenceIdx++;
    speakAiNextSentence();
  };

  utter.onerror = function () {
    if (isAiInterrupted) return;
    aiCurrentSentenceIdx++;
    speakAiNextSentence();
  };

  window.speechSynthesis.speak(utter);
}

function highlightAiSentence(idx) {
  clearAiHighlights();
  const targetBlock = document.querySelector(`.sentence-block[data-index="${idx}"]`);
  if (targetBlock) {
    targetBlock.classList.add("ai-speaking");
    targetBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function clearAiHighlights() {
  document.querySelectorAll(".sentence-block.ai-speaking").forEach((el) => {
    el.classList.remove("ai-speaking");
  });
}

function togglePlay() {
  if (isPlaying) {
    if (currentMode === "MP3") audioElement.pause();
    else {
      isAiInterrupted = true;
      window.speechSynthesis.cancel();
    }
    setPlayState(false);
  } else {
    if (currentMode === "MP3") playMP3();
    else playAI();
  }
}

function stopAll() {
  audioElement.pause();
  audioElement.currentTime = 0;
  isAiInterrupted = true;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  clearAiHighlights();
  currentRepeatIndex = 0;
  setPlayState(false);
}

function setPlayState(playing) {
  isPlaying = playing;
  if (playing) {
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
  } else {
    iconPlay.classList.remove("hidden");
    iconPause.classList.add("hidden");
  }
}

btnToggleMode.addEventListener("click", () => {
  stopAll();
  if (currentMode === "MP3") {
    currentMode = "AI";
    btnToggleMode.className = "btn-ctrl btn-mode ai";
    btnToggleMode.innerHTML = `<span class="icon">🗣️</span><span class="txt">AI</span>`;
    aiToolBar.classList.remove("hidden");
  } else {
    currentMode = "MP3";
    btnToggleMode.className = "btn-ctrl btn-mode mp3";
    btnToggleMode.innerHTML = `<span class="icon">🎵</span><span class="txt">MP3</span>`;
    aiToolBar.classList.add("hidden");
  }
  renderSentences();
});

btnPlay.addEventListener("click", togglePlay);

btnRepeat.addEventListener("click", (e) => {
  e.stopPropagation();
  menuSpeed.classList.add("hidden");
  menuRepeat.classList.toggle("hidden");
});

btnSpeed.addEventListener("click", (e) => {
  e.stopPropagation();
  menuRepeat.classList.add("hidden");
  menuSpeed.classList.toggle("hidden");
});

menuRepeat.querySelectorAll(".dropup-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    menuRepeat.querySelectorAll(".dropup-item").forEach((el) => el.classList.remove("active"));
    item.classList.add("active");
    targetRepeatCount = parseInt(item.dataset.val);
    lblRepeat.textContent = targetRepeatCount === 999 ? "∞" : targetRepeatCount;
    menuRepeat.classList.add("hidden");
  });
});

menuSpeed.querySelectorAll(".dropup-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    menuSpeed.querySelectorAll(".dropup-item").forEach((el) => el.classList.remove("active"));
    item.classList.add("active");
    currentSpeedVal = parseFloat(item.dataset.val);
    lblSpeed.textContent = currentSpeedVal + "x";
    audioElement.playbackRate = currentSpeedVal;
    menuSpeed.classList.add("hidden");
    if (isPlaying) {
      stopAll();
      togglePlay();
    }
  });
});

document.addEventListener("click", () => {
  menuRepeat.classList.add("hidden");
  menuSpeed.classList.add("hidden");
});

btnPrev.addEventListener("click", () => {
  if (currentDayIndex > 0) loadStory(currentDayIndex - 1);
});

btnNext.addEventListener("click", () => {
  const list = STORIES_DATA[currentMonth] || [];
  if (currentDayIndex < list.length - 1) loadStory(currentDayIndex + 1);
});

initDayList();
loadStory(0);