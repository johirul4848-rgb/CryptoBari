import React, { useState } from 'react';
import { SupportTicket } from '../../types';
import { LifeBuoy, MessageSquare, Send, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { sound } from '../../utils/audio';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TICK-802',
      userId: 'user_default',
      subject: 'Binance price feed verification',
      category: 'Market Data',
      status: 'RESOLVED',
      createdAt: Date.now() - 3600000 * 24,
      messages: [
        { sender: 'user', text: 'Are the settlement prices directly from Binance Spot?', timestamp: Date.now() - 3600000 * 24 },
        { sender: 'support', text: 'Yes, CryptoBari connects directly to Binance Public WebSocket streams with authoritative server-side timestamp execution.', timestamp: Date.now() - 3600000 * 23 },
      ],
    },
  ]);

  const [activeTicketId, setActiveTicketId] = useState<string>(tickets[0]?.id || '');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Trading & Execution');
  const [newMsg, setNewMsg] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does CryptoBari calculate binary options settlement?',
      a: 'When you place an UP or DOWN position, our server captures the exact Binance Spot market price at that millisecond. At expiration, the server fetches the reference Binance price and compares it. If direction is correct, your investment plus payout percentage (e.g. 85%) is automatically credited to your wallet.',
    },
    {
      q: 'What is Demo Account vs Real Account?',
      a: 'The Demo Account comes with $10,000 in virtual funds for risk-free practice. You can reset the balance anytime. The Real Account holds live balances deposited via crypto or payment gateways.',
    },
    {
      q: 'Can I trade from mobile phones and tablets?',
      a: 'Yes, CryptoBari is engineered mobile-first with dedicated thumb-friendly UP/DOWN trading controls, responsive candlestick charts, and instant asset selection.',
    },
    {
      q: 'What happens if Binance WebSocket temporarily disconnects?',
      a: 'Our system has automatic reconnection and fallback mechanisms. If market data becomes stale, new trades are temporarily suspended until live streaming resumes.',
    },
  ];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMsg) return;
    sound.playClick();

    const created: SupportTicket = {
      id: 'TICK-' + Math.floor(100 + Math.random() * 900),
      userId: 'user_default',
      subject: newSubject,
      category: newCategory,
      status: 'OPEN',
      createdAt: Date.now(),
      messages: [
        { sender: 'user', text: newMsg, timestamp: Date.now() },
        { sender: 'support', text: 'Thank you for reaching out! A CryptoBari specialist is reviewing your inquiry.', timestamp: Date.now() + 1000 },
      ],
    };

    setTickets([created, ...tickets]);
    setActiveTicketId(created.id);
    setIsCreatingTicket(false);
    setNewSubject('');
    setNewMsg('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sound.playClick();

    setTickets(prev =>
      prev.map(t => {
        if (t.id === activeTicketId) {
          return {
            ...t,
            messages: [
              ...t.messages,
              { sender: 'user', text: replyText, timestamp: Date.now() },
            ],
          };
        }
        return t;
      })
    );
    setReplyText('');
  };

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0c1018] text-slate-100 custom-scrollbar select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Help & Support Desk</h1>
            <p className="text-xs text-slate-400 mt-1">24/7 client assistance and platform documentation</p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsCreatingTicket(!isCreatingTicket);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer self-start"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{isCreatingTicket ? 'View Tickets' : 'Open Support Ticket'}</span>
          </button>
        </div>

        {/* FAQ Accordion Section */}
        <div className="bg-[#111624] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Frequently Asked Questions</span>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-800/80 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-slate-200 hover:bg-[#151c2c] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedFaq === idx && (
                  <div className="p-3 bg-[#0d121c] text-xs text-slate-400 border-t border-slate-800/80 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Creator Form */}
        {isCreatingTicket ? (
          <form onSubmit={handleCreateTicket} className="bg-[#111624] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100">Create New Support Inquiry</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit confirmation or trade clarification"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option>Trading & Execution</option>
                  <option>Deposit & Withdrawal</option>
                  <option>Verification & Security</option>
                  <option>General Inquiries</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your question or issue in detail..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Submit Ticket
            </button>
          </form>
        ) : (
          /* Live Ticket Chat & History */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tickets list */}
            <div className="bg-[#111624] border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                My Tickets ({tickets.length})
              </div>
              {tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTicketId(t.id);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    activeTicketId === t.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-slate-100'
                      : 'bg-[#151c2c] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate pr-2">{t.subject}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>{t.id}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat conversation box */}
            <div className="md:col-span-2 bg-[#111624] border border-slate-800 rounded-xl flex flex-col h-[400px]">
              {activeTicket ? (
                <>
                  <div className="p-3.5 border-b border-slate-800 bg-[#151c2c] flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-slate-100">{activeTicket.subject}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{activeTicket.category} • {activeTicket.id}</div>
                    </div>
                  </div>

                  {/* Messages scroll */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {activeTicket.messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-xl text-xs ${
                            m.sender === 'user'
                              ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                              : 'bg-[#1a2336] text-slate-200 border border-slate-700/80 rounded-tl-none'
                          }`}
                        >
                          <div>{m.text}</div>
                          <div className={`text-[10px] mt-1 ${m.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'}`}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input */}
                  <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-[#182234] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  Select a support ticket to view conversation
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
