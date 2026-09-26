// =========================
// Get the HTML elements
// =========================

const sectionsCanvas = document.querySelector("#sectionsCanvas");
const addSectionButton = document.querySelector("#addSectionButton");

const sectionModal = document.querySelector("#sectionModal");
const closeSectionModalButton = document.querySelector("#closeSectionModal");

const sectionForm = document.querySelector("#sectionForm");
const sectionTitleInput = document.querySelector("#sectionTitleInput");
const sectionQuantizationInput = document.querySelector("#sectionQuantization");

const saveButton = document.querySelector("#saveButton");

const songTitle = document.querySelector("#songTitle");
const bpm = document.querySelector("#bpm");
const key = document.querySelector("#key");
const timeSignature = document.querySelector("#timeSignature");


// =========================
// Find the current chart
// =========================

let chartMode = localStorage.getItem("chromatuneChartMode") || "edit";

if (chartMode === "view") {
    document.body.classList.add("view-only");
}

function getCharts() {
    try {
        const charts = JSON.parse(
            localStorage.getItem("chromatuneCharts") || "[]"
        );

        return Array.isArray(charts) ? charts : [];
    } catch (error) {
        console.error("Unable to read charts:", error);
        return [];
    }
}

function getCurrentChart() {
    const chartId = localStorage.getItem("chromatuneActiveChartId");

    const charts = getCharts();

    return charts.find((chart) => chart.id === chartId) || null;
}


// =========================
// Section form
// =========================

function openSectionForm() {
    sectionModal.classList.add("open");
    sectionModal.setAttribute("aria-hidden", "false");

    sectionTitleInput.focus();
}

function closeSectionForm() {
    sectionModal.classList.remove("open");
    sectionModal.setAttribute("aria-hidden", "true");

    sectionForm.reset();
    sectionQuantizationInput.value = "1/4";
}

addSectionButton.addEventListener("click", () => {
    if (chartMode !== "view") {
        openSectionForm();
    }
});

closeSectionModalButton.addEventListener("click", closeSectionForm);

sectionModal.addEventListener("click", (event) => {
    if (event.target === sectionModal) {
        closeSectionForm();
    }
});


// =========================
// Quantization
// =========================

function getQuantizationInfo(value) {

    if (value === "1/8") {
        return {
            cells: 8,
            gridClass: "eighthNoteGrid"
        };
    }

    if (value === "1/16") {
        return {
            cells: 16,
            gridClass: "sixteenthNoteGrid"
        };
    }

    return {
        cells: 4,
        gridClass: "quarterNoteGrid"
    };
}


// =========================
// Create a chord cell
// =========================

function createChordCell(number, chord = "") {

    const cell = document.createElement("div");
    cell.classList.add("chordCell");

    cell.dataset.chord = chord;

    const numberLabel = document.createElement("span");
    numberLabel.classList.add("gridNumber");
    numberLabel.textContent = number;

    const chordLabel = document.createElement("span");
    chordLabel.classList.add("chordLabel");
    chordLabel.textContent = chord;

    cell.append(numberLabel, chordLabel);

    return cell;
}


// =========================
// Create a measure
// =========================

function createMeasure(quantization, chords = []) {

    const info = getQuantizationInfo(quantization);

    const measure = document.createElement("div");
    measure.classList.add("measure", info.gridClass);

    for (let i = 1; i <= info.cells; i++) {

        const chord = chords[i - 1] || "";

        measure.appendChild(
            createChordCell(i, chord)
        );
    }


    // Delete button

    const deleteButton = document.createElement("div");

    deleteButton.classList.add("deleteMeasureBtn");
    deleteButton.textContent = "X";
    deleteButton.setAttribute("aria-hidden", "true");

    measure.appendChild(deleteButton);


    if (chartMode !== "view") {

        measure.addEventListener("pointerenter", () => {
            measure.classList.add("delete-ready");
        });

        measure.addEventListener("pointerleave", () => {
            measure.classList.remove("delete-ready");
        });

        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation();

            measure.remove();
        });
    }

    return measure;
}


// =========================
// Create a section
// =========================

function createSection(title, quantization, chords = []) {

    const section = document.createElement("section");

    section.classList.add("songSection");

    section.dataset.quantization = quantization;


    // Section header

    const header = document.createElement("div");

    header.classList.add("sectionHeader");


    const deleteButton = document.createElement("button");

    deleteButton.classList.add("deleteSectionBtn");
    deleteButton.type = "button";
    deleteButton.textContent = "X";
    deleteButton.setAttribute("aria-label", "Delete section");


    const titleElement = document.createElement("h4");

    titleElement.classList.add("sectionTitle");
    titleElement.textContent = title || "New Section";


    const quantizationElement = document.createElement("span");

    quantizationElement.classList.add("quantization");
    quantizationElement.textContent = `Quantization : ${quantization}`;


    header.append(
        deleteButton,
        titleElement,
        quantizationElement
    );


    // Add measure button

    const addMeasure = document.createElement("section");

    const info = getQuantizationInfo(quantization);

    addMeasure.classList.add("addMeasure");

    if (quantization === "1/8") {
        addMeasure.classList.add("eighth");
    } else if (quantization === "1/16") {
        addMeasure.classList.add("sixteenth");
    } else {
        addMeasure.classList.add("quarter");
    }


    const addMeasureButton = document.createElement("button");

    addMeasureButton.type = "button";
    addMeasureButton.textContent = "Add Measure";

    addMeasure.appendChild(addMeasureButton);


    // Put everything into the section

    section.append(header);


    // Add old measures

    chords.forEach((measureChords) => {

        section.appendChild(
            createMeasure(quantization, measureChords)
        );
    });


    section.append(addMeasure);


    // Delete section

    if (chartMode !== "view") {

        section.classList.add("delete-section-ready");

        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation();

            section.remove();
        });
    }


    return section;
}


