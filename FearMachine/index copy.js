import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path'; // to serve static files
import Replicate from "replicate";
import fs from 'fs'; //to load fears.json
import { UMAP } from 'umap-js';
import seedrandom from 'seedrandom'; //to randomize UMAP
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Get the directory path using import.meta.url in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fearsData;
let randomFear;
let randomFearString;
let responseString;
let lowDimEmbeddings;
let highDimEmbeddings;

//Setup LowDB
// const { Low, JSONFile } = require('lowdb');
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb';
const defaultData = { database: [] };
const adapter = new JSONFile('database.json');
const db = new Low(adapter);

// Setup Replicate with API key
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Setup Socket.io
import { Server } from 'socket.io';
let server = app.listen(PORT, () => {
    console.log(`Boom Server running on port ${PORT}`);
});
let io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log(`New connection: ${socket.id}`);
}

initializeDB();   // Initialize the storage DB
loadFearRandomizer(); //Initialize the fear randomizer for ML prompting

io.on('connection', (socket) => {
    socket.on('newFearClick', async (clickData) => {
        const { randomFearString, responseString } = await nightmareGeneration(); //Initialize the nightmare generation API endpoint
        db.data.nightmares.push({ buttonid: clickData.buttonID, timestamp: clickData.timestamp, fearPrompt: randomFearString, cleanResponse: responseString, highDimEmbeddings: highDimEmbeddings, lowDimEmbeddings: lowDimEmbeddings });
        await db.write();
        console.log(`newFearClick added to database ${clickData.buttonID} pressed at ${clickData.timestamp}`);
        console.log("database: ", db.data);
        // console.log("db.data.nightmares", db.data.nightmares[0].highDimEmbeddings);
        await runUMAP(db.data);

    });
});

// Enable CORS to allow requests from different origins
app.use(cors());
app.use(express.json()); // Parses JSON request bodies

// Middleware to serve static files 
app.use(express.static(path.join(__dirname, 'public')));

// API ENDPOINT FOR NIGHTMARE GENERATION
async function nightmareGeneration() {
    // app.post('/api/generate', async (req, res) => {
    console.log("API GENERATE FUNCTION FIRED");
    randomFear = Math.floor(Math.random() * 101);
    randomFearString = JSON.stringify(fearsData.fears[randomFear]);
    console.log(`random fear is ${randomFearString}`);
    const input = {
        prompt: `In less than six words, what is something that people are most afraid of? Use themes from movies and books to inform ideas. It should be related to ${randomFearString} and reiterate this theme and ideally the main word in the response. Don't write about dark or the darkness`,
        system_prompt: "You are a talented storyteller. You are concise and share no superfluous explanation or detail.",
        max_new_tokens: 512,
        temperature: 0.94,
        top_p: 0.95,
    };

    //API CALL FOR NIGHTMARE GENERATION
    try {
        const response = await replicate.run("meta/meta-llama-3-8b-instruct", { input });
        // console.log(`response is ${response}`);
        responseString = await cleanResponse(response);
        console.log(`response string is ${responseString}`);
        // res.json({ response: responseString }); // Send the response back to the front end as JSON
        await getEmbeddings(responseString);
    } catch (error) {
        console.error('Error:', error);
    }
    return { randomFearString, responseString };
}
async function cleanResponse(response) {
    console.log("Cleaning response");

    // Ensure response is an array before joining
    if (!Array.isArray(response)) {
        console.error("Response is not an array:", response);
        return '';
    }

    let cleanedString = response.join('');

    // Trim whitespace from both ends
    cleanedString = cleanedString.trim();

    // Replace multiple newlines with a single space
    cleanedString = cleanedString.replace(/\n+/g, " ");

    // Remove all special characters and punctuation
    cleanedString = cleanedString.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, "");

    // Additional trim to catch any lingering whitespace
    cleanedString = cleanedString.trim();

    return cleanedString;
}

