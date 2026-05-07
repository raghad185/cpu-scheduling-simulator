<!DOCTYPE html>
<html>
<head>
    <title> Gantt Visualization</title>
    <style>
/* CSS Section */

        .gantt-container {
            margin: 20px;
            padding: 15px;
            background-color: #ffffff;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow-x: auto;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);

        }

        .bar-row {
            display: flex;
            margin-bottom: 0px;
        }

        .bar-row div {
            box-sizing: border-box;
            font-weight: bold;
            color: #333;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 50px;
            border-right: 2px solid white;
            flex-shrink: 0;
        }

        .tick-row {
            display: flex;
            border-top: 2px solid #333;
            margin-top: 5px;
        }

        .tick-row div {
            box-sizing: border-box;
            border-left: 1px solid #ccc;
            padding-left: 2px;
            color: #666;
            height: 15px;
            font-size: 11px;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    <!--for the q value-->
    <div style="margin: 20px; padding: 15px; background: #eee; border-radius: 8px;">
    <label for="time-quantum"><strong>Round Robin Time Quantum:</strong> </label>
    <input type="number" id="time-quantum" value="3" min="1" style="width: 50px; padding: 5px;">
    <span style="font-size: 0.9em; color: #666; margin-left: 10px;">(Changes how the RR chart is drawn)</span>
</div>
    <!--for the Scenarios-->
    <div style="margin: 20px;">
    <strong>Select Scenario:</strong>
    <button onclick="loadScenario('A')">A: Mixed Workload</button>
    <button onclick="loadScenario('B')">B: Urgency</button>
    <button onclick="loadScenario('C')">C: Fairness</button>
    <button onclick="loadScenario('D')">D: Starvation</button>
    <button onclick="loadScenario('E')">E: Validation</button>
</div>
    <div id="analysis-box" style="margin: 20px; padding: 15px; background-color: #f9f9f9; border-left: 5px solid #4CAF50; display: none; line-height: 1.6; font-family: sans-serif;">
    <h4 id="scenario-title" style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd;"></h4>
    <p><strong>The Question:</strong> <span id="scenario-question"></span></p>
    
    <div style="display: flex; gap: 20px; margin-top: 10px;">
        <div style="flex: 1; padding: 15px; background: #e3f2fd; border-radius: 5px; border: 1px solid #bbdefb;">
            <h5 style="margin-top: 0; color: #1565c0;">Priority Scheduling</h5>
            <div id="priority-analysis"></div>
        </div>

        <div style="flex: 1; padding: 15px; background: #f1f8e9; border-radius: 5px; border: 1px solid #dcedc8;">
            <h5 style="margin-top: 0; color: #2e7d32;">Round Robin</h5>
            <div id="rr-analysis"></div>
        </div>
    </div>
</div>


    <!--for the Gant drawing-->
<h3>Non-Preemptive Priority Gantt</h3>
<div class="gantt-container">
    <div id="non-pre-bars" class="bar-row"></div>
    <div id="non-pre-ticks" class="tick-row"></div>
</div>

<h3>Preemptive Priority Gantt</h3>
<div class="gantt-container">
    <div id="pre-bars" class="bar-row"></div>
    <div id="pre-ticks" class="tick-row"></div>
</div>

<h3>Round Robin Gantt</h3>
<div class="gantt-container">
    <div id="rr-bars" class="bar-row"></div>
    <div id="rr-ticks" class="tick-row"></div>
</div>

    <script>
    /**
 * Round Robin (RR) Scheduling Algorithm
 * Focuses on fairness by allocating a fixed Time Quantum to each process.
 */

const runRoundRobin = (processes, quantum) => {
    let currentTime = 0;
    let finishedCount = 0;
    const n = processes.length;
    let queue = [];
    let gantt = [];
    let completionTimes = {};

    // Input Validation
    for (let p of processes) {
        if (p.burst <= 0 || p.arrival < 0 || !p.id) {
            throw new Error(`Invalid process data for ID: ${p.id}`);
        }
    }

    // Clone processes and initialize remaining time
    let pClone = processes.map(p => ({
        ...p,
        rem: p.burst
    })).sort((a, b) => a.arrival - b.arrival);

    while (finishedCount < n) {
        // Add newly arrived processes to the Ready Queue
        pClone.forEach(p => {
            if (p.arrival <= currentTime && p.rem > 0 && !queue.includes(p)) {
                queue.push(p);
            }
        });

        if (queue.length === 0) {
            // Handle CPU Idle time
            if (gantt.length > 0 && gantt[gantt.length - 1].id === "Idle") {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: "Idle", start: currentTime, end: currentTime + 1 });
            }
            currentTime++;
            continue;
        }

        // Pick the next process from the queue
        let current = queue.shift();
        let executeTime = Math.min(current.rem, quantum);

        // Record execution in Gantt Chart
        gantt.push({
            id: current.id,
            start: currentTime,
            end: currentTime + executeTime
        });

        // Update system clock and check for arrivals during execution
        for (let i = 0; i < executeTime; i++) {
            currentTime++;
            pClone.forEach(p => {
                if (p.arrival === currentTime && p.rem > 0 && !queue.includes(p) && p !== current) {
                    queue.push(p);
                }
            });
        }
        
        current.rem -= executeTime;

        // If process is not finished, return it to the end of the queue
        if (current.rem > 0) {
            queue.push(current);
        } else {
            completionTimes[current.id] = currentTime;
            finishedCount++;
        }
    }

    return { gantt, completionTimes };
};
/**
 * Priority Scheduling (Preemptive)
 * Rule:
 * Smaller priority number = higher priority
 * Tie-breaking:
 * 1) Lower priority number
 * 2) Earlier arrival time
 * 3) Smaller process ID
 */

