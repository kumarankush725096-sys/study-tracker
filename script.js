/* =====================================================
    STUDYTRACK
    Student Syllabus Tracker
===================================================== */

/* ================= DEFAULT DATA (Blank Slate + Gamification) ================= */
const defaultData = {
    user: {
        name: "",
        email: ""
    },
    streak: {
        count: 1,
        lastActiveDate: ""
    },
    subjects: [],
    tasks: []
};

/* ================= LOAD DATA ================= */
let data = JSON.parse(
    localStorage.getItem("studyTrackData")
) || defaultData;

let dark = localStorage.getItem("studyTrackDark") === "1";

/* ================= SAVE DATA ================= */
function save() {
    localStorage.setItem(
        "studyTrackData",
        JSON.stringify(data)
    );
    render();
}

/* ================= STREAK SYSTEM ================= */
function checkDailyStreak() {
    const today = todayISO();
    if (!data.streak) {
        data.streak = { count: 1, lastActiveDate: today };
    } else if (data.streak.lastActiveDate !== today) {
        const lastDate = new Date(data.streak.lastActiveDate || today);
        const currentDate = new Date(today);
        const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            data.streak.count += 1;
        } else if (diffDays > 1) {
            data.streak.count = 1;
        }
        data.streak.lastActiveDate = today;
    }
    document.getElementById("streakCount").textContent = data.streak.count;
}

/* ================= CHECK USER LOGIN ================= */
function checkUserLogin() {
    if (!data.user || !data.user.name) {
        openLoginModal();
    } else {
        updateUserProfileDisplay();
    }
}

function openLoginModal() {
    if (data.user && data.user.name) {
        document.getElementById("loginNameInput").value = data.user.name;
        document.getElementById("loginEmailInput").value = data.user.email || "";
    } else {
        document.getElementById("loginNameInput").value = "";
        document.getElementById("loginEmailInput").value = "";
    }
    openModal("loginModal");
}

document.getElementById("saveLoginBtn").onclick = () => {
    const name = document.getElementById("loginNameInput").value.trim();
    const email = document.getElementById("loginEmailInput").value.trim();

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    data.user = { name, email };
    closeModal("loginModal");
    checkDailyStreak();
    save();
    updateUserProfileDisplay();
};

function updateUserProfileDisplay() {
    if (data.user && data.user.name) {
        document.getElementById("userNameDisplay").textContent = data.user.name;
        const initials = data.user.name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        document.getElementById("userAvatar").textContent = initials || "S";
        
        document.getElementById("welcomeGreeting").textContent = `Welcome back, ${data.user.name.split(" ")[0]} 👋`;
    }
}

/* ================= SUBJECT PERCENTAGE ================= */
function pct(subject) {
    if (!subject.topics || subject.topics.length === 0) {
        return 0;
    }
    const completed = subject.done.filter(Boolean).length;
    return Math.round(completed / subject.topics.length * 100);
}

/* ================= OVERALL PERCENTAGE ================= */
function overall() {
    let total = 0;
    let completed = 0;

    data.subjects.forEach(subject => {
        total += subject.topics.length;
        completed += subject.done.filter(Boolean).length;
    });

    if (total === 0) {
        return 0;
    }

    return Math.round(completed / total * 100);
}

/* ================= SECURITY / HTML ================= */
function esc(value) {
    return String(value).replace(
        /[&<>"']/g,
        character => {
            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };
            return map[character];
        }
    );
}