//API ENDPOINT FOR EMBEDDING GENERATION
//document.getElementById("feedback").innerHTML = "Getting Embeddings...";
//let promptInLines = p_prompt.replace(/,/g, "\n");
async function getEmbeddings(responseString) {
    let embeddingData = {
        version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        input: {
            // inputs: sentences,
            inputs: responseString
        },
    };
    console.log("Asking for Embedding Similarities From Replicate via Proxy");
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(embeddingData),
    };
    const replicateProxy = "https://replicate-api-proxy.glitch.me"
    const replicateURL = replicateProxy + "/create_n_get/";
    console.log("url", replicateURL, "options", options);
    const raw = await fetch(replicateURL, options)
    const embeddingsJSON = await raw.json();
    //console.log("embeddingsJSON", embeddingsJSON.output);
    // document.body.style.cursor = "auto";
    // localStorage.setItem("embeddings", JSON.stringify(embeddingsJSON.output));
    // console.log("embeddingsJSON.output[0].embedding", embeddingsJSON.output[0].embedding);
    highDimEmbeddings = embeddingsJSON.output[0].embedding;

}

async function runUMAP(nightmareDatabase) {
    console.log("Running UMAP");
    // console.log("nightmareDatabase", nightmareDatabase);
    let embeddings = [];
    var totalNum = 0;

    if (nightmareDatabase.length < 2) {
        console.log("Not enough data points for UMAP. Skipping dimensionality reduction.");
        return [];
    }

    // Extract embeddings
    for (let i = 0; i < nightmareDatabase.length; i++) {
        embeddings.push(nightmareDatabase.nightmares[i].highDimEmbeddings);
        console.log(`embeddings[${i}]:`, embeddings[i]);
    }

    var myrng = seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 6,
        minDist: 0.1,
        nComponents: 2,
        random: myrng,  //special library seeded random so it is the same random numbers every time
        spread: 0.99,
        //distanceFn: 'cosine',
    });

    let fittings = umap.fit(embeddings);
    //console.log("fittings:", fittings);
    fittings = normalize(fittings);  //normalize to 0-1
    //console.log("normalized fittings:", fittings);
    // console.log("nightmareDatabase length:", nightmareDatabase.length);

    for (let i = 0; i < nightmareDatabase.length; i++) {
        // const input = nightmareDatabase[i].input;
        // const fit = fittings[i];
        console.log(`input: , nightmareDatabase.nightmares[${i}].cleanResponse`);
        console.log(`fittings[${i}]:`, fittings[i]);
        nightmareDatabase.nightmares[i].lowDimEmbeddings = fittings[i];
        await nightmareDatabase.write();
        // You can process each fit here if needed
    }
}



function normalize(arrayOfNumbers) {
    //find max and min in the array
    let max = [0, 0];
    let min = [0, 0];
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 2; j++) {
            if (arrayOfNumbers[i][j] > max[j]) {
                max[j] = arrayOfNumbers[i][j];
            }
            if (arrayOfNumbers[i][j] < min[j]) {
                min[j] = arrayOfNumbers[i][j];
            }
        }
    }
    //normalize
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 2; j++) {
            arrayOfNumbers[i][j] = (arrayOfNumbers[i][j] - min[j]) / (max[j] - min[j]);
        }
    }
    return arrayOfNumbers;
}

// Initialize and read the database
async function initializeDB() {
    await db.read(); // Read data from the JSON file
    db.data = db.data || defaultData; // If no data is present, set default
}

function loadFearRandomizer() {
    //load fears.json to help randomize fear generation prompting
    try {
        const rawData = fs.readFileSync(path.join(__dirname, 'fears.json'));
        fearsData = JSON.parse(rawData);
        console.log("Fears data loaded successfully");
        randomFear = Math.floor(Math.random() * 101);
        console.log(`randomFear of the day is ${fearsData.fears[randomFear]}`);
    } catch (error) {
        console.error('Error reading fears.json:', error);
    }
}