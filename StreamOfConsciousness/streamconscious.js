// Steven Phan
// 240917 | Stream of Consciousness 
// the basis for this code was inspired by an example from Dan O'Sullivan in his NYU ITP class Shared Minds. 
// I'm building out this specific project for a joint project in both Shared Minds and Connections Lab. 

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let inputBox;
let highCorrelationWords = [];
let lowCorrelationWords = [];

const url = "https://replicate-api-proxy.glitch.me/create_n_get/";

resizeCanvas();
init();

window.onload = function () {
    // changetext();
    myInput();
};

function init() {
    // Perform initialization logic here
    // initInterface();
    const ctx = canvas.getContext('2d');
    // ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function myInput() {
    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputField');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    document.body.appendChild(inputBox);

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            askWord(inputValue, 4);
            askWord(inputValue, 8);
        }
    });

    // Log to check if inputText is properly attached
    console.log("Input element added to DOM: ", inputBox);
}

function simulateEnterKeyPress(inputElement) {
    const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',        // Simulate the 'Enter' key
        keyCode: 13,         // Enter key code
        code: 'Enter',
        which: 13,
        bubbles: true,       // Ensures the event bubbles up
    });

    inputElement.dispatchEvent(enterEvent);  // Trigger the keydown event
}

// keep working on this
// add a means of keeping track of the entire array of selected central ideas
// add a function to click a returned value to make it the central idea

async function askWord(word, ideaNodes) {
    let prompt;
    console.log("ASK WORD FUNCTION FIRED");
    if (ideaNodes == 4) {
        prompt = "a json list of " + ideaNodes + " words related to " + word;
    }
    if (ideaNodes == 8) {
        prompt = "a json list of " + ideaNodes + " creative words that are analagously related to " + word;
    }
    console.log("Prompt is: ", prompt);
    document.body.style.cursor = "progress";
    const data = {
        //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
        //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
        "version": "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48",

        input: {
            prompt: prompt,
            max_tokens: 100,
            max_length: 100,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    console.log("Raw Response", raw_response);
    //turn it into json
    const json_response = await raw_response.json();
    document.body.style.cursor = "auto";
    console.log("JSON Response", json_response);
    let textResponse = json_response.output.join("").split(":")[1].trim();
    if (ideaNodes == 4) {
        console.log("High Correlation Words: ", textResponse);
        highCorrelationWords = textResponse
            .split(/\d+/) // Split by digits
            .map(word => word.trim().replace(/\./g, "")) // Trim and remove periods
            .filter(word => word.length > 0); // Filter out empty strings
    }
    else {
        console.log("Low Correlation Words: ", textResponse);
        textResponse = textResponse.split('\n\n')[0]; // Keep only the part before the sequence of \n\n
        lowCorrelationWords = textResponse
            .split(/\d+/) // Split by digits
            .map(word => word.trim().replace(/\./g, "")) // Trim and remove periods
            .filter(word => word.length > 0); // Filter out empty strings
    
    }

    drawWord(word, ideaNodes);
}

function drawWord(word, ideaNodes) {
    function updateInputBox(div) {
        div.addEventListener('click', () => {
            inputBox.value = div.textContent;  // Set the clicked div's text as the new input value
            simulateEnterKeyPress(inputBox);
            console.log("InputBox value updated to: ", inputBox.value);
        });
    }

    if (ideaNodes == 4) {
        const div8 = document.getElementById('item8');
        div8.textContent = highCorrelationWords[0];
        updateInputBox(div8);  // Add click event to update inputBox

        const div9 = document.getElementById('item9');
        div9.textContent = highCorrelationWords[1];
        updateInputBox(div9);  // Add click event to update inputBox

        const div10 = document.getElementById('item10');
        div10.textContent = highCorrelationWords[2];
        updateInputBox(div10);  // Add click event to update inputBox

        const div11 = document.getElementById('item11');
        div11.textContent = highCorrelationWords[3];
        updateInputBox(div11);  // Add click event to update inputBox
    }
    else if (ideaNodes == 8) {
        const div0 = document.getElementById('item0');
        div0.textContent = lowCorrelationWords[0];
        updateInputBox(div0);  // Add click event to update inputBox

        const div1 = document.getElementById('item1');
        div1.textContent = lowCorrelationWords[1];
        updateInputBox(div1);  // Add click event to update inputBox

        const div2 = document.getElementById('item2');
        div2.textContent = lowCorrelationWords[2];
        updateInputBox(div2);  // Add click event to update inputBox

        const div3 = document.getElementById('item3');
        div3.textContent = lowCorrelationWords[3];
        updateInputBox(div3);  // Add click event to update inputBox

        const div4 = document.getElementById('item4');
        div4.textContent = lowCorrelationWords[4];
        updateInputBox(div4);  // Add click event to update inputBox

        const div5 = document.getElementById('item5');
        div5.textContent = lowCorrelationWords[5];
        updateInputBox(div5);  // Add click event to update inputBox

        const div6 = document.getElementById('item6');
        div6.textContent = lowCorrelationWords[6];
        updateInputBox(div6);  // Add click event to update inputBox

        const div7 = document.getElementById('item7');
        div7.textContent = lowCorrelationWords[7];
        updateInputBox(div7);  // Add click event to update inputBox
    }   
}

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(ratio, ratio);  // Scale the context based on the device's pixel ratio
}