/* ================= MAIN RENDER ================= */
function render() {
    /* ---------- DARK MODE ---------- */
    document.body.classList.toggle("dark", dark);
    document.getElementById("themeBtn").innerHTML = `<span>◐</span> ${dark ? "Light mode" : "Dark mode"}`;

    /* ---------- STREAK CHECK ---------- */
    checkDailyStreak();

    /* ---------- CALCULATIONS ---------- */
    const overallPercentage = overall();
    let totalTopics = 0;
    let completedTopics = 0;

    data.subjects.forEach(subject => {
        totalTopics += subject.topics.length;
        completedTopics += subject.done.filter(Boolean).length;
    });

    /* ---------- DASHBOARD ---------- */
    document.getElementById("overallProgress").textContent = overallPercentage + "%";
    document.getElementById("overallBar").style.width = overallPercentage + "%";
    document.getElementById("subjectCount").textContent = data.subjects.length;
    document.getElementById("completedTopics").textContent = completedTopics;
    document.getElementById("topicTotal").textContent = `of ${totalTopics} topics`;
    document.getElementById("pendingTasks").textContent = data.tasks.filter(task => !task.done).length;

    /* ---------- DASHBOARD SUBJECTS WITH TOPICS ---------- */
    document.getElementById("dashboardSubjectsList").innerHTML = data.subjects.length
        ? data.subjects.slice(0, 3).map(dashboardSubjectHTML).join("")
        : `<div class="empty">No subjects added yet. Go to Subjects to add one.</div>`;

    /* ---------- TODAY TASKS ---------- */
    const pendingTasks = data.tasks.filter(task => !task.done).slice(0, 4);
    document.getElementById("todayTasks").innerHTML = pendingTasks.length
        ? pendingTasks.map(taskHTML).join("")
        : `<div class="empty">No pending tasks 🎉</div>`;

    /* ---------- SUBJECT CARDS ---------- */
    document.getElementById("subjectsGrid").innerHTML = data.subjects.length
        ? data.subjects.map(subjectHTML).join("")
        : `<div class="empty">Add your first subject to begin building your syllabus.</div>`;

    /* ---------- TASK LIST ---------- */
    document.getElementById("taskList").innerHTML = data.tasks.length
        ? data.tasks.map(taskHTML).join("")
        : `<div class="empty">No tasks yet.</div>`;

    /* ---------- STUDY PLAN ---------- */
    renderPlan();

    /* ---------- ALL PROGRESS & BADGES ---------- */
    document.getElementById("allProgressList").innerHTML = data.subjects.length
        ? data.subjects.map(progressHTML).join("")
        : `<div class="empty">No subjects yet.</div>`;

    renderBadges(overallPercentage);

    /* ---------- CIRCLE ---------- */
    document.getElementById("circleValue").textContent = overallPercentage + "%";
    document.getElementById("circleProgress").style.background = `conic-gradient(var(--accent) ${overallPercentage * 3.6}deg, var(--surface2) 0deg)`;

    /* ---------- PROGRESS MESSAGE ---------- */
    let headline = "Let's get started.";
    if (overallPercentage === 100) {
        headline = "Syllabus completed! 🎉";
    } else if (overallPercentage >= 75) {
        headline = "You're almost there!";
    } else if (overallPercentage >= 40) {
        headline = "Great progress. Keep pushing!";
    }
    document.getElementById("progressHeadline").textContent = headline;

    /* ---------- DATE ---------- */
    document.getElementById("todayDate").textContent = new Date().toLocaleDateString(
        undefined,
        { weekday: "short", month: "short", day: "numeric" }
    );

    /* ---------- SUBJECT SELECT ---------- */
    const subjectSelect = document.getElementById("taskSubject");
    subjectSelect.innerHTML = data.subjects.length
        ? data.subjects.map(subject => `<option>${esc(subject.name)}</option>`).join("")
        : `<option value="">No subjects available</option>`;
}

/* ================= PROGRESS HTML ================= */
function progressHTML(subject) {
    const percentage = pct(subject);
    return `
        <div class="subject-progress">
            <div class="progress-row">
                <span>${esc(subject.name)}</span>
                <span>${percentage}%</span>
            </div>
            <div class="bar">
                <i style="width:${percentage}%"></i>
            </div>
        </div>
    `;
}

/* ================= DASHBOARD SUBJECT WITH TOPICS HTML ================= */
function dashboardSubjectHTML(subject) {
    const percentage = pct(subject);
    return `
        <div class="subject-progress-container">
            <div class="subject-progress">
                <div class="progress-row">
                    <span>${esc(subject.name)}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="bar">
                    <i style="width:${percentage}%"></i>
                </div>
            </div>
            <div class="dashboard-topics-list">
                ${subject.topics.map((topic, index) => `
                    <label class="dashboard-topic-item ${subject.done[index] ? "completed" : ""}">
                        <input type="checkbox" ${subject.done[index] ? "checked" : ""} onchange="toggleTopic(${subject.id}, ${index})">
                        <span>${esc(topic)}</span>
                    </label>
                `).join("")}
            </div>
        </div>
    `;
}

