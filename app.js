const STORAGE_KEY = "pointify-state-v1";

const categories = {
  eating: { label: "Eating", color: "#cf5a3a" },
  exercising: { label: "Exercise", color: "#2f8f5b" },
  studying: { label: "Study", color: "#1f7a8c" }
};

const starterActivities = [
  { id: makeId(), name: "Balanced meal", category: "eating", points: 10 },
  { id: makeId(), name: "Workout", category: "exercising", points: 25 },
  { id: makeId(), name: "Deep study block", category: "studying", points: 20 }
];

const state = loadState();

const elements = {
  dateInput: document.querySelector("#log-date"),
  goalInput: document.querySelector("#goal-input"),
  activityForm: document.querySelector("#activity-form"),
  activityName: document.querySelector("#activity-name"),
  activityCategory: document.querySelector("#activity-category"),
  activityPoints: document.querySelector("#activity-points"),
  activityButtons: document.querySelector("#activity-buttons"),
  activityList: document.querySelector("#activity-list"),
  logList: document.querySelector("#log-list"),
  selectedDayTitle: document.querySelector("#selected-day-title"),
  personalBest: document.querySelector("#personal-best"),
  bestDay: document.querySelector("#best-day"),
  todayTotal: document.querySelector("#today-total"),
  weekAverage: document.querySelector("#week-average"),
  streak: document.querySelector("#streak"),
  eatingTotal: document.querySelector("#eating-total"),
  exercisingTotal: document.querySelector("#exercising-total"),
  studyingTotal: document.querySelector("#studying-total"),
  chartRange: document.querySelector("#chart-range"),
  dailyChart: document.querySelector("#daily-chart"),
  categoryChart: document.querySelector("#category-chart"),
  historyBody: document.querySelector("#history-body")
};

elements.dateInput.value = todayKey();
elements.goalInput.value = state.dailyGoal;

elements.activityForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = elements.activityName.value.trim();
  const category = elements.activityCategory.value;
  const points = Number.parseInt(elements.activityPoints.value, 10);

  if (!name || !category || !Number.isFinite(points) || points <= 0) {
    return;
  }

  const activity = {
    id: makeId(),
    name,
    category,
    points
  };

  state.activities.push(activity);
  addLogEntry(activity);
  elements.activityForm.reset();
  elements.activityCategory.value = category;
  saveAndRender();
});

elements.goalInput.addEventListener("change", () => {
  const goal = Number.parseInt(elements.goalInput.value, 10);
  state.dailyGoal = Number.isFinite(goal) && goal > 0 ? goal : 60;
  elements.goalInput.value = state.dailyGoal;
  saveAndRender();
});

elements.dateInput.addEventListener("change", render);
elements.chartRange.addEventListener("change", render);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      dailyGoal: 60,
      activities: starterActivities,
      logs: {}
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      dailyGoal: parsed.dailyGoal || 60,
      activities: Array.isArray(parsed.activities) && parsed.activities.length
        ? parsed.activities
        : starterActivities,
      logs: parsed.logs || {}
    };
  } catch {
    return {
      dailyGoal: 60,
      activities: starterActivities,
      logs: {}
    };
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  const selectedDate = elements.dateInput.value || todayKey();
  const selectedEntries = getEntriesForDate(selectedDate);
  const selectedTotals = getTotals(selectedEntries);
  const allDays = getAllDaySummaries();
  const best = getPersonalBest(allDays);

  elements.selectedDayTitle.textContent = formatDayTitle(selectedDate);
  elements.personalBest.textContent = best.total;
  elements.bestDay.textContent = best.date ? formatDate(best.date) : "No logs yet";
  elements.todayTotal.textContent = getTotals(getEntriesForDate(todayKey())).total;
  elements.weekAverage.textContent = getAverageForRange(7);
  elements.streak.textContent = getGoalStreak();
  elements.eatingTotal.textContent = selectedTotals.eating;
  elements.exercisingTotal.textContent = selectedTotals.exercising;
  elements.studyingTotal.textContent = selectedTotals.studying;

  renderActivityButtons();
  renderActivityList();
  renderLogList(selectedDate, selectedEntries);
  renderHistory(allDays);
  drawDailyChart();
  drawCategoryChart(selectedTotals);
}

