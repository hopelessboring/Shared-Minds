
// Steven Phan
// 241001 | Modern Cave Paintings
// The idea behind this project was to recreate one of the earliest forms of human expression and more specifically
// draw attention to how these ancient forms of art grew over time to tell a larger narrative with many authors. 

// The interaction is simple; you enter a simple expression to describe something interesting you've done today and 
// the program will generate an image in the style of a modern cave painting and add it to the shared canvas. All of 
// the collected images are stored and remain persistent for all users to see on the canvas as they add their own. 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let inputBox;
let db;
let myObjectsByFirebaseKey = {}; //for converting from firebase key to JSON object
let existingSubscribedFolder = null;
let imageSize = 100;

const url = "https://replicate-api-proxy.glitch.me/create_n_get/";

let exampleName = "Modern_Cave";

resizeCanvas();
init();

window.onload = function () {
    // changetext();
    myInput();
};

initFirebaseDB();
// initHTML();
subscribeToData();
animate();

function init() {
    const ctx = canvas.getContext('2d');
}

function animate() {
    canvas.onmousemove = function (e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before redrawing

        for (let key in myObjectsByFirebaseKey) {
            let thisObject = myObjectsByFirebaseKey[key];
            if (thisObject.type === "image") {
                let position = thisObject.position;
                let img = thisObject.loadedImage;
                if (img) {
                    // allows for a rotation of each image to give a looser feel to the composition
                    ctx.save();  // Save the current canvas state
                    ctx.translate(position.x + 50, position.y + 50);  // Translate to the center of the image (50, 50 is half of 100, 100)
                    ctx.rotate(position.rotation/100);  // Rotate around the new origin
                    ctx.drawImage(img, -50, -50, imageSize, imageSize);  // Draw image at the translated origin
                    ctx.restore();  // Restore the previous canvas state

                    // ctx.drawImage(img, position.x, position.y, 100, 100);
                    // mouseover to display the original prompt text 
                    if (
                        mouseX >= position.x &&
                        mouseX <= position.x + 100 &&
                        mouseY >= position.y &&
                        mouseY <= position.y + 100
                    ) {
                        ctx.fillStyle = "black";
                        ctx.font = "10px";
                        ctx.font = "lucidatypewriter-regular"
                        ctx.fillText(thisObject.inputValue, position.x, position.y - 5);
                    }
                }
            // } else if (thisObject.type === "text") {
            //     let position = thisObject.position;
            //     ctx.font = "10px Arial";
            //     ctx.fillText(thisObject.text, position.x, position.y);
            }
        }
    };

    requestAnimationFrame(animate);
}

// create the input box and listen for enter to be pressed. call the function for the placement of the image
function myInput() {
    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputField');
    inputBox.setAttribute('placeholder', 'Enter a sentence to describe it.');
    inputBox.style.position = 'absolute';
    // inputBox.style.width = 'fit-content';
    inputBox.style.zIndex = '100';
    document.body.appendChild(inputBox);

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed
    let position = getValidRandomPosition(canvas, imageSize);
    let location = { x: position.x, y: position.y, rotation: (100*(getRandomInt(-10,10) * (Math.PI / 180)))};
    // let location = { x: getRandomInt(0,canvas.width), y: getRandomInt(0,canvas.height), rotation: (100*(getRandomInt(-10,10) * (Math.PI / 180)))};

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            askModel(inputValue, location);
        }
    });

    // Log to check if inputText is properly attached
    console.log("Input element added to DOM: ", inputBox);
}

// borrowed from Dano example
function clearLocalScene() {
    myObjectsByFirebaseKey = {};
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //displayDiv.innerHTML = "";
}

// generates a string for prompting model 
async function askModel(inputValue, location) {
    let prompt;
    console.log("ASK SENTENCE FUNCTION FIRED");
    prompt = "a human " + inputValue + ". black and white image in the style of lascaux petroglyphs. use rudimentary linework and thin strokes. only black color.";

    console.log("Prompt is: ", prompt);
    document.body.style.cursor = "progress";
    const data = {
        //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
        //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
        // version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",   //stable diffusion
        version: "4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a",   //sticker
        input: {
            prompt: prompt,
            width: 512,
            height: 512, 
            // output_format: jpg,
            negative_prompt: "shadow, background, pink, color",
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

    const picture_info = await fetch(url, options);
    console.log("picture_response: ", picture_info);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        console.log("Something went wrong, try it again");
    } else {
        console.log("returned from API", proxy_said);
        let imageURL = proxy_said.output[0];

        // const img = new Image();
        // img.onload = () => {
        //     ctx.drawImage(img, 400, 400, 256, 256);
        // };
        // img.src = imageURL;

        //send by url but maybe safer in long term to uncomment above and send by base64
        addImageRemote(proxy_said.output[0], inputValue, location);

    }
    document.body.style.cursor = "auto";
}

function addImageRemote(imgURL, inputValue, pos) {
    console.log("addImageRemote", imgURL, inputValue, pos);
    let title = document.getElementById("title").value;
    const data = { type: "image", inputValue: inputValue, position: pos, imageURL: imgURL };
    let folder = exampleName + "/" + title + "/";
    // console.log("Entered Image, Send to Firebase", folder, data);
    addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}


function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(ratio, ratio);  // Scale the context based on the device's pixel ratio
}


