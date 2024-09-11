// Get the input box and the canvas element
const inputBox = document.getElementById('inputBox');
const canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define the invisible circle
const circleRadius = 0.3 * window.innerWidth; // 30vw
const circleCenterX = window.innerWidth / 2;
const circleCenterY = window.innerHeight / 2;

// Add event listener to the input box
inputBox.addEventListener('keydown', function (event) {
    // Check if the Enter key is pressed
    if (event.key === 'Enter') {
        const inputValue = inputBox.value;
        const ctx = canvas.getContext('2d');
        ctx.font = '30px Arial';

        // Calculate the position around the circle
        const angle = Math.random() * 2 * Math.PI;
        const x = circleCenterX + Math.cos(angle) * circleRadius;
        const y = circleCenterY + Math.sin(angle) * circleRadius;

        ctx.fillStyle = 'black';
        ctx.fillText(inputValue, x, y);
        inputBox.value = '';
    }
});

// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse location
    inputBox.style.left = event.clientX + 'px';
    inputBox.style.top = event.clientY + 'px';
});
