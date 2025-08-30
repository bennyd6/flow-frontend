import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

const SIGNAL_URL = "https://flow-backend-ztda.onrender.com/video";

function PeerVideo({ stream, username, connectionState }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
      <div className="bg-black rounded-lg overflow-hidden relative w-full h-full">
        <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">{username}</div>
        {connectionState !== 'connected' && <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs capitalize">{connectionState}...</div>}
      </div>
  );
}

export default function VideoCallModal({ isOpen, onClose, roomId, username }) {
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [peers, setPeers] = useState([]);

    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const peersRef = useRef(new Map());

    const leaveRoom = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        peersRef.current.forEach(({ pc }) => pc.close());
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        peersRef.current.clear();
        setPeers([]);
        onClose();
    }, [onClose]);

    const addPeer = useCallback((peerId, peerUsername, isInitiator) => {
        if (peersRef.current.has(peerId)) return;

        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        const entry = { pc, id: peerId, username: peerUsername, stream: new MediaStream(), connectionState: 'new' };
        peersRef.current.set(peerId, entry);
        setPeers(Array.from(peersRef.current.values()));

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socketRef.current.emit("signal", { to: peerId, data: { candidate: e.candidate } });
            }
        };

        pc.ontrack = (e) => {
            entry.stream = e.streams[0];
            setPeers(Array.from(peersRef.current.values()));
        };
        
        pc.oniceconnectionstatechange = () => {
            entry.connectionState = pc.iceConnectionState;
            setPeers(Array.from(peersRef.current.values()));
        };

        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

        if (isInitiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => socketRef.current.emit("signal", { to: peerId, data: pc.localDescription }));
        }
        
        return pc;
    }, []);

    const joinRoom = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } catch (err) {
            alert("Camera and microphone access is required. Please grant permission.");
            onClose();
            return;
        }

        socketRef.current = io(SIGNAL_URL, { transports: ["websocket"] });
        socketRef.current.on('connect_error', () => { alert("Failed to connect to video server."); leaveRoom(); });
        socketRef.current.on("connect", () => socketRef.current.emit("join-room", { roomId, username }));

        socketRef.current.on("existing-peers", (existingPeers) => {
            existingPeers.forEach(peer => addPeer(peer.id, peer.name, true));
        });

        socketRef.current.on("peer-joined", (peer) => {
            addPeer(peer.id, peer.name, false);
        });

        socketRef.current.on("signal", async ({ from, name, data }) => {
            const entry = peersRef.current.get(from);
            if (!entry) return;

            const { pc } = entry;
            if (data.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current.emit("signal", { to: from, data: pc.localDescription });
            } else if (data.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
            } else if (data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        socketRef.current.on("peer-left", (peerId) => {
            const entry = peersRef.current.get(peerId);
            if (entry) {
                entry.pc.close();
                peersRef.current.delete(peerId);
                setPeers(Array.from(peersRef.current.values()));
            }
        });
    }, [roomId, username, onClose, leaveRoom, addPeer]);

    useEffect(() => {
        if (isOpen) {
            joinRoom();
        }
        return () => {
            if (socketRef.current) {
                leaveRoom();
            }
        };
    }, [isOpen, joinRoom, leaveRoom]);

    const toggleMic = () => { localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !t.enabled); setMicOn(e => !e); };
    const toggleCam = () => { localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = !t.enabled); setCamOn(e => !e); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 text-white p-4">
            <h2 className="text-2xl font-bold mb-4">Video Call - Room: {roomId}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-3/4">
                <div className="bg-black rounded-lg overflow-hidden relative"><video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" /><div className="absolute bottom-2 left-2 bg-black/50 p-1 rounded">{username} (You)</div></div>
                {peers.map(peer => <PeerVideo key={peer.id} {...peer} />)}
            </div>
            <div className="flex items-center gap-4 mt-4">
                <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? 'bg-gray-600' : 'bg-red-600'}`}>{micOn ? <Mic /> : <MicOff />}</button>
                <button onClick={toggleCam} className={`p-3 rounded-full ${camOn ? 'bg-gray-600' : 'bg-red-600'}`}>{camOn ? <Video /> : <VideoOff />}</button>
                <button onClick={leaveRoom} className="px-6 py-3 bg-red-600 rounded-lg font-semibold">Leave Call</button>
            </div>
        </div>
    );
};
