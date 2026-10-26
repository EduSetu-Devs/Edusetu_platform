import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ChevronLeft, Loader2, Mic, MicOff, MonitorUp, PhoneOff, Send, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { completeTeacherSession, getTeacherSession } from '../services/teacherService';
import { getStudentSession, joinStudentSession } from '../services/studentService';

const iceServers = (() => {
  const configured = import.meta.env.VITE_ICE_SERVERS;
  if (configured) {
    try { return JSON.parse(configured); } catch { return [{ urls: configured }]; }
  }
  return [{ urls: 'stun:stun.l.google.com:19302' }];
})();

const OnlineClassroom = ({ sessionId, onNavigateBack }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [mediaError, setMediaError] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [remoteName, setRemoteName] = useState('Waiting for participant');
  const [remoteSharing, setRemoteSharing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const addMessage = (item) => setMessages((current) => [...current, item]);

  const closePeer = () => {
    if (peerRef.current) peerRef.current.close();
    peerRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const createPeer = (initiator) => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers });
    peerRef.current = peer;
    const localStream = localStreamRef.current;
    if (localStream) localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
    peer.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      setStatus('Connected');
    };
    peer.onicecandidate = (event) => {
      if (event.candidate) socketRef.current?.emit('webrtc:ice-candidate', { candidate: event.candidate });
    };
    peer.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peer.connectionState)) setStatus('Connection failed');
      else if (peer.connectionState === 'connecting') setStatus('Connecting...');
      else if (peer.connectionState === 'connected') setStatus('Connected');
    };
    if (initiator) {
      peer.createOffer().then((offer) => peer.setLocalDescription(offer)).then(() => {
        socketRef.current?.emit('webrtc:offer', { offer: peer.localDescription });
      }).catch(() => setStatus('Connection failed'));
    }
    return peer;
  };

  const requestMedia = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('This browser does not provide camera or microphone access. You can remain in the classroom without media.');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setMicEnabled(true);
      setCameraEnabled(true);
      return stream;
    } catch {
      let audioStream = null;
      let videoStream = null;
      try { audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); } catch {}
      try { videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true }); } catch {}
      const tracks = [...(audioStream?.getAudioTracks() || []), ...(videoStream?.getVideoTracks() || [])];
      if (!tracks.length) {
        setMediaError('Camera and microphone access were denied. You can remain in the classroom, but audio/video is unavailable.');
      } else {
        localStreamRef.current = new MediaStream(tracks);
        setMicEnabled(Boolean(audioStream));
        setCameraEnabled(Boolean(videoStream));
        setMediaError('One or more media permissions were unavailable. You can continue with the available devices.');
      }
      return localStreamRef.current;
    }
  };

  useEffect(() => {
    let active = true;
    const start = async () => {
      const detail = isTeacher ? await getTeacherSession(sessionId) : await getStudentSession(sessionId);
      if (!active) return;
      if (!detail.success || detail.data.mode !== 'ONLINE') {
        setStatus(detail.error || 'This is not an online classroom.');
        return;
      }
      setSession(detail.data);
      const stream = await requestMedia();
      if (!active) return;
      if (localVideoRef.current && stream) localVideoRef.current.srcObject = stream;
      if (!window.RTCPeerConnection) {
        setStatus('Connection failed');
        setMediaError('This browser does not support WebRTC classrooms.');
        return;
      }
      const socket = getSocket();
      socketRef.current = socket;
      if (!socket) { setStatus('Connection failed'); return; }
      const onParticipantJoined = (participant) => {
        setRemoteName(participant.name || 'Participant');
        createPeer(true);
      };
      const onOffer = async ({ offer }) => {
        const peer = createPeer(false);
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('webrtc:answer', { answer: peer.localDescription });
      };
      const onAnswer = async ({ answer }) => {
        if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      };
      const onCandidate = async ({ candidate }) => {
        try { if (peerRef.current && candidate) await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      };
      const onParticipantLeft = () => { closePeer(); setRemoteName('Participant left'); setStatus('Connected'); };
      const onChat = (item) => { addMessage(item); if (!chatOpen) setChatUnread((current) => current + 1); };
      const onEnded = () => { setStatus('Class ended'); closePeer(); };
      const onScreenStarted = () => setRemoteSharing(true);
      const onScreenStopped = () => setRemoteSharing(false);
      const onReconnect = () => setStatus('Reconnecting...');
      const onConnect = () => {
        setStatus('Connecting...');
        socket.emit('classroom:join', { sessionId }, (result) => {
          if (!result?.success) { setStatus(result?.message || 'Classroom access denied'); return; }
          roomJoinedRef.current = true;
          setStatus('Connected');
        });
      };
      socket.on('connect', onConnect);
      socket.on('reconnect_attempt', onReconnect);
      socket.on('classroom:participant-joined', onParticipantJoined);
      socket.on('classroom:participant-left', onParticipantLeft);
      socket.on('webrtc:offer', onOffer);
      socket.on('webrtc:answer', onAnswer);
      socket.on('webrtc:ice-candidate', onCandidate);
      socket.on('classroom:chat-message', onChat);
      socket.on('classroom:ended', onEnded);
      socket.on('classroom:screen-share-started', onScreenStarted);
      socket.on('classroom:screen-share-stopped', onScreenStopped);
      if (socket.connected) onConnect();
      return () => {
        socket.off('connect', onConnect);
        socket.off('reconnect_attempt', onReconnect);
        socket.off('classroom:participant-joined', onParticipantJoined);
        socket.off('classroom:participant-left', onParticipantLeft);
        socket.off('webrtc:offer', onOffer);
        socket.off('webrtc:answer', onAnswer);
        socket.off('webrtc:ice-candidate', onCandidate);
        socket.off('classroom:chat-message', onChat);
        socket.off('classroom:ended', onEnded);
        socket.off('classroom:screen-share-started', onScreenStarted);
        socket.off('classroom:screen-share-stopped', onScreenStopped);
      };
    };
    let cleanup;
    start().then((result) => { cleanup = result; });
    return () => {
      active = false;
      cleanup?.();
      if (roomJoinedRef.current) socketRef.current?.emit('classroom:leave');
      closePeer();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId, isTeacher]);

  useEffect(() => {
    if (!session?.startedAt) return undefined;
    const update = () => setElapsedMinutes(Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60000)));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [session?.startedAt]);

  const toggleTrack = (kind) => {
    const track = localStreamRef.current?.getTracks().find((item) => item.kind === kind);
    if (!track) return;
    track.enabled = !track.enabled;
    if (kind === 'audio') setMicEnabled(track.enabled);
    if (kind === 'video') setCameraEnabled(track.enabled);
  };

  const toggleScreenShare = async () => {
    if (!localStreamRef.current || !peerRef.current) return;
    if (sharing) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find((item) => item.track?.kind === 'video');
      if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
      setSharing(false);
      socketRef.current?.emit('classroom:screen-share-stopped');
      return;
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen sharing is unavailable');
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find((item) => item.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      setSharing(true);
      socketRef.current?.emit('classroom:screen-share-started');
      screenTrack.onended = () => toggleScreenShare();
    } catch {
      setMediaError('Screen sharing was cancelled or is unavailable in this browser.');
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const clean = message.trim();
    if (!clean || !socketRef.current) return;
    const item = { message: clean, sender: { name: user?.name || 'You', role: user?.role }, createdAt: new Date().toISOString() };
    addMessage(item);
    socketRef.current.emit('classroom:chat-message', { message: clean });
    setMessage('');
  };

  const openChat = () => { setChatOpen(true); setChatUnread(0); };

  const leave = async () => {
    setEnding(true);
    if (isTeacher && session?.status === 'LIVE') await completeTeacherSession(session.id);
    socketRef.current?.emit('classroom:leave');
    onNavigateBack();
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-1"><ChevronLeft className="w-4 h-4" /> My Classes</button><h1 className="text-2xl font-black text-slate-900">EduSetu Live Class</h1><p className="text-sm text-slate-500">{session?.subject || session?.title || 'Online classroom'} · {session?.title || ''}</p></div><div className="flex items-center gap-3 text-xs font-bold"><span className="text-slate-500">{elapsedMinutes} min live</span><span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-500' : status === 'Class ended' ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`} />{status}</div></header>
      {mediaError && <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">{mediaError}</div>}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-4 min-h-0">
        <div className="relative aspect-video lg:aspect-auto lg:min-h-[420px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800"><video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" /><div className="absolute left-3 bottom-3 rounded-lg bg-black/60 text-white px-3 py-1.5 text-xs font-bold">{remoteName}</div><div className="absolute top-3 right-3 rounded-lg bg-black/60 text-white px-2 py-1 text-[10px]">Remote</div>{remoteSharing && <div className="absolute top-3 left-3 rounded-lg bg-emerald-500 text-white px-2 py-1 text-[10px] font-bold">Teacher is sharing their screen</div>}</div>
        <div className="relative aspect-video lg:aspect-auto lg:min-h-[420px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800"><video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" /><div className="absolute left-3 bottom-3 rounded-lg bg-black/60 text-white px-3 py-1.5 text-xs font-bold">You</div><div className="absolute top-3 right-3 rounded-lg bg-black/60 text-white px-2 py-1 text-[10px]">Local</div>{sharing && <div className="absolute top-3 left-3 rounded-lg bg-emerald-500 text-white px-2 py-1 text-[10px] font-bold">You are sharing your screen</div>}</div>
        <aside className={`bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col ${chatOpen ? '' : 'hidden lg:flex'}`}><div className="p-4 border-b border-slate-100 flex items-center justify-between"><h2 className="font-bold text-slate-900">Class chat</h2><button onClick={() => setChatOpen(false)} className="lg:hidden p-1 text-slate-400"><X className="w-4 h-4" /></button></div><div className="flex-1 min-h-[180px] max-h-[420px] overflow-y-auto p-3 space-y-2">{messages.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">Messages will appear here.</p> : messages.map((item, index) => <div key={`${item.createdAt}-${index}`} className="rounded-xl bg-slate-50 p-2.5"><p className="text-[11px] font-bold text-indigo-700">{item.sender?.name || 'Participant'}</p><p className="text-sm text-slate-700 break-words">{item.message}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>)}</div><form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button aria-label="Send message" className="p-2 rounded-xl bg-indigo-600 text-white"><Send className="w-4 h-4" /></button></form></aside>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2"><button onClick={() => toggleTrack('audio')} title={micEnabled ? 'Mute microphone' : 'Unmute microphone'} className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">{micEnabled ? <Mic className="w-5 h-5 text-indigo-600" /> : <MicOff className="w-5 h-5 text-rose-600" />}</button><button onClick={() => toggleTrack('video')} title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">{cameraEnabled ? <Camera className="w-5 h-5 text-indigo-600" /> : <CameraOff className="w-5 h-5 text-rose-600" />}</button>{isTeacher && <button onClick={toggleScreenShare} title="Share screen" className={`p-3 rounded-xl border shadow-sm ${sharing ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-slate-200'}`}><MonitorUp className="w-5 h-5 text-emerald-600" /></button>}<button onClick={openChat} title="Open chat" className="relative p-3 rounded-xl bg-white border border-slate-200 shadow-sm"><Users className="w-5 h-5 text-amber-600" />{chatUnread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-rose-500 text-white text-[10px]">{chatUnread}</span>}</button><button disabled={ending} onClick={leave} title={isTeacher ? 'End class' : 'Leave class'} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold"><PhoneOff className="w-4 h-4" />{isTeacher ? 'End class' : 'Leave class'}</button></div>
    </div>
  );
};

export default OnlineClassroom;
