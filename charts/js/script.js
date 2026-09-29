function toggleFormVisibility(chartForm, isOpen) {
    chartForm.classList.toggle("open", isOpen);
    chartForm.style.display = isOpen ? "flex" : "none";
}


const createChartButton = document.querySelector("#create-chart-btn");
const chartForm = document.querySelector("#chartForm");
const formCloseButton = document.querySelector("#formCloseButton");
const savedChartsContainer = document.querySelector("#savedChartsContainer");

function getCurrentUserEmail() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null")?.email.toLowerCase() || "";
    } catch (error) {
        return "";
    }
}

function saveCharts(charts) {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return;

    const savedCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "{}");
    const allCharts = Array.isArray(savedCharts) ? {} : savedCharts;
    allCharts[userEmail] = charts;
    localStorage.setItem("chromatuneCharts", JSON.stringify(allCharts));
}


toggleFormVisibility(chartForm, false);


createChartButton.addEventListener("click", () => {
    toggleFormVisibility(chartForm, true);
});


formCloseButton.addEventListener("click", () => {
    toggleFormVisibility(chartForm, false);
});


function getSavedCharts() {

    try {
        const savedCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "{}");
        const userEmail = getCurrentUserEmail();

        return Array.isArray(savedCharts[userEmail]) ? savedCharts[userEmail] : [];

    } catch (error) {
        console.error("Unable to read saved charts:", error);
        return [];
    }
}


function openChartEditor(chartId, mode) {

    localStorage.setItem("chromatuneActiveChartId", chartId);
    localStorage.setItem("chromatuneChartMode", mode);

    window.location.href = "./chart-editor.html";
}


function deleteChart(chartId) {

    const charts = getSavedCharts().filter((chart) => chart.id !== chartId);

    saveCharts(charts);

    renderCharts();
}


function closeChartMenus() {

    document.querySelectorAll(".chart-menu-wrap.open").forEach((menu) => {
        menu.classList.remove("open");
    });
}


function createCard(chart) {

    const article = document.createElement("article");

    article.classList.add("chart-card");

    article.innerHTML = `
        <div class="chart-card-header">
            <span class="chart-date">${chart.date}</span>

            <div class="chart-menu-wrap">
                <button
                    class="chart-menu"
                    type="button"
                    aria-label="Chart options"
                    aria-expanded="false"
                >
                    •••
                </button>

                <div class="chart-menu-dropdown" role="menu">
                    <button type="button" data-action="edit" role="menuitem">
                        Edit
                    </button>

                    <button type="button" data-action="delete" role="menuitem">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <h3>${chart.songTitle}</h3>

        <div class="chart-metrics">
            <span class="metric">
                <span class="metric-label">BPM</span>
                ${chart.bpm}
            </span>

            <span class="metric">
                <span class="metric-label">TIME</span>
                ${chart.timeSignature}
            </span>

            <span class="metric">
                <span class="metric-label">KEY</span>
                ${chart.key}
            </span>
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

        closeChartMenus();

        menuWrap.classList.add("open");
        menuButton.setAttribute("aria-expanded", "true");
    });


    article
        .querySelector('[data-action="edit"]')
        .addEventListener("click", (event) => {

            event.stopPropagation();

            openChartEditor(chart.id, "edit");
        });


    article
        .querySelector('[data-action="delete"]')
        .addEventListener("click", (event) => {

            event.stopPropagation();

            deleteChart(chart.id);
        });


    return article;
}


function renderCharts() {

    const charts = getSavedCharts();

    savedChartsContainer.innerHTML = "";

    if (charts.length === 0) {

        const placeholder = document.createElement("p");

        placeholder.classList.add("empty-state-message");

        placeholder.textContent = "No saved charts yet";

        savedChartsContainer.appendChild(placeholder);

        return;
    }


    charts.forEach((chart) => {

        savedChartsContainer.appendChild(
            createCard(chart)
        );

    });
}


renderCharts();


document.addEventListener("click", (event) => {

    if (!event.target.closest(".chart-menu-wrap")) {
        closeChartMenus();
    }

});
