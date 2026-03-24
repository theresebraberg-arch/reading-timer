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

let selectedMinutes = 20;
let totalSeconds = selectedMinutes * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let isPaused = false;
let wakeLock = null;

function createSparkles() {
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

function startTimer() {
  clearInterval(timerInterval);
  isPaused = false;
  pauseBtn.textContent = "Pausa";

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerDisplay.textContent = "KLAR";
      timerDisplay.classList.add("finished");
      readingLabel.textContent = "Din lässtund är slut ✨";
      pauseBtn.style.display = "none";
      releaseWakeLock();

      try {
        if (navigator.vibrate) {
          navigator.vibrate([300, 150, 300]);
        }
      } catch (e) {}
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

createSparkles();
selectDefaultButton();
updateDisplay();
