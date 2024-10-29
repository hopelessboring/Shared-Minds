require('dotenv').config();
const express = require('express');
const cors = require('cors'); // to allow requests from different origins
const path = require('path'); // to serve static files
const Replicate = require("replicate");
const app = express();
const PORT = 3000;
const fs = require('fs'); //load fears.json
const UMAP = require('umap-js');
const socket = require('socket.io');

// Set up Replicate with your API key
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

//load fears.json
let fearsData;
let randomFear;
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'fears.json'));
    fearsData = JSON.parse(rawData);
    console.log("Fears data loaded successfully");
    randomFear = Math.floor(Math.random() * 101);
    console.log(fearsData.fears[randomFear]);
} catch (error) {
    console.error('Error reading fears.json:', error);
}

// // Get the directory path using import.meta.url in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Enable CORS to allow requests from different origins
app.use(cors());
app.use(express.json()); // Parses JSON request bodies

// Middleware to serve static files 
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// API ENDPOINT FOR NIGHTMARE GENERATION
app.post('/api/generate', async (req, res) => {
    console.log("API GENERATE FUNCTION FIRED");
    randomFear = Math.floor(Math.random() * 101);
    let randomFearString = JSON.stringify(fearsData.fears[randomFear]);
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
        console.log(`response is ${response}`);
        let responseString = response.join('');

        responseString = responseString.trim();

        // Replace multiple newlines with a single space
        responseString = responseString.replace(/\n+/g, " ");

        // Remove all special characters and punctuation
        responseString = responseString.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, "");

        // Additional trim to catch any lingering whitespace
        responseString = responseString.trim();
        console.log(`response string is ${responseString}`);
        res.json({ response: responseString }); // Send the response back to the front end as JSON
        getEmbeddings(responseString);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});



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
options = {
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
console.log("embeddingsJSON", embeddingsJSON.output);
// document.body.style.cursor = "auto";
// localStorage.setItem("embeddings", JSON.stringify(embeddingsJSON.output));
runUMAP(embeddingsJSON.output)
}

function runUMAP(embeddingsAndSentences) {

    //comes back with a list of embeddings and Sentences, single out the embeddings for UMAP
    console.log("embeddingsAndSentences", embeddingsAndSentences);
    let embeddings = [];
    for (let i = 0; i < embeddingsAndSentences.length; i++) {
        embeddings.push(embeddingsAndSentences[i].embedding);
    }
    //let fittings = runUMAP(embeddings);
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 6,
        minDist: 0.1,
        nComponents: 2,
        random: myrng,  //special library seeded random so it is the same random numbers every time
        spread: 0.99,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < embeddingsAndSentences.length; i++) {
        placeSentence(embeddingsAndSentences[i].input, fittings[i]);
    }
    //console.log("fitting", fitting);
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


