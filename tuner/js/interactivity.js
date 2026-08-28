// ============================================================
// CHROMATUNE - TUNER PAGE
// ============================================================


// ============================================================
// 1. DOM ELEMENTS
// ============================================================

// Main tuner UI
const tuneScaleNote = document.querySelector('#currNote');

// Main guitar SVG
const headstock = document.querySelector('#headstock');

// Six clickable note labels
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
// Physical layout:
//
//             LEFT          RIGHT
//
//              D3            G3
//              A2            B3
//              E2            E4
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
// 3. POSITION NOTE LABELS
// ============================================================
//
// The HTML labels are positioned over the corresponding
// physical tuning pegs.
//
// The SVG can scale, so we calculate the position dynamically.
// ============================================================

function positionPegButtons() {

    const containerRect =
        headstock.parentElement.getBoundingClientRect();


    pegButtons.forEach(button => {

        // Find the configuration for this label.
        const config =
            pegConfig[button.id];


        if (!config) {
            return;
        }


        // Find the corresponding physical peg.
        const peg =
            headstock.querySelector(
                `#${config.peg} use`
            );


        if (!peg) {
            return;
        }


        // Get the peg's current screen position.
        const pegRect =
            peg.getBoundingClientRect();


        // Position the interaction area at the centre
        // of the physical peg.
        button.style.left =
            `${pegRect.left + pegRect.width / 2 - containerRect.left}px`;

        button.style.top =
            `${pegRect.top + pegRect.height / 2 - containerRect.top}px`;

    });

}


// ============================================================
// 4. LOAD THE HEADSTOCK SVG
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

        // Parse the external SVG.
        const parser = new DOMParser();

        const svgDocument =
            parser.parseFromString(
                svgText,
                "image/svg+xml"
            );


        // Get the root <svg>.
        const loadedSvg =
            svgDocument.documentElement;


        // Preserve the original coordinate system.
        headstock.setAttribute(
            "viewBox",
            loadedSvg.getAttribute("viewBox")
        );


        // Preserve aspect ratio.
        headstock.setAttribute(
            "preserveAspectRatio",
            loadedSvg.getAttribute(
                "preserveAspectRatio"
            ) || "xMidYMid meet"
        );


        // Insert the SVG artwork.
        headstock.innerHTML =
            loadedSvg.innerHTML;


        // SVG is ready.
        positionPegButtons();

    })

    .catch(error => {

        console.error(
            "Could not load headstock SVG:",
            error
        );

    });


// ============================================================
// 5. KEEP LABELS ALIGNED
// ============================================================

window.addEventListener(
    'resize',
    positionPegButtons
);


// ============================================================
// 6. ACTIVATE A STRING
// ============================================================
//
// This function handles the complete selected state.
//
// Example:
//
//     activateString(pegConfig.fifthPeg);
//
// results in:
//
//     A peg              → active
//     A dots             → visible
//     A headstock string → red
//     A fretboard string → red
//
// ============================================================

function activateString(config) {

    // --------------------------------------------------------
    // Clear the previous selection
    // --------------------------------------------------------

    // Remove active state from all note labels.
    pegButtons.forEach(button => {

        button.classList.remove('active');

    });


    // Remove active state from all SVG elements.
    headstock
        .querySelectorAll('.active')
        .forEach(element => {

            element.classList.remove('active');

        });


    // --------------------------------------------------------
    // Find the selected peg
    // --------------------------------------------------------

    const peg =
        headstock.querySelector(
            `#${config.peg}`
        );


    // --------------------------------------------------------
    // Find the selected strings
    // --------------------------------------------------------

    const headstockString =
        headstock.querySelector(
            `#${config.headstockString}`
        );


    const fretboardString =
        headstock.querySelector(
            `#${config.fretboardString}`
        );


    // --------------------------------------------------------
    // Find the dot matrix
    // --------------------------------------------------------

    const pegDots =
        peg?.querySelector(
            '.peg-dots'
        );


    // --------------------------------------------------------
    // Activate the corresponding note label
    // --------------------------------------------------------

    const selectedButton =
        document.querySelector(
            `#${getButtonId(config)}`
        );


    if (selectedButton) {
        selectedButton.classList.add('active');
    }


    // --------------------------------------------------------
    // Activate the tuning peg
    // --------------------------------------------------------

    if (peg) {
        peg.classList.add('active');
    }


    // --------------------------------------------------------
    // Show the dot matrix
    // --------------------------------------------------------

    if (pegDots) {
        pegDots.classList.add('active');
    }


    // --------------------------------------------------------
    // Activate the headstock portion of the string
    // --------------------------------------------------------

    if (headstockString) {
        headstockString.classList.add('active');
    }


    // --------------------------------------------------------
    // Activate the fretboard portion of the string
    // --------------------------------------------------------

    if (fretboardString) {
        fretboardString.classList.add('active');
    }

}


// ============================================================
// 7. FIND BUTTON ID FROM CONFIG
// ============================================================

function getButtonId(config) {

    return Object.keys(pegConfig)
        .find(id => pegConfig[id] === config);

}


// ============================================================
// 8. NOTE LABEL INTERACTION
// ============================================================
//
// Clicking the visible E/B/G/D/A label:
//
//     → updates the tuner note
//     → activates the correct peg
//     → reveals its dots
//     → lights the entire string red
//
// ============================================================

pegButtons.forEach(button => {

    // --------------------------------------------------------
    // Mouse / touch
    // --------------------------------------------------------

    button.addEventListener('click', () => {

        const config =
            pegConfig[button.id];


        if (!config) {
            return;
        }


        // Update the big tuner note.
        tuneScaleNote.textContent =
            config.note;


        // Activate this string.
        activateString(config);

    });


    // --------------------------------------------------------
    // Keyboard accessibility
    // --------------------------------------------------------

    button.addEventListener('keydown', event => {

        if (
            event.key === 'Enter' ||
            event.key === ' '
        ) {

            event.preventDefault();

            button.click();

        }

    });

});