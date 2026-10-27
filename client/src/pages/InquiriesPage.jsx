import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, 
  Send, Building2, Loader2, CheckCheck, Home, Calendar, Video, UserCheck, Radio
} from 'lucide-react';
import { io } from 'socket.io-client';
import MainLayout from '../layouts/MainLayout';
import { inquiryApi, visitApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  completed: { label: 'Completed', icon: CheckCheck, color: 'bg-blue-100 text-blue-700 border-blue-200' }
};

function LiveInquiryCard({ inquiry, isOwner, user, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const statusConfig = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.pending;

  const loadReplies = async () => {
    setLoadingReplies(true);
    try {
      const res = await inquiryApi.getById(inquiry.id);
      setReplies(res.data.inquiry?.replies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Socket.io Connection & Room Join when card is expanded
  useEffect(() => {
    if (!expanded) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    loadReplies();

    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('join_inquiry_room', inquiry.id);
    });

    socket.on('receive_message', (newReply) => {
      setReplies(prev => {
        // Prevent duplicate if already added
        if (prev.some(r => r.id === newReply.id)) return prev;
        return [...prev, newReply];
      });
      setTypingUser(null);
    });

    socket.on('user_typing', ({ userName, isTyping }) => {
      if (isTyping) {
        setTypingUser(userName);
      } else {
        setTypingUser(null);
      }
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [expanded, inquiry.id]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleTyping = (e) => {
    setReplyText(e.target.value);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', {
        inquiryId: inquiry.id,
        userName: user?.name?.split(' ')[0] || 'User',
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('typing', {
            inquiryId: inquiry.id,
            userName: user?.name?.split(' ')[0] || 'User',
            isTyping: false
          });
        }
      }, 1500);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    const message = replyText.trim();
    setReplyText('');

    if (socketRef.current && socketRef.current.connected) {
      // Send real-time message via WebSockets
      socketRef.current.emit('send_message', {
        inquiryId: inquiry.id,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message
      });
      socketRef.current.emit('typing', {
        inquiryId: inquiry.id,
        userName: user?.name,
        isTyping: false
      });
    } else {
      // Fallback to standard HTTP REST endpoint
      inquiryApi.addReply(inquiry.id, message).then(res => {
        setReplies(res.data.replies || []);
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all">
      <div 
        className="p-5 cursor-pointer hover:bg-slate-50 transition"
        onClick={handleToggle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {inquiry.property_image && (
              <img
                src={inquiry.property_image}
                alt=""
                className="w-16 h-12 object-cover rounded-xl flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 truncate text-sm">{inquiry.property_title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {inquiry.property_locality}, {inquiry.property_city} · ₹{Number(inquiry.property_rent).toLocaleString('en-IN')}/mo
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isOwner ? `From: ${inquiry.tenant_name} (${inquiry.tenant_type || 'tenant'})` : `To: ${inquiry.owner_name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
              <statusConfig.icon className="w-3.5 h-3.5" />
              <span>{statusConfig.label}</span>
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Initial Inquiry Message */}
        <p className="mt-3 text-sm text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
          "{inquiry.message}"
        </p>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Preferred contact: {inquiry.preferred_contact_method}</span>
          <span>{new Date(inquiry.created_at).toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* Expanded: Real-Time Live Chat with Socket.io */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4 animate-in slide-in-from-top-1">
          {/* Owner Status Management */}
          {isOwner && inquiry.status === 'pending' && (
            <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
              <button
                onClick={() => onStatusUpdate(inquiry.id, 'accepted')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept Inquiry</span>
              </button>
              <button
                onClick={() => onStatusUpdate(inquiry.id, 'rejected')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition shadow-sm">
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </div>
          )}

          {/* Chat Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {isSocketConnected ? 'Live Socket.io Room Connected' : 'Connecting to live chat...'}
              </span>
            </div>
            {typingUser && (
              <span className="text-xs text-brand-600 font-semibold italic animate-pulse">
                ✍️ {typingUser} is typing...
              </span>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 max-h-72 overflow-y-auto space-y-3">
            {loadingReplies ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 italic">
                No replies yet. Start the conversation below!
              </div>
            ) : (
              replies.map(r => {
                const isMyMessage = r.sender_id === user?.id;
                return (
                  <div key={r.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm ${
                      isMyMessage
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      <div className="flex items-center justify-between space-x-3 mb-1 opacity-75 text-[11px] font-semibold">
                        <span>{isMyMessage ? 'You' : r.sender_name}</span>
                        <span>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{r.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Live Message Input */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={replyText}
              onChange={handleTyping}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
              placeholder="Type a real-time message..."
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-40 transition flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InquiriesPage({ ownerView = false }) {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'visits'

  useEffect(() => {
    load();
  }, [ownerView]);

  const load = async () => {
    setLoading(true);
    try {
      const inqPromise = ownerView ? inquiryApi.getOwnerInquiries() : inquiryApi.getMyInquiries();
      const visitPromise = ownerView ? visitApi.getOwnerVisits() : visitApi.getMyVisits();

      const [inqRes, visitRes] = await Promise.all([inqPromise, visitPromise]);
      setInquiries(inqRes.data.inquiries || []);
      setVisits(visitRes.data.visits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await inquiryApi.updateStatus(id, status);
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleVisitStatusUpdate = async (id, status) => {
    try {
      await visitApi.updateStatus(id, status);
      setVisits(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch (err) {
      alert('Failed to update visit status.');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-Time WebSockets Enabled</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-brand-600" />
            <span>{ownerView ? 'Tenant Inquiries & Visits' : 'My Inquiries & Scheduled Visits'}</span>
          </h1>
          <p className="text-slate-500 mt-1">
            Instant live messaging with typing indicators, read receipts, and scheduled property visits.
          </p>
        </div>

        {/* Section Navigation Tabs: Inquiries vs Scheduled Visits */}
        <div className="flex space-x-2 mb-6 bg-slate-100 rounded-2xl p-1.5 w-fit">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              activeTab === 'inquiries' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}>
            <MessageSquare className="w-4 h-4" />
            <span>Inquiries & Live Chats ({inquiries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              activeTab === 'visits' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}>
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Scheduled Visits ({visits.length})</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          </div>
        ) : activeTab === 'inquiries' ? (
          /* Inquiries Tab */
          inquiries.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No inquiries found</h3>
              {!ownerView && (
                <Link to="/properties" className="text-brand-600 font-semibold hover:text-brand-700 text-sm">
                  Browse Properties to Submit an Inquiry →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map(inquiry => (
                <LiveInquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  isOwner={ownerView}
                  user={user}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )
        ) : (
          /* Scheduled Visits Tab */
          visits.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No visits scheduled yet</h3>
              <p className="text-slate-500 text-sm">Schedule an in-person or live video tour on any property details page!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map(v => (
                <div key={v.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        {v.visit_type === 'video-call' ? <Video className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{v.property_title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-500" />
                          <span className="font-semibold text-slate-700">{v.visit_date}</span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 text-brand-500" />
                          <span>{v.visit_time_slot}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {ownerView ? `Tenant: ${v.tenant_name} (${v.tenant_phone})` : `Owner: ${v.owner_name} (${v.owner_phone})`}
                        </p>
                        {v.notes && <p className="text-xs text-slate-600 mt-1 italic">"{v.notes}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        v.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        v.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {v.status}
                      </span>

                      {ownerView && v.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVisitStatusUpdate(v.id, 'confirmed')}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
                            Confirm
                          </button>
                          <button
                            onClick={() => handleVisitStatusUpdate(v.id, 'cancelled')}
                            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </MainLayout>
  );
}
