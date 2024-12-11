// Grab DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const textArea = document.getElementById('textArea');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');
const startChatButton = document.getElementById('startChatButton');
const skipButton = document.getElementById('skipButton');
const endChatButton = document.getElementById('endChatButton');

// WebRTC setup (for video chat)
let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // STUN server for NAT traversal
let socket;

// Set up video stream
function setupLocalStream() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;
      localVideo.srcObject = stream;
    })
    .catch(error => {
      console.error('Error accessing media devices', error);
    });
}

// Set up WebSocket for text chat
function setupWebSocket() {
  socket = new WebSocket('ws://localhost:8080'); // Local WebSocket server

  socket.onopen = () => {
    console.log('Connected to the WebSocket server.');
  };

  socket.onmessage = (event) => {
    const message = event.data;
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
  };

  sendButton.addEventListener('click', () => {
    const message = textArea.value;
    if (message) {
      socket.send(message);
      textArea.value = ''; // Clear the text area
    }
  });
}

// Start a new random chat (initiate WebRTC peer connection)
startChatButton.addEventListener('click', () => {
  startChatButton.style.display = 'none';
  skipButton.style.display = 'inline';
  endChatButton.style.display = 'inline';

  setupLocalStream();
  setupWebSocket();

  // Create peer connection and exchange media
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Implement signaling and matchmaking via WebSocket or a server (this is simplified)
  socket.send(JSON.stringify({ type: 'startChat' }));
});

// Skip to the next random person (close current peer connection)
skipButton.addEventListener('click', () => {
  if (peerConnection) {
    peerConnection.close();
    remoteVideo.srcObject = null; // Reset remote video stream
  }
  
  // Re-initialize a new chat
  startChatButton.click();
});

// End the chat (disconnect)
endChatButton.addEventListener('click', () => {
  if (peerConnection) {
    peerConnection.close();
    remoteVideo.srcObject = null; // Reset remote video stream
  }

  // Reset the UI
  startChatButton.style.display = 'inline';
  skipButton.style.display = 'none';
  endChatButton.style.display = 'none';
});
