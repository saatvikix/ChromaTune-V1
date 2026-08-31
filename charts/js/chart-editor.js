const STORAGE_KEY = "chromatuneCharts";
const ACTIVE_CHART_ID_KEY = "chromatuneActiveChartId";
const CHART_MODE_KEY = "chromatuneChartMode";

const sectionsCanvas = document.querySelector("#sectionsCanvas");
const addSectionButton = document.querySelector("#addSectionButton");
const sectionModal = document.querySelector("#sectionModal");
const closeSectionModalButton = document.querySelector("#closeSectionModal");
const sectionForm = document.querySelector("#sectionForm");
const sectionTitleInput = document.querySelector("#sectionTitleInput");
const sectionQuantizationInput = document.querySelector("#sectionQuantization");
const saveButton = document.querySelector("#saveButton");

const chartMode = localStorage.getItem(CHART_MODE_KEY) || "edit";
if (chartMode === "view") {
    document.body.classList.add("view-only");
}

function exitEditor() {
    localStorage.removeItem(ACTIVE_CHART_ID_KEY);
    localStorage.removeItem(CHART_MODE_KEY);
    window.location.href = "./charts.html";
}

function getQuantizationConfig(quantization) {
    const normalized = String(quantization || "1/4");

    if (normalized === "1/8") {
        return {
            label: "1/8",
            quantClass: "eighth",
            gridClass: "eighthNoteGrid",
            count: 8,
        };
    }

    if (normalized === "1/16") {
        return {
            label: "1/16",
            quantClass: "sixteenth",
            gridClass: "sixteenthNoteGrid",
            count: 16,
        };
    }

    return {
        label: "1/4",
        quantClass: "quarter",
        gridClass: "quarterNoteGrid",
        count: 4,
    };
}

function getSavedCharts() {
    try {
        const rawCharts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(rawCharts) ? rawCharts : [];
    } catch (error) {
        console.error("Unable to read saved charts:", error);
        return [];
    }
}

