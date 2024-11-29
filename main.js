import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

// 🔥🔥 FILL THIS OUT FIRST! 🔥🔥
// Get your Gemini API key by:
// - Selecting "Add Gemini API" in the "Project IDX" panel in the sidebar
// - Or by visiting https://g.co/ai/idxGetGeminiKey
let API_KEY = 'AIzaSyB4Z3nLQ5bPK7JMOZlynSs5g2ldsMC-H6A';

let form = document.querySelector('form');
let languageSelect = document.querySelector('select[name="language"]');
let audioInput = document.querySelector('input[name="audio"]');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Processing audio...';

  try {
    // Ensure an audio file is uploaded
    if (!audioInput.files.length) {
      output.textContent = 'Please upload an audio file.';
      return;
    }

    let audioFile = audioInput.files[0];
    let audioBase64 = await readFileAsBase64(audioFile);

    // Generate prompt based on selected language
    let selectedLanguage = languageSelect.value;
    let promptText = `Buat jadi text dari audio yang tertera dan terjemahkan ke bahasa ${selectedLanguage}.`;

    // Assemble the prompt
    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: audioFile.type, data: audioBase64 } },
          { text: promptText }
        ]
      }
    ];

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    // Read from the stream and display as markdown
    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML = `Error: ${e.message}`;
  }
};

// Helper function to convert file to Base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Show API key banner if necessary
maybeShowApiKeyBanner(API_KEY);