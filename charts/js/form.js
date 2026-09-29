function constrainBpm(value) {
    return Math.min(300, Math.max(20, Math.round(value)));
}

const createChartButton = document.querySelector(".chart-submit-button");
const songTitleInput = document.querySelector("#song-title");
const timeSignatureInput = document.querySelector("#time-signature");
const bpmTextInput = document.querySelector(".bpm-text-input");
const keyRootInput = document.querySelector("#chart-key-root");
const keyQualityInput = document.querySelector("#chart-key-quality");
const increaseBpmButton = document.querySelector("#increaseBPM");
const decreaseBpmButton = document.querySelector("#decreaseBPM");
const bpmValue = document.querySelector(".bpm-value");

function getCurrentUserEmail() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null")?.email.toLowerCase() || "";
    } catch (error) {
        return "";
    }
}


increaseBpmButton.addEventListener("click", () => {
    bpmValue.textContent = constrainBpm(Number(bpmValue.textContent) + 1);
});


decreaseBpmButton.addEventListener("click", () => {
    bpmValue.textContent = constrainBpm(Number(bpmValue.textContent) - 1);
});


function closeBpmEditor(saveValue) {

    if (saveValue) {
        const parsedBpm = Number(bpmTextInput.value);

        if (Number.isFinite(parsedBpm)) {
            bpmValue.textContent = constrainBpm(parsedBpm);
        }
    }

    bpmTextInput.disabled = true;
    bpmTextInput.style.display = "none";
}


bpmValue.addEventListener("click", () => {

    bpmTextInput.value = bpmValue.textContent;
    bpmTextInput.disabled = false;
    bpmTextInput.style.display = "block";

    bpmTextInput.focus();
    bpmTextInput.select();
});


bpmTextInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        event.preventDefault();
        closeBpmEditor(true);
    }

    if (event.key === "Escape") {
        closeBpmEditor(false);
    }
});


bpmTextInput.addEventListener("blur", () => {
    closeBpmEditor(true);
});


createChartButton.addEventListener("click", () => {

    const userEmail = getCurrentUserEmail();

    if (!userEmail) {
        alert("Please log in before creating a chart.");
        return;
    }

    const chartData = {
        id: Date.now().toString(),
        bpm: Number(bpmValue.textContent || 120),
        songTitle: songTitleInput.value.trim() || "Untitled_Project",
        timeSignature: timeSignatureInput.value || "4/4",
        key: `${keyRootInput.value || "C"} ${keyQualityInput.value || "major"}`,
        date: new Date().toLocaleDateString("en-GB"),
        sections: []
    };

    try {

        const savedCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "{}");
        const allCharts = Array.isArray(savedCharts) ? {} : savedCharts;
        const userCharts = Array.isArray(allCharts[userEmail]) ? allCharts[userEmail] : [];

        userCharts.push(chartData);
        allCharts[userEmail] = userCharts;

        localStorage.setItem(
            "chromatuneCharts",
            JSON.stringify(allCharts)
        );

        localStorage.setItem(
            "chromatuneActiveChartId",
            chartData.id
        );

        localStorage.setItem(
            "chromatuneChartMode",
            "edit"
        );

        window.location.href = "./chart-editor.html";

    } catch (error) {
        console.error("Unable to save chart:", error);
    }
});
