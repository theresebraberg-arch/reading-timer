const sparkles = document.getElementById("sparkles");

for (let i = 0; i < 25; i++) {
  let s = document.createElement("div");
  s.className = "sparkle";
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 100 + "%";
  sparkles.appendChild(s);
}

let minutes = 20;
let time;
let interval;

document.querySelectorAll(".time-btn").forEach(btn => {
  btn.onclick = () => {
    minutes = btn.dataset.minutes;
  }
});

function format(s){
  let m = Math.floor(s/60);
  let sec = s%60;
  return `${m}:${sec}`;
}

document.getElementById("startBtn").onclick = () => {
  time = minutes * 60;

  document.getElementById("setupScreen").classList.remove("active");
  document.getElementById("timerScreen").classList.add("active");

  interval = setInterval(() => {
    time--;
    document.getElementById("timerDisplay").innerText = format(time);
  },1000);
};
