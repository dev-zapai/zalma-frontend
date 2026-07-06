import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/assets';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  Handshake, MessageSquare, Check as CheckIcon, X, Trash2, Clock, Send,
  Users, Inbox, Loader2, RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function PartnersPage() {
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('chat');

  // Chat state
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await api.get('/partners');
      setPartnerships(res.data?.items || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const activePartners = partnerships.filter(p => p.status === 'accepted');
  const pendingPartners = partnerships.filter(p => p.status === 'pending');
  const activeChat = activePartners.find(p => p.id === activeChatId);

  // ── Chat functions ──
  const openChat = async (pid) => {
    setActiveChatId(pid);
    setChatLoading(true);
    setMessages([]);
    try {
      const res = await api.get(`/partners/${pid}/messages`, { params: { limit: 100 } });
      setMessages(res.data?.messages || []);
      api.put(`/partners/${pid}/read`).catch(() => {});
    } catch (e) { console.error(e); }
    setChatLoading(false);
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }, 100);
  };

  // Manual refresh — pulls any new messages since the last one we have
  const refreshMessages = async () => {
    if (!activeChatId) return;
    const lastTs = messages.length > 0 ? messages[messages.length - 1].created_at : null;
    try {
      const r = await api.get(`/partners/${activeChatId}/messages`, { params: { after: lastTs, limit: 50 } });
      const newMsgs = r.data?.messages || [];
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs]);
        api.put(`/partners/${activeChatId}/read`).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeChatId) return;
    setSending(true);
    try {
      const res = await api.post(`/partners/${activeChatId}/messages`, { content: text });
      setMessages(prev => [...prev, res.data]);
      setInput('');
      inputRef.current?.focus();
    } catch (e) { toast.error('Failed to send'); }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Actions ──
  const handleRespond = async (id, action) => {
    try {
      await api.put(`/partners/${id}/respond`, { action });
      toast.success(action === 'accept' ? 'Partnership accepted!' : 'Request rejected');
      fetchPartners();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this partnership?')) return;
    try {
      await api.delete(`/partners/${id}`);
      toast.success('Partnership removed');
      if (activeChatId === id) { setActiveChatId(null); setMessages([]); }
      fetchPartners();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const TABS = [
    { key: 'chat', label: 'Chat', icon: MessageSquare, count: activePartners.reduce((s, p) => s + (p.unread_count || 0), 0) },
    { key: 'partners', label: 'Partners', icon: Users, count: activePartners.length },
    { key: 'pending', label: 'Pending', icon: Inbox, count: pendingPartners.filter(p => p.direction === 'received').length },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Handshake className="h-6 w-6 text-primary" /> Partners
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage partnerships with other salons and clinics.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
            }`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Chat (Instagram style) ═══ */}
      {tab === 'chat' && (
        <div className="flex border border-slate-200 border-t-0 rounded-b-xl overflow-hidden bg-white" style={{ height: 'calc(100vh - 230px)' }}>
          {/* Left: conversation list */}
          <div className="w-[320px] border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Messages</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {activePartners.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs px-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No active partners yet.<br/>Find salons on the Explore map.
                </div>
              ) : activePartners.map(p => (
                <button
                  key={p.id}
                  onClick={() => openChat(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50 ${
                    activeChatId === p.id ? 'bg-primary/5' : 'hover:bg-slate-50'
                  }`}
                >
                  {p.partner?.logo_url ? (
                    <img src={assetUrl(p.partner.logo_url)} alt="" className="w-11 h-11 rounded-full object-cover border shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {p.partner?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.partner?.name}</p>
                      {p.unread_count > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shrink-0">
                          {p.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{p.partner?.city || 'Tap to chat'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: chat area */}
          <div className="flex-1 flex flex-col">
            {!activeChatId ? (
              <div className="flex-1 flex items-center justify-center text-slate-300">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-slate-400">Select a conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                  {activeChat?.partner?.logo_url ? (
                    <img src={assetUrl(activeChat.partner.logo_url)} alt="" className="w-9 h-9 rounded-full object-cover border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {activeChat?.partner?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{activeChat?.partner?.name}</p>
                    <p className="text-[11px] text-slate-500">{activeChat?.partner?.city}{activeChat?.partner?.state ? `, ${activeChat.partner.state}` : ''}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={refreshMessages} title="Check for new messages">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  {chatLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">No messages yet. Say hello!</div>
                  ) : messages.map(m => (
                    <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                        m.is_mine
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-900 rounded-bl-md'
                      }`}>
                        {!m.is_mine && <p className="text-[10px] font-semibold mb-0.5 opacity-60">{m.sender_name}</p>}
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`text-[10px] mt-0.5 ${m.is_mine ? 'text-white/50' : 'text-slate-400'}`}>
                          {m.created_at && format(parseISO(m.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-slate-200">
                  <div className="flex gap-2">
                    <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown} placeholder="Message..." maxLength={2000}
                      className="flex-1 h-10 rounded-full bg-slate-50 border-slate-200 px-4" autoFocus />
                    <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="h-10 w-10 rounded-full">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Partners (active connections) ═══ */}
      {tab === 'partners' && (
        <div className="border border-slate-200 border-t-0 rounded-b-xl bg-white p-4" style={{ minHeight: 'calc(100vh - 230px)' }}>
          {activePartners.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active partners. Find salons on the Explore map.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activePartners.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  {p.partner?.logo_url ? (
                    <img src={assetUrl(p.partner.logo_url)} alt="" className="w-12 h-12 rounded-full object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {p.partner?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{p.partner?.name}</p>
                    <p className="text-xs text-slate-500">{p.partner?.city}{p.partner?.state ? `, ${p.partner.state}` : ''} · {(p.partner?.type || '').replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setTab('chat'); openChat(p.id); }}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Unpartner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Pending ═══ */}
      {tab === 'pending' && (
        <div className="border border-slate-200 border-t-0 rounded-b-xl bg-white p-4" style={{ minHeight: 'calc(100vh - 230px)' }}>
          {pendingPartners.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Inbox className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingPartners.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100">
                  {p.partner?.logo_url ? (
                    <img src={assetUrl(p.partner.logo_url)} alt="" className="w-12 h-12 rounded-full object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {p.partner?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{p.partner?.name}</p>
                    <p className="text-xs text-slate-500">{p.partner?.city}{p.partner?.state ? `, ${p.partner.state}` : ''}</p>
                    {p.message && <p className="text-xs text-slate-600 italic mt-1">"{p.message}"</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.direction === 'sent' ? 'You sent' : 'Received'} · {p.requested_at && format(parseISO(p.requested_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.direction === 'received' ? (
                      <>
                        <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleRespond(p.id, 'accept')}>
                          <CheckIcon className="h-3.5 w-3.5 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-600" onClick={() => handleRespond(p.id, 'reject')}>
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-600 flex items-center gap-1"><Clock className="h-3 w-3" /> Waiting</span>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-400" onClick={() => handleRemove(p.id)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