const runPriorityPreemptive = (processes) => {
    let currentTime = 0;
    let finishedCount = 0;
    const n = processes.length;

    let gantt = [];
    let completionTimes = {};

    // Validation
    for (let p of processes) {
        if (
            p.burst <= 0 ||
            p.arrival < 0 ||
            p.priority < 0 ||
            !p.id
        ) {
            throw new Error(`Invalid process input: ${JSON.stringify(p)}`);
        }
    }

    // Clone processes,add remaining time
    let remaining = processes.map(p => ({
        ...p,
        rem: p.burst
    }));

    while (finishedCount < n) {
        let available = remaining.filter(
            p => p.arrival <= currentTime && p.rem > 0
        );

        // If CPU is idle
        if (available.length === 0) {
            if (
                gantt.length > 0 &&
                gantt[gantt.length - 1].id === "Idle"
            ) {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({
                    id: "Idle",
                    start: currentTime,
                    end: currentTime + 1
                });
            }

            currentTime++;
            continue;
        }

        // Sort by:
        // 1) Priority
        // 2) Arrival time
        // 3) Process ID
        available.sort((a, b) =>
            a.priority - b.priority ||
            a.arrival - b.arrival ||
            a.id.localeCompare(b.id)
        );

        let current = available[0];

        // Update Gantt chart
        if (
            gantt.length > 0 &&
            gantt[gantt.length - 1].id === current.id
        ) {
            gantt[gantt.length - 1].end++;
        } else {
            gantt.push({
                id: current.id,
                start: currentTime,
                end: currentTime + 1
            });
        }

        // Execute for 1 time unit
        current.rem--;
        currentTime++;

        // Check if finished
        if (current.rem === 0) {
            completionTimes[current.id] = currentTime;
            finishedCount++;
        }
    }

    return {
        gantt,
        completionTimes
    };
};
        // JS Section
        function getColor(id) {
    if (id === "Idle") return "#ccc";
    // This turns "P1" into "1" so the color map works
    const numericId = id.toString().replace("P", "");
    const colors = { 1: "#B5D4F4", 2: "#9FE1CB", 3: "#FAC775", 4: "#F4C0D1", 5: "#CECBF6" };
    return colors[numericId] || "#ddd";
}

        function drawGantt(gantt, barsId, ticksId) {
            if (!gantt || gantt.length === 0) return;
            const scale = 40;
            const barsEl = document.getElementById(barsId);
            const ticksEl = document.getElementById(ticksId);
            barsEl.innerHTML = "";
            ticksEl.innerHTML = "";

            gantt.forEach(g => {
                const width = (g.end - g.start) * scale;
                const bar = document.createElement("div");
                bar.style.width = width + "px";
                bar.style.background = getColor(g.id);
                bar.textContent = g.id;
                barsEl.appendChild(bar);
            });

            const totalTime = gantt[gantt.length - 1].end;
            for (let t = 0; t <= totalTime; t++) {
                const tick = document.createElement("div");
                tick.style.width = scale + "px";
                tick.textContent = t;
                ticksEl.appendChild(tick);
            }
        }

