// =========================
// Get the HTML elements
// =========================

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


// =========================
// Find the current chart
// =========================

let chartMode =
    localStorage.getItem("chromatuneChartMode") || "edit";

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

    const chartId =
        localStorage.getItem("chromatuneActiveChartId");

    const charts = getCharts();

    return charts.find((chart) => chart.id === chartId) || null;
}


// =========================
// Section form
// =========================

function openSectionForm() {

    sectionDialog.classList.add("open");

    sectionDialog.setAttribute(
        "aria-hidden",
        "false"
    );

    sectionTitle.focus();
}


function closeSectionForm() {

    sectionDialog.classList.remove("open");

    sectionDialog.setAttribute(
        "aria-hidden",
        "true"
    );

    sectionForm.reset();

    sectionQuantization.value = "1/4";
}


addSectionButton.addEventListener("click", () => {

    if (chartMode !== "view") {
        openSectionForm();
    }
});


closeSectionButton.addEventListener(
    "click",
    closeSectionForm
);


sectionDialog.addEventListener("click", (event) => {

    if (event.target === sectionDialog) {
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

    cell.classList.add("chord-cell");

    cell.dataset.chord = chord;


    const numberLabel =
        document.createElement("span");

    numberLabel.classList.add("cell-number");

    numberLabel.textContent = number;


    const chordLabel =
        document.createElement("span");

    chordLabel.classList.add("chord-label");

    chordLabel.textContent = chord;


    cell.append(
        numberLabel,
        chordLabel
    );


    return cell;
}


// =========================
// Create a measure
// =========================

function createMeasure(
    quantization,
    chords = []
) {

    const info =
        getQuantizationInfo(quantization);


    const measure =
        document.createElement("div");

    measure.classList.add(
        "measure",
        info.gridClass
    );


    for (let i = 1; i <= info.cells; i++) {

        const chord =
            chords[i - 1] || "";


        measure.appendChild(
            createChordCell(i, chord)
        );
    }


    const deleteButton =
        document.createElement("div");

    deleteButton.classList.add(
        "delete-measure-button"
    );

    deleteButton.textContent = "X";

    deleteButton.setAttribute(
        "aria-hidden",
        "true"
    );


    measure.appendChild(deleteButton);


    if (chartMode !== "view") {

        measure.addEventListener(
            "pointerenter",
            () => {
                measure.classList.add(
                    "delete-ready"
                );
            }
        );


        measure.addEventListener(
            "pointerleave",
            () => {
                measure.classList.remove(
                    "delete-ready"
                );
            }
        );


        deleteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                measure.remove();
            }
        );
    }


    return measure;
}


// =========================
// Create a section
// =========================

function createSection(
    title,
    quantization,
    chords = []
) {

    const section =
        document.createElement("section");


    section.classList.add(
        "song-section"
    );


    section.dataset.quantization =
        quantization;


    // Section header

    const header =
        document.createElement("div");

    header.classList.add(
        "section-header"
    );


    const deleteButton =
        document.createElement("button");

    deleteButton.classList.add(
        "delete-section-button"
    );

    deleteButton.type = "button";

    deleteButton.textContent = "X";

    deleteButton.setAttribute(
        "aria-label",
        "Delete section"
    );


    const titleElement =
        document.createElement("h4");

    titleElement.classList.add(
        "section-title"
    );

    titleElement.textContent =
        title || "New Section";


    const quantizationElement =
        document.createElement("span");

    quantizationElement.classList.add(
        "section-quantization"
    );

    quantizationElement.textContent =
        `Quantization : ${quantization}`;


    header.append(
        deleteButton,
        titleElement,
        quantizationElement
    );


    // Add measure button

    const addMeasure =
        document.createElement("section");

    addMeasure.classList.add(
        "add-measure"
    );


    const addMeasureButton =
        document.createElement("button");

    addMeasureButton.type = "button";

    addMeasureButton.textContent =
        "Add Measure";


    addMeasure.appendChild(
        addMeasureButton
    );


    // Put the header into the section

    section.append(header);


    // Add existing measures

    chords.forEach((measureChords) => {

        section.appendChild(
            createMeasure(
                quantization,
                measureChords
            )
        );
    });


    // Add the Add Measure button

    section.append(addMeasure);


    // Delete section

    if (chartMode !== "view") {

        section.classList.add(
            "delete-section-ready"
        );


        deleteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                section.remove();
            }
        );
    }


    return section;
}


// =========================
// Show the chart
// =========================

