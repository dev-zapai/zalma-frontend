import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function PartnerChatPage() {
  const { partnershipId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch partner info
  useEffect(() => {
    api.get('/partners')
      .then(r => {
        const p = (r.data?.items || []).find(i => i.id === partnershipId);
        if (p) setPartner(p.partner);
      })
      .catch(() => {});
  }, [partnershipId]);

  // Initial message load
  useEffect(() => {
    api.get(`/partners/${partnershipId}/messages`, { params: { limit: 100 } })
      .then(r => { setMessages(r.data?.messages || []); setLoading(false); })
      .catch(() => setLoading(false));
    // Mark as read
    api.put(`/partners/${partnershipId}/read`).catch(() => {});
  }, [partnershipId]);

  // Poll for new messages every 5s
  // Manual refresh — pulls any new messages since the last one we have
  const refreshMessages = async () => {
    const lastTs = messages.length > 0 ? messages[messages.length - 1].created_at : null;
    try {
      const r = await api.get(`/partners/${partnershipId}/messages`, { params: { after: lastTs, limit: 50 } });
      const newMsgs = r.data?.messages || [];
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs]);
        api.put(`/partners/${partnershipId}/read`).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await api.post(`/partners/${partnershipId}/messages`, { content: text });
      setMessages(prev => [...prev, res.data]);
      setInput('');
      inputRef.current?.focus();
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/partners')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {partner?.logo_url ? (
          <img src={partner.logo_url} alt={partner.name} className="w-9 h-9 rounded-lg object-cover border" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {partner?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">{partner?.name || 'Partner Chat'}</h2>
          <p className="text-[11px] text-slate-500">{partner?.city}{partner?.state ? `, ${partner.state}` : ''}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={refreshMessages} title="Check for new messages">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                m.is_mine
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-slate-100 text-slate-900 rounded-bl-md'
              }`}>
                {!m.is_mine && (
                  <p className="text-[10px] font-semibold mb-0.5 opacity-70">{m.sender_name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${m.is_mine ? 'text-white/60' : 'text-slate-400'}`}>
                  {m.created_at && format(parseISO(m.created_at), 'h:mm a')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 h-10 rounded-lg"
            autoFocus
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()} className="h-10 px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
