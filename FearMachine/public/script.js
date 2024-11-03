const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Socket.io Setup
let socket = io.connect('http://localhost:3000');
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

window.onload = function () {
  resizeCanvas();
  mainButton();
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(ratio, ratio);
}

function mainButton() {
  const inputBox = document.createElement('button');
  inputBox.setAttribute('type', 'button');
  inputBox.setAttribute('id', 'mainButton');
  inputBox.textContent = "Unlock New Fears";
  inputBox.style.position = 'absolute';
  inputBox.style.left = '50%';
  inputBox.style.top = '50%';
  inputBox.style.transform = 'translate(-50%, -50%)';
  inputBox.style.zIndex = '100';
  document.body.appendChild(inputBox);

  inputBox.addEventListener('click', getNewFear);
}

function getNewFear() {
  console.log("GET FEAR FUNCTION FIRED");
  document.body.style.cursor = "progress";
  socket.emit('newFearClick', {
    buttonID: "inputBox",
    timestamp: Date.now()
  });
}

async function drawResponsesOnCanvas(nightmares) {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width;
  const scaleY = canvas.height;

  nightmares.forEach((nightmare) => {
    const { cleanResponse, lowDimEmbeddings } = nightmare;

    if (Array.isArray(lowDimEmbeddings) && lowDimEmbeddings.length >= 2) {
      const x = lowDimEmbeddings[0] * scaleX;
      const y = lowDimEmbeddings[1] * scaleY;

      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(cleanResponse, x, y);
    }
  });
}

// Listen for server event to fetch and draw new data
socket.on('newDataReady', () => {
  fetch('/nightmares')
    .then(response => response.json())
    .then(nightmares => {
      drawResponsesOnCanvas(nightmares);
    })
    .catch(error => console.error('Error fetching nightmares:', error));
});