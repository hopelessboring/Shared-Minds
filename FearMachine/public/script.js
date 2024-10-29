
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

  //Socket.io Setup
    let socket = io.connect('http://localhost:3000');
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
    });

    let inputBox;

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
      inputBox = document.createElement('button');
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

    async function getNewFear() {
      console.log("GET FEAR FUNCTION FIRED");
      document.body.style.cursor = "progress";
      socket.emit('newFearClick', {
        buttonID: "inputBox",
        timestamp: Date.now()
    });

    //   try {
    //     // Send request to back-end API to generate response
    //     const response = await fetch('http://localhost:3000/api/generate', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //     });
        
    //     const data = await response.json();
    //     console.log("Response from server:", data.response);
    //     document.body.style.cursor = "default";
        
    //     // // Draw response text on canvas (optional)
    //     // drawWord(data.response);

    //   } catch (error) {
    //     console.error('Error:', error);
    //     document.body.style.cursor = "default";
    //   }
    // }

    // function drawWord(word) {
    //   ctx.clearRect(0, 0, canvas.width, canvas.height);
    //   ctx.font = "20px Arial";
    //   ctx.fillStyle = "black";
    //   ctx.fillText(word, canvas.width / 2, canvas.height / 2);
    }
