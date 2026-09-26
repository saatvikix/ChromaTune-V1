// Storage and UI constants
const STORAGE_KEY = "chromatuneCharts";
const ACTIVE_CHART_ID_KEY = "chromatuneActiveChartId";
const CHART_MODE_KEY = "chromatuneChartMode";

// Quantization configuration lookup table
const QUANTIZATION_CONFIGS = {
  "1/4": { label: "1/4", quantClass: "quarter", gridClass: "quarterNoteGrid", count: 4 },
  "1/8": { label: "1/8", quantClass: "eighth", gridClass: "eighthNoteGrid", count: 8 },
  "1/16": { label: "1/16", quantClass: "sixteenth", gridClass: "sixteenthNoteGrid", count: 16 }
};

// Query DOM elements
const sectionsCanvas = document.querySelector("#sectionsCanvas");
const addSectionButton = document.querySelector("#addSectionButton");
const sectionModal = document.querySelector("#sectionModal");
const closeSectionModalButton = document.querySelector("#closeSectionModal");
const sectionForm = document.querySelector("#sectionForm");
const sectionTitleInput = document.querySelector("#sectionTitleInput");
const sectionQuantizationInput = document.querySelector("#sectionQuantization");
const saveButton = document.querySelector("#saveButton");

// Initialize chart mode and view state
let chartMode = localStorage.getItem(CHART_MODE_KEY) || "edit";
if (chartMode === "view") {
  document.body.classList.add("view-only");
}

// Get quantization config by value
function getQuantizationConfig(quantization) {
  return QUANTIZATION_CONFIGS[String(quantization || "1/4")] || QUANTIZATION_CONFIGS["1/4"];
}

// Exit editor and return to charts page
function exitEditor() {
  localStorage.removeItem(ACTIVE_CHART_ID_KEY);
  localStorage.removeItem(CHART_MODE_KEY);
  window.location.href = "./charts.html";
}

// Read charts from localStorage
function getSavedCharts() {
  try {
    const rawCharts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(rawCharts) ? rawCharts : [];
  } catch (error) {
    console.error("Unable to read saved charts:", error);
    return [];
  }
}

// Write charts to localStorage
function saveCharts(charts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

// Get the chart currently being edited
function getActiveChart() {
  const chartId = localStorage.getItem(ACTIVE_CHART_ID_KEY);
  const charts = getSavedCharts();
  return charts.find((chart) => chart.id === chartId) || null;
}

// Toggle modal visibility
function toggleSectionModal(isOpen) {
  if (!sectionModal) return;
  sectionModal.classList.toggle("open", isOpen);
  sectionModal.setAttribute("aria-hidden", String(!isOpen));
  if (isOpen && sectionTitleInput) {
    sectionTitleInput.focus();
  }
  if (!isOpen && sectionForm) {
    sectionForm.reset();
  }
}

// Create a single chord cell in a measure
function createMeasureCell(index, chord = "") {
  const cell = document.createElement("div");
  cell.classList.add("chordCell");
  cell.dataset.chord = chord;
  cell.innerHTML = `
    <span class="gridNumber">${index}</span>
    <span class="chordLabel">${chord}</span>
  `;
  return cell;
}

// Create a measure grid with cells and delete button
function createMeasureGrid(quantization, chords = []) {
  const config = getQuantizationConfig(quantization);
  const measure = document.createElement("div");
  measure.classList.add("measure", config.gridClass);

  // Add chord cells
  for (let i = 1; i <= config.count; i += 1) {
    measure.appendChild(createMeasureCell(i, chords[i - 1] || ""));
  }

  // Add delete button
  const deleteBtn = document.createElement("div");
  deleteBtn.classList.add("deleteMeasureBtn");
  deleteBtn.innerText = "X";
  deleteBtn.setAttribute("aria-hidden", "true");
  measure.append(deleteBtn);

  // Edit mode: add hover delete functionality
  if (chartMode !== "view") {
    measure.addEventListener("pointerenter", () => measure.classList.add("delete-ready"));
    measure.addEventListener("pointerleave", () => {
      measure.classList.remove("delete-ready");
      deleteBtn.setAttribute("aria-hidden", "true");
    });
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      measure.remove();
    });
  }

  return measure;
}

