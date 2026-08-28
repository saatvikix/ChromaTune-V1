// ==================================================
// CHROMATUNE — BASIC GUITAR TUNER
// ==================================================


// ==================================================
// 1. STRING / PEG DATA
// ==================================================

const stringMap = new Map([
    ["firstPeg", "E4"],
    ["secondPeg", "B3"],
    ["thirdPeg", "G3"],
    ["fourthPeg", "D3"],
    ["fifthPeg", "A2"],
    ["sixthPeg", "E2"]
]);


const pitchMap = new Map([
    ["E4", 329.63],
    ["B3", 246.94],
    ["G3", 196.00],
    ["D3", 146.83],
    ["A2", 110.00],
    ["E2", 82.41]
]);


// ==================================================
// 2. TUNER STATE
// ==================================================

let selectedNote = null;
let expectedPitch = null;

let audioContext = null;
let analyzer = null;
let microphoneStream = null;


// ==================================================
// 3. TUNING THRESHOLD
// ==================================================

// +/- 5 cents = TUNED
const TUNING_THRESHOLD = 10;


// ==================================================
// 4. PITCH SMOOTHING
// ==================================================

// Previous smoothed cents value
let smoothedCents = 0;
let hasPitch = false;

// How strongly the new pitch affects the needle
//
// Smaller number = smoother / slower
// Larger number  = faster / more responsive
const SMOOTHING_FACTOR = 0.15;


// ==================================================
// 5. SELECT HTML ELEMENTS
// ==================================================

const statusText = document.querySelector("#statusText");
const statusDot = document.querySelector("#statusDot");

const pegBtns = document.querySelectorAll(".pegBtn");

// METER
const meterNeedle = document.querySelector("#meterNeedle");
const centsOffset = document.querySelector("#centsOffset");
const currNote = document.querySelector("#currNote");


// ==================================================
// 6. PEG BUTTONS
// ==================================================

pegBtns.forEach((button) => {

    button.addEventListener("click", () => {

        // Get selected peg
        const peg = button.id;

        // Get note belonging to that peg
        selectedNote = stringMap.get(peg);

        // Get expected frequency for that note
        expectedPitch = pitchMap.get(selectedNote);


        // Reset smoothing when changing strings
        smoothedCents = 0;
        hasPitch = false;


        // Reset meter to center
        if (meterNeedle) {
            meterNeedle.style.left = "50%";
            meterNeedle.classList.remove("in-tune");
        }


        // Update displayed note
        if (currNote) {
            currNote.textContent = selectedNote;
        }


        // Reset cents display
        if (centsOffset) {
            centsOffset.textContent = "+00";
        }


        console.log("--------------------------------");
        console.log("Selected peg:", peg);
        console.log("Selected note:", selectedNote);
        console.log("Expected frequency:", expectedPitch, "Hz");
        console.log("--------------------------------");


        // Remove selection from all pegs
        pegBtns.forEach((btn) => {
            btn.classList.remove("selected");
        });


        // Select clicked peg
        button.classList.add("selected");


        // Start microphone only once
        if (!audioContext) {
            startPitchDetection();
        }

    });

});


// ==================================================
// 7. START MICROPHONE + AUDIO ENGINE
// ==================================================

async function startPitchDetection() {

    try {

        // Request microphone access
        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        // Create Web Audio API context
        audioContext =
            new AudioContext();


        // Convert microphone stream into audio node
        const source =
            audioContext.createMediaStreamSource(
                microphoneStream
            );


        // Create analyser
        analyzer =
            audioContext.createAnalyser();


        // Number of samples used for analysis
        analyzer.fftSize = 2048;


        // Microphone → Analyzer
        source.connect(analyzer);


        // Update UI
        if (statusText) {
            statusText.textContent = "LISTENING";
        }

        if (statusDot) {
            statusDot.classList.add("listening");
        }


        console.log("Mic access granted");


        // Start continuous pitch detection
        updatePitch(
            analyzer,
            audioContext.sampleRate
        );


    } catch (error) {

        if (statusText) {
            statusText.textContent = "ACCESS DENIED";
        }

        console.error(
            "Audio initialization error:",
            error
        );

    }

}


// ==================================================
// 8. AUTOCORRELATION — IMPROVED GUITAR PITCH DETECTION
// ==================================================

