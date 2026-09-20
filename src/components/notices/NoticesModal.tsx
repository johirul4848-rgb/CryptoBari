import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, Sparkles, Info, ShieldCheck, Tag, Copy, Check, ArrowRight, MessageSquare } from 'lucide-react';
import { sound } from '../../utils/audio';
import { subscribeNoticesFromFirebase } from '../../services/firebaseRequests';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'PROMO' | 'ALERT';
  active: boolean;
  priority: number;
  createdAt: number;
}

interface NoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit?: (promoCode?: string) => void;
  onOpenSupport?: () => void;
}

export const NoticesModal: React.FC<NoticesModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
  onOpenSupport,
}) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PROMO' | 'INFO' | 'ALERT'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const extractPromoCode = (text: string): string | null => {
    const match = text.match(/(?:code|promo|voucher|coupon)[:=\s]+([A-Za-z0-9_-]{3,15})/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    const words = text.match(/\b([A-Z0-9]{4,10})\b/g);
    if (words) {
      const candidate = words.find(w => /^(WIN|PROMO|BONUS|VIP|BARI|CB|SAVE)/i.test(w));
      if (candidate) return candidate.toUpperCase();
    }
    return null;
  };

  const handleCopyPromo = (code: string) => {
    sound.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  useEffect(() => {
    if (!isOpen) return;

    loadNotices();

    // Real-time Firestore sync
    const unsubscribe = subscribeNoticesFromFirebase((fireNotices) => {
      if (Array.isArray(fireNotices) && fireNotices.length > 0) {
        setNotices(fireNotices.filter((n: any) => n.active !== false));
      }
    });

    const handleUpdated = () => {
      loadNotices();
    };
    window.addEventListener('cb_notices_updated', handleUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('cb_notices_updated', handleUpdated);
    };
  }, [isOpen]);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notices/active');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotices(data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredNotices = notices.filter((n) => {
    if (selectedFilter === 'ALL') return true;
    return n.type === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-cyan-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#121a2d] via-[#101626] to-[#121a2d] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Bell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>CryptoBari Official Announcements</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official broker updates, bonus promos, and trading alerts from Treasury
              </p>
            </div>
          </div>

          <button
            id="notices-modal-close-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 bg-[#0e1424] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => { sound.playClick(); setSelectedFilter('ALL'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            All Notices ({notices.length})
          </button>
          <button
            onClick={() => { sound.playClick(); setSelectedFilter('PROMO'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'PROMO'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-amber-300 hover:text-amber-200 bg-amber-500/10'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Promotions ({notices.filter(n => n.type === 'PROMO').length})</span>
          </button>
          <button
            onClick={() => { sound.playClick(); setSelectedFilter('INFO'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'INFO'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-cyan-300 hover:text-cyan-200 bg-cyan-500/10'
            }`}
          >
            <Info className="w-3 h-3" />
            <span>Updates ({notices.filter(n => n.type === 'INFO').length})</span>
          </button>
          <button
            onClick={() => { sound.playClick(); setSelectedFilter('ALERT'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'ALERT'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-rose-300 hover:text-rose-200 bg-rose-500/10'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Alerts ({notices.filter(n => n.type === 'ALERT').length})</span>
          </button>
        </div>

        {/* Notices Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {isLoading && notices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading latest announcements...
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No active announcements found in this category.
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  notice.type === 'ALERT'
                    ? 'bg-gradient-to-br from-rose-950/30 to-[#141019] border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.15)]'
                    : notice.type === 'PROMO'
                    ? 'bg-gradient-to-br from-amber-950/30 to-[#1a1710] border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                    : 'bg-gradient-to-br from-cyan-950/30 to-[#0e1824] border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.15)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {notice.type === 'ALERT' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Alert
                      </span>
                    ) : notice.type === 'PROMO' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Bonus Promotion
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Platform Notice
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(notice.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    ID: {notice.id}
                  </span>
                </div>

                <h3 className="font-black text-sm text-white mb-1.5">{notice.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{notice.content}</p>

                {/* Interactive Action Bar */}
                {(() => {
                  const promoCode = extractPromoCode(`${notice.title} ${notice.content}`);
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      {notice.type === 'PROMO' && promoCode ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyPromo(promoCode)}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedCode === promoCode ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Code: <strong className="text-white font-mono">{promoCode}</strong></span>
                              </>
                            )}
                          </button>

                          {onOpenDeposit && (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onClose();
                                onOpenDeposit(promoCode);
                              }}
                              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-lg text-[11px] font-black flex items-center gap-1 shadow cursor-pointer transition active:scale-95"
                            >
                              <span>Claim in Deposit</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : notice.type === 'ALERT' && onOpenSupport ? (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onClose();
                            onOpenSupport();
                          }}
                          className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Inquire with Live Support</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {onOpenSupport && notice.type !== 'ALERT' && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onClose();
                            onOpenSupport();
                          }}
                          className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer ml-auto"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Ask Support</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0f1b] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-bold">Binance Live Verified Broker</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            Close Bulletin
          </button>
        </div>
      </div>
    </div>
  );
};
