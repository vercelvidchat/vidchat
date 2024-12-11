// Grab DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const textArea = document.getElementById('textArea');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');
const startChatButton = document.getElementById('startChatButton');
const skipButton = document.getElementById('skipButton');
const endChatButton = document.getElementById('endChatButton');

// Variable to store user ID
let userId = null;
let peerConnection;
let localStream;
let socket;

// Setup local video stream
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

// Set up WebSocket for text chat and user matching
function setupWebSocket() {
  socket = new WebSocket('ws://localhost:8080'); // Local WebSocket server

  socket.onopen = () => {
    console.log('Connected to the WebSocket server.');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'userId') {
      userId = message.userId; // Store the unique user ID
      console.log(`Assigned userId: ${userId}`);
      document.getElementById('messages').innerHTML = `Your User ID: ${userId}`;
    }

    if (message.type === 'matched') {
      // When matched, show the peer's user ID and start the video call
      const peerId = message.peerId;
      alert(`You are now matched with User ID: ${peerId}`);
      startChat(peerId);
    }
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
function startChat(peerId) {
  startChatButton.style.display = 'none';
  skipButton.style.display = 'inline';
  endChatButton.style.display = 'inline';

  setupLocalStream();
  setupWebSocket();

  // Create a new peer connection
  peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // WebRTC signaling could happen here, sending offer/answer messages (simplified)
  // Implement WebRTC signaling here for connecting peer-to-peer (not covered in this example)
}

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
