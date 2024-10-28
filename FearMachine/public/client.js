async function generateResponse() {
  const input = {
    prompt: "In less than five words, what is something that people are most afraid of? use themes from movies and books to inform ideas. it should be related to the ${randomFear}.",
    system_prompt: "You are a talented storyteller. You are concise and share no superfluous explanation or detail.",
    max_new_tokens: 512,
    temperature: .7, 
  };

  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input)
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}