/* ================= RENDER BADGES ================= */
function renderBadges(pctVal) {
    const badges = [
        { icon: "🌱", title: "Getting Started", desc: "Add your first subject", unlocked: data.subjects.length > 0 },
        { icon: "🥉", title: "Bronze Scholar", desc: "Reach 25% completion", unlocked: pctVal >= 25 },
        { icon: "🥈", title: "Silver Mind", desc: "Reach 50% completion", unlocked: pctVal >= 50 },
        { icon: "🥇", title: "Gold Master", desc: "Reach 100% completion", unlocked: pctVal === 100 && totalTopics > 0 }
    ];

    document.getElementById("badgesGrid").innerHTML = badges.map(b => `
        <div class="badge-item ${b.unlocked ? "unlocked" : ""}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-title">${b.title}</div>
            <div class="badge-desc">${b.desc}</div>
        </div>
    `).join("");
}

/* ================= TASK HTML ================= */
function taskHTML(task) {
    return `
        <div class="task-item">
            <button class="check ${task.done ? "done" : ""}" onclick="toggleTask(${task.id})">
                ${task.done ? "✓" : ""}
            </button>
            <div class="task-info">
                <div class="task-title ${task.done ? "done-text" : ""}">
                    ${esc(task.title)}
                </div>
                <div class="task-meta">
                    ${esc(task.subject || "General")}
                    ${task.date ? ` · Due ${formatDate(task.date)}` : ""}
                </div>
            </div>
            <button class="delete" onclick="deleteTask(${task.id})">×</button>
        </div>
    `;
}

/* ================= SUBJECT HTML ================= */
function subjectHTML(subject) {
    return `
        <div class="subject-card">
            <div class="subject-head">
                <div>
                    <h4>${esc(subject.name)}</h4>
                    <p class="muted">${pct(subject)}% complete · ${subject.topics.length} topics</p>
                </div>
                <button class="subject-menu" onclick="deleteSubject(${subject.id})">×</button>
            </div>
            <div class="bar" style="margin-bottom:10px">
                <i style="width:${pct(subject)}%"></i>
            </div>
            ${subject.topics.map((topic, index) => `
                <label class="topic ${subject.done[index] ? "completed" : ""}">
                    <input type="checkbox" ${subject.done[index] ? "checked" : ""} onchange="toggleTopic(${subject.id}, ${index})">
                    <span>${esc(topic)}</span>
                </label>
            `).join("")}
        </div>
    `;
}

/* ================= STUDY PLAN ================= */
function renderPlan() {
    const tasks = [...data.tasks].filter(task => task.date).sort((a, b) => a.date.localeCompare(b.date));
    document.getElementById("planList").innerHTML = tasks.length
        ? tasks.map(task => `
            <div class="plan-item">
                <div>
                    <div class="task-title ${task.done ? "done-text" : ""}">${esc(task.title)}</div>
                    <div class="task-meta">${esc(task.subject || "General")}</div>
                </div>
                <span class="date-badge ${!task.done && task.date < todayISO() ? "overdue" : ""}">
                    ${formatDate(task.date)}
                </span>
            </div>
        `).join("")
        : `<div class="empty">No dated tasks. Add tasks with deadlines to see your study plan.</div>`;
}

/* ================= POMODORO FOCUS TIMER ================= */
let timerInterval = null;
let timeLeft = 25 * 60;
let isTimerRunning = false;
let isStudyMode = true;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timerDisplay").textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function toggleTimer() {
    const btn = document.getElementById("timerToggleBtn");
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.textContent = "Resume Focus";
    } else {
        isTimerRunning = true;
        btn.textContent = "Pause";
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                alert(isStudyMode ? "Focus session complete! Take a 5-minute break." : "Break over! Back to studying.");
                isStudyMode = !isStudyMode;
                timeLeft = isStudyMode ? 25 * 60 : 5 * 60;
                document.getElementById("timerModeTag").textContent = isStudyMode ? "Study Session" : "Break Time";
                btn.textContent = "Start Focus";
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    isStudyMode = true;
    timeLeft = 25 * 60;
    document.getElementById("timerModeTag").textContent = "Study Session";
    document.getElementById("timerToggleBtn").textContent = "Start Focus";
    updateTimerDisplay();
}

/* ================= DATE ================= */
function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
    if (!date) return "";
    return new Date(date + "T00:00:00").toLocaleDateString(
        undefined,
        { day: "2-digit", month: "short", year: "numeric" }
    );
}

/* ================= PAGE NAVIGATION ================= */
function showPage(page) {
    document.querySelectorAll(".page").forEach(pageElement => pageElement.classList.remove("active-page"));
    document.getElementById(page).classList.add("active-page");
    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });
    document.getElementById("pageTitle").textContent = page.charAt(0).toUpperCase() + page.slice(1);
    document.getElementById("sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================= NAV BUTTONS ================= */
document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.onclick = () => {
        showPage(button.dataset.page);
    };
});

