document.addEventListener('DOMContentLoaded', () => {
    const knob = document.querySelector('.knob');
    const bpmDisplay = document.querySelector('.bpmDisplay');
    const bpmNumber = document.querySelector('.bpmNumber');
    const beatsIncreaseBtn = document.querySelector('#beatsIncrease');
    const beatsDecreaseBtn = document.querySelector('#beatsDecrease');
    const beatsDisplay = document.querySelector('#beatsDisplay');
    const playIcon = document.querySelector('#playIcon');
    const playBtn = document.querySelector('#playBtn');

    const minBpm = 30;
    const maxBpm = 300;
    const minAngle = -106;
    const maxAngle = 540;
    const knobRangeDeg = maxAngle - minAngle; // 540 degrees total
    let bpm = 128;
    let beats = 4;
    let isPlaying = false;
    let intervalId = null;
    let currentBeat = 1;
    let knobStartY = 0;
    let knobStartAngle = 0;
    let isDraggingKnob = false;

    const primaryClick = './clicks/click1.mp3';
    const secondaryClick = './clicks/click2.mp3';

    const getAngleFromBpm = (value) => minAngle + ((value - minBpm) / (maxBpm - minBpm)) * knobRangeDeg;
    const getBpmFromAngle = (angle) => Math.round(minBpm + ((angle - minAngle) / knobRangeDeg) * (maxBpm - minBpm));

    const updateKnobRotation = (angle) => {
        if (knob) {
            const normalized = Math.max(minAngle, Math.min(maxAngle, angle));
            knob.style.transform = `rotate(${normalized}deg)`;
            if (bpmDisplay) {
                bpmDisplay.style.transform = `rotate(${-normalized}deg)`;
            }
        }
    };

    const updateBeatsDisplay = () => {
        if (beatsDisplay) beatsDisplay.textContent = beats;
    };

    const updateBpmDisplay = () => {
        if (bpmNumber) bpmNumber.textContent = bpm;
        if (bpmDisplay && knob) {
            const currentAngle = getAngleFromBpm(bpm);
            bpmDisplay.style.transform = `rotate(${-currentAngle}deg)`;
        }
    };

    const setBpm = (value, restart = true) => {
        const newValue = Math.min(maxBpm, Math.max(minBpm, Math.round(value)));
        bpm = newValue;
        updateBpmDisplay();
        updateKnobRotation(getAngleFromBpm(bpm));

        if (restart && isPlaying) {
            restartMetronome();
        }
    };

    const startMetronome = () => {
        if (intervalId !== null) return;
        currentBeat = 1;
        intervalId = setInterval(() => {
            const sound = currentBeat === 1 ? primaryClick : secondaryClick;
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
        if (!bpmNumber || bpmNumber.querySelector('input')) return;

        const input = document.createElement('input');
        input.type = 'number';
        input.min = String(minBpm);
        input.max = String(maxBpm);
        input.step = '1';
        input.value = String(bpm);
        input.style.width = '4rem';
        input.style.fontSize = '1rem';
        input.style.textAlign = 'center';
        input.style.border = 'none';
        input.style.background = 'transparent';
        input.style.color = 'inherit';
        input.style.outline = 'none';

        bpmNumber.textContent = '';
        bpmNumber.appendChild(input);
        input.focus();
        input.select();

        input.addEventListener('blur', () => commitBpmInput(input));
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                commitBpmInput(input);
            }
            if (event.key === 'Escape') {
                input.remove();
                updateBpmDisplay();
            }
        });
    };

    if (beatsDecreaseBtn) {
        beatsDecreaseBtn.addEventListener('click', () => {
            if (beats > 1) {
                beats -= 1;
                updateBeatsDisplay();
            }
        });
    }

    if (beatsIncreaseBtn) {
        beatsIncreaseBtn.addEventListener('click', () => {
            if (beats < 16) {
                beats += 1;
                updateBeatsDisplay();
            }
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;

            if (isPlaying) {
                if (playIcon) playIcon.src = playBtn.dataset.pauseIcon;
                startMetronome();
            } else {
                if (playIcon) playIcon.src = playBtn.dataset.playIcon;
                stopMetronome();
            }
        });
    }

    if (bpmNumber) {
        bpmNumber.addEventListener('click', createBpmInput);
    }

    if (knob) {
        knob.style.touchAction = 'none';

        knob.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            knob.setPointerCapture(event.pointerId);
            isDraggingKnob = true;
            knobStartY = event.clientY;
            knobStartAngle = getAngleFromBpm(bpm);
        });

        knob.addEventListener('pointermove', (event) => {
            if (!isDraggingKnob) return;
            const deltaY = knobStartY - event.clientY;
     
            const sensitivity = 0.4; // lower sensitivity => refined control
            const newAngle = knobStartAngle + deltaY * sensitivity;
            setBpm(getBpmFromAngle(newAngle));
        });

        knob.addEventListener('pointerup', () => {
            isDraggingKnob = false;
        });

        knob.addEventListener('pointercancel', () => {
            isDraggingKnob = false;
        });

        // mouse wheel adjusts BPM in small steps
        knob.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            // normalize: wheel up (deltaY < 0) => increase bpm
            const delta = -event.deltaY;
            // Use small step for fine control; larger delta -> larger step
            const step = Math.max(1, Math.round(Math.abs(delta) / 100));
            const change = (delta > 0) ? step : -step;
            setBpm(bpm + change);
        });
    }

    updateBeatsDisplay();
    updateBpmDisplay();
    updateKnobRotation(getAngleFromBpm(bpm));
});