function renderActivityButtons() {
  elements.activityButtons.innerHTML = "";

  state.activities.slice(0, 6).forEach(activity => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `${escapeHtml(activity.name)}<span>${categories[activity.category].label} - ${activity.points} pts</span>`;
    button.addEventListener("click", () => {
      addLogEntry(activity);
      saveAndRender();
    });
    elements.activityButtons.append(button);
  });
}

function renderActivityList() {
  elements.activityList.innerHTML = "";

  state.activities.forEach(activity => {
    const item = document.createElement("li");
    item.className = "activity-item";
    item.innerHTML = `
      <div>
        <span class="item-title">${escapeHtml(activity.name)}</span>
        <span class="item-meta">${categories[activity.category].label}</span>
      </div>
      <span class="point-pill">${activity.points} pts</span>
      <button class="delete-button" type="button" aria-label="Delete ${escapeHtml(activity.name)}">Delete</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.activities = state.activities.filter(saved => saved.id !== activity.id);
      saveAndRender();
    });
    elements.activityList.append(item);
  });
}

function renderLogList(date, entries) {
  elements.logList.innerHTML = "";

  if (!entries.length) {
    elements.logList.innerHTML = `<li class="empty-state">No points logged for this date yet.</li>`;
    return;
  }

  entries.forEach(entry => {
    const item = document.createElement("li");
    item.className = "log-item";
    item.innerHTML = `
      <div>
        <span class="item-title">${escapeHtml(entry.name)}</span>
        <span class="item-meta">${categories[entry.category].label}</span>
      </div>
      <span class="point-pill">${entry.points} pts</span>
      <button class="delete-button" type="button" aria-label="Remove ${escapeHtml(entry.name)} from log">Remove</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.logs[date] = getEntriesForDate(date).filter(saved => saved.id !== entry.id);
      saveAndRender();
    });
    elements.logList.append(item);
  });
}

