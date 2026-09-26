// DOM elements
const headstock = document.querySelector('#headstock');

const pegButtons = document.querySelectorAll(".pegBtn");

// Position note labels


function positionPegButtons() {

    const containerRect =
        headstock.parentElement.getBoundingClientRect();


    pegButtons.forEach(button => {

                const config = tuning[button.id];


        if (!config) {
            return;
        }


                const peg =
            headstock.querySelector(
                `#${config.peg} use`
            );


        if (!peg) {
            return;
        }


                const pegRect =
            peg.getBoundingClientRect();


                button.style.left =
            `${pegRect.left + pegRect.width / 2 - containerRect.left}px`;

        button.style.top =
            `${pegRect.top + pegRect.height / 2 - containerRect.top}px`;

    });

}


// Load headstock SVG

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

                const parser = new DOMParser();

        const svgDocument =
            parser.parseFromString(
                svgText,
                "image/svg+xml"
            );


                const loadedSvg =
            svgDocument.documentElement;


                headstock.setAttribute(
            "viewBox",
            loadedSvg.getAttribute("viewBox")
        );


                headstock.setAttribute(
            "preserveAspectRatio",
            loadedSvg.getAttribute(
                "preserveAspectRatio"
            ) || "xMidYMid meet"
        );


                headstock.innerHTML =
            loadedSvg.innerHTML;


                positionPegButtons();

    })

    .catch(error => {

        console.error(
            "Could not load headstock SVG:",
            error
        );

    });


// Keep labels aligned

window.addEventListener(
    'resize',
    positionPegButtons
);


// Activate selected string
//
// This function handles the complete selected state.
//
// Example:
//
//     activateString(tuning.fifthPeg, button);
//
// results in:
//
//     A peg              → active
//     A dots             → visible
//     A headstock string → red
//     A fretboard string → red
//
// ============================================================

function activateString(config, selectedButton) {

        pegButtons.forEach(button => {
        button.classList.remove('active');
    });

        headstock
        .querySelectorAll('.active')
        .forEach(element => {
            element.classList.remove('active');
        });

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

    const pegDots =
        peg?.querySelector('.peg-dots');


        if (selectedButton) {
        selectedButton.classList.add('active');
    }

    if (peg) {
        peg.classList.add('active');
    }

    if (pegDots) {
        pegDots.classList.add('active');
    }

    if (headstockString) {
        headstockString.classList.add('active');
    }

    if (fretboardString) {
        fretboardString.classList.add('active');
    }
}


// Note label interaction
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

    button.addEventListener("click", () => {

        const config = tuning[button.id];

        if (!config) {
            return;
        }

        selectString(
            config.note,
            config.frequency
        );

        activateString(config, button);
    });

    button.addEventListener("keydown", event => {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            button.click();
        }

    });

});

