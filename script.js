/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

/* Cloudflare Worker URL — requests go here, NOT directly to OpenAI.
   The worker adds the API key server-side so it's never exposed. */
const workerUrl = "https://wispy-violet-c822.jessica-k-soohoo.workers.dev/";

/* System prompt: keeps the chatbot focused on L'Oréal topics only */
const systemPrompt = `You are the L'Oréal Smart Product Advisor, a friendly and knowledgeable beauty assistant.

You ONLY answer questions about:
- L'Oréal products (skincare, haircare, makeup, fragrance)
- Beauty routines and how to use L'Oréal products
- Personalized L'Oréal product recommendations
- General beauty-related topics (skin types, hair concerns, application tips)

Remember details the user shares (like their name, skin type, or hair concerns) and use them naturally in later answers.

If a user asks about anything unrelated to L'Oréal, beauty, or personal care — such as politics, coding, math, other brands, or general trivia — politely decline and steer the conversation back. For example: "I'm here to help with L'Oréal products and beauty routines! Is there anything beauty-related I can help you with?"

Keep answers warm, concise, and helpful.`;

/* Conversation history sent with every request so the AI has context.
   This is what enables multi-turn memory (names, past questions, etc.) */
const messages = [{ role: "system", content: systemPrompt }];

/* Helper: add a message bubble to the chat window */
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

  // Show the latest question above the chat (resets each time)
  latestQuestion.textContent = "You asked: " + text;

  // Show the user's message bubble and store it in history
  addMessage(text, "user");
  messages.push({ role: "user", content: text });

  // Clear + lock the input while we wait
  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  const thinking = addMessage("…", "ai");

  try {
    // No API key here — the Cloudflare Worker adds it server-side
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data = await response.json();

    // If OpenAI returned an error, show it so we know what's wrong
    if (data.error) {
      throw new Error(data.error.message);
    }

    const reply = data.choices[0].message.content;

    thinking.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error(err);
    thinking.textContent = "⚠️ " + err.message;
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});