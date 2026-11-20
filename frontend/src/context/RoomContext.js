import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();

  const [currentRoom, setCurrentRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [voteTally, setVoteTally] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentRoomId = currentRoom?.id;

  // Room lifecycle methods
  const createRoom = async (name) => {
    try {
      setLoading(true);
      const res = await api.post('/rooms', { name });
      toast.success('Room created successfully!');
      return res.data.room;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinRoomByCode = async (code) => {
    try {
      setLoading(true);
      const res = await api.post('/rooms/join', { code });
      toast.success(res.data.message || 'Joined room successfully!');
      return res.data.room;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadRoomDetails = async (roomId) => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${roomId}`);
      setCurrentRoom(res.data.room);
      setMembers(res.data.room.members);
      
      // Also join via socket
      if (socket && isConnected) {
        socket.emit('join_room', { roomId });
      }
      
      return res.data.room;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load room details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = useCallback(() => {
    if (socket && isConnected && currentRoom) {
      socket.emit('leave_room', { roomId: currentRoom.id });
    }
    setCurrentRoom(null);
    setMembers([]);
    setMessages([]);
    setActiveSession(null);
    setVoteTally(null);
    setError(null);
  }, [socket, isConnected, currentRoom]);

  // Chat methods
  const sendMessage = (content) => {
    if (!socket || !isConnected || !currentRoom) return;
    socket.emit('chat_message', { roomId: currentRoom.id, content });
  };

  // Group Trip Session methods
  const startGroupTrip = (logisticsData) => {
    if (!socket || !isConnected || !currentRoom) return;
    socket.emit('generate_trip_group', { roomId: currentRoom.id, logisticsData });
  };

  const submitPreference = (sessionId, preferences) => {
    if (!socket || !isConnected) return;
    socket.emit('submit_preference', { sessionId, preferences });
  };

  const finalizeSession = (sessionId) => {
    if (!socket || !isConnected) return;
    socket.emit('finalize_session', { sessionId });
  };

  const cancelSession = (sessionId) => {
    if (!socket || !isConnected) return;
    socket.emit('cancel_session', { sessionId });
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket || !isConnected || !currentRoomId) return;

    const handleMemberListUpdate = ({ members }) => {
      setMembers(members);
      setCurrentRoom(prev => prev ? { ...prev, members } : prev);
    };

    const handleChatMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleErrorMessage = ({ message }) => {
      toast.error(message);
    };

    const handleTripFormOpened = (sessionData) => {
      setActiveSession(sessionData);
      setVoteTally(null); // Reset tally for new session
    };

    const handleVoteTallyUpdate = ({ sessionId, tally }) => {
      setVoteTally(tally);
    };

    const handleSessionFinalizing = ({ sessionId }) => {
      setActiveSession(prev => (
        prev && prev.sessionId === sessionId ? { ...prev, status: 'finalizing' } : prev
      ));
    };

    const handleSessionFinalized = ({ sessionId, tripId, itinerary, tripDetails, tieBreakLog }) => {
      setActiveSession(prev => (
        prev && prev.sessionId === sessionId
          ? { ...prev, status: 'finalized', tripId, itinerary, tripDetails, tieBreakLog }
          : prev
      ));
    };

    const handleSessionCancelled = ({ sessionId }) => {
      setActiveSession(prev => {
        if (!prev || prev.sessionId !== sessionId) return prev;
        setVoteTally(null);
        return null;
      });
    };

    const handleSessionError = ({ sessionId, message }) => {
      toast.error(message);
      setActiveSession(prev => (
        prev && prev.sessionId === sessionId ? { ...prev, status: 'collecting' } : prev
      ));
    };

    // Attach listeners
    socket.on('member_list_update', handleMemberListUpdate);
    socket.on('chat_message', handleChatMessage);
    socket.on('error_message', handleErrorMessage);
    socket.on('trip_form_opened', handleTripFormOpened);
    socket.on('vote_tally_update', handleVoteTallyUpdate);
    socket.on('session_finalizing', handleSessionFinalizing);
    socket.on('session_finalized', handleSessionFinalized);
    socket.on('session_cancelled', handleSessionCancelled);
    socket.on('session_error', handleSessionError);

    // Initial join if socket just connected while we had a room selected
    socket.emit('join_room', { roomId: currentRoomId });

    return () => {
      // Detach listeners
      socket.off('member_list_update', handleMemberListUpdate);
      socket.off('chat_message', handleChatMessage);
      socket.off('error_message', handleErrorMessage);
      socket.off('trip_form_opened', handleTripFormOpened);
      socket.off('vote_tally_update', handleVoteTallyUpdate);
      socket.off('session_finalizing', handleSessionFinalizing);
      socket.off('session_finalized', handleSessionFinalized);
      socket.off('session_cancelled', handleSessionCancelled);
      socket.off('session_error', handleSessionError);
    };
  }, [socket, isConnected, currentRoomId]);


  const value = {
    currentRoom,
    members,
    messages,
    activeSession,
    voteTally,
    loading,
    error,
    createRoom,
    joinRoomByCode,
    loadRoomDetails,
    leaveRoom,
    sendMessage,
    startGroupTrip,
    submitPreference,
    finalizeSession,
    cancelSession,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within a RoomProvider');
  return context;
};
