// Grab DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const textArea = document.getElementById('textArea');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');

// WebRTC setup (for video chat)
let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // STUN server for NAT traversal

// Set up video stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;

    // Create peer connection
    peerConnection = new RTCPeerConnection(servers);

    // Add local tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    // WebSocket or other signaling server here to establish peer-to-peer connection
    // (for now, you would need a signaling server to connect peers)
  })
  .catch(error => {
    console.error('Error accessing media devices', error);
  });

// WebSocket setup for text chat
const socket = new WebSocket('ws://localhost:8080'); // Local WebSocket server

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