// Scenarios
// DELETE scenarios1. This NEW scenarios object replaces it completely.
const scenarios = {
    A: {
        title: "Scenario A: Normal Workload (Normal)",
        question: "How do algorithms handle a basic 1-2-3 queue?",
        table: [
            { p: "P1", at: 0, bt: 5, prio: 3 },
            { p: "P2", at: 0, bt: 4, prio: 1 },
            { p: "P3", at: 0, bt: 3, prio: 2 }
        ],
        // Priority order: P2(1), P3(2), P1(3)
        nonPre: [{ id: 2, start: 0, end: 4 }, { id: 3, start: 4, end: 7 }, { id: 1, start: 7, end: 12 }],
        pre: [{ id: 2, start: 0, end: 4 }, { id: 3, start: 4, end: 7 }, { id: 1, start: 7, end: 12 }],
        // RR rotation (q=3): P1(3s), P2(3s), P3(3s), P1(2s), P2(1s)
        rr: [
            { id: 1, start: 0, end: 3 }, { id: 2, start: 3, end: 6 }, 
            { id: 3, start: 6, end: 9 }, { id: 1, start: 9, end: 11 }, { id: 2, start: 11, end: 12 }
        ],
        analysis: {
            priority: "Since all arrive at 0, they execute purely by rank: P2 (High) -> P3 (Med) -> P1 (Low).",
            rr: "Every process gets a fair 3s slice. Notice P1 and P2 appear twice because their bursts exceed the quantum."
        }
    },
    B: {
        title: "Scenario B: The Urgency Test (Preemption)",
        question: "P2 (High Prio) arrives at Time 2 while P1 is running. Where does P3 fit?",
        table: [
            { p: "P1", at: 0, bt: 8, prio: 2 },
            { p: "P2", at: 2, bt: 2, prio: 1 },
            { p: "P3", at: 3, bt: 2, prio: 3 }
        ],
        // Non-Preemptive: P1 finishes 8s, then P2 (2s), then P3 (2s)
        nonPre: [{ id: 1, start: 0, end: 8 }, { id: 2, start: 8, end: 10 }, { id: 3, start: 10, end: 12 }],
        // Preemptive: P2 cuts P1 at Time 2, finishes, P1 resumes, finishes, then P3
        pre: [
            { id: 1, start: 0, end: 2 },  // P1 starts
            { id: 2, start: 2, end: 4 },  // P2 cuts in and finishes
            { id: 1, start: 4, end: 10 }, // P1 finishes its remaining 6s
            { id: 3, start: 10, end: 12 } // P3 runs last
        ],
        rr: [{ id: 1, start: 0, end: 3 }, { id: 2, start: 3, end: 5 }, { id: 3, start: 5, end: 7 }, { id: 1, start: 7, end: 12 }],
        analysis: {
            priority: "Preemptive: P1 is kicked out at Time 2 so P2 can finish. P3 waits until both are done.",
            rr: "P2 and P3 enter the queue as they arrive, taking their turns after P1's first slice."
        }
    },
    C: {
        title: "Scenario C: Fairness & Rotation",
        question: "Does the CPU rotate effectively with three processes?",
        table: [
            { p: "P1", at: 0, bt: 6, prio: 1 },
            { p: "P2", at: 0, bt: 6, prio: 2 },
            { p: "P3", at: 0, bt: 6, prio: 3 }
        ],
        nonPre: [{ id: 1, start: 0, end: 6 }, { id: 2, start: 6, end: 12 }, { id: 3, start: 12, end: 18 }],
        pre: [{ id: 1, start: 0, end: 6 }, { id: 2, start: 6, end: 12 }, { id: 3, start: 12, end: 18 }],
        rr: [
            { id: 1, start: 0, end: 3 }, { id: 2, start: 3, end: 6 }, { id: 3, start: 6, end: 9 },
            { id: 1, start: 9, end: 12 }, { id: 2, start: 12, end: 15 }, { id: 3, start: 15, end: 18 }
        ],
        analysis: {
            priority: "P1 hogs the CPU for 6s, then P2, then P3. Low-priority P3 waits a full 12s to start.",
            rr: "ensures fairness by granting every process an equal time quantum of 3 units, cycling through each in order so no process is starved or prioritized over another."
        }
    },
    D: {
        title: "Scenario D: The Starvation Risk",
        question: "Can multiple high-prio tasks block a low-prio task?",
        table: [
            { p: "P1", at: 0, bt: 10, prio: 1 },
            { p: "P2", at: 1, bt: 5, prio: 1 },
            { p: "P3", at: 2, bt: 2, prio: 5 } // Low priority
        ],
        nonPre: [{ id: 1, start: 0, end: 10 }, { id: 2, start: 10, end: 15 }, { id: 3, start: 15, end: 17 }],
        pre: [{ id: 1, start: 0, end: 10 }, { id: 2, start: 10, end: 15 }, { id: 3, start: 15, end: 17 }],
        rr: [
            { id: 1, start: 0, end: 3 }, { id: 2, start: 3, end: 6 }, { id: 3, start: 6, end: 8 },
            { id: 1, start: 8, end: 11 }, { id: 2, start: 11, end: 13 }, { id: 1, start: 13, end: 17 }
        ],
        analysis: {
            priority: "Starvation: P3 is 'trapped' behind P1 and P2 because they both have higher priority.",
            rr: "P3 finishes at Time 8, which is much faster than waiting until Time 15 in the priority charts."
        }
    },
    E: { 
    title: "Scenario E: Validation Case", 
    question: "What happens when invalid process data is submitted to the scheduler?", 
    table: [], nonPre: [], pre: [], rr: [], 
    analysis: { priority: "N/A", rr: "N/A" } 
    }
};


