document.addEventListener('DOMContentLoaded', () => {
    const messages = document.getElementById('messages');
    const userList = document.getElementById('user-list');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    let ws;
    let nick = ''

    // Get channel from URL, default to 'general'
    const channel = window.location.search.substring(1) || 'general';
    if (!window.location.search.substring(1)) {
        window.history.replaceState({}, document.title, '/?' + channel);
    }

    function init() {
        // Get nickname
        while (!nick) {
            nick = prompt('Please enter your nickname:');
        }

        // Determine WebSocket protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to WebSocket server.');
            ws.send(JSON.stringify({
                cmd: 'join',
                channel: channel,
                nick: nick
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.cmd) {
                case 'chat':
                    addChatMessage(data.nick, data.text);
                    break;
                case 'whisper':
                    addWhisperMessage(data.from, data.to, data.text);
                    break;
                case 'info':
                    addInfoMessage(data.text);
                    break;
                case 'online':
                    updateUserList(data.nicks);
                    break;
            }
        };

        ws.onclose = () => {
            addInfoMessage('Disconnected from server. Attempting to reconnect...');
            // Simple reconnect logic
            setTimeout(init, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            addInfoMessage('Connection error.');
        };
    }

    function addChatMessage(senderNick, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const nickElement = document.createElement('div');
        nickElement.classList.add('nick');
        nickElement.textContent = senderNick;

        const textElement = document.createElement('div');
        textElement.classList.add('text');
        textElement.textContent = text;

        messageElement.appendChild(nickElement);
        messageElement.appendChild(textElement);
        messages.appendChild(messageElement);
        messages.scrollTop = messages.scrollHeight;
    }

    function addWhisperMessage(from, to, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'whisper-message');

        const nickElement = document.createElement('div');
        nickElement.classList.add('nick');
        nickElement.textContent = `Whisper from ${from} to ${to}`;

        const textElement = document.createElement('div');
        textElement.classList.add('text');
        textElement.textContent = text;

        messageElement.appendChild(nickElement);
        messageElement.appendChild(textElement);
        messages.appendChild(messageElement);
        messages.scrollTop = messages.scrollHeight;
    }

    function addInfoMessage(text) {
        const infoElement = document.createElement('div');
        infoElement.classList.add('info-message');
        infoElement.textContent = text;
        messages.appendChild(infoElement);
        messages.scrollTop = messages.scrollHeight;
    }

    function updateUserList(nicks) {
        userList.innerHTML = '';
        nicks.forEach(n => {
            const li = document.createElement('li');
            li.textContent = n;
            userList.appendChild(li);
        });
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value;
        if (text && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                cmd: 'chat',
                text: text
            }));
            messageInput.value = '';
        }
    });

    init();
});