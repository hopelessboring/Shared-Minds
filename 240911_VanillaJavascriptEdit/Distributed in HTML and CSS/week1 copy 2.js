// Get the input box and the canvas element
const inputBox = document.getElementById('inputBox');
const canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create a string to store the input values
let snakeString = '';

// Add event listener to the input box
inputBox.addEventListener('keydown', function (event) {
    // Check if the Enter key is pressed
    if (event.key === 'Enter') {
        const inputValue = inputBox.value;
        snakeString += inputValue; // Append the inputValue to the snakeString
        inputBox.value = '';
    }
});

// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse location
    inputBox.style.left = event.clientX + 'px';
    inputBox.style.top = event.clientY + 'px';
});

// Animation loop
function animate() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Update the position of the snakeString
    const x = (Math.sin(Date.now() * 0.001) * canvas.width * 0.4) + canvas.width * 0.5;
    const y = (Math.cos(Date.now() * 0.001) * canvas.height * 0.4) + canvas.height * 0.5;

    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(snakeString, x, y);

    requestAnimationFrame(animate); // Request the next animation frame
}

animate(); // Start the animation loop
