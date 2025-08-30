import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ArrowLeft, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const host = "https://flow-backend-ztda.onrender.com";
const SIGNAL_URL = `${host}/video`;

// Enhanced WebRTC Configuration with multiple STUN/TURN servers
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Multiple TURN servers for better reliability
    {
      urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: ["turn:openrelay.metered.ca:80?transport=tcp", "turn:openrelay.metered.ca:443?transport=tcp"],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    // Backup TURN servers
    {
      urls: "turn:relay.backups.cz",
      username: "webrtc",
      credential: "webrtc",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Connection states with user-friendly messages
const CONNECTION_STATES = {
  new: { message: "Initializing...", color: "text-blue-400", bgColor: "bg-blue-500/70" },
  checking: { message: "Connecting...", color: "text-yellow-400", bgColor: "bg-yellow-500/70" },
  connected: { message: "Connected", color: "text-green-400", bgColor: "bg-green-500/70" },
  completed: { message: "Connected", color: "text-green-400", bgColor: "bg-green-500/70" },
  disconnected: { message: "Reconnecting...", color: "text-orange-400", bgColor: "bg-orange-500/70" },
  failed: { message: "Connection Failed", color: "text-red-400", bgColor: "bg-red-500/70" },
  closed: { message: "Disconnected", color: "text-gray-400", bgColor: "bg-gray-500/70" },
};

// Enhanced Peer Video Component with connection state indicators
function PeerVideo({ stream, username, connectionState, isRetrying }) {
  const ref = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      // Check if stream has active video tracks
      const videoTracks = stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
    }
  }, [stream]);

  const stateInfo = CONNECTION_STATES[connectionState] || CONNECTION_STATES.new;

  return (
    <div className="bg-black rounded-lg overflow-hidden relative w-full h-full min-h-[200px] border-2 border-gray-600">
      {stream ? (
        <video 
          ref={ref} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-400">Waiting for video...</p>
          </div>
        </div>
      )}
      
      {/* Username badge */}
      <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-sm font-semibold text-white border border-gray-500">
        {username}
      </div>
      
      {/* Connection state indicator */}
      <div className={`absolute top-2 right-2 ${stateInfo.bgColor} px-2 py-1 rounded text-xs capitalize text-white flex items-center gap-1`}>
        {connectionState === 'connected' || connectionState === 'completed' ? (
          <Wifi size={12} />
        ) : (
          <WifiOff size={12} />
        )}
        {stateInfo.message}
        {isRetrying && <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full ml-1"></div>}
      </div>

      {/* No video indicator */}
      {!hasVideo && stream && (
        <div className="absolute top-2 left-2 bg-gray-500/70 px-2 py-1 rounded text-xs text-white">
          No Video
        </div>
      )}
    </div>
  );
}

