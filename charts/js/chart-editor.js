// Page elements
const chartCanvas = document.querySelector("#chartCanvas");
const addSectionButton = document.querySelector("#addSectionButton");
const sectionDialog = document.querySelector("#sectionDialog");
const closeSectionButton = document.querySelector("#closeSectionButton");
const sectionForm = document.querySelector("#sectionForm");
const sectionTitle = document.querySelector("#sectionTitle");
const sectionQuantization = document.querySelector("#sectionQuantization");
const saveButton = document.querySelector("#saveButton");
const songTitle = document.querySelector("#songTitle");
const songBpm = document.querySelector("#songBpm");
const songKey = document.querySelector("#songKey");
const songTimeSignature = document.querySelector("#songTimeSignature");

// Storage and page state
const currentUserEmail =
    (localStorage.getItem("currentUserEmail") || "").toLowerCase();
const activeChartId = localStorage.getItem("chromatuneActiveChartId");
let chartMode = localStorage.getItem("chromatuneChartMode") || "edit";
const userCharts = getUserCharts();
const currentChart = userCharts.find((chart) => chart.id === activeChartId);

function getUserCharts() {
    try {
        const allCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "{}");
        return Array.isArray(allCharts[currentUserEmail]) ? allCharts[currentUserEmail] : [];
    } catch (error) {
        return [];
    }
}

function saveUserCharts(charts) {
    try {
        const allCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "{}");
        allCharts[currentUserEmail] = charts;
        localStorage.setItem("chromatuneCharts", JSON.stringify(allCharts));
    } catch (error) {
        console.error("Unable to save charts:", error);
    }
}

function openSectionForm() {
    sectionDialog.classList.add("open");
    sectionDialog.setAttribute("aria-hidden", "false");
    sectionTitle.focus();
}

function closeSectionForm() {
    sectionDialog.classList.remove("open");
    sectionDialog.setAttribute("aria-hidden", "true");
    sectionForm.reset();
}

function getQuantizationInfo(quantization) {
    if (quantization === "1/8") return { cells: 8 };
    if (quantization === "1/16") return { cells: 16 };
    return { cells: 4 };
}

// Build chart elements
function createChordCell(number, chord = "") {
    const cell = document.createElement("div");
    const numberLabel = document.createElement("span");
    const chordLabel = document.createElement("span");

    cell.className = "chord-cell";
    cell.dataset.chord = chord;
    numberLabel.className = "cell-number";
    numberLabel.textContent = number;
    chordLabel.className = "chord-label";
    chordLabel.textContent = chord;

    cell.append(numberLabel, chordLabel);
    return cell;
}

function createMeasure(quantization, chords = []) {
    const { cells } = getQuantizationInfo(quantization);
    const measure = document.createElement("div");
    const deleteButton = document.createElement("button");

    measure.className = "measure";

    for (let index = 1; index <= cells; index++) {
        measure.appendChild(createChordCell(index, chords[index - 1] || ""));
    }

    deleteButton.className = "delete-measure-button";
    deleteButton.type = "button";
    deleteButton.textContent = "X";
    deleteButton.setAttribute("aria-label", "Delete measure");
    measure.appendChild(deleteButton);

    return measure;
}

function createSection(title, quantization, chords = []) {
    const section = document.createElement("section");
    const header = document.createElement("div");
    const deleteButton = document.createElement("button");
    const titleElement = document.createElement("h4");
    const quantizationElement = document.createElement("span");
    const addMeasure = document.createElement("section");
    const addMeasureButton = document.createElement("button");

    section.className = "song-section";
    section.dataset.quantization = quantization;
    header.className = "section-header";
    deleteButton.className = "delete-section-button";
    deleteButton.type = "button";
    deleteButton.textContent = "X";
    deleteButton.setAttribute("aria-label", "Delete section");
    titleElement.className = "section-title";
    titleElement.textContent = title || "New Section";
    quantizationElement.className = "section-quantization";
    quantizationElement.textContent = `Quantization : ${quantization}`;
    addMeasure.className = "add-measure";
    addMeasureButton.type = "button";
    addMeasureButton.textContent = "Add Measure";

    header.append(deleteButton, titleElement, quantizationElement);
    section.appendChild(header);

    chords.forEach((measureChords) => {
        section.appendChild(createMeasure(quantization, measureChords));
    });

    addMeasure.appendChild(addMeasureButton);
    section.appendChild(addMeasure);

    return section;
}