function autoCorrelate(buffer, sampleRate) {

    const size = buffer.length;


    // --------------------------------------------------
    // STEP A — RMS / VOLUME CHECK
    // --------------------------------------------------

    let sum = 0;

    for (let i = 0; i < size; i++) {
        sum += buffer[i] * buffer[i];
    }

    const rms =
        Math.sqrt(sum / size);


    // Ignore very quiet signals
    if (rms < 0.01) {

        return {
            frequency: -1,
            clarity: 0
        };

    }


    // --------------------------------------------------
    // STEP B — REMOVE DC OFFSET
    // --------------------------------------------------

    let mean = 0;

    for (let i = 0; i < size; i++) {
        mean += buffer[i];
    }

    mean /= size;


    const centeredBuffer =
        new Float32Array(size);


    for (let i = 0; i < size; i++) {
        centeredBuffer[i] =
            buffer[i] - mean;
    }


    // --------------------------------------------------
    // STEP C — DEFINE GUITAR FREQUENCY RANGE
    // --------------------------------------------------

    /*
        Standard guitar range:

        Low E  ≈ 82.41 Hz
        High E ≈ 329.63 Hz

        We give ourselves some margin.

        70 Hz  → minimum
        400 Hz → maximum
    */

    const MIN_FREQUENCY = 70;
    const MAX_FREQUENCY = 400;


    // Frequency → period in samples

    const minPeriod =
        Math.floor(
            sampleRate / MAX_FREQUENCY
        );

    const maxPeriod =
        Math.ceil(
            sampleRate / MIN_FREQUENCY
        );


    // --------------------------------------------------
    // STEP D — AUTOCORRELATION
    // --------------------------------------------------

    let bestCorrelation = -Infinity;
    let bestLag = -1;


    /*
        We don't need to calculate every possible
        correlation from 0 → buffer.length.

        We ONLY inspect lags that could correspond
        to guitar fundamentals.
    */

    for (
        let lag = minPeriod;
        lag <= maxPeriod;
        lag++
    ) {

        let correlation = 0;

        let energyA = 0;
        let energyB = 0;


        /*
            Compare the waveform with a shifted
            copy of itself.
        */

        for (
            let i = 0;
            i < size - lag;
            i++
        ) {

            const sampleA =
                centeredBuffer[i];

            const sampleB =
                centeredBuffer[i + lag];


            correlation +=
                sampleA * sampleB;

            energyA +=
                sampleA * sampleA;

            energyB +=
                sampleB * sampleB;

        }


        // Prevent division by zero
        if (
            energyA === 0 ||
            energyB === 0
        ) {
            continue;
        }


        /*
            Normalize correlation.

            This gives us a value approximately
            between -1 and +1.

            +1 = extremely similar waveform
            0  = unrelated
            -1 = opposite
        */

        const normalizedCorrelation =
            correlation /
            Math.sqrt(
                energyA * energyB
            );


        // Keep strongest correlation
        if (
            normalizedCorrelation >
            bestCorrelation
        ) {

            bestCorrelation =
                normalizedCorrelation;

            bestLag =
                lag;

        }

    }


    // --------------------------------------------------
    // STEP E — SAFETY CHECK
    // --------------------------------------------------

    if (
        bestLag <= 0 ||
        !isFinite(bestCorrelation)
    ) {

        return {
            frequency: -1,
            clarity: 0
        };

    }


    // --------------------------------------------------
    // STEP F — SUB-SAMPLE PEAK INTERPOLATION
    // --------------------------------------------------

    /*
        bestLag is an integer.

        For example:

            lag  = 245
            lag  = 246  ← strongest
            lag  = 247

        But the real correlation peak might
        actually be around:

            246.37

        We estimate that position using the
        correlation values around the peak.
    */


    let refinedLag = bestLag;


    /*
        To interpolate, we need the correlation
        at:

            bestLag - 1
            bestLag
            bestLag + 1

        So calculate those three values.
    */

    function getNormalizedCorrelation(lag) {

        if (
            lag <= 0 ||
            lag >= size
        ) {
            return 0;
        }


        let correlation = 0;

        let energyA = 0;
        let energyB = 0;


        for (
            let i = 0;
            i < size - lag;
            i++
        ) {

            const sampleA =
                centeredBuffer[i];

            const sampleB =
                centeredBuffer[i + lag];


            correlation +=
                sampleA * sampleB;

            energyA +=
                sampleA * sampleA;

            energyB +=
                sampleB * sampleB;

        }


        if (
            energyA === 0 ||
            energyB === 0
        ) {
            return 0;
        }


        return correlation /
            Math.sqrt(
                energyA * energyB
            );

    }


    const correlationLeft =
        getNormalizedCorrelation(
            bestLag - 1
        );


    const correlationCenter =
        getNormalizedCorrelation(
            bestLag
        );


    const correlationRight =
        getNormalizedCorrelation(
            bestLag + 1
        );


    /*
        Parabolic interpolation.

        This estimates where the peak lies
        between the three integer lag values.
    */

    const denominator =
        correlationLeft -
        2 * correlationCenter +
        correlationRight;


    if (
        Math.abs(denominator) > 0.000001
    ) {

        const offset =
            0.5 *
            (
                correlationLeft -
                correlationRight
            ) /
            denominator;


        // Don't allow a crazy interpolation
        if (
            Math.abs(offset) <= 1
        ) {

            refinedLag =
                bestLag + offset;

        }

    }


    // --------------------------------------------------
    // STEP G — PERIOD → FREQUENCY
    // --------------------------------------------------

    const frequency =
        sampleRate / refinedLag;


    // --------------------------------------------------
    // STEP H — CLARITY
    // --------------------------------------------------

    /*
        Normalized correlation is already a
        confidence-like value.

        Convert it to percentage.
    */

    const clarity =
        Math.max(
            0,
            Math.min(
                100,
                bestCorrelation * 100
            )
        );


    // --------------------------------------------------
    // STEP I — FINAL SAFETY CHECK
    // --------------------------------------------------

    if (
        frequency < MIN_FREQUENCY ||
        frequency > MAX_FREQUENCY ||
        !isFinite(frequency)
    ) {

        return {
            frequency: -1,
            clarity: 0
        };

    }


    return {
        frequency,
        clarity
    };

}