// Connection quality indicator component
function ConnectionQuality({ quality }) {
  const getQualityColor = (quality) => {
    if (quality >= 80) return "text-green-400";
    if (quality >= 60) return "text-yellow-400";
    if (quality >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className={`flex items-center gap-1 ${getQualityColor(quality)}`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 h-3 rounded-sm ${
              quality >= bar * 25 ? 'bg-current' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-xs">{quality}%</span>
    </div>
  );
}

// Main Video Call Component
export default function VideoCallPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [peers, setPeers] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState(100);
  const [retryCount, setRetryCount] = useState(0);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const activePeersRef = useRef(new Set());
  const peerCreationLockRef = useRef(new Set());
  const connectionTimeoutsRef = useRef(new Map());
  const retryTimeoutsRef = useRef(new Map());
  const qualityCheckIntervalRef = useRef(null);

  // Enhanced leave room function with cleanup
  const leaveRoom = useCallback(() => {
    console.log('Leaving room...');
    
    // Clear all timeouts
    connectionTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    // Close all peer connections
    peersRef.current.forEach(({ pc, username }) => {
      console.log('Closing peer connection for:', username);
      pc?.close();
    });
    
    // Clear all references
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    activePeersRef.current.clear();
    peerCreationLockRef.current.clear();
    connectionTimeoutsRef.current.clear();
    retryTimeoutsRef.current.clear();
    
    navigate('/dashboard');
  }, [navigate]);

  // Enhanced peers list update with retry tracking
  const updatePeersList = useCallback(() => {
    const validPeers = Array.from(activePeersRef.current)
      .map(peerId => {
        const peer = peersRef.current.get(peerId);
        if (peer) {
          return {
            ...peer,
            isRetrying: retryTimeoutsRef.current.has(peerId),
          };
        }
        return null;
      })
      .filter(Boolean);
    setPeers(validPeers);
  }, []);

  // Enhanced ICE candidate processing with error handling
  const processPendingCandidates = useCallback(async (peerId) => {
    const candidates = pendingCandidatesRef.current.get(peerId) || [];
    const peer = peersRef.current.get(peerId);
    
    if (peer && peer.pc.remoteDescription && candidates.length > 0) {
      console.log(`Processing ${candidates.length} pending candidates for ${peer.username}`);
      
      for (const candidate of candidates) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added ICE candidate successfully');
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
          // Continue with other candidates even if one fails
        }
      }
      pendingCandidatesRef.current.delete(peerId);
    }
  }, []);

  // Enhanced retry mechanism for failed connections
  const retryPeerConnection = useCallback((peerId, peerUsername, maxRetries = 3) => {
    const currentRetries = retryTimeoutsRef.current.get(peerId) || 0;
    
    if (currentRetries >= maxRetries) {
      console.log(`Max retries reached for ${peerUsername}, giving up`);
      retryTimeoutsRef.current.delete(peerId);
      updatePeersList();
      return;
    }

    console.log(`Retrying connection for ${peerUsername} (attempt ${currentRetries + 1}/${maxRetries})`);
    retryTimeoutsRef.current.set(peerId, currentRetries + 1);
    setRetryCount(prev => prev + 1);
    
    // Remove existing peer
    const existingPeer = peersRef.current.get(peerId);
    if (existingPeer) {
      existingPeer.pc.close();
    }
    peersRef.current.delete(peerId);
    activePeersRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    
    // Clear existing timeout
    const existingTimeout = connectionTimeoutsRef.current.get(peerId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      connectionTimeoutsRef.current.delete(peerId);
    }

    // Retry after a delay
    setTimeout(() => {
      createPeerConnection(peerId, peerUsername, true);
      updatePeersList();
    }, 2000 * Math.pow(2, currentRetries)); // Exponential backoff
  }, [updatePeersList]);

  // Enhanced peer connection creation with comprehensive monitoring
  const createPeerConnection = useCallback((peerId, peerUsername, isInitiator = false) => {
    if (peerCreationLockRef.current.has(peerId) || 
        (activePeersRef.current.has(peerId) && peersRef.current.get(peerId)?.pc.connectionState !== 'closed')) {
      console.log(`Peer connection already exists or being created for ${peerUsername}`);
      return;
    }
    
    peerCreationLockRef.current.add(peerId);
    console.log(`Creating peer connection for ${peerUsername} (initiator: ${isInitiator})`);
    
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const peerData = { 
        pc, 
        id: peerId, 
        username: peerUsername, 
        stream: null, 
        connectionState: 'new',
        lastConnectionTime: Date.now(),
        statsData: {}
      };

      peersRef.current.set(peerId, peerData);
      activePeersRef.current.add(peerId);

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to peer connection`);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Enhanced track handling
      pc.ontrack = (event) => {
        console.log(`Received ${event.track.kind} track from ${peerUsername}`);
        peerData.stream = event.streams[0];
        peerData.lastConnectionTime = Date.now();
        updatePeersList();
        
        // Handle track ended event
        event.track.onended = () => {
          console.log(`${event.track.kind} track ended for ${peerUsername}`);
          updatePeersList();
        };
      };

      // Enhanced ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log(`Sending ICE candidate for ${peerUsername}:`, event.candidate.type);
          socketRef.current.emit("signal", { 
            to: peerId, 
            data: { candidate: event.candidate } 
          });
        } else if (!event.candidate) {
          console.log(`ICE candidate gathering complete for ${peerUsername}`);
        }
      };

      // Enhanced connection state monitoring
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`ICE connection state for ${peerUsername}: ${state}`);
        peerData.connectionState = state;
        peerData.lastConnectionTime = Date.now();

        // Clear connection timeout on successful connection
        if (state === 'connected' || state === 'completed') {
          const timeout = connectionTimeoutsRef.current.get(peerId);
          if (timeout) {
            clearTimeout(timeout);
            connectionTimeoutsRef.current.delete(peerId);
          }
          retryTimeoutsRef.current.delete(peerId);
        }

        // Handle failed connections with retry
        if (state === 'failed') {
          console.log(`Connection failed for ${peerUsername}, attempting restart...`);
          pc.restartIce?.();
          
          // Schedule retry if restart doesn't work
          setTimeout(() => {
            if (pc.iceConnectionState === 'failed') {
              retryPeerConnection(peerId, peerUsername);
            }
          }, 5000);
        }

        // Handle checking state timeout
        if (state === 'checking') {
          const checkingTimeout = setTimeout(() => {
            if (pc.iceConnectionState === 'checking') {
              console.log(`Connection stuck in checking state for ${peerUsername}, restarting ICE...`);
              pc.restartIce?.();
              
              // If still checking after restart, retry connection
              setTimeout(() => {
                if (pc.iceConnectionState === 'checking') {
                  retryPeerConnection(peerId, peerUsername);
                }
              }, 8000);
            }
          }, 15000); // 15 second timeout for checking state
          
          connectionTimeoutsRef.current.set(peerId, checkingTimeout);
        }

        updatePeersList();
      };

      // ICE gathering state monitoring
      pc.onicegatheringstatechange = () => {
        console.log(`ICE gathering state for ${peerUsername}: ${pc.iceGatheringState}`);
      };

      // Data channel for connection quality monitoring
      if (isInitiator) {
        const dataChannel = pc.createDataChannel('quality', { ordered: true });
        dataChannel.onopen = () => {
          console.log(`Data channel opened with ${peerUsername}`);
          // Start quality monitoring
          const qualityInterval = setInterval(() => {
            pc.getStats().then(stats => {
              // Process stats for connection quality
              let inboundRTP = null;
              stats.forEach(stat => {
                if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                  inboundRTP = stat;
                }
              });
              
              if (inboundRTP) {
                const quality = Math.min(100, Math.max(0, 
                  100 - (inboundRTP.packetsLost || 0) * 10
                ));
                peerData.statsData = { ...inboundRTP, quality };
              }
            }).catch(console.error);
          }, 5000);
          
          // Store interval for cleanup
          peerData.qualityInterval = qualityInterval;
        };
      }

      // Connection timeout (overall)
      const connectionTimeout = setTimeout(() => {
        const currentState = pc.iceConnectionState;
        if (currentState === 'new' || currentState === 'checking') {
          console.log(`Connection timeout for ${peerUsername} (state: ${currentState}), retrying...`);
          retryPeerConnection(peerId, peerUsername);
        }
      }, 30000); // 30 second overall timeout

      connectionTimeoutsRef.current.set(peerId, connectionTimeout);

      // Initiate connection if this is the initiator
      if (isInitiator) {
        pc.createOffer({ 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true 
        })
          .then(offer => {
            console.log(`Created offer for ${peerUsername}`);
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            socketRef.current.emit("signal", { 
              to: peerId, 
              data: pc.localDescription 
            });
          })
          .catch(error => {
            console.error(`Error creating offer for ${peerUsername}:`, error);
            retryPeerConnection(peerId, peerUsername);
          });
      }

      updatePeersList();
      return peerData;
    } catch (error) {
      console.error(`Failed to create peer connection for ${peerUsername}:`, error);
    } finally {
      peerCreationLockRef.current.delete(peerId);
    }
  }, [updatePeersList, retryPeerConnection]);

  // Enhanced signal handling with better error recovery
  const handleSignal = useCallback(async ({ from, name, data }) => {
    let peerData = peersRef.current.get(from);
    
    if (!peerData && !activePeersRef.current.has(from)) {
      console.log(`Creating new peer connection for incoming signal from ${name}`);
      peerData = createPeerConnection(from, name, false);
    }
    
    if (!peerData) {
      console.error(`No peer data found for ${name}`);
      return;
    }

    const { pc } = peerData;
    
    try {
      if (data.type === "offer") {
        console.log(`Received offer from ${name}`);
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        await processPendingCandidates(from);
        
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(answer);
        
        socketRef.current.emit("signal", { 
          to: from, 
          data: pc.localDescription 
        });
        console.log(`Sent answer to ${name}`);
        
      } else if (data.type === "answer") {
        console.log(`Received answer from ${name}`);
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        await processPendingCandidates(from);
        
      } else if (data.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log(`Added ICE candidate from ${name}`);
        } else {
          // Queue candidate for later processing
          if (!pendingCandidatesRef.current.has(from)) {
            pendingCandidatesRef.current.set(from, []);
          }
          pendingCandidatesRef.current.get(from).push(data.candidate);
          console.log(`Queued ICE candidate from ${name}`);
        }
      }
    } catch (error) {
      console.error(`Error handling signal from ${name}:`, error);
      // Retry connection on signal handling error
      setTimeout(() => {
        retryPeerConnection(from, name);
      }, 2000);
    }
  }, [createPeerConnection, processPendingCandidates, retryPeerConnection]);
  
  // Enhanced peer removal with cleanup
  const removePeer = useCallback((peerId) => {
    const peerData = peersRef.current.get(peerId);
    if (peerData) {
      console.log(`Removing peer: ${peerData.username}`);
      
      // Clean up quality monitoring
      if (peerData.qualityInterval) {
        clearInterval(peerData.qualityInterval);
      }
      
      peerData.pc.close();
    }
    
    // Clean up all references
    peersRef.current.delete(peerId);
    activePeersRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    peerCreationLockRef.current.delete(peerId);
    retryTimeoutsRef.current.delete(peerId);
    
    const timeout = connectionTimeoutsRef.current.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      connectionTimeoutsRef.current.delete(peerId);
    }
    
    updatePeersList();
  }, [updatePeersList]);

  // Enhanced initialization with better error handling
  useEffect(() => {
    let isMounted = true;
    let initializationTimeout;

    const initializeCall = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { 
          navigate('/login'); 
          return; 
        }

        setError(null);
        setIsConnecting(true);

        // Set initialization timeout
        initializationTimeout = setTimeout(() => {
          if (isMounted && isConnecting) {
            setError("Connection timeout. Please check your network and try again.");
            setIsConnecting(false);
          }
        }, 20000);

        // Fetch user data with timeout
        console.log('Fetching user data...');
        const userResponse = await fetch(`${host}/api/auth/getuser`, { 
          method: 'POST', 
          headers: { 'auth-token': token },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to authenticate user');
        }
        
        const userData = await userResponse.json();
        if (!isMounted) return;
        
        console.log('User authenticated:', userData.name);
        setCurrentUser(userData);

        // Get media with enhanced constraints
        console.log('Requesting media access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }, 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
        
        if (!isMounted) { 
          stream.getTracks().forEach(t => t.stop()); 
          return; 
        }
        
        console.log('Media access granted');
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize socket connection
        console.log('Connecting to signaling server...');
        const socket = io(SIGNAL_URL, { 
          transports: ["websocket"],
          timeout: 10000,
          forceNew: true
        });
        socketRef.current = socket;

        // Enhanced socket event handlers
        socket.on("connect", () => {
          console.log('Connected to signaling server');
          socket.emit("join-room", { roomId: projectId, username: userData.name });
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setError("Failed to connect to video server. Please check your network connection.");
          setIsConnecting(false);
        });

        socket.on("existing-peers", (existingPeers) => {
          console.log(`Found ${existingPeers.length} existing peers`);
          existingPeers.forEach(peer => {
            console.log(`Connecting to existing peer: ${peer.name}`);
            createPeerConnection(peer.id, peer.name, true);
          });
        });

        socket.on("peer-joined", (peer) => {
          console.log(`New peer joined: ${peer.name}`);
          createPeerConnection(peer.id, peer.name, false);
        });

        socket.on("signal", handleSignal);

        socket.on("peer-left", (peerId) => {
          console.log('Peer left:', peerId);
          removePeer(peerId);
        });

        socket.on("room-joined", () => {
          console.log('Successfully joined room');
          setIsConnecting(false);
          clearTimeout(initializationTimeout);
        });

        socket.on("room-error", (error) => {
          console.error('Room error:', error);
          setError(`Room error: ${error.message || error}`);
          setIsConnecting(false);
        });

        // Start connection quality monitoring
        qualityCheckIntervalRef.current = setInterval(() => {
          if (peersRef.current.size > 0) {
            // Calculate average connection quality
            let totalQuality = 0;
            let connectedPeers = 0;
            
            peersRef.current.forEach(peer => {
              if (peer.connectionState === 'connected' || peer.connectionState === 'completed') {
                connectedPeers++;
                totalQuality += peer.statsData.quality || 100;
              }
            });
            
            if (connectedPeers > 0) {
              setConnectionQuality(Math.round(totalQuality / connectedPeers));
            }
          }
        }, 5000);

      } catch (error) {
        console.error('Initialization error:', error);
        if (isMounted) {
          setError(error.message || "Could not start video call. Please grant camera/microphone permissions and check your network connection.");
          setIsConnecting(false);
        }
      }
    };

    initializeCall();

    return () => {
      isMounted = false;
      if (initializationTimeout) clearTimeout(initializationTimeout);
      if (qualityCheckIntervalRef.current) clearInterval(qualityCheckIntervalRef.current);
      
      // Cleanup connections
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(({ pc }) => pc?.close());
      peersRef.current.clear();
      activePeersRef.current.clear();
      peerCreationLockRef.current.clear();
      pendingCandidatesRef.current.clear();
      connectionTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [projectId, navigate, createPeerConnection, handleSignal, removePeer]);

  // Enhanced media controls with error handling
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
        console.log(`Audio track ${track.enabled ? 'enabled' : 'disabled'}`);
      });
      setMicOn(prev => !prev);
    }
  }, []);

  const toggleCam = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
        console.log(`Video track ${track.enabled ? 'enabled' : 'disabled'}`);
      });
      setCamOn(prev => !prev);
    }
  }, []);

  // Enhanced error display
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 flex justify-center">
            <AlertCircle size={64} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Video Call Error</h2>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
          {retryCount > 0 && (
            <p className="text-sm text-gray-400 mb-4">
              Retry attempts: {retryCount}
            </p>
          )}
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={leaveRoom} 
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <button 
          onClick={leaveRoom} 
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors bg-black/50 px-3 py-2 rounded-lg"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <div className="flex items-center gap-4">
          {/* Connection quality indicator */}
          <div className="bg-black/50 px-3 py-2 rounded-lg">
            <ConnectionQuality quality={connectionQuality} />
          </div>
          
          {/* Connection status */}
          {isConnecting && (
            <div className="flex items-center gap-2 text-yellow-400 animate-pulse bg-black/50 px-3 py-2 rounded-lg">
              <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
              Connecting...
            </div>
          )}
        </div>
      </div>

      {/* Room title and participant count */}
      <div className="text-center mb-4 mt-16">
        <h2 className="text-2xl font-bold mb-2">Video Call</h2>
        <p className="text-gray-400">
          {peers.length + 1} participant{peers.length !== 0 ? 's' : ''}
        </p>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-7xl flex-1 mb-4">
        {/* Local video */}
        <div className="bg-black rounded-lg overflow-hidden relative min-h-[200px] border-2 border-blue-500">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />
          <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-sm font-semibold text-white border border-gray-500">
            {currentUser?.name || 'You'} (You)
          </div>
          <div className="absolute top-2 right-2 bg-green-500/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
            <Wifi size={12} />
            Local
          </div>
          {/* Mic/Camera status indicators */}
          <div className="absolute top-2 left-2 flex gap-1">
            {!micOn && (
              <div className="bg-red-500/70 p-1 rounded">
                <MicOff size={12} />
              </div>
            )}
            {!camOn && (
              <div className="bg-red-500/70 p-1 rounded">
                <VideoOff size={12} />
              </div>
            )}
          </div>
        </div>
        
        {/* Peer videos */}
        {peers.map(peer => (
          <PeerVideo 
            key={peer.id} 
            stream={peer.stream}
            username={peer.username}
            connectionState={peer.connectionState}
            isRetrying={peer.isRetrying}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMic} 
          className={`p-3 rounded-full transition-colors ${
            micOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
          }`}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        <button 
          onClick={toggleCam} 
          className={`p-3 rounded-full transition-colors ${
            camOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
          }`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        
        <button 
          onClick={leaveRoom} 
          className="p-3 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
          title="Leave call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
