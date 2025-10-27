# Web-Based Real-Time Chat

## 1. Project Overview

This project is a simple, web-based, real-time chat application. It allows users to join chat rooms (called "channels") by visiting a specific URL, choosing a nickname, and sending messages that appear instantly for all other users in the same channel.

The defining feature of this application is that it is **logless and ephemeral**. The server does not store any chat history. Messages exist only as long as users are in the channel. When the last user leaves a channel, the channel and its conversation disappear completely.

---

## 2. Core Architecture: How It Works

The entire service is built on a classic client-server model, but with a modern real-time twist.

**Core Technology:**
- **Backend:** A Node.js server using the **Express** framework. Its primary job is to serve the frontend application to the user.
- **Real-time Communication:** **WebSockets**. This is the most critical piece. A WebSocket is a persistent, two-way communication channel between the client (your browser) and the server. Unlike a normal webpage request (HTTP), this connection stays open, allowing the server to "push" information to clients instantly.
- **Frontend:** A standard single-page application (SPA) built with **HTML, CSS, and JavaScript**. All the logic for displaying messages and interacting with the user runs in the browser.

### Step-by-Step Communication Flow

Let's say you open the URL: `http://localhost:3000/?my-channel`

1.  **Initial Connection (HTTP):**
    - Your browser makes a standard HTTP `GET` request to the server.
    - The Node.js/Express server responds by sending back the static files that make up the application: `index.html`, `style.css`, and `main.js`.

2.  **Client-Side Setup (JavaScript):**
    - The `main.js` script begins to run in your browser.
    - It parses the URL to find the channel name (`my-channel`).
    - It prompts you to enter a nickname (e.g., "Alex").

3.  **Opening the WebSocket:**
    - Now that the script has a channel and a nickname, it opens a WebSocket connection to the very same server. This is like opening a persistent "phone line" for instant messages.

4.  **Joining a Channel:**
    - As soon as the WebSocket connection is established, the client sends its first message—a special JSON command to "join" the channel:
      ```json
      {
        "cmd": "join",
        "channel": "my-channel",
        "nick": "Alex"
      }
      ```

5.  **Server-Side Handling:**
    - The WebSocket server receives this `join` command.
    - It checks its memory for a "room" or "channel" named `my-channel`. If it doesn't exist, it creates one. A channel is simply a list (an array) of all the users currently in it.
    - It adds "Alex" to the list for `my-channel`.
    - The server then broadcasts two messages to **everyone** in `my-channel`: an informational message that "Alex has joined" and an updated list of all online users.

6.  **Sending and Receiving Messages (The Relay):**
    - You type "Hello everyone!" and hit Send.
    - Your browser does **not** send this message directly to other users. It sends another JSON command to the server over the WebSocket:
      ```json
      {
        "cmd": "chat",
        "text": "Hello everyone!"
      }
      ```
    - The server receives this `chat` command. It looks up the channel you are in (`my-channel`) and relays (or broadcasts) a new message to every single user in that channel's list. The relayed message includes your nickname:
      ```json
      {
        "cmd": "chat",
        "nick": "Alex",
        "text": "Hello everyone!"
      }
      ```
    - Every user in the channel (including you) receives this final message. The `main.js` script in their browsers then adds the new message to the chat window.

7.  **Disconnecting:**
    - When you close your browser tab, the WebSocket connection is terminated.
    - The server detects this `close` event, removes you from the `my-channel` list, and broadcasts a final message that "Alex has left."

---

## 3. Technology Stack

- **Backend:**
  - **Node.js:** The JavaScript runtime environment for the server.
  - **Express.js:** A web framework for Node.js, used here to serve the static frontend files.
  - **`ws` (WebSocket) Library:** A popular, lightweight library for creating the WebSocket server.
- **Frontend:**
  - **HTML5:** For the basic structure of the application.
  - **CSS3:** For all styling and layout.
  - **JavaScript (ES6+):** For all client-side logic, including DOM manipulation and WebSocket communication.

