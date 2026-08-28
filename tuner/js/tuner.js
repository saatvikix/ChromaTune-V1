// ============================================================
// CHROMATUNE - TUNER PAGE
// ============================================================


// ============================================================
// 1. DOM ELEMENTS
// ============================================================

// Main tuner UI
const tunerMode = document.querySelector('#tuneMode');
const tuneScaleNote = document.querySelector('#currNote');

// Main guitar headstock SVG
const headstock = document.querySelector('#headstock');

// Six transparent buttons positioned over the tuning pegs
const pegButtons = [
    ...document.querySelectorAll('.pegBtn')
];


// ============================================================
// 2. GUITAR STRING CONFIGURATION
// ============================================================
//
// Standard guitar tuning:
//
//     1st string → E4  (high E)
//     2nd string → B3
//     3rd string → G3
//     4th string → D3
//     5th string → A2
//     6th string → E2  (low E)
//
// Physical layout we WANT:
//
//             LEFT          RIGHT
//
//              D3            G3
//              A2            B3
//              E2            E4
//
// Each button is explicitly connected to one note.
// We do NOT rely on the order of the buttons.
//
// ============================================================

const pegConfig = {

    // --------------------------------------------------------
    // RIGHT SIDE
    // --------------------------------------------------------

    firstPeg: {
        note: 'E4',
        peg: 'peg-E4',
        headstockString: 'string-E4-headstock',
        fretboardString: 'string-E4-fretboard'
    },

    secondPeg: {
        note: 'B3',
        peg: 'peg-B3',
        headstockString: 'string-B3-headstock',
        fretboardString: 'string-B3-fretboard'
    },

    thirdPeg: {
        note: 'G3',
        peg: 'peg-G3',
        headstockString: 'string-G3-headstock',
        fretboardString: 'string-G3-fretboard'
    },


    // --------------------------------------------------------
    // LEFT SIDE
    // --------------------------------------------------------

    fourthPeg: {
        note: 'D3',
        peg: 'peg-D3',
        headstockString: 'string-D3-headstock',
        fretboardString: 'string-D3-fretboard'
    },

    fifthPeg: {
        note: 'A2',
        peg: 'peg-A2',
        headstockString: 'string-A2-headstock',
        fretboardString: 'string-A2-fretboard'
    },

    sixthPeg: {
        note: 'E2',
        peg: 'peg-E2',
        headstockString: 'string-E2-headstock',
        fretboardString: 'string-E2-fretboard'
    }

};


// ============================================================
// 3. POSITION PEG BUTTONS
// ============================================================
//
// Each HTML button is positioned directly over the SVG peg
// it belongs to.
//
// We find the peg's real screen coordinates, then place the
// transparent button at its centre.
//
// This keeps the buttons aligned even when the SVG scales.
// ============================================================

function positionPegButtons() {

    const containerRect =
        headstock.parentElement.getBoundingClientRect();


    pegButtons.forEach(button => {

        // Find the configuration for this button.
        const config =
            pegConfig[button.id];


        if (!config) {
            console.warn(
                `No peg configuration found for #${button.id}`
            );

            return;
        }


        // Find the actual peg inside the SVG.
        const peg =
            headstock.querySelector(
                `#${config.peg} use`
            );


        if (!peg) {
            return;
        }


        // Get the peg's position on the screen.
        const pegRect =
            peg.getBoundingClientRect();


        // Put the button at the centre of the peg.
        button.style.left =
            `${pegRect.left + pegRect.width / 2 - containerRect.left}px`;

        button.style.top =
            `${pegRect.top + pegRect.height / 2 - containerRect.top}px`;

    });

}


// ============================================================
// 4. LOAD THE HEADSTOCK SVG
// ============================================================
//
// The artwork remains a separate SVG file:
//
//     ./graphics/headstock.svg
//
// We load its contents into:
//
//     <svg id="headstock"></svg>
//
// This makes the individual pegs and strings accessible
// through JavaScript.
// ============================================================

