import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/ui/Navbar';
import GroupFormPanel from '../components/GroupFormPanel';
import ItineraryCard from '../components/ItineraryCard';
import { AIGeneratingLoader } from '../components/ui/LoadingSpinner';
import { Users, Send, Map, ArrowLeft, LogOut, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function normalizeId(value) {
  return value?._id || value || '';
}

function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

export default function RoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentRoom, loadRoomDetails, leaveRoom, members, messages, 
    sendMessage, activeSession, startGroupTrip, loading 
  } = useRoom();

  const [chatInput, setChatInput] = useState('');
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [logistics, setLogistics] = useState({
    source: '', destination: '', travelMode: 'flight', 
    startDate: '', endDate: '', days: 3
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    loadRoomDetails(id).catch(() => navigate('/rooms'));
    return () => leaveRoom();
  }, [id]);

  useEffect(() => {
    // Scroll to bottom of chat smoothly
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleStartGroupTrip = (e) => {
    e.preventDefault();
    startGroupTrip(logistics);
    setShowLogisticsModal(false);
  };

  const updateLogisticsDate = (field, value) => {
    setLogistics(prev => {
      const next = { ...prev, [field]: value };
      const calculatedDays = daysBetween(next.startDate, next.endDate);
      return calculatedDays ? { ...next, days: calculatedDays } : next;
    });
  };

  if (loading && !currentRoom) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  if (!currentRoom) return null;

  const isOrganizer = normalizeId(currentRoom.createdBy) === user._id;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar />
      
      {/* Top Bar for Room Name */}
      <div className="h-14 mt-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/rooms')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">{currentRoom.name}</h1>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Code: {currentRoom.code}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-2">
            {members.slice(0, 5).map((m, i) => (
              <div 
                key={m.userId._id || m.userId} 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white relative ${m.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                title={`${m.name} ${m.isOnline ? '(Online)' : '(Offline)'}`}
                style={{ zIndex: 10 - i }}
              >
                {m.name[0].toUpperCase()}
                {m.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
              </div>
            ))}
            {members.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border-2 border-white z-0">
                +{members.length - 5}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => { leaveRoom(); navigate('/rooms'); }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Chat */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white relative z-0">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/30">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No messages yet. Say hello to start planning!</p>
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === user._id;
              const isSystem = msg.messageType === 'system';
              const isCard = msg.messageType === 'itinerary_card';

              if (isSystem) {
                return (
                  <div key={msg._id || idx} className="flex justify-center my-2 animate-fade-in">
                    <span className="text-[10px] bg-gray-100/80 text-gray-500 px-3 py-1 rounded-full border border-gray-200/50">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              if (isCard) {
                return null;
              }

              return (
                <div key={msg._id || idx} className={`flex w-full animate-fade-in ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-[10px] font-bold text-white mr-2 flex-shrink-0 mt-1">
                      {msg.senderName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-primary-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {!isMe && <div className="text-[10px] font-bold text-gray-400 mb-0.5">{msg.senderName}</div>}
                    <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                      {format(new Date(msg.createdAt || Date.now()), 'HH:mm')}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white p-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: Trip Logic */}
        <div className="w-1/2 flex flex-col bg-gray-50/50 relative overflow-hidden">
          
          {activeSession?.status === 'collecting' ? (
            <GroupFormPanel />
          ) : activeSession?.status === 'finalizing' ? (
            <div className="h-full flex items-center justify-center p-8">
              <AIGeneratingLoader />
            </div>
          ) : activeSession?.status === 'finalized' && activeSession.tripId ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="font-bold text-2xl text-gray-900 mb-2">Itinerary Ready!</h2>
              <p className="text-gray-500 mb-8 max-w-sm">The group preferences have been tallied and WanderAI has crafted your perfect trip.</p>
              
              <div className="w-full max-w-sm mx-auto">
                 <ItineraryCard 
                    {...activeSession.tripDetails}
                    title={activeSession.itinerary?.tripSummary?.title}
                    budget={activeSession.itinerary?.budgetBreakdown?.totalEstimated}
                    highlights={activeSession.itinerary?.tripSummary?.highlights}
                    tieBreakLog={activeSession.tieBreakLog}
                    tripId={activeSession.tripId}
                    onView={(id) => navigate(`/trip/${id}`)}
                  />
              </div>
              
              {isOrganizer && (
                <button 
                  onClick={() => setShowLogisticsModal(true)}
                  className="mt-8 text-sm text-primary-600 font-semibold hover:text-primary-700"
                >
                  Plan another trip
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <Map className="w-10 h-10 text-primary-300" />
              </div>
              <h2 className="font-bold text-xl text-gray-900 mb-2">Ready to plan?</h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm">Start a new group trip session to collect preferences from everyone in the room.</p>
              
              <button
                onClick={() => {
                  if (!isOrganizer) toast.error('Only the room creator can start a new trip session.');
                  else setShowLogisticsModal(true);
                }}
                className="btn-primary py-3 px-6 shadow-lg shadow-primary-200"
              >
                Start New Trip Vote
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Logistics Modal (Organizer only) */}
      {showLogisticsModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <h3 className="font-bold text-xl mb-1 text-gray-900">Trip Logistics</h3>
            <p className="text-sm text-gray-500 mb-6">Add the basics your group decided in chat before opening the vote.</p>
            
            <form onSubmit={handleStartGroupTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">From</label>
                  <input type="text" value={logistics.source} onChange={e => setLogistics({...logistics, source: e.target.value})} className="form-input py-2 text-sm" placeholder="City" required />
                </div>
                <div>
                  <label className="form-label text-xs">To</label>
                  <input type="text" value={logistics.destination} onChange={e => setLogistics({...logistics, destination: e.target.value})} className="form-input py-2 text-sm" placeholder="City" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Start Date</label>
                  <input
                    type="date"
                    value={logistics.startDate}
                    onChange={e => updateLogisticsDate('startDate', e.target.value)}
                    className="form-input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">End Date</label>
                  <input
                    type="date"
                    value={logistics.endDate}
                    min={logistics.startDate || undefined}
                    onChange={e => updateLogisticsDate('endDate', e.target.value)}
                    className="form-input py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Days</label>
                  <input type="number" min="1" max="30" value={logistics.days} onChange={e => setLogistics({...logistics, days: e.target.value})} className="form-input py-2 text-sm" required />
                </div>
                <div>
                  <label className="form-label text-xs">Mode</label>
                  <select value={logistics.travelMode} onChange={e => setLogistics({...logistics, travelMode: e.target.value})} className="form-input py-2 text-sm px-2" required>
                    <option value="flight">Flight</option>
                    <option value="train">Train</option>
                    <option value="bus">Bus</option>
                    <option value="car">Car</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowLogisticsModal(false)} className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors">
                  Open Voting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
