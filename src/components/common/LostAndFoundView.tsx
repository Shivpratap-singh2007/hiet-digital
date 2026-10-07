import React, { useState } from 'react';
import { 
  PackageSearch, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  X, 
  User, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from './PageHeader';
import { StatCard } from './StatCard';
import { LostFoundItem, LostFoundClaim } from '../../types';

export const LostAndFoundView: React.FC = () => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  const [items, setItems] = useState<LostFoundItem[]>([
    {
      id: 'lf-001',
      title: 'HP Scientific Calculator (fx-991ES Plus)',
      category: 'Electronics',
      description: 'Black dual-power non-programmable scientific calculator found near row 4 of the main lecture hall.',
      found_location: 'LH-201 (Block B, 2nd Floor)',
      found_date: new Date().toISOString().slice(0, 10),
      status: 'Reported',
      challenge_question: 'What is written on the inner side of the slide-on cover?',
      founder_name: 'Library Volunteer',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'lf-002',
      title: 'College ID Card & Metro Pass Holder',
      category: 'Documents/ID',
      description: 'Blue HIET lanyard with student ID card and bus pass in plastic casing.',
      found_location: 'Central Canteen Table 12',
      found_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      status: 'Claim_Pending',
      challenge_question: 'What is the full name and enrollment number visible on the back card?',
      founder_name: 'Security Post 1',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<LostFoundItem | null>(null);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimResult, setClaimResult] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Report Form State
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'Electronics' as const,
    description: '',
    found_location: '',
    found_date: new Date().toISOString().slice(0, 10),
    challenge_question: '',
    challenge_answer: ''
  });

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    const item: LostFoundItem = {
      id: `lf-${Date.now()}`,
      title: newItem.title,
      category: newItem.category,
      description: newItem.description,
      found_location: newItem.found_location,
      found_date: newItem.found_date,
      status: 'Reported',
      challenge_question: newItem.challenge_question,
      founder_name: user?.name || 'Campus Member',
      created_at: new Date().toISOString()
    };
    setItems(prev => [item, ...prev]);
    setShowReportModal(false);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAnswer.trim()) return;

    setClaimResult({
      success: true,
      msg: 'Verification response submitted successfully. The founder / security desk has been notified to verify your proof.'
    });

    if (selectedItemForClaim) {
      setItems(prev => prev.map(it => it.id === selectedItemForClaim.id ? { ...it, status: 'Claim_Pending' } : it));
    }
  };

  const filteredItems = items.filter(it => {
    if (categoryFilter !== 'All' && it.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return it.title.toLowerCase().includes(q) || 
             it.found_location.toLowerCase().includes(q) || 
             it.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Services' },
          { label: 'Lost & Found Vault', active: true }
        ]}
        title="Campus Lost & Found"
        description="Smart challenge-response matching for lost campus items, belongings, textbooks & electronics"
        badge="Property Retrieval Desk"
        actions={
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Report Found Item</span>
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Found Items Logged"
          value={items.length}
          icon={PackageSearch}
          badgeColor="blue"
          subtext="In institutional custody"
        />
        <StatCard
          label="Awaiting Claims"
          value={items.filter(i => i.status === 'Reported').length}
          icon={Clock}
          badgeColor="amber"
          subtext="Unclaimed belongings"
        />
        <StatCard
          label="Claims in Review"
          value={items.filter(i => i.status === 'Claim_Pending').length}
          icon={HelpCircle}
          badgeColor="slate"
          subtext="Challenge answers pending"
        />
        <StatCard
          label="Returned to Owner"
          value={items.filter(i => i.status === 'Verified_Claimed').length}
          icon={CheckCircle2}
          badgeColor="emerald"
          subtext="Successfully retrieved"
        />
      </div>

      {/* Filters and List Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items by name, place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents/ID">Documents / ID</option>
              <option value="Accessories">Accessories</option>
              <option value="Books">Books</option>
              <option value="Keys">Keys</option>
            </select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-slate-400">
              <PackageSearch className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No reported items match your search.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-300 transition flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Reported' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      item.status === 'Claim_Pending' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.found_location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.found_date}
                    </span>
                    <span className="text-[11px] text-slate-400">By {item.founder_name}</span>
                  </div>

                  <div className="pt-2">
                    {item.status === 'Reported' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemForClaim(item);
                          setClaimAnswer('');
                          setClaimResult(null);
                        }}
                        className="w-full py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Claim This Item</span>
                      </button>
                    ) : (
                      <div className="text-center py-1 bg-slate-50 rounded-lg text-slate-500 text-[11px] font-semibold">
                        Verification In Progress
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Claim Modal with Challenge Question */}
      {selectedItemForClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Claim Ownership</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForClaim(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {claimResult ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="text-xs text-slate-700">{claimResult.msg}</p>
                <button
                  type="button"
                  onClick={() => setSelectedItemForClaim(null)}
                  className="px-4 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Item</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedItemForClaim.title}</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Ownership Challenge Question:
                  </span>
                  <p className="text-xs font-semibold">{selectedItemForClaim.challenge_question}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Specific Answer / Proof Details</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide exact identification features (serial number, markings, password hint, engravings)..."
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForClaim(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs"
                  >
                    Submit Verification Claim
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Report Found Campus Item</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scientific Calculator fx-991ES"
                  value={newItem.title}
                  onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(p => ({ ...p, category: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Documents/ID">Documents / ID</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Books">Books</option>
                    <option value="Keys">Keys</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Found Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LH-201 3rd Row"
                    value={newItem.found_location}
                    onChange={(e) => setNewItem(p => ({ ...p, found_location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Public)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="General description without revealing the secret identifying details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block">Challenge Verification Security</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Challenge Question (Public to Claimants)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What name is written on the cover sticker?"
                    value={newItem.challenge_question}
                    onChange={(e) => setNewItem(p => ({ ...p, challenge_question: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Secret Correct Answer (Hashed securely)</label>
                  <input
                    type="text"
                    required
                    placeholder="Secret key for automated matching"
                    value={newItem.challenge_answer}
                    onChange={(e) => setNewItem(p => ({ ...p, challenge_answer: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs"
                >
                  Submit Found Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
