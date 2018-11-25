var inputRoomNumber = document.getElementById('roomNumber');
var goRoom = document.getElementById('goRoom');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var roomNumber;
var isCaller;
var rtcPeerConnection;
var localStream;
const mediaConstraints = {
    audio: {
        echoCancellation: true
    },
    video: {
        width: 300
    }
}
var socket = io('');

var configIceServers = {
    iceServers: [
        { 'url': 'stun:stun.l.google.com:19302' }
    ]
}

goRoom.onclick = () => {
    roomNumber = inputRoomNumber.value;
    if (roomNumber === '') {
        alert('please type a room number');
    } else {
        socket.emit('create or join', roomNumber);
        inputRoomNumber.style = "display: none";
        goRoom.style = "display: none";
    }
}

socket.on('created', (room) => {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
            localVideo.srcObject = stream;
            localStream = stream;
            isCaller = true;
        })
        .catch('An error ocured when accessing media devices');
});

socket.on('joined', (room) => {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
            localVideo.srcObject = stream;
            localStream = stream;
            socket.emit('ready', roomNumber);
        })
        .catch('An error ocured when accessing media devices');
});

socket.on('ready', (ready) => {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(configIceServers);
        rtcPeerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: roomNumber
                });
            }
        }

        rtcPeerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        }

        localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));

        rtcPeerConnection.createOffer(offer => {
            rtcPeerConnection.setLocalDescription(offer);
            socket.emit('offer', {
                type: 'offer',
                sdp: offer,
                room: roomNumber
            });
        }, err => console.log(err));
    }
});

socket.on('full', msg => {
    alert('room is fulled')
})

socket.on('offer', offer => {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(configIceServers);
        rtcPeerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: roomNumber
                });
            }
        }

        rtcPeerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        }

        localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));

        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        rtcPeerConnection.createAnswer(answer => {
            rtcPeerConnection.setLocalDescription(answer);
            socket.emit('answer', {
                type: 'answer',
                sdp: answer,
                room: roomNumber
            });
        }, err => console.trace(err));
    }
});
socket.on('candidate', candidateData => {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: candidateData.label,
        candidate: candidateData.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('answer', answer => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});


