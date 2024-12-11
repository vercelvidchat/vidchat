const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let waitingUsers = [];
let userCount = 0; // This will track the number of users connected

wss.on('connection', ws => {
  // Assign a unique identifier (ID) to the user based on the number of users
  const userId = ++userCount;
  console.log(`User ${userId} connected`);

  // Send the unique userId to the client when they connect
  ws.send(JSON.stringify({ type: 'userId', userId: userId }));

  // Add the user to the waiting list
  waitingUsers.push({ ws, userId });

  // When two users are connected, match them and establish a connection
  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.pop();
    const user2 = waitingUsers.pop();

    // Notify both users that they are matched
    user1.ws.send(JSON.stringify({ type: 'matched', peerId: user2.userId }));
    user2.ws.send(JSON.stringify({ type: 'matched', peerId: user1.userId }));

    // Optionally, add logic to initiate the WebRTC signaling process here (simplified)
    console.log(`Users ${user1.userId} and ${user2.userId} matched!`);
  }

  ws.on('message', message => {
    console.log(`Received message from user ${userId}: `, message);
    // Broadcast the message to the matched user(s)
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log(`User ${userId} disconnected`);
    // Remove user from the waiting list when they disconnect
    waitingUsers = waitingUsers.filter(client => client.ws !== ws);
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