// ==================================================
// 9. FREQUENCY → CENTS
// ==================================================

function getCentsDifference(
    actualFrequency,
    expectedFrequency
) {

    /*
        cents =
        1200 × log2(actual / expected)

        Negative = FLAT
        Zero     = PERFECT
        Positive = SHARP
    */

    return 1200 *
        Math.log2(
            actualFrequency /
            expectedFrequency
        );

}


// ==================================================
// 10. UPDATE TUNER METER
// ==================================================

function updateMeter(cents) {

    // --------------------------------------------------
    // VISUAL RANGE
    // --------------------------------------------------

    // The meter represents -50 to +50 cents
    const MAX_CENTS = 50;


    // Prevent the needle from leaving the meter
    const limitedCents =
        Math.max(
            -MAX_CENTS,
            Math.min(MAX_CENTS, cents)
        );


    // --------------------------------------------------
    // SMOOTH THE NEEDLE
    // --------------------------------------------------

    if (!hasPitch) {

        smoothedCents = limitedCents;
        hasPitch = true;

    }
    else {

        smoothedCents =
            smoothedCents +
            (
                limitedCents -
                smoothedCents
            ) *
            SMOOTHING_FACTOR;

    }


    // --------------------------------------------------
    // CONVERT CENTS → METER POSITION
    // --------------------------------------------------

    /*
        -50 cents → 0%
          0 cents → 50%
        +50 cents → 100%
    */

    const position =
        50 +
        (
            smoothedCents /
            MAX_CENTS
        ) *
        50;


    // Move needle
    if (meterNeedle) {

        meterNeedle.style.left =
            `${position}%`;

    }


    // --------------------------------------------------
    // DISPLAY CENTS
    // --------------------------------------------------

    const roundedCents =
        Math.round(smoothedCents);


    if (centsOffset) {

        if (roundedCents > 0) {

            centsOffset.textContent =
                `+${String(roundedCents).padStart(2, "0")}`;

        }
        else if (roundedCents < 0) {

            centsOffset.textContent =
                `${roundedCents}`;

        }
        else {

            centsOffset.textContent =
                "+00";

        }

    }


    // --------------------------------------------------
    // IN-TUNE STATE
    // --------------------------------------------------

    if (
        Math.abs(smoothedCents) <=
        TUNING_THRESHOLD
    ) {

        meterNeedle.classList.add("in-tune");

    }
    else {

        meterNeedle.classList.remove("in-tune");

    }

}


// ==================================================
// 11. CONTINUOUS TUNER LOOP
// ==================================================

function updatePitch(
    analyzer,
    sampleRate
) {

    // Create waveform buffer
    const buffer =
        new Float32Array(
            analyzer.fftSize
        );


    // Get microphone waveform
    analyzer.getFloatTimeDomainData(
        buffer
    );


    // Detect current pitch
    const result =
        autoCorrelate(
            buffer,
            sampleRate
        );


    // --------------------------------------------------
    // PROCESS DETECTED PITCH
    // --------------------------------------------------

    if (
        selectedNote !== null &&
        expectedPitch !== null &&
        result.frequency !== -1 &&
        isFinite(result.frequency)
    ) {

        const actualFrequency =
            result.frequency;


        // Calculate raw cents difference
        const cents =
            getCentsDifference(
                actualFrequency,
                expectedPitch
            );


        // Update visual meter
        updateMeter(cents);


        // --------------------------------------------------
        // DETERMINE TUNING STATUS
        // --------------------------------------------------

        let tuningStatus;


        if (
            Math.abs(smoothedCents) <=
            TUNING_THRESHOLD
        ) {

            tuningStatus = "TUNED";

        }
        else if (smoothedCents < 0) {

            tuningStatus = "FLAT";

        }
        else {

            tuningStatus = "SHARP";

        }


        // --------------------------------------------------
        // CONSOLE OUTPUT
        // --------------------------------------------------

        console.log(
            "NOTE:",
            selectedNote,
            "| EXPECTED:",
            expectedPitch.toFixed(2),
            "Hz",
            "| ACTUAL:",
            actualFrequency.toFixed(2),
            "Hz",
            "| CENTS:",
            cents.toFixed(2),
            "| SMOOTHED:",
            smoothedCents.toFixed(2),
            "| STATUS:",
            tuningStatus
        );

    }


    // --------------------------------------------------
    // CONTINUE LOOP
    // --------------------------------------------------

    requestAnimationFrame(() => {

        updatePitch(
            analyzer,
            sampleRate
        );

    });

}