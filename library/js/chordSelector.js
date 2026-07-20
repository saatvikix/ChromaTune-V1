const roots = [
    "C", "C#", "D", "D#",
    "E", "F", "F#", "G",
    "G#", "A", "A#", "B"
];

const qualities = ["Major", "Minor"];

const chordImageMap = {
    "C-major": "./graphics/chords/C_major.png",
    "C#-major": "./graphics/chords/C_Sharp_major.png",
    "D-major": "./graphics/chords/D_major.png",
    "D#-major": "./graphics/chords/D_Sharp_major.png",
    "E-major": "./graphics/chords/E_Major.png",
    "F-major": "./graphics/chords/F_Major.png",
    "F#-major": "./graphics/chords/F_Sharp_Major.png",
    "G-major": "./graphics/chords/G_Major.png",
    "G#-major": "./graphics/chords/G_Sharp_Major.png",
    "A-major": "./graphics/chords/A_Major.png",
    "A#-major": "./graphics/chords/A_Sharp_Major.png",
    "B-major": "./graphics/chords/B_Major.png",
};

let currentRootIndex = 0;
let currentQualityIndex = 0;

const rootSlider = document.querySelector("#rootSlider");
const qualitySlider = document.querySelector("#qualitySlider");
const rootThumb = rootSlider?.querySelector(".thumb");
const qualityThumb = qualitySlider?.querySelector(".thumb");
const chordRootEl = document.querySelector("#chordRoot");
const chordQualityEl = document.querySelector("#chordQuality");
const diagramImage = document.querySelector("#diagramImage");

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getSliderPosition(slider, event) {
    const rect = slider.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const padding = 20;
    const usable = Math.max(1, slider.clientWidth - padding * 2);
    return clamp((x - padding) / usable, 0, 1);
}

function getSnappedIndex(position, totalValues) {
    return clamp(Math.round(position * (totalValues - 1)), 0, totalValues - 1);
}

function updateThumbPosition(slider, thumb, index, totalValues) {
    if (!slider || !thumb) return;

    const padding = 20;
    const usable = Math.max(1, slider.clientWidth - padding * 2);
    const normalized = totalValues > 1 ? index / (totalValues - 1) : 0;
    thumb.style.left = `${padding + normalized * usable}px`;
}

function updateRootDisplay(position) {
    currentRootIndex = getSnappedIndex(position, roots.length);
    const root = roots[currentRootIndex] || roots[0];

    if (chordRootEl) chordRootEl.textContent = root;
    if (rootThumb) updateThumbPosition(rootSlider, rootThumb, currentRootIndex, roots.length);

    updateChordDisplay(root, getSelectedQuality());
}

function updateQualityDisplay(position) {
    currentQualityIndex = getSnappedIndex(position, qualities.length);
    const quality = qualities[currentQualityIndex] || qualities[0];

    if (chordQualityEl) chordQualityEl.textContent = quality;
    if (qualityThumb) updateThumbPosition(qualitySlider, qualityThumb, currentQualityIndex, qualities.length);

    updateChordDisplay(getSelectedRoot(), quality);
}

function getSelectedRoot() {
    return roots[currentRootIndex] || roots[0];
}

function getSelectedQuality() {
    return qualities[currentQualityIndex] || qualities[0];
}

function updateChordDisplay(root, quality) {
    if (chordRootEl) chordRootEl.textContent = root;
    if (chordQualityEl) chordQualityEl.textContent = quality;

    if (diagramImage) {
        const imageKey = `${root}-${quality.toLowerCase()}`;
        const imagePath = chordImageMap[imageKey];
        if (imagePath) {
            diagramImage.src = imagePath;
        }
    }
}

function setupSlider(slider, thumb, onChange) {
    if (!slider || !thumb) return;

    slider.style.touchAction = "none";

    const handleMove = (event) => {
        if (!slider.dataset.dragging) return;
        const position = getSliderPosition(slider, event);
        onChange(position);
    };

    slider.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        slider.dataset.dragging = "true";
        slider.setPointerCapture(event.pointerId);
        handleMove(event);
    });

    slider.addEventListener("pointermove", handleMove);
    slider.addEventListener("pointerup", () => {
        delete slider.dataset.dragging;
    });
    slider.addEventListener("pointercancel", () => {
        delete slider.dataset.dragging;
    });
    slider.addEventListener("click", (event) => {
        handleMove(event);
    });
}

setupSlider(rootSlider, rootThumb, (position) => {
    updateRootDisplay(position);
});

setupSlider(qualitySlider, qualityThumb, (position) => {
    updateQualityDisplay(position);
});

window.addEventListener("resize", () => {
    updateRootDisplay(currentRootIndex / (roots.length - 1));
    updateQualityDisplay(currentQualityIndex / (qualities.length - 1));
});

updateRootDisplay(0);
updateQualityDisplay(0);