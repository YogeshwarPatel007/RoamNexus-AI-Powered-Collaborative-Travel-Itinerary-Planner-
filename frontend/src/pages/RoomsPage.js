import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Key, ArrowRight, Hash, Compass, ArrowLeft } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { useRoom } from '../context/RoomContext';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function RoomsPage() {
  const navigate = useNavigate();
  const { createRoom, joinRoomByCode } = useRoom();
  
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [myRooms, setMyRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    fetchMyRooms();
  }, []);

  const fetchMyRooms = async () => {
    try {
      const res = await api.get('/rooms/my/list');
      setMyRooms(res.data.rooms);
    } catch (err) {
      toast.error('Failed to load your rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-character room code');
      return;
    }
    
    try {
      setLoading(true);
      const room = await joinRoomByCode(code.toUpperCase());
      navigate(`/room/${room.id}`);
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error('Room name must be at least 2 characters');
      return;
    }
    
    try {
      setLoading(true);
      const room = await createRoom(name.trim());
      navigate(`/room/${room.id}`);
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Group Trip Planning</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Plan your next adventure collaboratively. Chat, vote on preferences, and let AI build the perfect itinerary for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Action Card (Join/Create) */}
          <div className="md:col-span-5 animate-fade-in">
            <div className="glass-card overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-4 text-sm font-semibold transition-all ${
                    activeTab === 'join' 
                      ? 'bg-white text-primary-600 border-b-2 border-primary-500' 
                      : 'bg-gray-50/50 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Join a Room
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-4 text-sm font-semibold transition-all ${
                    activeTab === 'create' 
                      ? 'bg-white text-primary-600 border-b-2 border-primary-500' 
                      : 'bg-gray-50/50 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Create Room
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'join' ? (
                  <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-primary-500" /> Room Code
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character code"
                        className="form-input text-center text-xl tracking-widest font-mono uppercase font-bold"
                        maxLength={6}
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading || code.length !== 6}
                      className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Join Room <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-primary-500" /> Room Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Goa Trip 2024"
                        className="form-input"
                        maxLength={50}
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading || name.trim().length < 2}
                      className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Create Room <Plus className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <Compass className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>How it works:</strong> Anyone can create a room and share the 6-character code with friends. Once inside, you can chat and collectively vote on travel preferences to generate a unified itinerary.
              </p>
            </div>
          </div>
          
          {/* My Rooms List */}
          <div className="md:col-span-7 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Your Active Rooms
              {!loadingRooms && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{myRooms.length}</span>}
            </h2>
            
            {loadingRooms ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : myRooms.length === 0 ? (
              <div className="glass-card p-10 text-center flex flex-col items-center justify-center h-[300px]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">No rooms yet</h3>
                <p className="text-gray-500 text-sm max-w-[200px]">Create or join a room to start planning together.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRooms.map((room) => (
                  <div 
                    key={room.id}
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="glass-card p-5 cursor-pointer hover:border-primary-200 transition-all group flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {room.name}
                        </h3>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                          {room.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {room.members.map((m, i) => (
                            <div key={m.userId} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[8px] font-bold text-white border-2 border-white z-10" style={{ zIndex: 10 - i }}>
                              {m.name[0].toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
