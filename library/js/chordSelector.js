const roots = [
    "C", "C#", "D", "D#",
    "E", "F", "F#", "G",
    "G#", "A", "A#", "B"
];

const qualities = ["Major", "Minor"];

// const chordImageMap = {
//     "C-major": "./graphics/chords/C_major.png",
//     "C#-major": "./graphics/chords/C_Sharp_major.png",
//     "D-major": "./graphics/chords/D_major.png",
//     "D#-major": "./graphics/chords/D_Sharp_major.png",
//     "E-major": "./graphics/chords/E_Major.png",
//     "F-major": "./graphics/chords/F_Major.png",
//     "F#-major": "./graphics/chords/F_Sharp_Major.png",
//     "G-major": "./graphics/chords/G_Major.png",
//     "G#-major": "./graphics/chords/G_Sharp_Major.png",
//     "A-major": "./graphics/chords/A_Major.png",
//     "A#-major": "./graphics/chords/A_Sharp_Major.png",
//     "B-major": "./graphics/chords/B_Major.png",
// };

const chordImageMap = {
    "C-major": "./graphics/chords/major/c_major_01.svg",
    "C#-major": "./graphics/chords/major/c_sharp_major_01.svg",
    "D-major": "./graphics/chords/major/d_major_01.svg",
    "D#-major": "./graphics/chords/major/d_sharp_major_01.svg",
    "E-major": "./graphics/chords/major/e_major_01.svg",
    "F-major": "./graphics/chords/major/f_major_01.svg",
    "F#-major": "./graphics/chords/major/f_sharp_major_01.svg",
    "G-major": "./graphics/chords/major/g_major_01.svg",
    "G#-major": "./graphics/chords/major/g_sharp_major_01.svg",
    "A-major": "./graphics/chords/major/a_major_01.svg",
    "A#-major": "./graphics/chords/major/a_sharp_major_01.svg",
    "B-major": "./graphics/chords/major/b_major_01.svg",

    "C-minor": "./graphics/chords/minor/c_minor_01.svg",
    "C#-minor": "./graphics/chords/minor/c_sharp_minor_01.svg",
    "D-minor": "./graphics/chords/minor/d_minor_01.svg",
    "D#-minor": "./graphics/chords/minor/d_sharp_minor_01.svg",
    "E-minor": "./graphics/chords/minor/e_minor_01.svg",
    "F-minor": "./graphics/chords/minor/f_minor_01.svg",
    "F#-minor": "./graphics/chords/minor/f_sharp_minor_01.svg",
    "G-minor": "./graphics/chords/minor/g_minor_01.svg",
    "G#-minor": "./graphics/chords/minor/g_sharp_minor_01.svg",
    "A-minor": "./graphics/chords/minor/a_minor_01.svg",
    "A#-minor": "./graphics/chords/minor/a_sharp_minor_01.svg",
    "B-minor": "./graphics/chords/minor/b_minor_01.svg",
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
const favButton = document.querySelector(".favButton");
const favouriteChords = new Set();

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

        updateFavouriteState(imageKey);
    }
}

function updateFavouriteState(imageKey) {
    if (!favButton) return;

    const isFavourite = favouriteChords.has(imageKey);
    favButton.classList.toggle("is-favourite", isFavourite);
    favButton.setAttribute("aria-pressed", String(isFavourite));
    favButton.setAttribute(
        "aria-label",
        isFavourite ? "Remove chord from favourites" : "Add chord to favourites"
    );
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

favButton?.addEventListener("click", () => {
    const imageKey = `${getSelectedRoot()}-${getSelectedQuality().toLowerCase()}`;

    if (favouriteChords.has(imageKey)) {
        favouriteChords.delete(imageKey);
    } else {
        favouriteChords.add(imageKey);
    }

    updateFavouriteState(imageKey);
});

window.addEventListener("resize", () => {
    updateRootDisplay(currentRootIndex / (roots.length - 1));
    updateQualityDisplay(currentQualityIndex / (qualities.length - 1));
});

updateRootDisplay(0);
updateQualityDisplay(0);