function saveCharts(charts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

function getActiveChart() {
    const chartId = localStorage.getItem(ACTIVE_CHART_ID_KEY);
    const charts = getSavedCharts();

    return charts.find((chart) => chart.id === chartId) || null;
}

function setActiveChart(chart) {
    if (!chart || !chart.id) {
        return;
    }

    localStorage.setItem(ACTIVE_CHART_ID_KEY, chart.id);
}

function openSectionModal() {
    if (!sectionModal) {
        return;
    }

    sectionModal.classList.add("open");
    sectionModal.setAttribute("aria-hidden", "false");
    if (sectionTitleInput) {
        sectionTitleInput.focus();
    }
}

function closeSectionModal() {
    if (!sectionModal) {
        return;
    }

    sectionModal.classList.remove("open");
    sectionModal.setAttribute("aria-hidden", "true");
    if (sectionForm) {
        sectionForm.reset();
    }
}

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

function createMeasureGrid(quantization, gridClass, chords = []) {
    const config = getQuantizationConfig(quantization);
    const measure = document.createElement("div");
    measure.classList.add("measure");
    measure.classList.add(gridClass || config.gridClass);

    for (let i = 1; i <= (config.count || 4); i += 1) {
        measure.appendChild(createMeasureCell(i, chords[i - 1] || ""));
    }

    return measure;
}

function createSection(title, quantization, measureCount = 0, chords = []) {
    if (!sectionsCanvas) {
        return null;
    }

    const trimmedTitle = (title || "New Section").trim() || "New Section";
    const config = getQuantizationConfig(quantization);
    const section = document.createElement("section");
    section.classList.add("songSection");
    section.dataset.sectionId = `section-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    section.innerHTML = `
        <div class="sectionHeader">
            <h4 class="sectionTitle">${trimmedTitle}</h4>
            <span class="quantization">Quantization : ${config.label}</span>
        </div>
        <section class="addMeasure ${config.quantClass}">
            <button type="button">Add Measure</button>
        </section>
    `;

    const addMeasureBlock = section.querySelector(".addMeasure");

    for (let i = 0; i < measureCount; i += 1) {
        const measure = createMeasureGrid(config.label, config.gridClass, chords[i] || []);
        section.insertBefore(measure, addMeasureBlock);
    }

    sectionsCanvas.insertBefore(section, addSectionButton);
    return section;
}

function createGrid(button, quant, gridClass) {
    if (!button || !gridClass) {
        return;
    }

    const addMeasureBlock = button.closest(".addMeasure");
    const section = button.closest(".songSection");

    if (!section || !addMeasureBlock) {
        return;
    }

    const measure = createMeasureGrid(quant, gridClass);
    section.insertBefore(measure, addMeasureBlock);
}

function renderChartData() {
    const chart = getActiveChart();

    if (!chart) {
        if (sectionsCanvas) {
            sectionsCanvas.innerHTML = "";
        }
        return;
    }

    const songTitleEl = document.querySelector("#songTitle");
    const bpmEl = document.querySelector("#bpm");
    const keyEl = document.querySelector("#key");
    const timeSignatureEl = document.querySelector("#timeSignature");

    if (songTitleEl) {
        songTitleEl.textContent = chart.songTitle || "Untitled Project";
    }

    if (bpmEl) {
        bpmEl.textContent = `${chart.bpm ?? 120} BPM`;
    }

    if (keyEl) {
        keyEl.textContent = chart.key || "A min";
    }

    if (timeSignatureEl) {
        timeSignatureEl.textContent = chart.timeSignature || "4/4";
    }

    if (!sectionsCanvas) {
        return;
    }

    sectionsCanvas.innerHTML = "";

    if (addSectionButton) {
        sectionsCanvas.appendChild(addSectionButton);
    }

    const sections = Array.isArray(chart.sections) ? chart.sections : [];
    sections.forEach((section) => {
        createSection(section.title, section.quantization, section.measureCount || 0, section.chords || []);
    });
}

function getSectionsFromDOM() {
    return Array.from(document.querySelectorAll(".songSection")).map((sectionEl) => {
        const title = sectionEl.querySelector(".sectionTitle")?.textContent?.trim() || "Section";
        const quantizationText = sectionEl.querySelector(".quantization")?.textContent?.replace("Quantization :", "").trim() || "1/4";
        const measureCount = sectionEl.querySelectorAll(".measure").length;
        const chords = Array.from(sectionEl.querySelectorAll(".measure")).map((measure) =>
            Array.from(measure.querySelectorAll(".chordCell")).map((cell) => cell.dataset.chord || "")
        );

        return {
            title,
            quantization: quantizationText,
            measureCount,
            chords,
        };
    });
}

function startInlineEdit(element, value, onCommit) {
    if (element.querySelector("input")) {
        return;
    }

    const input = document.createElement("input");
    input.className = "inline-editor";
    input.type = "text";
    input.value = value;
    input.setAttribute("aria-label", "Edit value");
    element.replaceChildren(input);
    input.focus();
    input.select();

    let committed = false;
    const finish = (saveValue) => {
        if (committed) {
            return;
        }

        committed = true;
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

function saveCurrentChart() {
    const chart = getActiveChart();

    if (!chart) {
        return;
    }

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
    localStorage.removeItem(ACTIVE_CHART_ID_KEY);
    localStorage.removeItem(CHART_MODE_KEY);
    window.location.href = "./charts.html";
}

if (addSectionButton) {
    addSectionButton.addEventListener("click", openSectionModal);
}

if (closeSectionModalButton) {
    closeSectionModalButton.addEventListener("click", closeSectionModal);
}

if (sectionModal) {
    sectionModal.addEventListener("click", (event) => {
        if (event.target === sectionModal) {
            closeSectionModal();
        }
    });
}

if (sectionForm) {
    sectionForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = sectionTitleInput?.value || "New Section";
        const quantization = sectionQuantizationInput?.value || "1/4";

        createSection(title, quantization, 0);
        closeSectionModal();
    });
}

if (sectionsCanvas) {
    sectionsCanvas.addEventListener("click", (event) => {
        if (chartMode === "view") {
            return;
        }

        const chordCell = event.target.closest(".chordCell");
        if (chordCell) {
            const chordLabel = chordCell.querySelector(".chordLabel");
            startInlineEdit(chordLabel, chordCell.dataset.chord || "", (value) => {
                chordCell.dataset.chord = value;
                chordLabel.textContent = value;
            });
            return;
        }

        const sectionTitle = event.target.closest(".sectionTitle");
        if (sectionTitle) {
            startInlineEdit(sectionTitle, sectionTitle.textContent.trim(), (value) => {
                sectionTitle.textContent = value || "New Section";
            });
            return;
        }

        const addMeasureButton = event.target.closest(".addMeasure button");

        if (!addMeasureButton) {
            return;
        }

        const addMeasureSection = addMeasureButton.closest(".addMeasure");
        const quant = addMeasureSection?.classList[1];
        const section = addMeasureSection?.closest(".songSection");

        if (!section || !quant) {
            return;
        }

        if (quant === "quarter") {
            createGrid(addMeasureButton, "1/4", "quarterNoteGrid");
        } else if (quant === "eighth") {
            createGrid(addMeasureButton, "1/8", "eighthNoteGrid");
        } else if (quant === "sixteenth") {
            createGrid(addMeasureButton, "1/16", "sixteenthNoteGrid");
        }
    });
}

if (saveButton) {
    if (chartMode === "view") {
        saveButton.textContent = "Exit";
        saveButton.addEventListener("click", exitEditor);
    } else {
        saveButton.textContent = "Save";
        saveButton.addEventListener("click", saveCurrentChart);
    }
}

if (sectionQuantizationInput) {
    sectionQuantizationInput.value = "1/4";
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderChartData);
} else {
    renderChartData();
}

setActiveChart(getActiveChart());

