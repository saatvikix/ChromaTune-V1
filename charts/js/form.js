const submitBtn = document.querySelector(".chart-submit-button");

const songTitleInput = document.querySelector("input#song-title");
const timeSignInput = document.querySelector("#time-signature");
const bpmTextInput = document.querySelector(".bpm-text-input");
const keyRootInput = document.querySelector("#chart-key-root");
const keyQualityInput = document.querySelector("#chart-key-quality");

const bpmIncreaseBtn = document.querySelector("#increaseBPM");
const bpmDecreaseBtn = document.querySelector("#decreaseBPM");
const bpmValue = document.querySelector(".bpm-value");



if (bpmIncreaseBtn) {
  bpmIncreaseBtn.addEventListener("click", () => {
      bpmValue.textContent = Number(bpmValue.textContent) + 1;
  });
}

if (bpmDecreaseBtn) {
  bpmDecreaseBtn.addEventListener("click", () => {
      bpmValue.textContent = Number(bpmValue.textContent) - 1;
  });
}

if (bpmValue) {
  bpmValue.addEventListener("click", () => {
      bpmTextInput.disabled = false;
      bpmTextInput.style.display = "initial";
  });
}

if (bpmTextInput) {
  bpmTextInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
          bpmValue.textContent = bpmTextInput.value;
          bpmTextInput.disabled = true;
          bpmTextInput.style.display = "none";
      }
  });
}

if (submitBtn) {
  submitBtn.addEventListener("click", () => {
    const createdChartId = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const bpm = Number(bpmValue?.textContent || 120);
      const songTitle = songTitleInput?.value.trim() || "Untitled_Project";
      const timeSignature = timeSignInput?.value || "4/4";
      const keyRoot = keyRootInput?.value || "C";
      const keyQuality = keyQualityInput?.value || "major";
      const chartData = {
      id: createdChartId,
          bpm,
          songTitle,
          timeSignature,
          key: `${keyRoot} ${keyQuality}`,
      date: new Date().toLocaleDateString("en-GB"),
      sections: []
      };

      try {
          const savedCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "[]");
          savedCharts.push(chartData);
          localStorage.setItem("chromatuneCharts", JSON.stringify(savedCharts));
      localStorage.setItem("chromatuneActiveChartId", createdChartId);
          localStorage.setItem("chromatuneChartMode", "edit");
      } catch (error) {
          console.error("Unable to save chart:", error);
      }

    window.location.href = "./chart-editor.html";
  });
}