/* ================= MOBILE MENU ================= */
document.getElementById("menuBtn").onclick = () => {
    document.getElementById("sidebar").classList.toggle("open");
};

/* ================= DARK MODE ================= */
document.getElementById("themeBtn").onclick = () => {
    dark = !dark;
    localStorage.setItem("studyTrackDark", dark ? "1" : "0");
    render();
};

/* ================= RESET ================= */
document.getElementById("resetBtn").onclick = () => {
    if (confirm("Reset all syllabus, user data, and tasks?")) {
        data = JSON.parse(JSON.stringify(defaultData));
        save();
        checkUserLogin();
    }
};

/* ================= MODALS ================= */
function openModal(id) {
    document.getElementById(id).classList.add("open");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}

/* ================= ADD SUBJECT ================= */
document.getElementById("addSubjectBtn").onclick = () => {
    openModal("subjectModal");
};

/* ================= ADD TASK ================= */
document.getElementById("addTaskBtn").onclick = () => {
    openTaskModal();
};

function openTaskModal() {
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDate").value = todayISO();
    openModal("taskModal");
}

/* ================= SAVE SUBJECT ================= */
document.getElementById("saveSubjectBtn").onclick = () => {
    const name = document.getElementById("subjectName").value.trim();
    const topics = document.getElementById("subjectTopics").value
        .split("\n")
        .map(topic => topic.trim())
        .filter(Boolean);

    if (!name || !topics.length) {
        alert("Please enter a subject name and at least one topic.");
        return;
    }

    data.subjects.push({
        id: Date.now(),
        name: name,
        topics: topics,
        done: topics.map(() => false)
    });

    document.getElementById("subjectName").value = "";
    document.getElementById("subjectTopics").value = "";
    closeModal("subjectModal");
    save();
};

/* ================= SAVE TASK ================= */
document.getElementById("saveTaskBtn").onclick = () => {
    const title = document.getElementById("taskTitle").value.trim();
    if (!title) {
        alert("Please enter a task.");
        return;
    }

    data.tasks.push({
        id: Date.now(),
        title: title,
        subject: document.getElementById("taskSubject").value,
        date: document.getElementById("taskDate").value,
        done: false
    });

    closeModal("taskModal");
    save();
};

/* ================= TOPIC TOGGLE ================= */
function toggleTopic(subjectId, topicIndex) {
    const subject = data.subjects.find(item => item.id === subjectId);
    if (subject) {
        subject.done[topicIndex] = !subject.done[topicIndex];
        save();
    }
}

/* ================= DELETE SUBJECT ================= */
function deleteSubject(id) {
    if (confirm("Delete this subject and all its topics?")) {
        data.subjects = data.subjects.filter(subject => subject.id !== id);
        save();
    }
}

/* ================= TASK TOGGLE ================= */
function toggleTask(id) {
    const task = data.tasks.find(item => item.id === id);
    if (task) {
        task.done = !task.done;
        save();
    }
}

/* ================= DELETE TASK ================= */
function deleteTask(id) {
    data.tasks = data.tasks.filter(task => task.id !== id);
    save();
}

/* ================= MOTIVATIONAL SLIDER ================= */
const motivationalQuotes = [
    "“The secret of getting ahead is getting started. Break down your complex syllabus into tiny, manageable steps.”",
    "“Consistency is what transforms average effort into exceptional achievement. Keep checking off those topics!”",
    "“Excellence is not an act, but a habit. Show up for your code and your books every single day.”",
    "“Don't watch the clock; do what it does. Keep going, your future self will thank you for today's focus.”",
    "“Success is the sum of small efforts, repeated day in and day out. You're building something great.”",
    "“Push yourself, because no one else is going to do it for you. Master your concepts, ace those exams!”"
];

let currentQuoteIndex = 0;

function startMotivationSlider() {
    const quoteContainer = document.getElementById("quoteText");
    if (!quoteContainer) return;

    quoteContainer.textContent = motivationalQuotes[currentQuoteIndex];

    setInterval(() => {
        const slideElement = document.getElementById("quoteContainer");
        if (!slideElement) return;

        slideElement.classList.remove("active");

        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % motivationalQuotes.length;
            quoteContainer.textContent = motivationalQuotes[currentQuoteIndex];
            slideElement.classList.add("active");
        }, 400);

    }, 10000);
}

startMotivationSlider();

/* ================= START APP ================= */
checkUserLogin();
updateTimerDisplay();
render();