///////////////////////FIREBASE///////////////////////////
// BORROWED FROM DANO EXAMPLE

function initFirebaseDB() {
    // Initialize Firebase
    const firebaseConfig = {

        apiKey: "AIzaSyDTRcYAa7e1FiU1_FPCjvHu59B9AH4_HKc",
        authDomain: "sharedminds-cffdc.firebaseapp.com",
        projectId: "sharedminds-cffdc",
        storageBucket: "sharedminds-cffdc.appspot.com",
        messagingSenderId: "263973058295",
        appId: "1:263973058295:web:cad27a6ae8eb4c5bcf45f2",
        measurementId: "G-DD0SSE9YLP"

        // apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        // authDomain: "sharedmindss24.firebaseapp.com",
        // databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        // projectId: "sharedmindss24",
        // storageBucket: "sharedmindss24.appspot.com",
        // messagingSenderId: "1039430447930",
        // appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
}

function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

async function updateJSONFieldInFirebase(folder, data) {
    console.log("updateDataInFirebase", folder, data);
    const dbRef = ref(db, folder);
    let updater = await update(dbRef, data);
    console.log("update", updater);
}

function setDataInFirebase(folder, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    console.log("setDataInFirebase", folder, data);
    const dbRef = ref(db, folder)
    set(dbRef, data);

}

function deleteFromFirebase(folder, key) {
    console.log("deleting", folder + '/' + key);
    const dbRef = ref(db, folder + '/' + key);
    set(dbRef, null);
}

function subscribeToData() {
    clearLocalScene()
    let title = document.getElementById("title").value;
    // let currentFrame = document.getElementById("currentFrameDisplay").textContent.split(" ")[2];
    // let folder = exampleName + "/" + title + "/frames/" + currentFrame + "/";
    let folder = exampleName + "/" + title + "/";
    //get callbacks when there are changes either by you locally or others remotely
    if (existingSubscribedFolder) {
        const oldRef = ref(db, existingSubscribedFolder);
        console.log("unsubscribing from", existingSubscribedFolder, oldRef);
        off(oldRef);
    }
    existingSubscribedFolder = folder;

    const thisRef = ref(db, folder);
    console.log("subscribing to", folder, thisRef);
    onChildAdded(thisRef, (snapshot) => {
        let key = snapshot.key;
        let data = snapshot.val();
        //console.log("added", data, key);
        //transfer data into your local variable
        //replaces it if it already exists, otherwise makes a new entry
        myObjectsByFirebaseKey[key] = data;
        //if it is an image, load it
        if (data.type == "image") {
            let img = new Image();  //create a new image
            img.onload = function () {
                img.setAttribute("id", key + "_image");
                myObjectsByFirebaseKey[key].loadedImage = img;

            }
            img.src = data.imageURL;
        }
        console.log(myObjectsByFirebaseKey);

    });

    onChildChanged(thisRef, (data) => {
        callback("CHANGED", data.val(), data.key);
        let key = data.key;
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            if (data.type === "text") {
                thisObject.text = data.text;
                thisObject.position = data.position;
            } else if (data.type === "image") {
                let img = new Image();  //create a new image
                img.onload = function () {
                    thisObject.img = img;
                    thisObject.position = data.position;

                }
                img.src = data.imageURL;

            }
        }
    });
    onChildRemoved(thisRef, (data) => {
        callback("removed", data.val(), data.key);
        console.log("removed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {

            delete myObjectsByFirebaseKey[key];
        }
    });
}
 
// Random integer generator for placement of images
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let placedImages = [];  // Array to keep track of placed image positions

// an attempt at trying to use collision detection to prevent overlap. 
function checkOverlap(newPosition, imageSize) {
    for (let i = 0; i < placedImages.length; i++) {
        let existingPosition = placedImages[i];
        let distanceX = Math.abs(existingPosition.x - newPosition.x);
        let distanceY = Math.abs(existingPosition.y - newPosition.y);

        // Check for overlap based on image size
        if (distanceX < imageSize && distanceY < imageSize) {
            return true; // Overlap detected
        }
    }
    return false; // No overlap
}

// an attempt at trying to use collision detection to prevent overlap. 
function getValidRandomPosition(canvas, imageSize) {
    let position;
    let tries = 0;
    do {
        position = {
            // x: getRandomInt(0, canvas.style.width - imageSize),
            // y: getRandomInt(0, canvas.style.height - imageSize),
            x: getRandomInt(0, 800),
            y: getRandomInt(0, 550),
            rotation: 100 * (getRandomInt(-10, 10) * (Math.PI / 180))
        };
        tries++;
    } while (checkOverlap(position, imageSize) && tries < 100);  // Limit the number of retries

    placedImages.push(position);  // Add the new valid position to the list

    // Update Firebase with the new placedImages array
    let folder = exampleName + "/placedimages";
    update(ref(db, folder), { placedImages: placedImages })
      .then(() => {
        console.log("Placed images updated on Firebase");
      })
      .catch((error) => {
        console.error("Error updating Firebase:", error);
      });

    return position;
}