function loadScenario(letter) {
    const data = scenarios[letter];
    const qValue = parseInt(document.getElementById("time-quantum").value) || 3;
    const analysisBox = document.getElementById("analysis-box");

    if (letter === 'E') {
    document.getElementById("scenario-title").innerText = data.title;
    document.getElementById("scenario-question").innerText = data.question;
    document.getElementById("priority-analysis").innerHTML = "<p>⚠️ <strong>Invalid Input:</strong> No processes were submitted. Priority Scheduling requires at least one process with a valid arrival time, burst time, and priority value to begin execution.</p>";
    document.getElementById("rr-analysis").innerHTML = "<p>⚠️ <strong>Invalid Input:</strong> No processes were submitted. Round Robin cannot rotate an empty queue — without any process to schedule, the CPU remains idle and no Gantt chart can be generated.</p>";
    document.getElementById("analysis-box").style.display = "block";
    document.getElementById("non-pre-bars").innerHTML = "";
    document.getElementById("non-pre-ticks").innerHTML = "";
    document.getElementById("pre-bars").innerHTML = "";
    document.getElementById("pre-ticks").innerHTML = "";
    document.getElementById("rr-bars").innerHTML = "";
    document.getElementById("rr-ticks").innerHTML = "";
    return;
}

    if (!data || data.table.length === 0) return;

    // 1. Map Scenario Table to Algorithm Input Format
    // Algorithms expect: id, arrival, burst, priority
    const processesForAlgo = data.table.map(p => ({
        id: p.p,
        arrival: p.at,
        burst: p.bt,
        priority: p.prio
    }));

    // 2. Execute Logic Engines
    const preemptiveResult = runPriorityPreemptive(processesForAlgo);
    const rrResult = runRoundRobin(processesForAlgo, qValue);

    // 3. Build the Process Data Table
    let tableHTML = `
        <table style="width:100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #ddd; text-align: center;">
            <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ddd;">Process</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Arrival</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Burst</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Priority</th>
            </tr>`;
    
    data.table.forEach(row => {
        tableHTML += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.p}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.at}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.bt}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.prio}</td>
            </tr>`;
    });
    tableHTML += `</table>`;

    // 4. Update UI Content
    document.getElementById("scenario-title").innerText = data.title;
    document.getElementById("scenario-question").innerText = data.question;
    
    document.getElementById("priority-analysis").innerHTML = tableHTML + 
        `<p style="margin-top:10px;"><strong>Preemptive Analysis:</strong> ${data.analysis.priority}</p>`;
    
    document.getElementById("rr-analysis").innerHTML = 
        `<p><strong>Round Robin Analysis (q=${qValue}):</strong> ${data.analysis.rr}</p>`;

    analysisBox.style.display = "block";

    // 5. Draw the Live Calculated Gantt Charts
    // Non-Preemptive remains static (or you can add a function for it later)
    drawGantt(data.nonPre, "non-pre-bars", "non-pre-ticks");
    
    // LIVE: Preemptive Priority
    drawGantt(preemptiveResult.gantt, "pre-bars", "pre-ticks");
    
    // LIVE: Round Robin
    drawGantt(rrResult.gantt, "rr-bars", "rr-ticks");
}

// Mock Data 
// 1. Initial Data for the 'Preview' (What users see when they open the page)
const initialProcesses = [
    { p: "P1", at: 0, bt: 5, prio: 2 },
    { p: "P2", at: 2, bt: 2, prio: 1 },
    { p: "P3", at: 4, bt: 3, prio: 3 }
];

// 2. START DRAWING
window.onload = function() {
    // Get the default quantum (usually 3)
    const qValue = parseInt(document.getElementById("time-quantum").value) || 3;

    // Convert to algorithm format
    const previewData = initialProcesses.map(p => ({
        id: p.p,
        arrival: p.at,
        burst: p.bt,
        priority: p.prio
    }));

    // Generate accurate results using your new functions
    const preResult = runPriorityPreemptive(previewData);
    const rrResult = runRoundRobin(previewData, qValue);

    // DRAW initial charts
    // For Non-Preemptive, we can use a hardcoded simple order or a separate function
    const simpleNonPre = [
        { id: "P1", start: 0, end: 5 },
        { id: "P2", start: 5, end: 7 },
        { id: "P3", start: 7, end: 10 }
    ];

    drawGantt(simpleNonPre, "non-pre-bars", "non-pre-ticks");
    drawGantt(preResult.gantt, "pre-bars", "pre-ticks");
    drawGantt(rrResult.gantt, "rr-bars", "rr-ticks");
};
    </script>
    <!--Final Checklist
Visualization: scaling Gantt chart with color-coded processes.

Scenarios: In buttons that simulate Urgency, Fairness, and Starvation.

Mock Data: Done, mockGantt variable that lets you test the UI without waiting for others.-->
</body>
</html> 
