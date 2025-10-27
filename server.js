
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory storage for channels and users
const channels = {};

// Broadcast to all clients in a channel
function broadcast(channel, message) {
  if (channels[channel]) {
    channels[channel].forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
}

wss.on('connection', (ws) => {
  let currentChannel = null;
  let userNick = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.cmd) {
        case 'join':
          currentChannel = data.channel;
          userNick = data.nick;

          if (!channels[currentChannel]) {
            channels[currentChannel] = [];
          }

          // Store user info on the client connection
          const clientInfo = { ws, nick: userNick };
          channels[currentChannel].push(clientInfo);

          console.log(`User ${userNick} joined channel ${currentChannel}`);

          // Notify others in the channel
          broadcast(currentChannel, {
            cmd: 'online',
            nicks: channels[currentChannel].map(c => c.nick)
          });

          broadcast(currentChannel, {
             cmd: 'info',
             text: `${userNick} has joined the channel.`
          });
          break;

        case 'chat':
          if (currentChannel && userNick) {
            console.log(`Message from ${userNick} in ${currentChannel}: ${data.text}`);
            broadcast(currentChannel, {
              cmd: 'chat',
              nick: userNick,
              text: data.text,
            });
          }
          break;

        default:
          console.warn('Unknown command:', data.cmd);
      }
    } catch (e) {
      console.error('Failed to parse message or handle command:', e);
    }
  });

  ws.on('close', () => {
    if (currentChannel && userNick) {
      console.log(`User ${userNick} left channel ${currentChannel}`);

      // Remove user from channel
      channels[currentChannel] = channels[currentChannel].filter(
        client => client.nick !== userNick
      );

      // If channel is empty, delete it
      if (channels[currentChannel].length === 0) {
        delete channels[currentChannel];
      } else {
        // Notify remaining users
        broadcast(currentChannel, {
            cmd: 'info',
            text: `${userNick} has left the channel.`
        });
        broadcast(currentChannel, {
            cmd: 'online',
            nicks: channels[currentChannel].map(c => c.nick)
        });
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
