import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ArrowLeft } from 'lucide-react';

const host = "https://flow-backend-ztda.onrender.com";
const SIGNAL_URL = `${host}/video`;

// --- Peer Video Component ---
// This component is responsible for rendering a single peer's video feed.
function PeerVideo({ stream, username, connectionState }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="bg-black rounded-lg overflow-hidden relative w-full h-full min-h-[200px]">
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-sm font-semibold text-white">
        {username}
      </div>
      {connectionState && connectionState !== 'connected' && (
        <div className="absolute top-2 right-2 bg-yellow-500/70 px-2 py-1 rounded text-xs capitalize text-white animate-pulse">
          {connectionState}...
        </div>
      )}
    </div>
  );
}

// --- Main Video Call Page (Rewritten for Stability) ---
export default function VideoCallPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    const [currentUser, setCurrentUser] = useState(null);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [peers, setPeers] = useState([]);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState(null);

    // Refs for managing WebRTC objects without causing re-renders
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const peersRef = useRef(new Map()); // Maps peerId to their connection object { pc, id, username, ... }
    const pendingCandidatesRef = useRef(new Map()); // Maps peerId to an array of queued ICE candidates
    
    // CRITICAL FIX: Refs to prevent race conditions
    const activePeersRef = useRef(new Set()); // Tracks ONLY active peer IDs to prevent duplicates
    const peerCreationLockRef = useRef(new Set()); // Prevents concurrent creation of the same peer

    // Stable cleanup function
    const leaveRoom = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('leave-room');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        peersRef.current.forEach(({ pc }) => pc?.close());
        peersRef.current.clear();
        pendingCandidatesRef.current.clear();
        activePeersRef.current.clear();
        peerCreationLockRef.current.clear();
        navigate('/dashboard');
    }, [navigate]);

    // Stable function to update the React state for rendering
    const updatePeersList = useCallback(() => {
        const validPeers = Array.from(activePeersRef.current)
            .map(peerId => peersRef.current.get(peerId))
            .filter(Boolean); // Filter out any undefined entries
        setPeers(validPeers);
    }, []);

    // Function to process queued ICE candidates after the remote description is set
    const processPendingCandidates = useCallback(async (peerId) => {
        const candidates = pendingCandidatesRef.current.get(peerId) || [];
        const peer = peersRef.current.get(peerId);
        if (peer && peer.pc.remoteDescription && candidates.length > 0) {
            for (const candidate of candidates) {
                try {
                    await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
            pendingCandidatesRef.current.delete(peerId);
        }
    }, []);

    // This is the core of the fix: a completely rewritten peer creation function with locks
    const createPeerConnection = useCallback((peerId, peerUsername, isInitiator = false) => {
        // ATOMIC CHECK: If peer is being created or already exists, abort immediately
        if (peerCreationLockRef.current.has(peerId) || activePeersRef.current.has(peerId)) {
            return;
        }
        
        peerCreationLockRef.current.add(peerId); // LOCK this peer ID
        
        try {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
            const peerData = { pc, id: peerId, username: peerUsername, stream: null, connectionState: 'new' };

            peersRef.current.set(peerId, peerData);
            activePeersRef.current.add(peerId);

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
            }

            pc.ontrack = (event) => {
                peerData.stream = event.streams[0];
                updatePeersList();
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && socketRef.current) {
                    socketRef.current.emit("signal", { to: peerId, data: { candidate: event.candidate } });
                }
            };

            pc.oniceconnectionstatechange = () => {
                peerData.connectionState = pc.iceConnectionState;
                if (pc.iceConnectionState === 'failed') pc.restartIce?.();
                updatePeersList();
            };

            if (isInitiator) {
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => socketRef.current.emit("signal", { to: peerId, data: pc.localDescription }))
                    .catch(error => console.error(`Error creating offer for ${peerUsername}:`, error));
            }

            updatePeersList();
            return peerData;
        } finally {
            peerCreationLockRef.current.delete(peerId); // UNLOCK
        }
    }, [updatePeersList]);

    // Stable function to handle incoming signals
    const handleSignal = useCallback(async ({ from, name, data }) => {
        let peerData = peersRef.current.get(from);
        
        if (!peerData && !activePeersRef.current.has(from)) {
            peerData = createPeerConnection(from, name, false);
        }
        if (!peerData) return;

        const { pc } = peerData;
        try {
            if (data.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
                await processPendingCandidates(from);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current.emit("signal", { to: from, data: pc.localDescription });
            } else if (data.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
                await processPendingCandidates(from);
            } else if (data.candidate) {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    if (!pendingCandidatesRef.current.has(from)) pendingCandidatesRef.current.set(from, []);
                    pendingCandidatesRef.current.get(from).push(data.candidate);
                }
            }
        } catch (error) {
            console.error(`Error handling signal from ${name}:`, error);
        }
    }, [createPeerConnection, processPendingCandidates]);
    
    // Stable function to remove a peer
    const removePeer = useCallback((peerId) => {
        const peerData = peersRef.current.get(peerId);
        if (peerData) peerData.pc.close();
        peersRef.current.delete(peerId);
        activePeersRef.current.delete(peerId);
        pendingCandidatesRef.current.delete(peerId);
        peerCreationLockRef.current.delete(peerId);
        updatePeersList();
    }, [updatePeersList]);

    // This is the single, massive useEffect that runs only ONCE.
    useEffect(() => {
        let isMounted = true;

        const initializeCall = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                setError(null);
                setIsConnecting(true);

                const userData = await fetch(`${host}/api/auth/getuser`, { method: 'POST', headers: { 'auth-token': token }}).then(res => res.ok ? res.json() : Promise.reject('Failed to fetch user'));
                if (!isMounted) return;
                setCurrentUser(userData);

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                if (!isMounted) { stream.getTracks().forEach(t=>t.stop()); return; }
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                const socket = io(SIGNAL_URL, { transports: ["websocket"] });
                socketRef.current = socket;

                socket.on("connect", () => socket.emit("join-room", { roomId: projectId, username: userData.name }));
                socket.on('connect_error', () => { setError("Failed to connect to video server"); setIsConnecting(false); });
                socket.on("existing-peers", (existingPeers) => existingPeers.forEach(peer => createPeerConnection(peer.id, peer.name, true)));
                socket.on("peer-joined", (peer) => createPeerConnection(peer.id, peer.name, false));
                socket.on("signal", handleSignal);
                socket.on("peer-left", removePeer);
                socket.on("room-joined", () => setIsConnecting(false));

            } catch (error) {
                setError(error.message || "Could not start video call. Please grant camera/microphone permissions.");
                setIsConnecting(false);
            }
        };

        initializeCall();

        return () => {
            isMounted = false;
            if (socketRef.current) socketRef.current.disconnect();
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
            peersRef.current.forEach(({ pc }) => pc?.close());
            peersRef.current.clear();
            activePeersRef.current.clear();
            peerCreationLockRef.current.clear();
            pendingCandidatesRef.current.clear();
        };
    }, [projectId, navigate, createPeerConnection, handleSignal, removePeer]);

    const toggleMic = useCallback(() => {
        localStreamRef.current?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setMicOn(prev => !prev);
    }, []);

    const toggleCam = useCallback(() => {
        localStreamRef.current?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setCamOn(prev => !prev);
    }, []);

    if (error) {
        return (
            <div className="fixed inset-0 bg-gray-800 flex flex-col items-center justify-center z-50 text-white p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-red-400">Video Call Error</h2>
                    <p className="mb-4">{error}</p>
                    <button onClick={leaveRoom} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-800 flex flex-col items-center justify-center z-50 text-white p-4">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <button onClick={leaveRoom} className="flex items-center gap-2 text-white hover:text-gray-300">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                {isConnecting && <div className="flex items-center gap-2 text-yellow-400 animate-pulse">Connecting...</div>}
            </div>
            <h2 className="text-2xl font-bold mb-4 mt-8">Video Call</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl flex-1 mb-4">
                <div className="bg-black rounded-lg overflow-hidden relative min-h-[200px]">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-sm font-semibold text-white">
                        {currentUser?.name || 'You'} (You)
                    </div>
                </div>
                {peers.map(peer => <PeerVideo key={peer.id} {...peer} />)}
            </div>
            <div className="flex items-center gap-4">
                <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? 'bg-gray-600' : 'bg-red-600'}`}>
                    {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button onClick={toggleCam} className={`p-3 rounded-full ${camOn ? 'bg-gray-600' : 'bg-red-600'}`}>
                    {camOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button onClick={leaveRoom} className="p-3 bg-red-600 hover:bg-red-500 rounded-full">
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
}

