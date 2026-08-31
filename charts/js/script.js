const createChartBtn = document.querySelector("#create-chart-btn");
const chartSetupModal = document.querySelector("#chartSetupModal");
const closeChartModalBtn = document.querySelector("#closeChartModalBtn");
const ACTIVE_CHART_ID_KEY = "chromatuneActiveChartId";
const CHART_MODE_KEY = "chromatuneChartMode";

function openChartModal() {
  if (!chartSetupModal) {
    return;
  }

  chartSetupModal.classList.add("open");
  chartSetupModal.setAttribute("aria-hidden", "false");
  chartSetupModal.style.display = "flex";
}

function closeChartModal() {
  if (!chartSetupModal) {
    return;
  }

  chartSetupModal.classList.remove("open");
  chartSetupModal.setAttribute("aria-hidden", "true");
  chartSetupModal.style.display = "none";
}

if (chartSetupModal) {
  closeChartModal();
}

if (createChartBtn) {
  createChartBtn.addEventListener("click", openChartModal);
}

if (closeChartModalBtn) {
  closeChartModalBtn.addEventListener("click", closeChartModal);
}

if (chartSetupModal) {
  chartSetupModal.addEventListener("click", (event) => {
    if (event.target === chartSetupModal) {
      closeChartModal();
    }
  });
}

export function setActiveChartId(chartId) {
  localStorage.setItem(ACTIVE_CHART_ID_KEY, chartId);
}

export function openChartEditor(chartId, mode = "view") {
  setActiveChartId(chartId);
  localStorage.setItem(CHART_MODE_KEY, mode);
  window.location.href = "./chart-editor.html";
}

function deleteChart(chartId) {
  const charts = getSavedCharts().filter((chart) => chart.id !== chartId);
  localStorage.setItem("chromatuneCharts", JSON.stringify(charts));
  renderCharts();
}

function closeChartMenus() {
  document.querySelectorAll(".chart-menu-wrap.open").forEach((menu) => {
    menu.classList.remove("open");
  });
}

export function createCard(data) {
  const article = document.createElement("article");
  const chart = {
    id: data.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    songTitle: data.songTitle || "Untitled Project",
    bpm: data.bpm ?? 120,
    timeSignature: data.timeSignature || "4/4",
    key: data.key || "A min",
    date: data.date || new Date().toLocaleDateString("en-GB")
  };

  article.classList.add("chart-card");
  article.innerHTML = `
    <div class="chart-card-header">
      <span class="chart-date">${chart.date}</span>
      <div class="chart-menu-wrap">
        <button class="chart-menu" type="button" aria-label="Chart options" aria-expanded="false">•••</button>
        <div class="chart-menu-dropdown" role="menu">
          <button type="button" data-action="edit" role="menuitem">Edit</button>
          <button type="button" data-action="delete" role="menuitem">Delete</button>
        </div>
      </div>
    </div>
    <h3>${chart.songTitle}</h3>
    <div class="chart-metrics">
      <span class="metric"><span class="metric-label">BPM</span> ${chart.bpm}</span>
      <span class="metric"><span class="metric-label">TIME</span> ${chart.timeSignature}</span>
      <span class="metric"><span class="metric-label">KEY</span> ${chart.key}</span>
    </div>
  `;

  article.addEventListener("click", (event) => {
    if (event.target.closest(".chart-menu-wrap")) {
      return;
    }

    closeChartMenus();
    openChartEditor(chart.id, "view");
  });

  const menuWrap = article.querySelector(".chart-menu-wrap");
  const menuButton = article.querySelector(".chart-menu");
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menuWrap.classList.toggle("open");
    closeChartMenus();
    if (isOpen) {
      menuWrap.classList.add("open");
    }
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  menuWrap.querySelector('[data-action="edit"]').addEventListener("click", (event) => {
    event.stopPropagation();
    openChartEditor(chart.id, "edit");
  });

  menuWrap.querySelector('[data-action="delete"]').addEventListener("click", (event) => {
    event.stopPropagation();
    deleteChart(chart.id);
  });

  return article;
}

export function getSavedCharts() {
  try {
    const savedCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "[]");
    return Array.isArray(savedCharts) ? savedCharts : [];
  } catch (error) {
    console.error("Unable to read saved charts:", error);
    return [];
  }
}

export function renderCharts() {
  const container = document.querySelector(".saved-charts-container");

  if (!container) {
    return;
  }

  const charts = getSavedCharts();
  container.innerHTML = "";
  container.classList.toggle("empty-state", charts.length === 0);

  if (charts.length === 0) {
    const placeholder = document.createElement("p");
    placeholder.classList.add("empty-state-message");
    placeholder.textContent = "No saved charts yet";
    container.appendChild(placeholder);
    return;
  }

  charts.forEach((chart) => {
    container.appendChild(createCard(chart));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderCharts);
} else {
  renderCharts();
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".chart-menu-wrap")) {
    closeChartMenus();
  }
});