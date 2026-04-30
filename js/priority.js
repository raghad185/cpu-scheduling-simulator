//member 3 Gantt diagram

function drawGantt(gantt, barsId, ticksId) {
    const scale = 40; // width of 1 time unit in pixels
    const barsEl= document.getElementById(barsId);
    const ticksEl = document.getElementById(ticksId);
    barsEl.innerHTML = "";
    ticksEl.innerHTML = "";

  // draw bars
gantt.forEach(g => {
    const width = (g.end - g.start) * scale;
    const bar = document.createElement("div");
    bar.style.width = width + "px";
    bar.style.height = "50px";
    bar.style.background = g.id === "Idle" ? "#ccc" : getColor(g.id);
    bar.style.display = "inline-flex";
    bar.style.alignItems = "center";
    bar.style.justifyContent = "center";
    bar.style.fontSize = "13px";
    bar.style.borderRight = "2px solid white";
    bar.textContent = g.id;
    barsEl.appendChild(bar);
});

  // draw timeline numbers
const totalTime = gantt[gantt.length - 1].end;
for (let t = 0; t <= totalTime; t++) {
    const tick = document.createElement("div");
    tick.style.width = scale + "px";
    tick.style.fontSize = "11px";
    tick.textContent = t;
    ticksEl.appendChild(tick);
}
}

// give each process a different color
function getColor(id) {
const colors = {
    P1: "#B5D4F4",
    P2: "#9FE1CB",
    P3: "#FAC775",
    P4: "#F4C0D1",
    P5: "#CECBF6",
};
return colors[id] || "#ddd";
}
