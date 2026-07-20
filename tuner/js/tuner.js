const tunerMode = document.querySelector('#tuneMode');
const metronomeMode = document.querySelector('#metronomeMode'); 
const tuneScaleNote = document.querySelector('#currNote');


const stringButtons = [
    document.querySelector("#firstString"),
    document.querySelector("#secondString"),
    document.querySelector("#thirdString"),
    document.querySelector("#fourthString"),
    document.querySelector("#fifthString"),
    document.querySelector("#sixthString")
];

const tuneModeButtons = [
    document.querySelector('#standardBtn'),
    document.querySelector('#manualBtn'),
]

tuneModeButtons.forEach(button => {

    button.addEventListener('click', ()=> {

        tuneModeButtons.forEach(mode=> {
            mode.classList.remove("selectedButtons");
        })

        button.classList.add("selectedButtons");
    })

});

stringButtons.forEach(button => {

    button.addEventListener("click", () => {

        stringButtons.forEach(btn => {
            btn.classList.remove("selectedButtons");
        });

        button.classList.add("selectedButtons");
        tuneScaleNote.textContent = button.textContent;

    });

});



// let tunerToggle = true;


// tunerMode.addEventListener('click', ()=> {

//     if(tunerToggle) {
//         tunerToggle = false;
//         console.log('tuner is now false');
//         return;
//     }
//     else {
//         tunerToggle = true;
//         console.log('tuner is now true');
//         return;
//     }

// })





//========================================