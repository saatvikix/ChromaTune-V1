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


// Stores the string currently being tuned.
let selectedNote = null;
let expectedPitch = null;


// Web Audio API objects.
let audioContext = null;
let analyzer = null;
let microphoneStream = null;


// A string is considered in tune when it is within
// this many cents of the target frequency.
const TUNING_THRESHOLD = 10;


// Used to make the meter movement less jumpy.
const SMOOTHING_FACTOR = 0.15;

let smoothedCents = 0;
let hasPitch = false;


function selectString(note, frequency) {
    selectedNote = note;
    expectedPitch = frequency;

    // Start the meter from the centre whenever
    // the user selects a different string.
    smoothedCents = 0;
    hasPitch = false;

    // Ask for microphone access only once.
    if (!audioContext) {
        startPitchDetection();
    }
}


async function startPitchDetection() {
    try {
        // Get live audio from the microphone.
        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioContext = new AudioContext();

        // Convert the microphone stream into an
        // audio source that Web Audio can process.
        const source =
            audioContext.createMediaStreamSource(
                microphoneStream
            );

        analyzer =
            audioContext.createAnalyser();

        // Number of samples we read from the microphone
        // for each pitch detection step.
        analyzer.fftSize = 2048;

        source.connect(analyzer);

        // Start continuously checking the microphone.
        updatePitch(
            analyzer,
            audioContext.sampleRate
        );

    } catch (error) {
        console.error(
            "Audio initialization error:",
            error
        );

        updateTunerStatus("ACCESS DENIED");
    }
}


function autoCorrelate(buffer, sampleRate) {
    const size = buffer.length;


    // Check whether there is enough sound to
    // meaningfully detect a pitch.
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


    // Remove DC offset so the waveform is centred
    // around zero before calculating correlation.
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


    // We only care about frequencies that are
    // reasonable for a guitar.
    const MIN_FREQUENCY = 70;
    const MAX_FREQUENCY = 400;


    // Frequency and period are related by:
    //
    // frequency = sampleRate / period
    //
    // Here, lag represents the period in samples.
    const minLag =
        Math.floor(sampleRate / MAX_FREQUENCY);

    const maxLag =
        Math.ceil(sampleRate / MIN_FREQUENCY);


    // Compare the waveform with shifted versions
    // of itself. A strong correlation means the
    // waveform is repeating at that lag.
    const correlations =
        new Float32Array(maxLag + 2);

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
            const a = centeredBuffer[i];
            const b = centeredBuffer[i + lag];

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

        // Normalise the correlation so that
        // different signal strengths can be compared.
        correlations[lag] =
            correlation /
            Math.sqrt(
                energyA * energyB
            );
    }


    // Find local peaks in the correlation data.
    // These are possible repeating periods.
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


    // Find the strongest correlation peak.
    let strongestPeak = peaks[0];

    for (const peak of peaks) {
        if (
            peak.correlation >
            strongestPeak.correlation
        ) {
            strongestPeak = peak;
        }
    }


    // The strongest peak is not always the
    // fundamental frequency. Look for an earlier
    // peak that is almost as strong.
    const strengthThreshold =
        strongestPeak.correlation * 0.85;

    let selectedPeak = strongestPeak;

    for (const peak of peaks) {
        if (
            peak.lag < strongestPeak.lag &&
            peak.correlation >= strengthThreshold
        ) {
            selectedPeak = peak;
            break;
        }
    }


    // The correlation peak may fall between two
    // integer sample positions. Interpolation gives
    // us a more accurate estimate of the lag.
    const lag = selectedPeak.lag;

    const left =
        correlations[lag - 1];

    const center =
        correlations[lag];

    const right =
        correlations[lag + 1];

    let refinedLag = lag;

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

        if (Math.abs(offset) <= 1) {
            refinedLag =
                lag + offset;
        }
    }


    // Convert the detected period into frequency.
    const frequency =
        sampleRate / refinedLag;


    // Convert the correlation strength into a
    // simple 0-100 clarity value.
    const clarity =
        Math.max(
            0,
            Math.min(
                100,
                selectedPeak.correlation * 100
            )
        );


    // Reject anything outside our expected
    // guitar frequency range.
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


function getCentsDifference(
    actualFrequency,
    expectedFrequency
) {
    // One octave contains 1200 cents.
    // 0 cents means the two frequencies match.
    return 1200 *
        Math.log2(
            actualFrequency /
            expectedFrequency
        );
}


function updateTunerDisplay(cents) {
    const MAX_CENTS = 50;

    // The meter only displays a range of -50 to +50.
    const limitedCents =
        Math.max(
            -MAX_CENTS,
            Math.min(MAX_CENTS, cents)
        );


    // Smooth the value so the meter does not
    // jump around with every microphone sample.
    if (!hasPitch) {
        smoothedCents = limitedCents;
        hasPitch = true;
    } else {
        smoothedCents =
            smoothedCents +
            (
                limitedCents -
                smoothedCents
            ) *
            SMOOTHING_FACTOR;
    }


    const roundedCents =
        Math.round(smoothedCents);

    let status;

    if (
        Math.abs(smoothedCents) <=
        TUNING_THRESHOLD
    ) {
        status = "TUNED";
    } else if (smoothedCents < 0) {
        status = "FLAT";
    } else {
        status = "SHARP";
    }


    // interactivity.js handles the actual page elements.
    updateTunerUI(
        smoothedCents,
        roundedCents,
        status
    );
}


function updatePitch(
    analyzer,
    sampleRate
) {
    const buffer =
        new Float32Array(
            analyzer.fftSize
        );

    // Copy the latest microphone samples
    // into our buffer.
    analyzer.getFloatTimeDomainData(
        buffer
    );


    // Try to find the fundamental frequency
    // of the current microphone input.
    const result =
        autoCorrelate(
            buffer,
            sampleRate
        );


    if (
        selectedNote !== null &&
        expectedPitch !== null &&
        result.frequency !== -1 &&
        isFinite(result.frequency)
    ) {
        const actualFrequency =
            result.frequency;

        const cents =
            getCentsDifference(
                actualFrequency,
                expectedPitch
            );

        updateTunerDisplay(cents);


        // Useful while developing/testing the tuner.
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
            Math.abs(smoothedCents) <= TUNING_THRESHOLD
                ? "TUNED"
                : smoothedCents < 0
                    ? "FLAT"
                    : "SHARP"
        );
    }


    // Run the pitch detector again on the next
    // browser animation frame.
    requestAnimationFrame(() => {
        updatePitch(
            analyzer,
            sampleRate
        );
    });
}


function updateTunerStatus(status) {
    const statusText =
        document.querySelector("#statusText");

    if (statusText) {
        statusText.textContent = status;
    }
}