function renderHistory(allDays) {
  elements.historyBody.innerHTML = "";

  getDateRange(14).reverse().forEach(date => {
    const summary = allDays.find(day => day.date === date) || {
      date,
      eating: 0,
      exercising: 0,
      studying: 0,
      total: 0
    };
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(summary.date)}</td>
      <td>${summary.eating}</td>
      <td>${summary.exercising}</td>
      <td>${summary.studying}</td>
      <td><strong>${summary.total}</strong></td>
    `;
    elements.historyBody.append(row);
  });
}

function drawDailyChart() {
  const days = getDateRange(Number.parseInt(elements.chartRange.value, 10));
  const summaries = days.map(date => {
    const totals = getTotals(getEntriesForDate(date));
    return { date, total: totals.total };
  });
  const canvas = elements.dailyChart;
  const ctx = getChartContext(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const padding = { top: 26, right: 18, bottom: 44, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(state.dailyGoal, ...summaries.map(day => day.total), 10);

  clearCanvas(ctx, width, height);
  drawGrid(ctx, padding, chartWidth, chartHeight, maxValue, width);

  const goalY = valueToY(state.dailyGoal, maxValue, padding, chartHeight);
  ctx.strokeStyle = "#c48a16";
  ctx.setLineDash([6, 6]);
  line(ctx, padding.left, goalY, width - padding.right, goalY);
  ctx.setLineDash([]);
  label(ctx, `Goal ${state.dailyGoal}`, padding.left + 4, goalY - 8, "#8c6518");

  const step = summaries.length > 1 ? chartWidth / (summaries.length - 1) : chartWidth;
  const points = summaries.map((day, index) => ({
    x: padding.left + step * index,
    y: valueToY(day.total, maxValue, padding, chartHeight),
    date: day.date,
    total: day.total
  }));

  if (points.length) {
    ctx.strokeStyle = "#2f8f5b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }

  points.forEach(point => {
    ctx.fillStyle = point.total >= state.dailyGoal ? "#2f8f5b" : "#cf5a3a";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#667085";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "12px system-ui, sans-serif";
  points.forEach((point, index) => {
    const shouldShow = summaries.length <= 14 || index % 3 === 0 || index === points.length - 1;
    if (shouldShow) {
      ctx.fillText(formatShortDate(point.date), point.x, height - 28);
    }
  });
}

function drawCategoryChart(totals) {
  const canvas = elements.categoryChart;
  const ctx = getChartContext(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const values = Object.keys(categories).map(key => ({
    key,
    label: categories[key].label,
    color: categories[key].color,
    value: totals[key]
  }));
  const maxValue = Math.max(...values.map(item => item.value), 10);
  const barWidth = Math.min(70, (width - 90) / values.length);
  const spacing = (width - barWidth * values.length) / (values.length + 1);
  const baseY = height - 58;
  const chartHeight = height - 96;

  clearCanvas(ctx, width, height);

  values.forEach((item, index) => {
    const x = spacing + index * (barWidth + spacing);
    const barHeight = (item.value / maxValue) * chartHeight;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);

    ctx.fillStyle = "#1f2933";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(item.value, x + barWidth / 2, baseY - barHeight - 8);

    ctx.fillStyle = "#667085";
    ctx.textBaseline = "top";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(item.label, x + barWidth / 2, baseY + 14);
  });

  if (values.every(item => item.value === 0)) {
    ctx.fillStyle = "#667085";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("Log a few activities to see the mix.", width / 2, height / 2);
  }
}

function drawGrid(ctx, padding, chartWidth, chartHeight, maxValue, width) {
  ctx.strokeStyle = "#e3e8ed";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#667085";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "12px system-ui, sans-serif";

  for (let index = 0; index <= 4; index += 1) {
    const value = Math.round((maxValue / 4) * index);
    const y = valueToY(value, maxValue, padding, chartHeight);
    line(ctx, padding.left, y, width - padding.right, y);
    ctx.fillText(value, padding.left - 10, y);
  }

  ctx.strokeStyle = "#bfcbd4";
  line(ctx, padding.left, padding.top, padding.left, padding.top + chartHeight);
  line(ctx, padding.left, padding.top + chartHeight, padding.left + chartWidth, padding.top + chartHeight);
}

function addLogEntry(activity) {
  const date = elements.dateInput.value || todayKey();

  if (!state.logs[date]) {
    state.logs[date] = [];
  }

  state.logs[date].push({
    id: makeId(),
    name: activity.name,
    category: activity.category,
    points: activity.points
  });
}

function getEntriesForDate(date) {
  return Array.isArray(state.logs[date]) ? state.logs[date] : [];
}

function getTotals(entries) {
  return entries.reduce((totals, entry) => {
    totals[entry.category] += entry.points;
    totals.total += entry.points;
    return totals;
  }, { eating: 0, exercising: 0, studying: 0, total: 0 });
}

function getAllDaySummaries() {
  return Object.keys(state.logs).map(date => {
    const totals = getTotals(getEntriesForDate(date));
    return { date, ...totals };
  }).sort((first, second) => first.date.localeCompare(second.date));
}

function getPersonalBest(days) {
  return days.reduce((best, day) => {
    return day.total > best.total ? day : best;
  }, { date: "", total: 0 });
}

function getAverageForRange(length) {
  const days = getDateRange(length);
  const total = days.reduce((sum, date) => sum + getTotals(getEntriesForDate(date)).total, 0);
  return Math.round(total / length);
}

function getGoalStreak() {
  let streak = 0;

  for (const date of getDateRange(365).reverse()) {
    const total = getTotals(getEntriesForDate(date)).total;
    if (total < state.dailyGoal) {
      break;
    }
    streak += 1;
  }

  return streak;
}

function getDateRange(length) {
  const dates = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - length + 1);

  for (let index = 0; index < length; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    dates.push(toDateKey(date));
  }

  return dates;
}

function todayKey() {
  return toDateKey(new Date());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayTitle(dateKey) {
  return dateKey === todayKey() ? "Today" : formatDate(dateKey);
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateKey}T12:00:00`));
}

function getChartContext(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

function valueToY(value, maxValue, padding, chartHeight) {
  return padding.top + chartHeight - (value / maxValue) * chartHeight;
}

function line(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function label(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(text, x, y);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

window.addEventListener("resize", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works online if service worker registration is unavailable.
    });
  });
}
