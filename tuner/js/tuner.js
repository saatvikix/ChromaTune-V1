const tuning = {
    firstPeg: {
        note: "E4",
        frequency: 329.63,
        peg: "peg-E4",
        headstockString: "string-E4-headstock",
        fretboardString: "string-E4-fretboard"
    },

    secondPeg: {
        note: "B3",
        frequency: 246.94,
        peg: "peg-B3",
        headstockString: "string-B3-headstock",
        fretboardString: "string-B3-fretboard"
    },

    thirdPeg: {
        note: "G3",
        frequency: 196.00,
        peg: "peg-G3",
        headstockString: "string-G3-headstock",
        fretboardString: "string-G3-fretboard"
    },

    fourthPeg: {
        note: "D3",
        frequency: 146.83,
        peg: "peg-D3",
        headstockString: "string-D3-headstock",
        fretboardString: "string-D3-fretboard"
    },

    fifthPeg: {
        note: "A2",
        frequency: 110.00,
        peg: "peg-A2",
        headstockString: "string-A2-headstock",
        fretboardString: "string-A2-fretboard"
    },

    sixthPeg: {
        note: "E2",
        frequency: 82.41,
        peg: "peg-E2",
        headstockString: "string-E2-headstock",
        fretboardString: "string-E2-fretboard"
    }
};

// ==================================================
// 2. TUNER STATE
// ==================================================

let selectedNote = null;
let expectedPitch = null;

let audioContext = null;
let analyzer = null;
let microphoneStream = null;

function selectString(note, frequency) {
    selectedNote = note;
    expectedPitch = frequency;

    smoothedCents = 0;
    hasPitch = false;

    if (meterNeedle) {
        meterNeedle.style.left = "50%";
        meterNeedle.classList.remove("in-tune");
    }

    if (currNote) {
        currNote.textContent = note;
    }

    if (centsOffset) {
        centsOffset.textContent = "+00";
    }

    if (!audioContext) {
        startPitchDetection();
    }
}


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

// METER
const meterNeedle = document.querySelector("#meterNeedle");
const centsOffset = document.querySelector("#centsOffset");
const currNote = document.querySelector("#currNote");


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


    // ==================================================
    // 1. RMS / VOLUME CHECK
    // ==================================================

    let sum = 0;

    for (let i = 0; i < size; i++) {
        sum += buffer[i] * buffer[i];
    }

    const rms = Math.sqrt(sum / size);

    if (rms < 0.01) {
        return {
            frequency: -1,
            clarity: 0
        };
    }


    // ==================================================
    // 2. REMOVE DC OFFSET
    // ==================================================

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


    // ==================================================
    // 3. GUITAR FREQUENCY RANGE
    // ==================================================

    const MIN_FREQUENCY = 70;
    const MAX_FREQUENCY = 400;

    const minLag =
        Math.floor(sampleRate / MAX_FREQUENCY);

    const maxLag =
        Math.ceil(sampleRate / MIN_FREQUENCY);


    // ==================================================
    // 4. AUTOCORRELATION
    // ==================================================

    const correlations = new Float32Array(
        maxLag + 2
    );


    for (
        let lag = minLag;
        lag <= maxLag;
        lag++
    ) {

        let correlation = 0;
        let energyA = 0;
        let energyB = 0;


        for (
            let i = 0;
            i < size - lag;
            i++
        ) {

            const a =
                centeredBuffer[i];

            const b =
                centeredBuffer[i + lag];

            correlation += a * b;

            energyA += a * a;
            energyB += b * b;

        }


        if (
            energyA === 0 ||
            energyB === 0
        ) {
            correlations[lag] = 0;
            continue;
        }


        correlations[lag] =
            correlation /
            Math.sqrt(
                energyA * energyB
            );
    }


    // ==================================================
    // 5. FIND LOCAL PEAKS
    // ==================================================

    const peaks = [];

    for (
        let lag = minLag + 1;
        lag < maxLag - 1;
        lag++
    ) {

        const previous =
            correlations[lag - 1];

        const current =
            correlations[lag];

        const next =
            correlations[lag + 1];


        if (
            current > previous &&
            current >= next
        ) {

            peaks.push({
                lag,
                correlation: current
            });

        }

    }


    if (peaks.length === 0) {

        return {
            frequency: -1,
            clarity: 0
        };

    }


    // ==================================================
    // 6. FIND THE STRONGEST CORRELATION
    // ==================================================

    let strongestPeak =
        peaks[0];

    for (const peak of peaks) {

        if (
            peak.correlation >
            strongestPeak.correlation
        ) {

            strongestPeak =
                peak;

        }

    }


    // ==================================================
    // 7. FUNDAMENTAL PEAK SELECTION
    // ==================================================

    /*
        Guitar waveforms can produce strong
        subharmonic peaks.

        Therefore, don't automatically trust
        the strongest peak.

        Look for an earlier peak that is
        sufficiently strong compared to the
        strongest one.
    */

    const strengthThreshold =
        strongestPeak.correlation * 0.85;


    let selectedPeak =
        strongestPeak;


    for (const peak of peaks) {

        if (
            peak.lag < strongestPeak.lag &&
            peak.correlation >= strengthThreshold
        ) {

            selectedPeak =
                peak;

            break;

        }

    }


    // ==================================================
    // 8. PARABOLIC INTERPOLATION
    // ==================================================

    const lag =
        selectedPeak.lag;


    const left =
        correlations[lag - 1];

    const center =
        correlations[lag];

    const right =
        correlations[lag + 1];


    let refinedLag =
        lag;


    const denominator =
        left -
        2 * center +
        right;


    if (
        Math.abs(denominator) >
        0.000001
    ) {

        const offset =
            0.5 *
            (left - right) /
            denominator;


        if (
            Math.abs(offset) <= 1
        ) {

            refinedLag =
                lag + offset;

        }

    }


    // ==================================================
    // 9. PERIOD → FREQUENCY
    // ==================================================

    const frequency =
        sampleRate / refinedLag;


    // ==================================================
    // 10. CLARITY
    // ==================================================

    const clarity =
        Math.max(
            0,
            Math.min(
                100,
                selectedPeak.correlation * 100
            )
        );


    // ==================================================
    // 11. FINAL VALIDATION
    // ==================================================

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