function renderChart() {
    if (!currentChart) return;

    songTitle.textContent = currentChart.songTitle || "Untitled Project";
    songBpm.textContent = `${currentChart.bpm ?? 120} BPM`;
    songKey.textContent = currentChart.key || "C major";
    songTimeSignature.textContent = currentChart.timeSignature || "4/4";

    chartCanvas.replaceChildren(addSectionButton);

    (currentChart.sections || []).forEach((sectionData) => {
        const section = createSection(
            sectionData.title,
            sectionData.quantization || "1/4",
            sectionData.chords || []
        );

        chartCanvas.insertBefore(section, addSectionButton);
    });
}

function editText(element, oldValue, saveValue) {
    if (element.querySelector("input")) return;

    const input = document.createElement("input");
    let cancelled = false;

    input.className = "inline-editor";
    input.type = "text";
    input.value = oldValue;
    element.replaceChildren(input);
    input.focus();
    input.select();

    function finishEditing() {
        saveValue(cancelled ? oldValue : input.value.trim());
    }

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            input.blur();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            cancelled = true;
            input.blur();
        }
    });

    input.addEventListener("blur", finishEditing);
}

// Editor interactions
chartCanvas.addEventListener("click", (event) => {
    if (chartMode === "view") return;

    const deleteMeasureButton = event.target.closest(".delete-measure-button");
    if (deleteMeasureButton) {
        deleteMeasureButton.closest(".measure").remove();
        return;
    }

    const deleteSectionButton = event.target.closest(".delete-section-button");
    if (deleteSectionButton) {
        deleteSectionButton.closest(".song-section").remove();
        return;
    }

    const addMeasureButton = event.target.closest(".add-measure button");
    if (addMeasureButton) {
        const section = addMeasureButton.closest(".song-section");
        const measure = createMeasure(section.dataset.quantization);
        section.insertBefore(measure, addMeasureButton.parentElement);
        return;
    }

    const chordCell = event.target.closest(".chord-cell");
    if (chordCell) {
        const chordLabel = chordCell.querySelector(".chord-label");

        editText(chordLabel, chordCell.dataset.chord || "", (value) => {
            chordCell.dataset.chord = value;
            chordLabel.textContent = value;
        });
        return;
    }

    const sectionTitleElement = event.target.closest(".section-title");
    if (sectionTitleElement) {
        editText(sectionTitleElement, sectionTitleElement.textContent.trim(), (value) => {
            sectionTitleElement.textContent = value || "New Section";
        });
    }
});

addSectionButton.addEventListener("click", () => {
    if (chartMode !== "view") openSectionForm();
});

closeSectionButton.addEventListener("click", closeSectionForm);

sectionDialog.addEventListener("click", (event) => {
    if (event.target === sectionDialog) closeSectionForm();
});

sectionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = sectionTitle.value.trim() || "New Section";
    const quantization = sectionQuantization.value;
    const section = createSection(title, quantization);

    chartCanvas.insertBefore(section, addSectionButton);
    closeSectionForm();
});

function readSectionsFromEditor() {
    const sections = [];

    chartCanvas.querySelectorAll(".song-section").forEach((section) => {
        const chords = [];

        section.querySelectorAll(".measure").forEach((measure) => {
            const measureChords = [];

            measure.querySelectorAll(".chord-cell").forEach((cell) => {
                measureChords.push(cell.dataset.chord || "");
            });

            chords.push(measureChords);
        });

        sections.push({
            title: section.querySelector(".section-title").textContent.trim() || "Section",
            quantization: section.dataset.quantization,
            chords
        });
    });

    return sections;
}

// Save / exit
function saveChart() {
    if (!currentChart) return;

    currentChart.sections = readSectionsFromEditor();
    saveUserCharts(userCharts);

    chartMode = "view";
    localStorage.setItem("chromatuneChartMode", "view");
    document.body.classList.add("view-only");
    saveButton.textContent = "Exit";
}

saveButton.addEventListener("click", () => {
    if (chartMode === "view") {
        localStorage.removeItem("chromatuneActiveChartId");
        localStorage.removeItem("chromatuneChartMode");
        window.location.href = "./charts.html";
        return;
    }

    saveChart();
});

if (chartMode === "view") document.body.classList.add("view-only");

saveButton.textContent = chartMode === "view" ? "Exit" : "Save";
renderChart();
