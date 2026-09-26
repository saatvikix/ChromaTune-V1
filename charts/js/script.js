// Storage keys
const ACTIVE_CHART_ID_KEY = "chromatuneActiveChartId";
const CHART_MODE_KEY = "chromatuneChartMode";
const CHARTS_KEY = "chromatuneCharts";

// Helper: Generate unique ID
function generateId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Helper: Toggle chartForm visibility
function toggleFormVisibility(chartForm, isOpen) {
  if (!chartForm) return;
  chartForm.classList.toggle("open", isOpen);
  chartForm.style.display = isOpen ? "flex" : "none";
}

// Query DOM elements
const createChartBtn = document.querySelector("#create-chart-btn");
const chartForm = document.querySelector("#chartForm");
const formCloseButton = document.querySelector("#formCloseButton");

// Initialize form
toggleFormVisibility(chartForm, false);

// chartForm event listeners
createChartBtn?.addEventListener("click", () => {
  toggleFormVisibility(chartForm, true)
});

formCloseButton?.addEventListener("click", () => {
  toggleFormVisibility(chartForm, false)
});

// chartForm?.addEventListener("click", (event) => {
//   if (event.target === chartForm) {
//     toggleFormVisibility(chartForm, false);
//   }
// });

// Helper: Read charts from localStorage
function getSavedCharts() {
  try {
    const savedCharts = JSON.parse(localStorage.getItem(CHARTS_KEY) || "[]");
    return Array.isArray(savedCharts) ? savedCharts : [];
  } catch (error) {
    console.error("Unable to read saved charts:", error);
    return [];
  }
}

// Navigate to chart editor
export function openChartEditor(chartId, mode = "view") {
  localStorage.setItem(ACTIVE_CHART_ID_KEY, chartId);
  localStorage.setItem(CHART_MODE_KEY, mode);
  window.location.href = "./chart-editor.html";
}

// Delete chart from storage and refresh display
function deleteChart(chartId) {
  const charts = getSavedCharts().filter((chart) => chart.id !== chartId);
  localStorage.setItem(CHARTS_KEY, JSON.stringify(charts));
  renderCharts();
}

// Close all open chart menus
function closeChartMenus() {
  document.querySelectorAll(".chart-menu-wrap.open").forEach((menu) => {
    menu.classList.remove("open");
  });
}

// Create a chart card element
export function createCard(data) {
  const article = document.createElement("article");
  const chart = {
    id: data.id || generateId(),
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

  // Open chart in view mode when clicked
  article.addEventListener("click", (event) => {
    if (event.target.closest(".chart-menu-wrap")) return;
    closeChartMenus();
    openChartEditor(chart.id, "view");
  });

  // Setup menu button
  const menuWrap = article.querySelector(".chart-menu-wrap");
  const menuButton = article.querySelector(".chart-menu");
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeChartMenus();
    menuWrap.classList.add("open");
    menuButton.setAttribute("aria-expanded", "true");
  });

  // Setup menu actions
  article.querySelector('[data-action="edit"]').addEventListener("click", (event) => {
    event.stopPropagation();
    openChartEditor(chart.id, "edit");
  });

  article.querySelector('[data-action="delete"]').addEventListener("click", (event) => {
    event.stopPropagation();
    deleteChart(chart.id);
  });

  return article;
}

// Render all saved charts to the page
export function renderCharts() {
  const container = document.querySelector(".saved-charts-container");
  if (!container) return;

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

// Render charts when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderCharts);
} else {
  renderCharts();
}

// Close menus when clicking outside
document.addEventListener("click", (event) => {
  if (!event.target.closest(".chart-menu-wrap")) {
    closeChartMenus();
  }
});