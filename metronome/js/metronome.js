document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // DOM REFERENCES
    // ==============================

    const knob = document.querySelector(".knob");
    const bpmDisplay = document.querySelector(".bpmDisplay");
    const bpmNumber = document.querySelector(".bpmNumber");

    const beatsIncreaseBtn = document.querySelector("#beatsIncrease");
    const beatsDecreaseBtn = document.querySelector("#beatsDecrease");
    const beatsDisplay = document.querySelector("#beatsDisplay");

    const playBtn = document.querySelector("#playBtn");
    const playIcon = document.querySelector("#playIcon");


    // ==============================
    // CONFIGURATION & STATE
    // ==============================

    const minBpm = 30;
    const maxBpm = 300;

    const minAngle = -106;
    const maxAngle = 540;
    const knobRangeDeg = maxAngle - minAngle;

    const primaryClick = "./clicks/click1.mp3";
    const secondaryClick = "./clicks/click2.mp3";

    let bpm = 99;
    let beats = 4;

    let isPlaying = false;
    let intervalId = null;
    let currentBeat = 1;

    let knobStartY = 0;
    let knobStartAngle = 0;
    let isDraggingKnob = false;


    // ==============================
    // BPM ↔ KNOB ANGLE
    // ==============================

    const getAngleFromBpm = (value) => {
        return minAngle + ((value - minBpm) / (maxBpm - minBpm)) * knobRangeDeg;
    };

    const getBpmFromAngle = (angle) => {
        return Math.round(
            minBpm + ((angle - minAngle) / knobRangeDeg) * (maxBpm - minBpm)
        );
    };


    // ==============================
    // DISPLAY
    // ==============================

    const updateKnobRotation = (angle) => {
        if (!knob) return;

        const normalizedAngle = Math.max(
            minAngle,
            Math.min(maxAngle, angle)
        );

        knob.style.transform = `rotate(${normalizedAngle}deg)`;

        if (bpmDisplay) {
            bpmDisplay.style.transform = `rotate(${-normalizedAngle}deg)`;
        }
    };

    const updateBpmDisplay = () => {
        if (bpmNumber) {
            bpmNumber.textContent = bpm;
        }

        if (bpmDisplay && knob) {
            const angle = getAngleFromBpm(bpm);
            bpmDisplay.style.transform = `rotate(${-angle}deg)`;
        }
    };

    const updateBeatsDisplay = () => {
        if (beatsDisplay) {
            beatsDisplay.textContent = beats;
        }
    };


    // ==============================
    // BPM CONTROL
    // ==============================

    const setBpm = (value, restart = true) => {
        const newValue = Math.min(
            maxBpm,
            Math.max(minBpm, Math.round(value))
        );

        bpm = newValue;

        updateBpmDisplay();
        updateKnobRotation(getAngleFromBpm(bpm));

        if (restart && isPlaying) {
            restartMetronome();
        }
    };


    // ==============================
    // METRONOME PLAYBACK
    // ==============================

    const startMetronome = () => {
        if (intervalId !== null) return;

        currentBeat = 1;

        intervalId = setInterval(() => {
            const sound =
                currentBeat === 1
                    ? primaryClick
                    : secondaryClick;

            const click = new Audio(sound);
            click.play();

            currentBeat += 1;

            if (currentBeat > beats) {
                currentBeat = 1;
            }
        }, Math.round(60000 / bpm));
    };

    const stopMetronome = () => {
        if (intervalId === null) return;

        clearInterval(intervalId);
        intervalId = null;
    };

    const restartMetronome = () => {
        stopMetronome();
        startMetronome();
    };


    // ==============================
    // BPM TEXT EDITING
    // ==============================

    const commitBpmInput = (input) => {
        const value = parseInt(input.value, 10);

        if (!Number.isNaN(value)) {
            setBpm(value);
        } else {
            updateBpmDisplay();
        }

        input.remove();
    };

    const createBpmInput = () => {
        if (!bpmNumber || bpmNumber.querySelector("input")) {
            return;
        }

        const input = document.createElement("input");

        input.type = "number";
        input.min = String(minBpm);
        input.max = String(maxBpm);
        input.step = "1";
        input.value = String(bpm);

        input.style.width = "4rem";
        input.style.fontSize = "1rem";
        input.style.textAlign = "center";
        input.style.border = "none";
        input.style.background = "transparent";
        input.style.color = "inherit";
        input.style.outline = "none";

        bpmNumber.textContent = "";
        bpmNumber.appendChild(input);

        input.focus();
        input.select();

        input.addEventListener("blur", () => {
            commitBpmInput(input);
        });

        input.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                commitBpmInput(input);
            }

            if (event.key === "Escape") {
                input.remove();
                updateBpmDisplay();
            }
        });
    };


    // ==============================
    // BEAT CONTROLS
    // ==============================

    if (beatsDecreaseBtn) {
        beatsDecreaseBtn.addEventListener("click", () => {

            if (beats > 1) {
                beats -= 1;
                updateBeatsDisplay();
            }
        });
    }

    if (beatsIncreaseBtn) {
        beatsIncreaseBtn.addEventListener("click", () => {

            if (beats < 16) {
                beats += 1;
                updateBeatsDisplay();
            }
        });
    }


    // ==============================
    // PLAY / PAUSE
    // ==============================

    if (playBtn) {
        playBtn.addEventListener("click", () => {

            isPlaying = !isPlaying;

            if (isPlaying) {
                if (playIcon) {
                    playIcon.src = playBtn.dataset.pauseIcon;
                }

                startMetronome();

            } else {
                if (playIcon) {
                    playIcon.src = playBtn.dataset.playIcon;
                }

                stopMetronome();
            }
        });
    }


    // ==============================
    // BPM NUMBER CLICK
    // ==============================

    if (bpmNumber) {
        bpmNumber.addEventListener("click", createBpmInput);
    }


    // ==============================
    // KNOB DRAGGING
    // ==============================

    if (knob) {

        knob.style.touchAction = "none";

        knob.addEventListener("pointerdown", (event) => {

            event.preventDefault();

            knob.setPointerCapture(event.pointerId);

            isDraggingKnob = true;
            knobStartY = event.clientY;
            knobStartAngle = getAngleFromBpm(bpm);
        });

        knob.addEventListener("pointermove", (event) => {

            if (!isDraggingKnob) return;

            const deltaY = knobStartY - event.clientY;
            const sensitivity = 0.4;

            const newAngle =
                knobStartAngle + deltaY * sensitivity;

            setBpm(getBpmFromAngle(newAngle));
        });

        knob.addEventListener("pointerup", () => {
            isDraggingKnob = false;
        });

        knob.addEventListener("pointercancel", () => {
            isDraggingKnob = false;
        });


        // ==============================
        // KNOB WHEEL
        // ==============================

        knob.addEventListener("wheel", (event) => {

            event.preventDefault();

            const delta = -event.deltaY;
            const step = Math.max(
                1,
                Math.round(Math.abs(delta) / 100)
            );

            const change = delta > 0 ? step : -step;

            setBpm(bpm + change);
        });
    }


    // ==============================
    // INITIALIZATION
    // ==============================

    updateBeatsDisplay();
    updateBpmDisplay();
    updateKnobRotation(getAngleFromBpm(bpm));

});