// =========================
// Show the chart
// =========================

function showChart() {

    const chart = getCurrentChart();

    if (!chart) {
        return;
    }


    // Show chart information

    songTitle.textContent = chart.songTitle || "Untitled Project";
    bpm.textContent = `${chart.bpm ?? 120} BPM`;
    key.textContent = chart.key || "C major";
    timeSignature.textContent = chart.timeSignature || "4/4";


    // Clear the canvas

    sectionsCanvas.innerHTML = "";


    // Put Add Section button back

    sectionsCanvas.appendChild(addSectionButton);


    // Show sections

    const sections = Array.isArray(chart.sections)
        ? chart.sections
        : [];


    sections.forEach((sectionData) => {

        const section = createSection(
            sectionData.title,
            sectionData.quantization || "1/4",
            sectionData.chords || []
        );

        sectionsCanvas.insertBefore(
            section,
            addSectionButton
        );
    });
}


// =========================
// Edit text
// =========================

function editText(element, oldValue, saveValue) {

    if (element.querySelector("input")) {
        return;
    }


    const input = document.createElement("input");

    input.className = "inline-editor";
    input.type = "text";
    input.value = oldValue;

    element.replaceChildren(input);

    input.focus();
    input.select();


    let finished = false;


    function finish(save) {

        if (finished) {
            return;
        }

        finished = true;

        const value = save
            ? input.value.trim()
            : oldValue;

        saveValue(value);
    }


    input.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            finish(true);
        }

        if (event.key === "Escape") {

            event.preventDefault();

            finish(false);
        }
    });


    input.addEventListener("blur", () => {
        finish(true);
    });
}


// =========================
// Canvas clicks
// =========================

sectionsCanvas.addEventListener("click", (event) => {

    if (chartMode === "view") {
        return;
    }


    // Edit chord

    const chordCell = event.target.closest(".chordCell");

    if (chordCell) {

        const chordLabel = chordCell.querySelector(".chordLabel");

        editText(
            chordLabel,
            chordCell.dataset.chord || "",
            (value) => {

                chordCell.dataset.chord = value;
                chordLabel.textContent = value;
            }
        );

        return;
    }


    // Edit section title

    const sectionTitle = event.target.closest(".sectionTitle");

    if (sectionTitle) {

        editText(
            sectionTitle,
            sectionTitle.textContent.trim(),
            (value) => {

                sectionTitle.textContent =
                    value || "New Section";
            }
        );

        return;
    }


    // Add measure

    const addMeasureButton =
        event.target.closest(".addMeasure button");

    if (addMeasureButton) {

        const section =
            addMeasureButton.closest(".songSection");

        const quantization =
            section.dataset.quantization;


        const measure =
            createMeasure(quantization);


        section.insertBefore(
            measure,
            section.querySelector(".addMeasure")
        );
    }
});


// =========================
// Create a new section
// =========================

sectionForm.addEventListener("submit", (event) => {

    event.preventDefault();


    const title =
        sectionTitleInput.value.trim() || "New Section";

    const quantization =
        sectionQuantizationInput.value;


    const section =
        createSection(title, quantization);


    sectionsCanvas.insertBefore(
        section,
        addSectionButton
    );


    closeSectionForm();
});


// =========================
// Save chart
// =========================

function saveChart() {

    const chart = getCurrentChart();

    if (!chart) {
        return;
    }


    const sections = [];


    document
        .querySelectorAll(".songSection")
        .forEach((section) => {

            const title =
                section
                    .querySelector(".sectionTitle")
                    .textContent
                    .trim();


            const quantization =
                section.dataset.quantization;


            const measures = [];


            section
                .querySelectorAll(".measure")
                .forEach((measure) => {

                    const chords = [];


                    measure
                        .querySelectorAll(".chordCell")
                        .forEach((cell) => {

                            chords.push(
                                cell.dataset.chord || ""
                            );
                        });


                    measures.push(chords);
                });


            sections.push({
                title: title || "Section",
                quantization: quantization,
                measureCount: measures.length,
                chords: measures
            });
        });


    chart.sections = sections;


    // Put the updated chart back into localStorage

    const charts = getCharts();

    const chartIndex =
        charts.findIndex(
            (item) => item.id === chart.id
        );


    if (chartIndex !== -1) {

        charts[chartIndex] = chart;

    } else {

        charts.push(chart);
    }


    localStorage.setItem(
        "chromatuneCharts",
        JSON.stringify(charts)
    );


    // Saving means we are now viewing the chart

    chartMode = "view";

    localStorage.setItem(
        "chromatuneChartMode",
        "view"
    );

    document.body.classList.add("view-only");

    saveButton.textContent = "Exit";
}


// =========================
// Save / Exit button
// =========================

saveButton.addEventListener("click", () => {

    if (chartMode === "view") {

        localStorage.removeItem(
            "chromatuneActiveChartId"
        );

        localStorage.removeItem(
            "chromatuneChartMode"
        );

        window.location.href = "./charts.html";

        return;
    }


    saveChart();
});


// =========================
// Start the editor
// =========================

saveButton.textContent =
    chartMode === "view"
        ? "Exit"
        : "Save";

showChart();