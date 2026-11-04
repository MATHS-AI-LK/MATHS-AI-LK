// API Endpoint URL (Replace with your Cloudflare Worker URL)
const WORKER_URL = "https://maths-ai-lk-backend.YOUR-SUBDOMAIN.workers.dev/api/chat";

let currentLang = 'en';
let selectedImageBase64 = null;
let chatHistory = JSON.parse(localStorage.getItem('maths_ai_history')) || [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadHistoryUI();
});

function setupEventListeners() {
    // Language switch
    document.getElementById('lang-en').addEventListener('click', () => switchLanguage('en'));
    document.getElementById('lang-si').addEventListener('click', () => switchLanguage('si'));

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    document.getElementById('history-toggle').addEventListener('click', () => sidebar.classList.toggle('open'));
    document.getElementById('close-sidebar').addEventListener('click', () => sidebar.classList.remove('open'));

    // New chat
    document.getElementById('new-chat-btn').addEventListener('click', resetChat);
    document.getElementById('clear-chat').addEventListener('click', resetChat);

    // Send actions
    document.getElementById('send-btn').addEventListener('click', handleSendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Image Upload
    const imageUpload = document.getElementById('image-upload');
    imageUpload.addEventListener('change', handleImageUpload);
    document.getElementById('remove-image').addEventListener('click', clearImageUpload);
}

function switchLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');

    // Update text elements
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });

    // Update textarea placeholder
    const input = document.getElementById('user-input');
    input.placeholder = input.getAttribute(`data-placeholder-${lang}`);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImageBase64 = e.target.result;
        document.getElementById('image-preview').src = selectedImageBase64;
        document.getElementById('image-preview-container').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearImageUpload() {
    selectedImageBase64 = null;
    document.getElementById('image-upload').value = '';
    document.getElementById('image-preview-container').classList.add('hidden');
}

function useSample(text) {
    document.getElementById('user-input').value = text;
    handleSendMessage();
}

async function handleSendMessage() {
    const inputEl = document.getElementById('user-input');
    const text = inputEl.value.trim();

    if (!text && !selectedImageBase64) return;

    // Display user message
    appendMessage(text, 'user', selectedImageBase64);

    const payload = {
        message: text,
        image: selectedImageBase64,
        language: currentLang
    };

    // Reset input fields
    inputEl.value = '';
    const currentImg = selectedImageBase64;
    clearImageUpload();

    // Show loading
    const loadingId = showLoadingIndicator();

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        removeLoadingIndicator(loadingId);

        if (response.ok && data.reply) {
            appendMessage(data.reply, 'bot');
            saveToHistory(text || "Image Question", data.reply);
        } else {
            appendMessage(data.error || "⚠️ An error occurred while contacting the AI backend server.", 'bot');
        }
    } catch (err) {
        removeLoadingIndicator(loadingId);
        appendMessage("⚠️ Network error. Please ensure your Cloudflare backend worker URL is configured.", 'bot');
    }
}

function appendMessage(content, sender, imageSrc = null) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', `${sender}-message`);

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.classList.add('uploaded-img-msg');
        contentDiv.appendChild(img);
    }

    const textP = document.createElement('div');
    textP.innerHTML = formatText(content);
    contentDiv.appendChild(textP);

    if (sender === 'bot') {
        const actions = document.createElement('div');
        actions.classList.add('msg-actions');
        actions.innerHTML = `<button class="copy-btn" onclick="copyText(this)"><i class="fa-regular fa-copy"></i> Copy</button>`;
        contentDiv.appendChild(actions);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (window.MathJax) {
        MathJax.typesetPromise([contentDiv]);
    }
}

function formatText(text) {
    if (!text) return '';
    // Format code/math blocks or line breaks
    return text.replace(/\n/g, '<br>');
}

function showLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot-message');
    msgDiv.id = id;

    msgDiv.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
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
    const el = document.getElementById(id);
    if (el) el.remove();
}

function copyText(btn) {
    const content = btn.closest('.message-content').innerText.replace('Copy', '').trim();
    navigator.clipboard.writeText(content);
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
    setTimeout(() => {
        btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
    }, 2000);
}

function resetChat() {
    document.getElementById('chat-messages').innerHTML = `
        <div class="message bot-message intro-card">
            <div class="avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-content">
                <p data-en="👋 Hello! I am your Grade 10 Math AI Assistant. Ask any question from Part I or Part II, or upload a photo of your equation!" data-si="👋 ආයුබෝවන්! මම ඔබගේ 10 ශ්‍රේණිය ගණිතය AI සහායකයා වෙමි. I හෝ II කොටස් වල ඕනෑම ප්‍රශ්නයක් අසන්න, නැතහොත් ප්‍රශ්නයේ ඡායාරූපයක් එක් කරන්න!">👋 Hello! I am your Grade 10 Math AI Assistant. Ask any question from Part I or Part II, or upload a photo of your equation!</p>
            </div>
        </div>
    `;
}

function saveToHistory(q, a) {
    chatHistory.unshift({ question: q, answer: a, date: new Date().toLocaleTimeString() });
    if (chatHistory.length > 20) chatHistory.pop();
    localStorage.setItem('maths_ai_history', JSON.stringify(chatHistory));
    loadHistoryUI();
}

function loadHistoryUI() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    chatHistory.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('history-item');
        div.textContent = item.question;
        div.onclick = () => {
            resetChat();
            appendMessage(item.question, 'user');
            appendMessage(item.answer, 'bot');
        };
        list.appendChild(div);
    });
}
