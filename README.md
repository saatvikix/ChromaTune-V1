# ChromaTune

**ChromaTune** is a browser-based toolkit for guitarists built using **HTML, CSS, JavaScript, and the Web Audio API**. It brings together a guitar tuner, metronome, chord library, and chord chart creator in a single web application.

The project was developed as a Web Fundamentals project with a focus on DOM manipulation, browser audio processing, dynamic user interfaces, and modular JavaScript.

## Access

Hit [https://saatvikix.github.io/ChromaTune-V1/](https://saatvikix.github.io/ChromaTune-V1/)

No installation is required to use the deployed version.

> The guitar tuner requires microphone permission in the browser.

## Features

### Guitar Tuner

- Captures microphone input using the **Web Audio API**.
- Detects the fundamental frequency of the incoming audio signal.
- Maps the detected frequency to the corresponding musical note.
- Displays tuning information through an interactive guitar-oriented interface.
- Supports standard guitar tuning: **E2, A2, D3, G3, B3, E4**.

### Metronome

- Adjustable tempo in **BPM**.
- Play and pause controls.
- Generates timed audio clicks directly in the browser.
- "Beats Per Measure" control mimics various time signatures.
- Provides visual feedback while the metronome is running.

### Chord Library

- Provides a collection of guitar chords through an interactive interface.
- Allows users to explore chord shapes and switch between available chords.
- Uses JavaScript to dynamically update chord information on the page.

### Chord Chart Creator

- Allows users to create chord charts for songs.
- Supports sections such as verses, choruses, and bridges.
- Dynamically creates measures and chord cells using JavaScript.
- Supports different rhythmic grid divisions for organizing chords within measures.
- Separates chart creation and chart viewing into dedicated interfaces.

## Technologies Used

- **HTML5** – page structure and application markup
- **CSS3** – styling, layouts, animations, and interface states
- **JavaScript** – application logic, DOM manipulation, events, and dynamic UI generation
- **Web Audio API** – microphone input, audio analysis, pitch detection, and browser-generated audio
- **Local Storage** – browser-side persistence for applicable application data

## Project Structure

ChromaTune is divided into independent feature modules for the:

- Guitar Tuner
- Metronome
- Chord Library
- Chord Chart Creator

Each feature maintains its own HTML, CSS, and JavaScript responsibilities, while shared navigation and common interface elements connect the individual parts of the application.

This structure keeps the functionality separated and makes each module easier to understand, maintain, and extend.

## Running Locally

The deployed version can be accessed directly from the link above, but the project can also be run locally.

### Prerequisites

- A modern browser such as Google Chrome, Microsoft Edge, or Firefox
- Microphone access for the tuner
- A local development server such as the **Live Server** extension for Visual Studio Code

### Steps

1. Clone the repository:

```bash
git clone https://github.com/saatvikix/ChromaTune-V1.git
```

2. Move into the project directory:

```bash
cd ChromaTune-V1
```

3. Open the project in Visual Studio Code or another code editor.

4. Start the application using a local development server.

If using **Live Server** in Visual Studio Code, open the required HTML entry page and select:

```text
Open with Live Server
```

5. Allow microphone permission when using the guitar tuner.

> Microphone access generally requires the project to be served through `localhost` or another secure context rather than opening the HTML files directly.

## What I Learned

Building ChromaTune provided practical experience with several core web-development concepts, including:

- DOM creation and manipulation
- JavaScript event handling
- Modular organization of frontend features
- Dynamic CSS classes and UI states
- Browser audio processing with the Web Audio API
- Frequency-to-note mapping for musical pitch detection
- Generating interface elements dynamically with JavaScript
- Maintaining application state in the browser
- Refactoring growing JavaScript code into clearer responsibilities

One of the main challenges of the project was making real-time pitch detection stable enough for guitar input, since a plucked string contains an initial transient, harmonics, and fluctuations before the detected pitch settles.

Another major learning area was the chord chart creator, where the interface is generated dynamically based on user actions rather than being completely predefined in HTML.

## Future Improvements

Possible future improvements include:

- Support for alternate guitar tunings
- Additional chord types and chord-library features (add, sus2, sus4, dim etc.)
- Improved pitch-detection stability across different instruments and microphones
- Exporting or sharing chord charts
- Improved responsiveness and mobile layouts
- Converting the project into a full-stack application with user accounts and cloud-based persistence

## License

This project is licensed under the **MIT License**.

See the `LICENSE` file for more information.

## Author

**Saatvik**
