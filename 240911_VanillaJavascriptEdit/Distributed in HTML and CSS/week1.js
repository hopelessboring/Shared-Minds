// Get the input box and the canvas element
const inputBox = document.getElementById('inputBox');
const canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create an array to store the character objects
let Characters = [];

// Add event listener to the input box
inputBox.addEventListener('keydown', function (event) {
    // Check if the Enter key is pressed
    if (event.key === 'Enter') {
        const inputValue = inputBox.value;
        // Create a character object for each input value
        for (let i = 0; i < inputValue.length; i++) {
            const character = {
                value: inputValue[i],
                x: canvas.width * 0.5,
                y: canvas.height * 0.5,
                dx: Math.random() * 2 - 1, // Random velocity in x direction
                dy: Math.random() * 2 - 1, // Random velocity in y direction
            };
            Characters.push(character);
        }
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

    // Update the position of each character
    for (let i = 0; i < Characters.length; i++) {
        const character = Characters[i];
        character.x += character.dx;
        character.y += character.dy;

        // Wrap around the screen edges
        if (character.x < 0) character.x = canvas.width;
        if (character.x > canvas.width) character.x = 0;
        if (character.y < 0) character.y = canvas.height;
        if (character.y > canvas.height) character.y = 0;

        ctx.font = '30px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(character.value, character.x, character.y);
    }

    requestAnimationFrame(animate); // Request the next animation frame
}

animate(); // Start the animation loop
