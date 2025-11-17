# How to Run the Web-Based Real-Time Chat Project

This guide provides step-by-step instructions to clone, install, and run the web-based real-time chat application on any local machine.

## Prerequisites

- **Node.js**: Version 14 or higher (16+ recommended). Download from [nodejs.org](https://nodejs.org/).
- **Git**: For cloning the repository. Download from [git-scm.com](https://git-scm.com/).
- **Web Browser**: Any modern browser (Chrome, Firefox, Safari) to access the app.

## Setup Instructions

1. **Clone the Repository**

   Open your terminal and run:

   ```bash
   git clone https://github.com/iamaakashks/real-time-chat-room.git
   ```

   This creates a folder named `real-time-chat-room`.

2. **Navigate to the Project Directory**

   ```bash
   cd real-time-chat-room
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Run the Application**

   ```bash
   npm start
   ```

   Output: "Server is listening on port 3000".

5. **Access the App**

   Open a browser and go to: `http://localhost:3000`

   - Default channel: 'general'
   - Custom channel example: `http://localhost:3000/?music`

## Features

- Real-time messaging using WebSockets.
- Multi-channel support (via URL query).
- Private whispers (`/w <nick> <message>`).
- Online users sidebar.

## Testing

- Open multiple tabs for different users.
- Join the same channel to test chat.

## Stopping the Server

Press `Ctrl + C` in the terminal.

## Troubleshooting

- **Custom Port**: `PORT=3001 npm start` then visit `localhost:3001`.
- **Node Not Installed**: Run `node --version` to check.
- **Port Issues**: Check if 3000 is blocked by firewall.

## Production Deployment

- Use environment variable `PORT` for hosting platforms like Heroku.
- Add HTTPS for secure WebSockets (`wss://`).

---

For more details, see the project code: `server.js` for backend, `public/` for frontend.
