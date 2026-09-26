const headstock =
    document.querySelector("#headstock");

const pegButtons =
    document.querySelectorAll(".pegBtn");


function positionPegButtons() {
    const containerRect =
        headstock.parentElement.getBoundingClientRect();

    pegButtons.forEach(button => {
        const config = tuning[button.id];

        if (!config) {
            return;
        }


        // Find the SVG peg corresponding to this button.
        const peg =
            headstock.querySelector(
                `#${config.peg} use`
            );

        if (!peg) {
            return;
        }

        const pegRect =
            peg.getBoundingClientRect();


        // Position the HTML button at the centre
        // of the corresponding SVG peg.
        button.style.left =
            `${pegRect.left + pegRect.width / 2 - containerRect.left}px`;

        button.style.top =
            `${pegRect.top + pegRect.height / 2 - containerRect.top}px`;
    });
}


async function loadHeadstock() {
    try {
        // Load the SVG file so we can manipulate
        // its individual elements with JavaScript.
        const response =
            await fetch("./graphics/headstock.svg");

        if (!response.ok) {
            throw new Error(
                `SVG failed to load: ${response.status}`
            );
        }

        const svgText =
            await response.text();


        // Convert the SVG text into a DOM document.
        const parser =
            new DOMParser();

        const svgDocument =
            parser.parseFromString(
                svgText,
                "image/svg+xml"
            );

        const loadedSvg =
            svgDocument.documentElement;


        // Copy the important SVG properties
        // into the SVG already present in the page.
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


        // Insert the actual SVG elements into
        // our existing #headstock element.
        headstock.innerHTML =
            loadedSvg.innerHTML;


        positionPegButtons();

    } catch (error) {
        console.error(
            "Could not load headstock SVG:",
            error
        );
    }
}


function activateString(
    config,
    selectedButton
) {
    // Remove the previous active state from
    // both the buttons and the SVG.
    pegButtons.forEach(button => {
        button.classList.remove("active");
    });

    headstock
        .querySelectorAll(".active")
        .forEach(element => {
            element.classList.remove("active");
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
        peg?.querySelector(".peg-dots");


    // Activate the selected button.
    if (selectedButton) {
        selectedButton.classList.add("active");
    }

    // Activate the corresponding SVG elements.
    if (peg) {
        peg.classList.add("active");
    }

    if (pegDots) {
        pegDots.classList.add("active");
    }

    if (headstockString) {
        headstockString.classList.add("active");
    }

    if (fretboardString) {
        fretboardString.classList.add("active");
    }
}


function updateTunerStatus(status) {
    const statusText =
        document.querySelector("#statusText");

    if (statusText) {
        statusText.textContent = status;
    }
}

function updateTunerUI(
    cents,
    roundedCents,
    status
) {
    const meterNeedle =
        document.querySelector("#meterNeedle");

    const centsOffset =
        document.querySelector("#centsOffset");

    const currNote =
        document.querySelector("#currNote");

    const statusText =
        document.querySelector("#statusText");

    const statusDot =
        document.querySelector("#statusDot");


    const MAX_CENTS = 50;


    // Convert the cents value into a position
    // on the meter. 0 cents is the centre.
    const position =
        50 +
        (cents / MAX_CENTS) * 50;


    if (meterNeedle) {
        meterNeedle.style.left =
            `${position}%`;

        if (status === "TUNED") {
            meterNeedle.classList.add("in-tune");
        } else {
            meterNeedle.classList.remove("in-tune");
        }
    }


    // Display the cents with a + sign for sharp
    // notes and +00 when perfectly in tune.
    if (centsOffset) {
        if (roundedCents > 0) {
            centsOffset.textContent =
                `+${String(roundedCents).padStart(2, "0")}`;
        } else if (roundedCents < 0) {
            centsOffset.textContent =
                `${roundedCents}`;
        } else {
            centsOffset.textContent =
                "+00";
        }
    }


    if (currNote && selectedNote !== null) {
        currNote.textContent =
            selectedNote;
    }


    if (statusText) {
        statusText.textContent =
            status;
    }


    if (statusDot) {
        statusDot.classList.toggle(
            "listening",
            status === "TUNED" ||
            status === "FLAT" ||
            status === "SHARP"
        );
    }
}


function resetTunerUI(note) {
    const meterNeedle =
        document.querySelector("#meterNeedle");

    const centsOffset =
        document.querySelector("#centsOffset");

    const currNote =
        document.querySelector("#currNote");


    // Reset the meter whenever a new string
    // is selected.
    if (meterNeedle) {
        meterNeedle.style.left = "50%";
        meterNeedle.classList.remove("in-tune");
    }

    if (centsOffset) {
        centsOffset.textContent = "+00";
    }

    if (currNote) {
        currNote.textContent = note;
    }
}


pegButtons.forEach(button => {

    button.addEventListener("click", () => {
        const config =
            tuning[button.id];

        if (!config) {
            return;
        }


        // Tell the tuner which frequency
        // it should listen for.
        selectString(
            config.note,
            config.frequency
        );


        // Update the visual interface.
        resetTunerUI(config.note);

        activateString(
            config,
            button
        );
    });


    // Allow keyboard users to select a string
    // using Enter or Space.
    button.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                button.click();
            }
        }
    );
});


window.addEventListener(
    "resize",
    positionPegButtons
);


// Load the headstock when the page starts.
loadHeadstock();