// Create a section with add measure button
function createSection(title, quantization, measureCount = 0, chords = []) {
  if (!sectionsCanvas) return null;

  const trimmedTitle = (title || "New Section").trim() || "New Section";
  const config = getQuantizationConfig(quantization);
  const section = document.createElement("section");
  section.classList.add("songSection");
  section.dataset.sectionId = `section-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  section.innerHTML = `
    <div class="sectionHeader">
      <button class="deleteSectionBtn" type="button" aria-label="Delete section">X</button>
      <h4 class="sectionTitle">${trimmedTitle}</h4>
      <span class="quantization">Quantization : ${config.label}</span>
    </div>
    <section class="addMeasure ${config.quantClass}">
      <button type="button">Add Measure</button>
    </section>
  `;

  const addMeasureBlock = section.querySelector(".addMeasure");
  const deleteBtn = section.querySelector(".deleteSectionBtn");

  // Edit mode: add delete functionality
  if (chartMode !== "view") {
    section.classList.add("delete-section-ready");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      section.remove();
    });
  }

  // Add existing measures
  for (let i = 0; i < measureCount; i += 1) {
    const measure = createMeasureGrid(quantization, chords[i] || []);
    section.insertBefore(measure, addMeasureBlock);
  }

  sectionsCanvas.insertBefore(section, addSectionButton);
  return section;
}

// Render chart data to page
function renderChartData() {
  const chart = getActiveChart();
  if (!chart) {
    if (sectionsCanvas) sectionsCanvas.innerHTML = "";
    return;
  }

  // Populate header metadata
  document.querySelector("#songTitle").textContent = chart.songTitle || "Untitled Project";
  document.querySelector("#bpm").textContent = `${chart.bpm ?? 120} BPM`;
  document.querySelector("#key").textContent = chart.key || "A min";
  document.querySelector("#timeSignature").textContent = chart.timeSignature || "4/4";

  // Clear and populate sections
  if (sectionsCanvas) {
    sectionsCanvas.innerHTML = "";
    if (addSectionButton) sectionsCanvas.appendChild(addSectionButton);
  }

  const sections = Array.isArray(chart.sections) ? chart.sections : [];
  sections.forEach((section) => {
    createSection(section.title, section.quantization, section.measureCount || 0, section.chords || []);
  });
}

// Extract section data from DOM back to data structure
function getSectionsFromDOM() {
  return Array.from(document.querySelectorAll(".songSection")).map((sectionEl) => {
    const title = sectionEl.querySelector(".sectionTitle")?.textContent?.trim() || "Section";
    const quantizationText = sectionEl.querySelector(".quantization")?.textContent?.replace("Quantization :", "").trim() || "1/4";
    const measureCount = sectionEl.querySelectorAll(".measure").length;
    const chords = Array.from(sectionEl.querySelectorAll(".measure")).map((measure) =>
      Array.from(measure.querySelectorAll(".chordCell")).map((cell) => cell.dataset.chord || "")
    );
    return { title, quantization: quantizationText, measureCount, chords };
  });
}

// Inline edit mode for text elements
function startInlineEdit(element, value, onCommit) {
  if (element.querySelector("input")) return; // Already editing

  const input = document.createElement("input");
  input.className = "inline-editor";
  input.type = "text";
  input.value = value;
  input.setAttribute("aria-label", "Edit value");
  element.replaceChildren(input);
  input.focus();
  input.select();

  const finish = (saveValue) => {
    const nextValue = saveValue ? input.value.trim() : value;
    onCommit(nextValue);
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      finish(false);
    }
  });
  input.addEventListener("blur", () => finish(true));
}

// Save current chart to storage
function saveCurrentChart() {
  const chart = getActiveChart();
  if (!chart) return;

  chart.sections = getSectionsFromDOM();
  chart.date = chart.date || new Date().toLocaleDateString("en-GB");

  const charts = getSavedCharts();
  const chartIndex = charts.findIndex((item) => item.id === chart.id);

  if (chartIndex >= 0) {
    charts[chartIndex] = chart;
  } else {
    charts.push(chart);
  }

  saveCharts(charts);
  chartMode = "view";
  localStorage.setItem(CHART_MODE_KEY, chartMode);
  document.body.classList.add("view-only");
  if (saveButton) saveButton.textContent = "Exit";
}

// Add section button
addSectionButton?.addEventListener("click", () => {
  if (chartMode !== "view") {
    toggleSectionModal(true);
  }
});

// Close section modal button
closeSectionModalButton?.addEventListener("click", () => toggleSectionModal(false));

// Section modal backdrop click
sectionModal?.addEventListener("click", (event) => {
  if (event.target === sectionModal) {
    toggleSectionModal(false);
  }
});

// Section form submission
sectionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = sectionTitleInput?.value || "New Section";
  const quantization = sectionQuantizationInput?.value || "1/4";
  createSection(title, quantization, 0);
  toggleSectionModal(false);
});

// Mapping of quantization class to config label
const QUANT_CLASS_TO_LABEL = {
  "quarter": "1/4",
  "eighth": "1/8",
  "sixteenth": "1/16"
};

// Canvas click handler for editing chords, sections, and adding measures
sectionsCanvas?.addEventListener("click", (event) => {
  if (chartMode === "view") return;

  // Edit chord
  const chordCell = event.target.closest(".chordCell");
  if (chordCell) {
    const chordLabel = chordCell.querySelector(".chordLabel");
    startInlineEdit(chordLabel, chordCell.dataset.chord || "", (value) => {
      chordCell.dataset.chord = value;
      chordLabel.textContent = value;
    });
    return;
  }

  // Edit section title
  const sectionTitle = event.target.closest(".sectionTitle");
  if (sectionTitle) {
    startInlineEdit(sectionTitle, sectionTitle.textContent.trim(), (value) => {
      sectionTitle.textContent = value || "New Section";
    });
    return;
  }

  // Add measure
  const addMeasureButton = event.target.closest(".addMeasure button");
  if (addMeasureButton) {
    const addMeasureSection = addMeasureButton.closest(".addMeasure");
    const quantClass = addMeasureSection?.classList[1];
    const section = addMeasureSection?.closest(".songSection");

    if (section && quantClass) {
      const quantLabel = QUANT_CLASS_TO_LABEL[quantClass];
      const measure = createMeasureGrid(quantLabel || "1/4");
      section.insertBefore(measure, addMeasureSection);
    }
  }
});

// Save/Exit button
if (saveButton) {
  saveButton.textContent = chartMode === "view" ? "Exit" : "Save";
  saveButton.addEventListener("click", () => {
    if (chartMode === "view") {
      exitEditor();
    } else {
      saveCurrentChart();
    }
  });
}

// Initialize quantization select
sectionQuantizationInput?.addEventListener("DOMContentLoaded", () => {
  sectionQuantizationInput.value = "1/4";
});
if (sectionQuantizationInput) {
  sectionQuantizationInput.value = "1/4";
}

// Initial render
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderChartData);
} else {
  renderChartData();
}