function showChart() {

    const chart =
        getCurrentChart();


    if (!chart) {
        return;
    }


    // Show song information

    songTitle.textContent =
        chart.songTitle || "Untitled Project";

    songBpm.textContent =
        `${chart.bpm ?? 120} BPM`;

    songKey.textContent =
        chart.key || "C major";

    songTimeSignature.textContent =
        chart.timeSignature || "4/4";


    // Clear the chart

    chartCanvas.innerHTML = "";


    // Put Add Section back

    chartCanvas.appendChild(
        addSectionButton
    );


    // Get the sections

    const sections =
        Array.isArray(chart.sections)
            ? chart.sections
            : [];


    // Create each section

    sections.forEach((sectionData) => {

        const section =
            createSection(
                sectionData.title,
                sectionData.quantization || "1/4",
                sectionData.chords || []
            );


        chartCanvas.insertBefore(
            section,
            addSectionButton
        );
    });
}


// =========================
// Edit text
// =========================

function editText(
    element,
    oldValue,
    saveValue
) {

    if (element.querySelector("input")) {
        return;
    }


    const input =
        document.createElement("input");


    input.className =
        "inline-editor";

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


        const value =
            save
                ? input.value.trim()
                : oldValue;


        saveValue(value);
    }


    input.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                finish(true);
            }


            if (event.key === "Escape") {

                event.preventDefault();

                finish(false);
            }
        }
    );


    input.addEventListener(
        "blur",
        () => {
            finish(true);
        }
    );
}


// =========================
// Chart canvas clicks
// =========================

chartCanvas.addEventListener(
    "click",
    (event) => {

        if (chartMode === "view") {
            return;
        }


        // Edit chord

        const chordCell =
            event.target.closest(
                ".chord-cell"
            );


        if (chordCell) {

            const chordLabel =
                chordCell.querySelector(
                    ".chord-label"
                );


            editText(
                chordLabel,
                chordCell.dataset.chord || "",
                (value) => {

                    chordCell.dataset.chord =
                        value;

                    chordLabel.textContent =
                        value;
                }
            );


            return;
        }


        // Edit section title

        const sectionTitleElement =
            event.target.closest(
                ".section-title"
            );


        if (sectionTitleElement) {

            editText(
                sectionTitleElement,
                sectionTitleElement.textContent.trim(),
                (value) => {

                    sectionTitleElement.textContent =
                        value || "New Section";
                }
            );


            return;
        }


        // Add measure

        const addMeasureButton =
            event.target.closest(
                ".add-measure button"
            );


        if (addMeasureButton) {

            const section =
                addMeasureButton.closest(
                    ".song-section"
                );


            const quantization =
                section.dataset.quantization;


            const measure =
                createMeasure(
                    quantization
                );


            section.insertBefore(
                measure,
                section.querySelector(
                    ".add-measure"
                )
            );
        }
    }
);


// =========================
// Create a new section
// =========================

sectionForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const title =
            sectionTitle.value.trim()
            || "New Section";


        const quantization =
            sectionQuantization.value;


        const section =
            createSection(
                title,
                quantization
            );


        chartCanvas.insertBefore(
            section,
            addSectionButton
        );


        closeSectionForm();
    }
);


// =========================
// Save the chart
// =========================

function saveChart() {

    const chart =
        getCurrentChart();


    if (!chart) {
        return;
    }


    const sections = [];


    document
        .querySelectorAll(".song-section")
        .forEach((section) => {

            const title =
                section
                    .querySelector(".section-title")
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
                        .querySelectorAll(".chord-cell")
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


    chart.sections =
        sections;


    // Get all charts from storage

    const charts =
        getCharts();


    // Find the current chart

    const chartIndex =
        charts.findIndex(
            (item) => item.id === chart.id
        );


    // Replace the old chart

    if (chartIndex !== -1) {

        charts[chartIndex] =
            chart;

    } else {

        charts.push(chart);
    }


    // Save everything

    localStorage.setItem(
        "chromatuneCharts",
        JSON.stringify(charts)
    );


    // Switch to view mode

    chartMode = "view";


    localStorage.setItem(
        "chromatuneChartMode",
        "view"
    );


    document.body.classList.add(
        "view-only"
    );


    saveButton.textContent =
        "Exit";
}


// =========================
// Save / Exit
// =========================

saveButton.addEventListener(
    "click",
    () => {

        if (chartMode === "view") {

            localStorage.removeItem(
                "chromatuneActiveChartId"
            );

            localStorage.removeItem(
                "chromatuneChartMode"
            );


            window.location.href =
                "./charts.html";


            return;
        }


        saveChart();
    }
);


// =========================
// Start the editor
// =========================

saveButton.textContent =
    chartMode === "view"
        ? "Exit"
        : "Save";


showChart();