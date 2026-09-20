import React, { useState, useEffect, useRef } from 'react';
import { SupportTicket } from '../../types';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import {
  subscribeSupportTicketsFromFirebase,
  saveSupportTicketToFirebase,
  addMessageToTicketInFirebase,
} from '../../services/firebaseRequests';

interface SupportPageProps {
  userName?: string;
  userEmail?: string;
}

export const SupportPage: React.FC<SupportPageProps> = ({
  userName = 'Trader',
  userEmail = 'Johirul4848@gmail.com',
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string>('');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Binance Pay Deposit');
  const [newMsg, setNewMsg] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const faqs = [
    {
      q: 'How does CryptoBari calculate binary options settlement?',
      a: 'When you place an UP or DOWN position, our server captures the exact Binance Spot market price at that millisecond. At expiration, the server fetches the reference Binance price and compares it. If direction is correct, your investment plus payout percentage (e.g. 85-95%) is automatically credited to your wallet.',
    },
    {
      q: 'How does the Binance Pay Deposit work?',
      a: 'Navigate to Deposit, enter your amount in USD (minimum $5), and send the funds via Binance App to Binance ID: 794380283 or scan the QR Code. Once submitted, our treasury department automatically reviews and credits your live wallet within 1-3 minutes.',
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum withdrawal request is $10.00 USD. Ensure your live real balance has at least $10.00 before submitting. Payouts are dispatched directly to your Binance ID.',
    },
    {
      q: 'What is Demo Account vs Real Account?',
      a: 'The Demo Account comes with $10,000 in virtual funds for risk-free practice. You can reset the balance anytime. The Real Account holds live balances deposited via Binance Pay for real profits.',
    },
    {
      q: 'Can I trade from mobile phones and tablets?',
      a: 'Yes, CryptoBari is engineered mobile-first with dedicated thumb-friendly UP/DOWN trading controls, responsive candlestick charts, and instant asset selection.',
    },
  ];

  const quickTemplates = [
    {
      label: '⚡ Binance Deposit Pending',
      category: 'Binance Pay Deposit',
      subject: 'Binance Pay Deposit Under Review',
      msg: 'Hello Support, I submitted a deposit via Binance Pay. My Binance ID is [enter ID] and amount is $[enter amount]. Please review and credit my account.',
    },
    {
      label: '💸 Withdrawal Status Inquiry',
      category: 'Withdrawal Inquiry',
      subject: 'Withdrawal Request Processing Status',
      msg: 'Hello Treasury, I requested a withdrawal to my Binance Pay ID. Kindly confirm when the transfer will be sent to my Binance account.',
    },
    {
      label: '🎁 Influencer Promo Bonus',
      category: 'General Support',
      subject: 'Influencer Promo Code Activation Query',
      msg: 'Hello, I have an influencer promotion code. I would like to confirm my bonus percentage and eligibility.',
    },
    {
      label: '📊 Binary Trade Execution',
      category: 'Trading & Execution',
      subject: 'Trade Settlement Verification Inquiry',
      msg: 'Hello, I would like to verify the Binance reference exit price for my recent trade on the platform.',
    },
  ];

  const applyTemplate = (tmpl: typeof quickTemplates[0]) => {
    sound.playClick();
    setNewCategory(tmpl.category);
    setNewSubject(tmpl.subject);
    setNewMsg(tmpl.msg);
    setIsCreatingTicket(true);
  };

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTickets(data);
          if (data.length > 0 && !activeTicketId) {
            setActiveTicketId(data[0].id);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Subscribe to Firestore for real-time ticket streaming
    const unsubscribe = subscribeSupportTicketsFromFirebase((fireTickets) => {
      if (Array.isArray(fireTickets) && fireTickets.length > 0) {
        setTickets(fireTickets);
        if (!activeTicketId && fireTickets.length > 0) {
          setActiveTicketId(fireTickets[0].id);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Attachment image size must be under 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      sound.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMsg.trim()) return;
    sound.playClick();

    const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: userEmail,
      subject: newSubject.trim(),
      category: newCategory,
      status: 'OPEN',
      createdAt: Date.now(),
      messages: [
        {
          id: 'MSG-' + Math.floor(100000 + Math.random() * 900000),
          sender: 'user',
          text: newMsg.trim() + (attachedImage ? `\n[Image Attachment Included]` : ''),
          imageUrl: attachedImage || undefined,
          timestamp: Date.now(),
        },
      ],
    };

    try {
      // Save to Firebase Firestore
      await saveSupportTicketToFirebase(newTicket);

      // Save to backend API
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ticketId,
          userId: userEmail,
          userName,
          userEmail,
          subject: newSubject.trim(),
          category: newCategory,
          message: newMsg.trim(),
          imageUrl: attachedImage || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        setActiveTicketId(created.id);
      } else {
        setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
        setActiveTicketId(ticketId);
      }

      setIsCreatingTicket(false);
      setNewSubject('');
      setNewMsg('');
      setAttachedImage(null);
      sound.playWin();
    } catch {
      setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
      setActiveTicketId(ticketId);
      setIsCreatingTicket(false);
      setNewSubject('');
      setNewMsg('');
      setAttachedImage(null);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !attachedImage) || !activeTicketId) return;
    sound.playClick();

    const currentText = replyText.trim();
    const currentImg = attachedImage;
    setReplyText('');
    setAttachedImage(null);

    const messageObj = {
      id: 'MSG-' + Math.floor(100000 + Math.random() * 900000),
      sender: 'user' as const,
      text: currentText || (currentImg ? 'Sent an image attachment' : ''),
      imageUrl: currentImg || undefined,
      timestamp: Date.now(),
    };

    // Update Firestore
    addMessageToTicketInFirebase(activeTicketId, messageObj).catch(() => {});

    // Update API
    try {
      const res = await fetch(`/api/support/tickets/${activeTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'user',
          text: messageObj.text,
          imageUrl: messageObj.imageUrl,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === activeTicketId
              ? { ...t, messages: [...t.messages, messageObj] }
              : t
          )
        );
      }
    } catch {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicketId
            ? { ...t, messages: [...t.messages, messageObj] }
            : t
        )
      );
    }
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || tickets[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#090d16] text-slate-100 custom-scrollbar select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-[#12192a] via-[#0e1422] to-[#12192a] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg ring-2 ring-cyan-400/20">
              <LifeBuoy className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">24/7 Global Support Desk</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Treasury Active (<span className="font-mono">&lt; 2m response</span>)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direct inquiry channel for <strong className="text-white">{userName}</strong> ({userEmail}). Live verification & prompt assistance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                fetchTickets();
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="open-support-ticket-btn"
              onClick={() => {
                sound.playClick();
                setIsCreatingTicket(!isCreatingTicket);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isCreatingTicket ? 'View My Inquiries' : 'New Ticket Inquiry'}</span>
            </button>
          </div>
        </div>

        {/* Quick Help Template Pills */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast-Track Inquiries (Click to auto-compose ticket)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((t, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(t)}
                className="px-3 py-1.5 rounded-xl bg-[#0e1424] hover:bg-[#16213a] border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer active:scale-95"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Creator Form */}
        {isCreatingTicket ? (
          <form onSubmit={handleCreateTicket} className="bg-[#0f1422] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Create Direct Support Inquiry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Our treasury & technical agents usually reply in under 3 minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingTicket(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-3 py-1 rounded-lg bg-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Binance Pay deposit inquiry"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option>Binance Pay Deposit</option>
                  <option>Withdrawal Inquiry</option>
                  <option>Trading & Execution</option>
                  <option>Verification & Security</option>
                  <option>General Support</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Message Description</label>
              <textarea
                rows={4}
                placeholder="Please describe your question or issue with as much detail as possible..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 leading-relaxed"
                required
              />
            </div>

            {/* Image attachment preview in creation */}
            {attachedImage && (
              <div className="relative inline-block border border-slate-700 rounded-xl p-1 bg-slate-900">
                <img src={attachedImage} alt="Attachment" className="max-h-32 rounded-lg object-contain" />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Attach Screenshot (Binance slip)</span>
                </button>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket to Treasury</span>
              </button>
            </div>
          </form>
        ) : (
          /* Live Ticket Chat & History */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Tickets list (4 Cols) */}
            <div className="lg:col-span-4 bg-[#0f1422] border border-slate-800 rounded-3xl p-4 space-y-2.5 shadow-xl">
              <div className="text-xs font-black text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                <span>My Inquiries</span>
                <span className="font-mono text-cyan-400">({tickets.length})</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No tickets yet. Click "New Ticket Inquiry" or select a fast-track pill above.
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        sound.playClick();
                        setActiveTicketId(t.id);
                      }}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        activeTicketId === t.id
                          ? 'bg-gradient-to-r from-[#172338] to-[#121c2e] border-cyan-500/50 text-slate-100 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span className="truncate text-white">{t.subject}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span className="font-mono text-cyan-400 font-semibold">{t.id}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat conversation box (8 Cols) */}
            <div className="lg:col-span-8 bg-[#0f1422] border border-slate-800 rounded-3xl flex flex-col h-[540px] shadow-xl overflow-hidden">
              {activeTicket ? (
                <>
                  <div className="p-4 border-b border-slate-800 bg-[#141b2c] flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm text-white">{activeTicket.subject}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Category: <strong className="text-cyan-400">{activeTicket.category}</strong> • ID: <span className="font-mono text-slate-300">{activeTicket.id}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                        activeTicket.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {activeTicket.status}
                    </span>
                  </div>

                  {/* Messages scroll */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0a0f1c]">
                    {activeTicket.messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            m.sender === 'user'
                              ? 'bg-cyan-600 text-white font-medium rounded-tr-none'
                              : 'bg-[#151d2e] text-slate-200 border border-slate-700/80 rounded-tl-none'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                            {m.sender === 'user' ? (
                              <span>You</span>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300 font-bold">CryptoBari Support Specialist</span>
                              </>
                            )}
                          </div>
                          <div className="whitespace-pre-line">{m.text}</div>
                          {m.imageUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-white/20">
                              <img src={m.imageUrl} alt="Attached Proof" className="max-h-48 object-contain w-full bg-black/40" />
                            </div>
                          )}
                          <div className={`text-[9px] mt-1.5 ${m.sender === 'user' ? 'text-cyan-100' : 'text-slate-500'}`}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Attachment preview in reply */}
                  {attachedImage && (
                    <div className="p-2 bg-[#121828] border-t border-slate-800 flex items-center gap-2">
                      <div className="relative inline-block border border-slate-700 rounded-lg p-1 bg-black/40">
                        <img src={attachedImage} alt="Attachment" className="h-16 rounded object-contain" />
                        <button
                          type="button"
                          onClick={() => setAttachedImage(null)}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">Screenshot attached to reply</span>
                    </div>
                  )}

                  {/* Reply Input */}
                  <form onSubmit={handleSendReply} className="p-3.5 border-t border-slate-800 bg-[#121828] flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
                      title="Attach screenshot or payment proof"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type your message to support..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer transition shadow-md flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center">
                  <LifeBuoy className="w-10 h-10 mb-2 text-slate-600 stroke-[1.5]" />
                  <span>Select an inquiry from the left or create a new ticket to chat with support.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQ Accordion Section */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-black text-white mb-4">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <span>Frequently Asked Questions & Trading Guidance</span>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/40">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="p-4 bg-[#0a0f1c] text-xs text-slate-400 border-t border-slate-800/80 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

