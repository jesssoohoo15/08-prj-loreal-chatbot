/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

/* OpenAI Chat Completions endpoint */
const apiUrl = "https://api.openai.com/v1/chat/completions";

/* System prompt: keeps the chatbot focused on L'Oréal topics only */
const systemPrompt = `You are the L'Oréal Smart Product Advisor, a friendly and knowledgeable beauty assistant.

You ONLY answer questions about:
- L'Oréal products (skincare, haircare, makeup, fragrance)
- Beauty routines and how to use L'Oréal products
- Personalized L'Oréal product recommendations
- General beauty-related topics (skin types, hair concerns, application tips)

If a user asks about anything unrelated to L'Oréal, beauty, or personal care — such as politics, coding, math, other brands, or general trivia — politely decline and steer the conversation back. For example: "I'm here to help with L'Oréal products and beauty routines! Is there anything beauty-related I can help you with?"

Keep answers warm, concise, and helpful.`;

/* Conversation history sent with every request so the AI has context */
const messages = [{ role: "system", content: systemPrompt }];

/* Helper: add a message to the chat window */
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("msg", sender); // sender is "user" or "ai"
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight; // keep newest message in view
  return msg;
}

/* Initial greeting */
addMessage("👋 Hello! How can I help you today?", "ai");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Show the user's message and store it in history
  addMessage(text, "user");
  messages.push({ role: "user", content: text });

  // Clear + lock the input while we wait
  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  const thinking = addMessage("…", "ai");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    thinking.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error(err);
    thinking.textContent =
      "⚠️ Sorry, something went wrong. Please try again in a moment.";
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});

// Temporary local storage for your API key — do NOT commit this file!
// Add "secrets.js" to your .gitignore.
const OPENAI_API_KEY = "PASTE-YOUR-OPENAI-API-KEY-HERE";