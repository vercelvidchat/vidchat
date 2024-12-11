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
let peerId = null; // To keep track of the peer's unique ID

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

// Set up WebSocket for text chat and WebRTC signaling
function setupWebSocket() {
  socket = new WebSocket('ws://13.51.163.191:8080'); // Local WebSocket server

  socket.onopen = () => {
    console.log('Connected to the WebSocket server.');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'startChat') {
      peerId = message.peerId;
      console.log('Matched with peer:', peerId);
      // Create offer once matched
      createOffer();
    } else if (message.type === 'offer') {
      handleOffer(message);
    } else if (message.type === 'answer') {
      handleAnswer(message);
    } else if (message.type === 'iceCandidate') {
      handleIceCandidate(message);
    } else {
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      messagesDiv.appendChild(messageDiv);
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

// Create WebRTC offer
function createOffer() {
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({
        type: 'iceCandidate',
        candidate: event.candidate,
        peerId: peerId
      }));
    }
  };

  // Create and send offer
  peerConnection.createOffer()
    .then(offer => {
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      socket.send(JSON.stringify({
        type: 'offer',
        offer: peerConnection.localDescription,
        peerId: peerId
      }));
    })
    .catch(error => {
      console.error('Error creating offer:', error);
    });
}

// Handle incoming offer
function handleOffer(message) {
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({
        type: 'iceCandidate',
        candidate: event.candidate,
        peerId: message.peerId
      }));
    }
  };

  peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer))
    .then(() => peerConnection.createAnswer())
    .then(answer => peerConnection.setLocalDescription(answer))
    .then(() => {
      socket.send(JSON.stringify({
        type: 'answer',
        answer: peerConnection.localDescription,
        peerId: message.peerId
      }));
    })
    .catch(error => {
      console.error('Error handling offer:', error);
    });
}

// Handle incoming answer
function handleAnswer(message) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer))
    .catch(error => {
      console.error('Error setting remote description:', error);
    });
}

// Handle incoming ICE candidate
function handleIceCandidate(message) {
  const candidate = new RTCIceCandidate(message.candidate);
  peerConnection.addIceCandidate(candidate)
    .catch(error => {
      console.error('Error adding ICE candidate:', error);
    });
}

// Start a new random chat (initiate WebRTC peer connection)
startChatButton.addEventListener('click', () => {
  startChatButton.style.display = 'none';
  skipButton.style.display = 'inline';
  endChatButton.style.display = 'inline';

  setupLocalStream();
  setupWebSocket();
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
