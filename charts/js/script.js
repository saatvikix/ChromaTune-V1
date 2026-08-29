const createChartBtn = document.querySelector("#create-chart-btn");

if (createChartBtn) {
  createChartBtn.addEventListener("click", () => {
    window.location.href = "./create-chart-form.html";
  });
}

export function createCard(data) {
  const article = document.createElement("article");
  const chart = {
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
      <button class="chart-menu" aria-label="Chart options">•••</button>
    </div>
    <h3>${chart.songTitle}</h3>
    <div class="chart-metrics">
      <span class="metric"><span class="metric-label">BPM</span> ${chart.bpm}</span>
      <span class="metric"><span class="metric-label">TIME</span> ${chart.timeSignature}</span>
      <span class="metric"><span class="metric-label">KEY</span> ${chart.key}</span>
    </div>
  `;

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

  if (charts.length === 0) {
    const placeholder = document.createElement("article");
    placeholder.classList.add("chart-card");
    placeholder.innerHTML = `
      <div class="chart-card-header">
        <span class="chart-date">--</span>
        <button class="chart-menu" aria-label="Chart options">•••</button>
      </div>
      <h3>No saved charts yet</h3>
      <div class="chart-metrics">
        <span class="metric"><span class="metric-label">BPM</span> --</span>
        <span class="metric"><span class="metric-label">TIME</span> --</span>
      </div>
    `;
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