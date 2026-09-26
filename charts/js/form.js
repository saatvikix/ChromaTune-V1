// Helper: Generate unique ID
function generateId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Helper: Constrain BPM value between 20 and 300
function constrainBpm(value) {
  return Math.min(300, Math.max(20, Math.round(value)));
}

// Query DOM elements
const submitBtn = document.querySelector(".chart-submit-button");
const songTitleInput = document.querySelector("input#song-title");
const timeSignInput = document.querySelector("#time-signature");
const bpmTextInput = document.querySelector(".bpm-text-input");
const keyRootInput = document.querySelector("#chart-key-root");
const keyQualityInput = document.querySelector("#chart-key-quality");
const bpmIncreaseBtn = document.querySelector("#increaseBPM");
const bpmDecreaseBtn = document.querySelector("#decreaseBPM");
const bpmValue = document.querySelector(".bpm-value");

// BPM increment/decrement buttons
bpmIncreaseBtn?.addEventListener("click", () => {
  bpmValue.textContent = Number(bpmValue.textContent) + 1;
});

bpmDecreaseBtn?.addEventListener("click", () => {
  bpmValue.textContent = Number(bpmValue.textContent) - 1;
});

// BPM inline editor
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

bpmValue?.addEventListener("click", () => {
  bpmTextInput.value = bpmValue.textContent;
  bpmTextInput.disabled = false;
  bpmTextInput.style.display = "block";
  bpmTextInput.focus();
  bpmTextInput.select();
});

bpmTextInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    closeBpmEditor(true);
  } else if (event.key === "Escape") {
    closeBpmEditor(false);
  }
});

bpmTextInput?.addEventListener("blur", () => closeBpmEditor(true));

// Chart creation
submitBtn?.addEventListener("click", () => {
  const chartData = {
    id: generateId(),
    bpm: Number(bpmValue?.textContent || 120),
    songTitle: songTitleInput?.value.trim() || "Untitled_Project",
    timeSignature: timeSignInput?.value || "4/4",
    key: `${keyRootInput?.value || "C"} ${keyQualityInput?.value || "major"}`,
    date: new Date().toLocaleDateString("en-GB"),
    sections: []
  };

  try {
    const savedCharts = JSON.parse(localStorage.getItem("chromatuneCharts") || "[]");
    savedCharts.push(chartData);
    localStorage.setItem("chromatuneCharts", JSON.stringify(savedCharts));
    localStorage.setItem("chromatuneActiveChartId", chartData.id);
    localStorage.setItem("chromatuneChartMode", "edit");
  } catch (error) {
    console.error("Unable to save chart:", error);
  }

  window.location.href = "./chart-editor.html";
});
