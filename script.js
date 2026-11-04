
const WORKER_URL = "https://maths-ai-lk.sasankamaheja862.workers.dev/";

let currentLang = "en";
let selectedImageBase64 = null;

let chatHistory = [];

try {
    chatHistory = JSON.parse(
        localStorage.getItem("maths_ai_history") || "[]"
    );
    if (!Array.isArray(chatHistory)) chatHistory = [];
} catch {
    chatHistory = [];
}

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadHistoryUI();
});

function setupEventListeners() {
    const get = id => document.getElementById(id);

    get("lang-en")?.addEventListener("click", () => switchLanguage("en"));
    get("lang-si")?.addEventListener("click", () => switchLanguage("si"));

    get("history-toggle")?.addEventListener("click", () => {
        get("sidebar")?.classList.toggle("open");
    });

    get("close-sidebar")?.addEventListener("click", () => {
        get("sidebar")?.classList.remove("open");
    });

    get("new-chat-btn")?.addEventListener("click", resetChat);
    get("clear-chat")?.addEventListener("click", resetChat);

    get("send-btn")?.addEventListener("click", handleSendMessage);

    get("user-input")?.addEventListener("keypress", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    });

    get("image-upload")?.addEventListener("change", handleImageUpload);
    get("remove-image")?.addEventListener("click", clearImageUpload);
}

function switchLanguage(lang) {
    currentLang = lang;

    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(`lang-${lang}`)?.classList.add("active");

    document.querySelectorAll("[data-en]").forEach(el => {
        const translated = el.getAttribute(`data-${lang}`);
        if (translated !== null) el.textContent = translated;
    });

    const input = document.getElementById("user-input");

    if (input) {
        input.placeholder = input.getAttribute(`data-placeholder-${lang}`) || "";
    }
}

function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5 MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = event => {
        selectedImageBase64 = event.target.result;

        const preview = document.getElementById("image-preview");
        const container = document.getElementById("image-preview-container");

        if (preview) preview.src = selectedImageBase64;
        container?.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
}

function clearImageUpload() {
    selectedImageBase64 = null;

    const upload = document.getElementById("image-upload");
    if (upload) upload.value = "";

    document.getElementById("image-preview-container")
        ?.classList.add("hidden");
}

function useSample(text) {
    const input = document.getElementById("user-input");

    if (input) {
        input.value = text;
        handleSendMessage();
    }
}

async function handleSendMessage() {
    const inputEl = document.getElementById("user-input");
    const text = inputEl?.value.trim() || "";

    if (!text && !selectedImageBase64) return;

    if (!text && selectedImageBase64) {
        appendMessage(
            currentLang === "si"
                ? "දැනට පින්තූර ප්‍රශ්න සඳහා සහාය සකස් කර නැහැ. කරුණාකර ප්‍රශ්නය ටයිප් කරන්න."
                : "Image questions are not enabled yet. Please type your question.",
            "bot"
        );
        return;
    }

    appendMessage(text, "user");

    inputEl.value = "";

    const loadingId = showLoadingIndicator();

    const sendButton = document.getElementById("send-btn");
    if (sendButton) sendButton.disabled = true;

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: text
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Invalid response from server.");
        }

        if (!response.ok) {
            throw new Error(
                data.error || `Server error: ${response.status}`
            );
        }

        if (!data.answer) {
            throw new Error("AI answer was empty.");
        }

        appendMessage(data.answer, "bot");
        saveToHistory(text, data.answer);

    } catch (error) {
        console.error("Gemini Chat Error:", error);

        appendMessage(
            currentLang === "si"
                ? "⚠️ සම්බන්ධතාවයේ ගැටලුවක් ඇතිවුණා. නැවත උත්සාහ කරන්න."
                : "⚠️ Connection error. Please try again.",
            "bot"
        );

    } finally {
        removeLoadingIndicator(loadingId);

        if (sendButton) sendButton.disabled = false;
    }
}

function appendMessage(content, sender, imageSrc = null) {
    const chatMessages = document.getElementById("chat-messages");

    if (!chatMessages) return;

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", `${sender}-message`);

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");

    const icon = document.createElement("i");
    icon.className = sender === "user"
        ? "fa-solid fa-user"
        : "fa-solid fa-robot";

    avatar.appendChild(icon);

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");

    if (imageSrc) {
        const img = document.createElement("img");
        img.src = imageSrc;
        img.classList.add("uploaded-img-msg");
        contentDiv.appendChild(img);
    }

    const textDiv = document.createElement("div");
    textDiv.textContent = content;
    textDiv.style.whiteSpace = "pre-wrap";

    contentDiv.appendChild(textDiv);

    if (sender === "bot") {
        const actions = document.createElement("div");
        actions.classList.add("msg-actions");

        const copyButton = document.createElement("button");
        copyButton.classList.add("copy-btn");
        copyButton.textContent = "Copy";

        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(content);
                copyButton.textContent = "Copied!";
                setTimeout(() => {
                    copyButton.textContent = "Copy";
                }, 2000);
            } catch {
                copyButton.textContent = "Copy failed";
            }
        });

        actions.appendChild(copyButton);
        contentDiv.appendChild(actions);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([contentDiv]).catch(console.error);
    }
}

function showLoadingIndicator() {
    const id = "loading-" + Date.now();
    const chatMessages = document.getElementById("chat-messages");

    if (!chatMessages) return id;

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "bot-message");
    msgDiv.id = id;

    msgDiv.innerHTML = `
        <div class="avatar">
            <i class="fa-solid fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return id;
}

function removeLoadingIndicator(id) {
    document.getElementById(id)?.remove();
}

function resetChat() {
    const chatMessages = document.getElementById("chat-messages");

    if (!chatMessages) return;

    chatMessages.innerHTML = `
        <div class="message bot-message intro-card">
            <div class="avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content">
                <p>
                    👋 Hello! I am your Grade 10 Math AI Assistant.
                    Ask any question from Part I or Part II!
                </p>
            </div>
        </div>
    `;

    document.getElementById("sidebar")?.classList.remove("open");
}

function saveToHistory(question, answer) {
    chatHistory.unshift({
        question,
        answer,
        date: new Date().toLocaleString()
    });

    chatHistory = chatHistory.slice(0, 20);

    try {
        localStorage.setItem(
            "maths_ai_history",
            JSON.stringify(chatHistory)
        );
    } catch (error) {
        console.error("History save error:", error);
    }

    loadHistoryUI();
}

function loadHistoryUI() {
    const list = document.getElementById("history-list");

    if (!list) return;

    list.innerHTML = "";

    chatHistory.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("history-item");
        div.textContent = item.question;

        div.addEventListener("click", () => {
            resetChat();
            appendMessage(item.question, "user");
            appendMessage(item.answer, "bot");
        });

        list.appendChild(div);
    });
}
