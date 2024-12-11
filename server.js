const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let waitingUsers = [];

wss.on('connection', ws => {
  console.log('A user connected');
  
  // Add the user to the waiting list
  waitingUsers.push(ws);
  
  // Match with a random user when two users are available
  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.pop();
    const user2 = waitingUsers.pop();

    user1.send('Matched with a random person!');
    user2.send('Matched with a random person!');

    // Send the signaling data for WebRTC (simplified)
    user1.send(JSON.stringify({ type: 'startChat', peerId: user2._socket.remoteAddress }));
    user2.send(JSON.stringify({ type: 'startChat', peerId: user1._socket.remoteAddress }));
  }

  ws.on('message', message => {
    console.log('Received message: ', message);
    // Broadcast the message to all connected clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('A user disconnected');
    // Remove user from the waiting list when they disconnect
    waitingUsers = waitingUsers.filter(client => client !== ws);
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
