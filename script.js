const timeButtons = document.querySelectorAll(".time-btn");
const startBtn = document.getElementById("startBtn");
const setupScreen = document.getElementById("setupScreen");
const timerScreen = document.getElementById("timerScreen");
const timerDisplay = document.getElementById("timerDisplay");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const readingLabel = document.getElementById("readingLabel");
const sessionLabel = document.getElementById("sessionLabel");
const sparklesContainer = document.getElementById("sparkles");
const themeToggle = document.getElementById("themeToggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

let selectedMinutes = 20;
let totalSeconds = selectedMinutes * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let isPaused = false;
let wakeLock = null;

function createSparkles() {
  sparklesContainer.innerHTML = "";

  for (let i = 0; i < 22; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    sparkle.style.left = Math.random() * 100 + "%";
    sparkle.style.top = Math.random() * 100 + "%";
    sparkle.style.animationDuration =
      (4 + Math.random() * 4) + "s, " + (2 + Math.random() * 3) + "s";
    sparkle.style.animationDelay =
      (Math.random() * 4) + "s, " + (Math.random() * 3) + "s";
    sparkle.style.transform = `scale(${0.6 + Math.random() * 0.9})`;
    sparklesContainer.appendChild(sparkle);
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  document.title = `${formatTime(remainingSeconds)} • Reading Timer`;
}

function selectDefaultButton() {
  timeButtons.forEach(btn => {
    btn.classList.toggle("selected", Number(btn.dataset.minutes) === selectedMinutes);
  });
}

function updateThemeButton() {
  const darkModeOn = document.body.classList.contains("dark-mode");
  themeToggle.textContent = darkModeOn ? "☀️" : "🌙";
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", darkModeOn ? "#2b1d46" : "#dbc5ff");
  }
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("readingTimerTheme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  updateThemeButton();
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("readingTimerTheme", isDark ? "dark" : "light");
  updateThemeButton();
});

timeButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedMinutes = Number(button.dataset.minutes);
    totalSeconds = selectedMinutes * 60;
    remainingSeconds = totalSeconds;
    selectDefaultButton();
  });
});

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        console.log("Wake lock släppt.");
      });
    }
  } catch (error) {
    console.log("Wake lock kunde inte aktiveras:", error);
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch (error) {
      console.log("Kunde inte släppa wake lock:", error);
    }
    wakeLock = null;
  }
}

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && timerInterval && !isPaused) {
    await requestWakeLock();
  }
});

function playFinishSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    const notes = [880, 1174, 1568];

    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, now + index * 0.18);

      gainNode.gain.setValueAtTime(0.0001, now + index * 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + index * 0.18 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.22);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now + index * 0.18);
      oscillator.stop(now + index * 0.18 + 0.24);
    });
  } catch (error) {
    console.log("Kunde inte spela ljud:", error);
  }
}

function finishTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerDisplay.textContent = "KLAR";
  timerDisplay.classList.add("finished");
  readingLabel.textContent = "Din lässtund är slut ✨";
  pauseBtn.style.display = "none";
  releaseWakeLock();
  playFinishSound();

  try {
    if (navigator.vibrate) {
      navigator.vibrate([300, 150, 300]);
    }
  } catch (e) {
    console.log(e);
  }
}

function startTimer() {
  clearInterval(timerInterval);
  isPaused = false;
  pauseBtn.textContent = "Pausa";

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateDisplay();

    if (remainingSeconds <= 0) {
      finishTimer();
    }
  }, 1000);
}

startBtn.addEventListener("click", async () => {
  totalSeconds = selectedMinutes * 60;
  remainingSeconds = totalSeconds;
  sessionLabel.textContent = `${selectedMinutes} min lässtund`;
  readingLabel.textContent = "Nu läser vi 📖";
  timerDisplay.classList.remove("finished");
  pauseBtn.style.display = "inline-block";

  updateDisplay();
  setupScreen.classList.remove("active");
  timerScreen.classList.add("active");

  await requestWakeLock();
  startTimer();
});

pauseBtn.addEventListener("click", async () => {
  if (!timerInterval && !isPaused) return;

  if (!isPaused) {
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = true;
    pauseBtn.textContent = "Fortsätt";
    readingLabel.textContent = "Pausad";
    await releaseWakeLock();
  } else {
    isPaused = false;
    pauseBtn.textContent = "Pausa";
    readingLabel.textContent = "Nu läser vi 📖";
    await requestWakeLock();
    startTimer();
  }
});

resetBtn.addEventListener("click", async () => {
  clearInterval(timerInterval);
  timerInterval = null;
  isPaused = false;
  await releaseWakeLock();

  remainingSeconds = selectedMinutes * 60;
  updateDisplay();
  timerDisplay.classList.remove("finished");
  setupScreen.classList.add("active");
  timerScreen.classList.remove("active");
  pauseBtn.textContent = "Pausa";
  pauseBtn.style.display = "inline-block";
  document.title = "Reading Timer";
});

applySavedTheme();
createSparkles();
selectDefaultButton();
updateDisplay();
