require('dotenv').config();
const express = require('express');
const cors = require('cors'); // to allow requests from different origins
const path = require('path'); // to serve static files
const Replicate = require("replicate");
const app = express();
const PORT = 3000;
const fs = require('fs'); //load fears.json

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

// Define API endpoint for generating a fear response
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
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});