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

// Send a message to a single client
function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Broadcast to all clients in a channel
function broadcast(channel, message) {
  if (channels[channel]) {
    channels[channel].forEach(client => {
      send(client.ws, message);
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

          const clientInfo = { ws, nick: userNick };
          channels[currentChannel].push(clientInfo);

          console.log(`User ${userNick} joined channel ${currentChannel}`);

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
            const text = data.text;
            // Check for whisper command
            if (text.startsWith('/w ') || text.startsWith('/whisper ')) {
              const match = text.match(/^\/(?:w|whisper)\s+([^\s]+)\s+(.*)/);
              if (match) {
                const targetNick = match[1];
                const whisperText = match[2];
                const targetClient = channels[currentChannel].find(c => c.nick === targetNick);

                if (targetClient) {
                  // Send to target
                  send(targetClient.ws, {
                    cmd: 'whisper',
                    from: userNick,
                    to: targetNick,
                    text: whisperText
                  });
                  // Send confirmation to sender
                  send(ws, {
                    cmd: 'whisper',
                    from: 'You',
                    to: targetNick,
                    text: whisperText
                  });
                } else {
                  send(ws, {
                    cmd: 'info',
                    text: `User "${targetNick}" not found in this channel.`
                  });
                }
              }
            } else {
              // Public message
              broadcast(currentChannel, {
                cmd: 'chat',
                nick: userNick,
                text: data.text,
              });
            }
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

      channels[currentChannel] = channels[currentChannel].filter(
        client => client.nick !== userNick
      );

      if (channels[currentChannel].length === 0) {
        delete channels[currentChannel];
      } else {
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