fetch("./graphics/headstock.svg")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                `SVG failed to load: ${response.status}`
            );
        }

        return response.text();

    })

    .then(svgText => {

        // Turn the SVG text into a DOM document.
        const parser = new DOMParser();

        const svgDocument =
            parser.parseFromString(
                svgText,
                "image/svg+xml"
            );


        // Get the loaded <svg> element.
        const loadedSvg =
            svgDocument.documentElement;


        // Preserve the original SVG coordinate system.
        headstock.setAttribute(
            "viewBox",
            loadedSvg.getAttribute("viewBox")
        );


        // Preserve aspect-ratio behaviour.
        headstock.setAttribute(
            "preserveAspectRatio",
            loadedSvg.getAttribute(
                "preserveAspectRatio"
            ) || "xMidYMid meet"
        );


        // Insert only the contents of the external SVG.
        headstock.innerHTML =
            loadedSvg.innerHTML;


        // Now that the SVG exists in the DOM,
        // position the transparent buttons.
        positionPegButtons();

    })

    .catch(error => {

        console.error(
            "Could not load headstock SVG:",
            error
        );

    });


// ============================================================
// 5. KEEP PEG BUTTONS ALIGNED ON RESIZE
// ============================================================

window.addEventListener(
    'resize',
    positionPegButtons
);


// ============================================================
// 6. ACTIVATE A STRING
// ============================================================
//
// This function controls the COMPLETE visual state of one
// guitar string.
//
// For example:
//
//     activateString(pegConfig.fifthPeg);
//
// activates:
//
//     peg-A2
//     string-A2-headstock
//     string-A2-fretboard
//
// Everything else is returned to its normal state.
// ============================================================

function activateString(config) {

    // --------------------------------------------------------
    // Clear the previous selection.
    // --------------------------------------------------------

    headstock
        .querySelectorAll('.active')
        .forEach(element => {

            element.classList.remove('active');

        });


    // --------------------------------------------------------
    // Find all three pieces belonging to this string.
    // --------------------------------------------------------

    const peg =
        headstock.querySelector(
            `#${config.peg}`
        );


    const headstockString =
        headstock.querySelector(
            `#${config.headstockString}`
        );


    const fretboardString =
        headstock.querySelector(
            `#${config.fretboardString}`
        );


    // --------------------------------------------------------
    // Activate the tuning peg.
    // --------------------------------------------------------

    if (peg) {
        peg.classList.add('active');
    }


    // --------------------------------------------------------
    // Activate the string on the headstock.
    // --------------------------------------------------------

    if (headstockString) {
        headstockString.classList.add('active');
    }


    // --------------------------------------------------------
    // Activate the same string on the fretboard.
    // --------------------------------------------------------

    if (fretboardString) {
        fretboardString.classList.add('active');
    }


    // --------------------------------------------------------
    // DEBUGGING
    // --------------------------------------------------------
    //
    // These messages are useful while we're building this.
    // You can remove them later.
    //

    console.log(
        `Selected string: ${config.note}`
    );

    console.log(
        'Peg:',
        peg
    );

    console.log(
        'Headstock string:',
        headstockString
    );

    console.log(
        'Fretboard string:',
        fretboardString
    );

}


// ============================================================
// 7. PEG BUTTON INTERACTION
// ============================================================
//
// Clicking a button:
//
//     1. Determines which guitar string it represents.
//     2. Updates the tuner note.
//     3. Activates the peg.
//     4. Activates the headstock string.
//     5. Activates the fretboard string.
// ============================================================

pegButtons.forEach(button => {

    button.addEventListener('click', () => {

        const config =
            pegConfig[button.id];


        if (!config) {
            console.warn(
                `No configuration found for #${button.id}`
            );

            return;
        }


        // Update the big note display.
        tuneScaleNote.textContent =
            config.note;


        // Activate the complete string.
        activateString(config);

    });

});


// ============================================================
// 8. OLD STRING BUTTON REFERENCES
// ============================================================
//
// Kept for later use.
// ============================================================

const stringButtons = [

    document.querySelector("#firstString"),
    document.querySelector("#secondString"),
    document.querySelector("#thirdString"),
    document.querySelector("#fourthString"),
    document.querySelector("#fifthString"),
    document.querySelector("#sixthString")

];


// ============================================================
// 9. TUNER MODE BUTTONS
// ============================================================

const tuneModeButtons = [

    document.querySelector('#standardBtn'),
    document.querySelector('#manualBtn')

];


tuneModeButtons.forEach(button => {

    button.addEventListener('click', () => {

        // Clear the selected state from both buttons.
        tuneModeButtons.forEach(mode => {

            mode.classList.remove(
                "selectedModeButton"
            );

        });


        // Select the clicked mode.
        button.classList.add(
            "selectedModeButton"
        );

    });

});