---

## 4. File-by-File Breakdown

The project has a very simple and clean structure.

- **`package.json`**: The standard Node.js project file. It lists project metadata and dependencies (`express`, `ws`).
- **`server.js`**: The heart of the backend. This single file contains all the server-side logic.
  - It creates an `express` application to serve files from the `public` folder.
  - It creates an `http` server.
  - It attaches a `WebSocket` server to the `http` server, so they can share the same port.
  - It handles all incoming WebSocket connections and messages (`join`, `chat`).
  - It keeps track of all channels and users in an in-memory object called `channels`.
- **`public/`**: The folder containing all frontend files that are sent to the user.
  - **`index.html`**: The main HTML file. It defines the layout of the page, including the message area, user list, and input form.
  - **`style.css`**: Provides the visual styling for the chat, creating the two-column layout and making it look clean and modern.
  - **`main.js`**: The heart of the frontend. This script is responsible for:
    - Prompting the user for a nickname.
    - Establishing and managing the WebSocket connection.
    - Sending `join` and `chat` commands to the server.
    - Listening for messages from the server and dynamically updating the HTML to show new messages and user list changes.

---

## 5. How to Run the Project

1.  **Install Dependencies:**
    - You need to have Node.js installed.
    - Open your terminal in the project root and run:
      ```bash
      npm install
      ```
      This will download the `express` and `ws` libraries.

2.  **Start the Server:**
    - In the same terminal, run:
      ```bash
      node server.js
      ```
    - You should see the message: `Server is listening on port 3000`.

3.  **Use the Chat:**
    - Open your web browser and navigate to `http://localhost:3000`.
    - To chat in a specific channel, use a query parameter in the URL, like `http://localhost:3000/?friends`.
    - To test the multi-user functionality, open the same URL in several different browser tabs or windows.

---

## 6. Advantages and Disadvantages

### Advantages

1.  **Excellent Privacy:** This is the strongest feature. Since no chat logs, messages, or user data are ever saved to a disk or database, the conversations are completely ephemeral and private. Once the session is over, the data is gone forever.

2.  **High Performance & Low Latency:** The server acts as a simple in-memory relay. It doesn't need to perform slow database queries or write to files. This makes it incredibly fast, and messages are delivered to other users almost instantly.

3.  **Simplicity and Low Resource Usage:** The backend logic is minimal and easy to understand. Because it doesn't have the overhead of a database, it uses very little CPU and RAM, making it cheap to run and easy to maintain.

4.  **Real-Time by Nature:** The WebSocket-based architecture is designed from the ground up for real-time communication, making it a perfect fit for applications where instant updates are critical.

### Disadvantages

1.  **No Chat History (High Volatility):** This is the flip side of the privacy advantage. If you accidentally close your browser tab, lose your internet connection, or refresh the page, the entire conversation history is lost. There is no way to retrieve past messages.

2.  **No Offline Messaging:** The application only works for users who are online and connected at the same time. If a message is sent while you are disconnected, you will never receive it.

3.  **Scalability is Challenged:** The server is **stateful**, meaning it stores all channel and user information in its own memory. You cannot run multiple copies of this server behind a load balancer to handle more traffic, because a user on Server A would be in a completely different "world" from a user on Server B. All users must connect to the same single server process.

4.  **Lack of Basic Features:** The simple design lacks many features that users expect from modern chat applications:
    *   **No Persistent Identity:** Anyone can take any nickname. There are no user accounts, so you can't be sure who you're talking to, and impersonation is easy.
    *   **No Private Messages:** All messages are sent to the entire channel.
    *   **No Rich Content:** No support for file uploads, message editing/deleting, read receipts, etc.

5.  **Single Point of Failure:** If the single Node.js server process crashes for any reason, all active chat rooms and connections are instantly destroyed.