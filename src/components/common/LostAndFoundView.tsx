// HIET Digital Campus - Lost & Found Vault
// Dual-sided reporting: Students & staff can report lost belongings OR catalog found items
// Features intelligent matching suggestions, challenge-response verification, and institutional RLS

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PackageSearch, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle, 
  X, 
  User, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  Mail, 
  Building, 
  Upload, 
  Eye, 
  FileText, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from './PageHeader';
import { StatCard } from './StatCard';
import { 
  LostFoundItem, 
  LostFoundCategory, 
  LostFoundReportType, 
  LostReportStatus, 
  FoundReportStatus,
  LostFoundStatus 
} from '../../types';
import { apiService } from '../../lib/supabase';
import { dataStore } from '../../lib/mockData';
import { 
  findPotentialMatches, 
  findUserReportMatches, 
  calculateItemMatch 
} from '../../lib/lostFoundMatcher';

type TabType = 'all' | 'lost' | 'found' | 'my_reports' | 'matches';

export const LostAndFoundView: React.FC = () => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || (user as any)?.roll_no || 'HIET-CSE-2026-001';
  const currentEmail = user?.email || (student?.roll_no ? `${student.roll_no.toLowerCase()}@hiet.ac.in` : 'student@hiet.ac.in');
  const currentPhone = student?.phone || (user as any)?.phone || '+91 98160 11001';
  const currentName = user?.name || student?.name || 'Campus Member';

  // Master Items State
  const [items, setItems] = useState<LostFoundItem[]>(() => dataStore.getLostFoundItems('all'));
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Tabs State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal Open/Close Controls
  const [showLostModal, setShowLostModal] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<LostFoundItem | null>(null);
  const [selectedItemForMatches, setSelectedItemForMatches] = useState<LostFoundItem | null>(null);
  const [viewDetailsItem, setViewDetailsItem] = useState<LostFoundItem | null>(null);

  // In-flight submission controls
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    reference_code: string;
    type: 'lost' | 'found';
    title: string;
    matchesFound: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Claim Submission State
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimPhone, setClaimPhone] = useState(currentPhone);
  const [claimResult, setClaimResult] = useState<{ success?: boolean; msg?: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Form State: Report Lost Item
  // ---------------------------------------------------------------------------
  const [lostForm, setLostForm] = useState({
    title: '',
    category: 'Electronics' as LostFoundCategory,
    description: '',
    identifying_characteristics: '',
    location: '',
    item_date: new Date().toISOString().slice(0, 10),
    approximate_time: '11:15 AM',
    image_url: '',
    contact_preference: 'Institutional_Email' as const,
    contact_email: currentEmail,
    contact_phone: currentPhone,
    additional_info: ''
  });

  // ---------------------------------------------------------------------------
  // Form State: Report Found Item
  // ---------------------------------------------------------------------------
  const [foundForm, setFoundForm] = useState({
    title: '',
    category: 'Electronics' as LostFoundCategory,
    description: '',
    found_location: '',
    found_date: new Date().toISOString().slice(0, 10),
    approximate_time: '12:30 PM',
    custody_status: 'Security_Desk' as const,
    challenge_question: '',
    challenge_answer: '',
    image_url: '',
    additional_info: ''
  });

  // Fetch items from backend on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    apiService.getLostFoundItems()
      .then(data => {
        if (isMounted && data && data.length > 0) {
          setItems(data);
        }
      })
      .catch(err => {
        console.warn('Failed to load remote lost & found items:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Compute counts for tab badges
  const counts = useMemo(() => {
    const all = items.length;
    const lost = items.filter(i => i.report_type === 'lost').length;
    const found = items.filter(i => i.report_type === 'found').length;
    const myReports = items.filter(i => 
      i.reporter_id === user?.id || 
      i.reporter_roll_or_emp === currentRoll ||
      (i.reporter_name && i.reporter_name.toLowerCase() === currentName.toLowerCase())
    ).length;
    const userMatches = findUserReportMatches(currentRoll, items).length;

    return { all, lost, found, myReports, userMatches };
  }, [items, user?.id, currentRoll, currentName]);

  // Compute suggestions for current user
  const myMatchSuggestions = useMemo(() => {
    return findUserReportMatches(currentRoll, items);
  }, [currentRoll, items]);

  // Filtered Items based on active tab and search filters
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      // 1. Tab Filter
      if (activeTab === 'lost' && it.report_type !== 'lost') return false;
      if (activeTab === 'found' && it.report_type !== 'found') return false;
      if (activeTab === 'my_reports') {
        const isMine = 
          it.reporter_id === user?.id || 
          it.reporter_roll_or_emp === currentRoll ||
          (it.reporter_name && it.reporter_name.toLowerCase() === currentName.toLowerCase());
        if (!isMine) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Documents' && (it.category === 'Documents' || it.category === 'Documents/ID')) {
          // match both
        } else if (it.category !== categoryFilter) {
          return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = it.title.toLowerCase().includes(q);
        const descMatch = it.description.toLowerCase().includes(q);
        const locMatch = (it.location || it.found_location || '').toLowerCase().includes(q);
        const refMatch = (it.reference_code || '').toLowerCase().includes(q);
        const categoryMatch = it.category.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !locMatch && !refMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeTab, categoryFilter, searchQuery, user?.id, currentRoll, currentName]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleOpenLostModal = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setLostForm({
      title: '',
      category: 'Electronics',
      description: '',
      identifying_characteristics: '',
      location: '',
      item_date: new Date().toISOString().slice(0, 10),
      approximate_time: '11:15 AM',
      image_url: '',
      contact_preference: 'Institutional_Email',
      contact_email: currentEmail,
      contact_phone: currentPhone,
      additional_info: ''
    });
    setShowLostModal(true);
  };

  const handleOpenFoundModal = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setFoundForm({
      title: '',
      category: 'Electronics',
      description: '',
      found_location: '',
      found_date: new Date().toISOString().slice(0, 10),
      approximate_time: '12:30 PM',
      custody_status: 'Security_Desk',
      challenge_question: '',
      challenge_answer: '',
      image_url: '',
      additional_info: ''
    });
    setShowFoundModal(true);
  };

  const handleLostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostForm.title.trim() || !lostForm.location.trim() || !lostForm.description.trim() || !lostForm.identifying_characteristics.trim()) {
      setSubmitError('Please fill in all required fields including identifying characteristics.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const now = new Date();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceCode = `LOST-${now.getFullYear()}-${randomSuffix}`;
      const newId = `lf-lost-${Date.now()}`;

      const lostItemPayload: Partial<LostFoundItem> = {
        id: newId,
        reference_code: referenceCode,
        report_type: 'lost',
        title: lostForm.title.trim(),
        category: lostForm.category,
        description: lostForm.description.trim(),
        location: lostForm.location.trim(),
        found_location: lostForm.location.trim(),
        item_date: lostForm.item_date,
        found_date: lostForm.item_date,
        approximate_time: lostForm.approximate_time,
        identifying_characteristics: lostForm.identifying_characteristics.trim(),
        contact_preference: lostForm.contact_preference,
        contact_email: lostForm.contact_email || currentEmail,
        contact_phone: lostForm.contact_phone || currentPhone,
        additional_info: lostForm.additional_info.trim() || undefined,
        image_url: lostForm.image_url || undefined,
        status: 'Open',
        reporter_id: user?.id || 'usr-student',
        reporter_name: currentName,
        reporter_role: user?.role || 'student',
        reporter_roll_or_emp: currentRoll,
        founder_name: currentName,
        created_at: now.toISOString()
      };

      const saved = await apiService.saveLostFoundItem(lostItemPayload);
      
      // Update local view state
      setItems(prev => [saved, ...prev]);

      // Calculate matches immediately
      const possibleMatches = findPotentialMatches(saved, items);

      setSubmitSuccess({
        reference_code: saved.reference_code,
        type: 'lost',
        title: saved.title,
        matchesFound: possibleMatches.length
      });
    } catch (err: any) {
      console.error('Failed to report lost item:', err);
      setSubmitError(err?.message || 'Failed to submit report. Please check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundForm.title.trim() || !foundForm.found_location.trim() || !foundForm.description.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }

    if (!foundForm.challenge_question.trim()) {
      setSubmitError('Please provide a challenge question to protect ownership verification.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const now = new Date();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceCode = `FOUND-${now.getFullYear()}-${randomSuffix}`;
      const newId = `lf-found-${Date.now()}`;

      const foundItemPayload: Partial<LostFoundItem> = {
        id: newId,
        reference_code: referenceCode,
        report_type: 'found',
        title: foundForm.title.trim(),
        category: foundForm.category,
        description: foundForm.description.trim(),
        location: foundForm.found_location.trim(),
        found_location: foundForm.found_location.trim(),
        item_date: foundForm.found_date,
        found_date: foundForm.found_date,
        approximate_time: foundForm.approximate_time,
        custody_status: foundForm.custody_status,
        challenge_question: foundForm.challenge_question.trim(),
        challenge_answer: foundForm.challenge_answer.trim(),
        challenge_answer_hash: foundForm.challenge_answer ? `hash-${foundForm.challenge_answer.toLowerCase().trim()}` : undefined,
        additional_info: foundForm.additional_info.trim() || undefined,
        image_url: foundForm.image_url || undefined,
        status: 'Reported',
        reporter_id: user?.id || 'usr-campus',
        reporter_name: currentName,
        reporter_role: user?.role || 'student',
        reporter_roll_or_emp: currentRoll,
        founder_name: currentName,
        created_at: now.toISOString()
      };

      const saved = await apiService.saveLostFoundItem(foundItemPayload);
      
      // Update local view state
      setItems(prev => [saved, ...prev]);

      // Calculate matches with open lost reports
      const possibleMatches = findPotentialMatches(saved, items);

      setSubmitSuccess({
        reference_code: saved.reference_code,
        type: 'found',
        title: saved.title,
        matchesFound: possibleMatches.length
      });
    } catch (err: any) {
      console.error('Failed to report found item:', err);
      setSubmitError(err?.message || 'Failed to submit found item report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAnswer.trim() || !selectedItemForClaim) return;

    setIsSubmitting(true);
    try {
      await apiService.submitLostFoundClaim({
        item_id: selectedItemForClaim.id,
        claimant_id: user?.id || currentRoll,
        claimant_name: currentName,
        claimant_roll: currentRoll,
        claimant_phone: claimPhone,
        challenge_response: claimAnswer.trim()
      });

      // Update state locally
      setItems(prev => prev.map(it => 
        it.id === selectedItemForClaim.id ? { ...it, status: 'Claim_Pending' } : it
      ));

      setClaimResult({
        success: true,
        msg: `Your ownership claim has been submitted under reference ${selectedItemForClaim.reference_code}. Campus Security has been notified to verify your challenge answer and coordinate safe return.`
      });
    } catch (err: any) {
      console.error('Failed to submit claim:', err);
      setClaimResult({
        success: false,
        msg: 'Failed to submit verification response. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isLost: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isLost) {
        setLostForm(prev => ({ ...prev, image_url: result }));
      } else {
        setFoundForm(prev => ({ ...prev, image_url: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header with Dual Actions */}
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Services' },
          { label: 'Lost & Found Vault', active: true }
        ]}
        title="Campus Lost & Found Vault"
        description="Official institutional registry for lost belongings and found items with verified challenge retrieval"
        badge="Property Retrieval Desk"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Action 1: Report Lost Item */}
            <button
              type="button"
              id="btn-report-lost-item"
              onClick={handleOpenLostModal}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0f2942] border border-[#0f2942] hover:border-[#0a1c2e] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-[0.98]"
            >
              <AlertCircle className="w-4 h-4 text-[#0f2942]" />
              <span>Report Lost Item</span>
            </button>

            {/* Action 2: Report Found Item */}
            <button
              type="button"
              id="btn-report-found-item"
              onClick={handleOpenFoundModal}
              className="px-4 py-2.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs hover:shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Report Found Item</span>
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Catalogued Items"
          value={counts.all}
          icon={PackageSearch}
          badgeColor="blue"
          subtext="Lost & found records"
        />
        <StatCard
          label="Open Lost Reports"
          value={counts.lost}
          icon={AlertCircle}
          badgeColor="slate"
          subtext="Searching on campus"
        />
        <StatCard
          label="Found in Custody"
          value={counts.found}
          icon={ShieldCheck}
          badgeColor="blue"
          subtext="Security & front desk"
        />
        <StatCard
          label="Potential Matches"
          value={myMatchSuggestions.length}
          icon={Sparkles}
          badgeColor="amber"
          subtext={myMatchSuggestions.length > 0 ? "Suggestions for your reports" : "No pending suggestions"}
          onClick={() => setActiveTab('matches')}
        />
      </div>

      {/* Potential Matches Suggestion Alert Banner (When applicable) */}
      {myMatchSuggestions.length > 0 && activeTab !== 'matches' && (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f2942] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0f2942] flex items-center gap-1.5">
                <span>{myMatchSuggestions.length} Potential Match Suggestion{myMatchSuggestions.length > 1 ? 's' : ''} Found</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Automated Match
                </span>
              </h4>
              <p className="text-[11px] text-slate-600">
                Our property matching engine detected catalogued items matching your reported belongings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className="px-3.5 py-1.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition shrink-0 shadow-2xs"
          >
            Review Suggestions
          </button>
        </div>
      )}

      {/* Main Listing Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-4 pt-3 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'all', label: 'All Items', count: counts.all },
              { id: 'lost', label: 'Lost Items', count: counts.lost },
              { id: 'found', label: 'Found Items', count: counts.found },
              { id: 'my_reports', label: 'My Reports', count: counts.myReports },
              { id: 'matches', label: 'Matches', count: myMatchSuggestions.length }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                    isActive 
                      ? 'border-[#0f2942] text-[#0f2942] bg-slate-50/80' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#0f2942] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              apiService.getLostFoundItems().then(data => setItems(data)).finally(() => setIsLoading(false));
            }}
            title="Refresh Registry"
            className="p-1.5 text-slate-400 hover:text-[#0f2942] transition rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0f2942]' : ''}`} />
          </button>
        </div>

        {/* Filter Controls (Search + Category) */}
        {activeTab !== 'matches' && (
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-search-lost-found"
                placeholder="Search by title, location, reference ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                id="select-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              >
                <option value="All">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Documents/ID">Documents / ID Cards</option>
                <option value="Books">Books & Stationary</option>
                <option value="Accessories">Accessories</option>
                <option value="Clothing">Clothing</option>
                <option value="Keys">Keys</option>
                <option value="Bags">Bags & Backpacks</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab View: MATCHES SUGGESTIONS TAB */}
        {activeTab === 'matches' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 text-[#0f2942] font-bold">
                <Info className="w-4 h-4 text-[#0f2942]" />
                <span>Institutional Property Matching Policy</span>
              </div>
              <p className="text-slate-600">
                Matches are automated suggestions based on category, campus locations, timestamps, and descriptive traits. 
                They do <span className="font-semibold text-slate-900">NOT</span> constitute proof of ownership. 
                Physical retrieval requires challenge verification at Campus Security.
              </p>
            </div>

            {myMatchSuggestions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">No Potential Matches at This Moment</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a found item matching your reported belongings is catalogued by security or staff, it will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myMatchSuggestions.map((suggestion, idx) => {
                  const lost = suggestion.lostItem;
                  const found = suggestion.foundItem;
                  return (
                    <div 
                      key={`match-${idx}`} 
                      className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 hover:border-slate-300 transition bg-white shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#0f2942] text-white">
                            {suggestion.matchScore}% Confidence Match
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            Category: {lost.category}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {lost.reference_code} ↔ {found.reference_code}
                        </div>
                      </div>

                      {/* Side by side comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Lost Report Side */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Your Reported Lost Item
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700">{lost.reference_code}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{lost.title}</h4>
                          <p className="text-slate-600 line-clamp-2">{lost.description}</p>
                          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Last seen: {lost.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Date: {lost.item_date} {lost.approximate_time ? `(${lost.approximate_time})` : ''}</span>
                            </div>
                          </div>
                        </div>

                        {/* Found Item in Custody Side */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2942]">
                              Found Item In Custody
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700">{found.reference_code}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{found.title}</h4>
                          <p className="text-slate-600 line-clamp-2">{found.description}</p>
                          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Found at: {found.found_location || found.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Custody: {found.custody_status?.replace('_', ' ') || 'Security Desk'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Matching Factors */}
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                        <span className="font-bold text-slate-800 text-[11px] block">Matching Criteria Identified:</span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 list-disc list-inside">
                          {suggestion.matchingFactors.map((factor, fIdx) => (
                            <li key={fIdx}>{factor}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setViewDetailsItem(found)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                        >
                          View Found Record
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForClaim(found);
                            setClaimAnswer('');
                            setClaimResult(null);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Submit Ownership Verification</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Regular Items Grid */}
        {activeTab !== 'matches' && (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-400 space-y-2">
                <PackageSearch className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">No items match your active filter.</p>
                <p className="text-xs text-slate-400">Try adjusting your search keywords or switching category filters.</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isLost = item.report_type === 'lost';
                const isMyReport = 
                  item.reporter_id === user?.id || 
                  item.reporter_roll_or_emp === currentRoll ||
                  (item.reporter_name && item.reporter_name.toLowerCase() === currentName.toLowerCase());

                // Find candidate matches for this specific item
                const itemMatches = findPotentialMatches(item, items);

                return (
                  <div 
                    key={item.id} 
                    className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 hover:border-slate-300 transition flex flex-col justify-between bg-white shadow-2xs hover:shadow-xs"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {/* Report Type Badge */}
                          {isLost ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#0f2942] border border-slate-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-[#0f2942]" />
                              <span>Lost Belonging</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0f2942] text-white flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-white" />
                              <span>Found Item</span>
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'Open' || item.status === 'Reported' 
                            ? 'bg-slate-50 text-slate-800 border-slate-300' 
                            : item.status === 'Possible_Match' || item.status === 'Claim_Pending'
                            ? 'bg-blue-50 text-[#0f2942] border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Title & Reference Code */}
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-base leading-snug">{item.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Ref: {item.reference_code || item.id}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Location & Date Details */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-slate-700">{isLost ? 'Last seen:' : 'Found at:'}</span> {item.location || item.found_location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {item.item_date || item.found_date} {item.approximate_time ? `• ${item.approximate_time}` : ''}
                          </span>
                          <span className="text-slate-400">
                            {isMyReport ? 'Reported by you' : `By ${item.reporter_name || item.founder_name || 'Campus Member'}`}
                          </span>
                        </div>

                        {/* Custody status for found items */}
                        {!isLost && item.custody_status && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Custody: <span className="font-semibold text-slate-800">{item.custody_status.replace(/_/g, ' ')}</span></span>
                          </div>
                        )}
                      </div>

                      {/* Match Suggestion Alert on card if matches exist */}
                      {itemMatches.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-[#0f2942] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#0f2942]" />
                            {itemMatches.length} possible {isLost ? 'found item' : 'lost report'} match{itemMatches.length > 1 ? 'es' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedItemForMatches(item)}
                            className="text-[11px] font-bold text-[#0f2942] hover:underline"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Bottom */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewDetailsItem(item)}
                        className="flex-1 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {/* Specific Action based on report type */}
                      {!isLost ? (
                        item.status === 'Reported' || item.status === 'In_Custody' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemForClaim(item);
                              setClaimAnswer('');
                              setClaimResult(null);
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Claim Item</span>
                          </button>
                        ) : (
                          <div className="flex-1 text-center py-1 bg-slate-50 rounded-xl text-slate-500 text-[11px] font-semibold">
                            {item.status.replace(/_/g, ' ')}
                          </div>
                        )
                      ) : (
                        itemMatches.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedItemForMatches(item)}
                            className="flex-1 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Matches ({itemMatches.length})</span>
                          </button>
                        ) : (
                          <div className="flex-1 text-center py-1 bg-slate-50 rounded-xl text-slate-500 text-[11px] font-semibold">
                            Searching Campus
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* =======================================================================
          MODAL 1: REPORT LOST ITEM
         ======================================================================= */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0f2942] text-white flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Report Lost Campus Belonging</h3>
                  <p className="text-[11px] text-slate-500">Official log linked to your institutional student profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && submitSuccess.type === 'lost' ? (
              <div className="space-y-4 text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-[#0f2942] mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Lost Item Report Filed Successfully</h4>
                  <p className="text-xs text-slate-600">
                    Your report reference code is <span className="font-mono font-bold text-[#0f2942]">{submitSuccess.reference_code}</span>.
                  </p>
                </div>
                {submitSuccess.matchesFound > 0 ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#0f2942]">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    We identified <span className="font-bold">{submitSuccess.matchesFound} possible match(es)</span> in campus custody!
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Campus security and property front desks have been notified. You will be alerted immediately if a matching item is catalogued.
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLostModal(false);
                      setSubmitSuccess(null);
                      if (submitSuccess.matchesFound > 0) setActiveTab('matches');
                    }}
                    className="px-5 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLostSubmit} className="space-y-3.5 text-xs">
                {submitError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Item Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-lost-title"
                    placeholder="e.g. Casio fx-991EX ClassWiz, Navy Blue Dell Backpack, Apple AirPods"
                    value={lostForm.title}
                    onChange={(e) => setLostForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {/* Category & Last Seen Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-lost-category"
                      value={lostForm.category}
                      onChange={(e) => setLostForm(p => ({ ...p, category: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Documents">Documents / ID Cards</option>
                      <option value="Books">Books & Stationary</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Keys">Keys</option>
                      <option value="Bags">Bags & Backpacks</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Last-Seen Campus Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      id="input-lost-location"
                      placeholder="e.g. Block B LH-201, Canteen, Ground"
                      value={lostForm.location}
                      onChange={(e) => setLostForm(p => ({ ...p, location: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                </div>

                {/* Date and Approximate Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Date Last Seen <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      id="input-lost-date"
                      value={lostForm.item_date}
                      onChange={(e) => setLostForm(p => ({ ...p, item_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Approximate Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11:30 AM or During Break"
                      value={lostForm.approximate_time}
                      onChange={(e) => setLostForm(p => ({ ...p, approximate_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    General Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    id="input-lost-description"
                    placeholder="General appearance, brand, color, approximate age..."
                    value={lostForm.description}
                    onChange={(e) => setLostForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {/* Secret Identifying Characteristics (Crucial for verification) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    Identifying Characteristics & Secret Marks <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Specific markings used by campus security to verify you are the genuine owner before handover (e.g. serial numbers, sticker text, engravings, internal contents, lockscreen hints).
                  </p>
                  <textarea
                    required
                    rows={2}
                    id="input-lost-characteristics"
                    placeholder="e.g. Initials 'AS' engraved on back; sticker of Himachal Pradesh on bottom left..."
                    value={lostForm.identifying_characteristics}
                    onChange={(e) => setLostForm(p => ({ ...p, identifying_characteristics: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {/* Contact Preference & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Preference</label>
                    <select
                      value={lostForm.contact_preference}
                      onChange={(e) => setLostForm(p => ({ ...p, contact_preference: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    >
                      <option value="Institutional_Email">Official Email ({currentEmail})</option>
                      <option value="Phone_WhatsApp">Phone / WhatsApp</option>
                      <option value="Campus_Desk">Campus Security Desk Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 XXXXX XXXXX"
                      value={lostForm.contact_phone}
                      onChange={(e) => setLostForm(p => ({ ...p, contact_phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                </div>

                {/* Optional Photo Attachment */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Optional Reference Photo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="file-lost-image"
                      onChange={(e) => handleImageFileSelect(e, true)}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-lost-image"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 text-slate-700 font-semibold text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lostForm.image_url ? 'Replace Photo' : 'Upload Photo'}</span>
                    </label>
                    {lostForm.image_url && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Additional Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Contains urgent lecture notes; reward if found"
                    value={lostForm.additional_info}
                    onChange={(e) => setLostForm(p => ({ ...p, additional_info: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLostModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-lost-item-btn"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>File Lost Item Report</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: REPORT FOUND ITEM
         ======================================================================= */}
      {showFoundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0f2942] text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Report Found Campus Item</h3>
                  <p className="text-[11px] text-slate-500">Catalog an item found on campus and deposit into safe custody</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFoundModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && submitSuccess.type === 'found' ? (
              <div className="space-y-4 text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-[#0f2942] mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Found Item Catalogued Successfully</h4>
                  <p className="text-xs text-slate-600">
                    Item reference code is <span className="font-mono font-bold text-[#0f2942]">{submitSuccess.reference_code}</span>.
                  </p>
                </div>
                {submitSuccess.matchesFound > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#0f2942]">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    We identified <span className="font-bold">{submitSuccess.matchesFound} possible owner report(s)</span> looking for this item!
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFoundModal(false);
                      setSubmitSuccess(null);
                    }}
                    className="px-5 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFoundSubmit} className="space-y-3.5 text-xs">
                {submitError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Item Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Found Item Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-found-title"
                    placeholder="e.g. HP Scientific Calculator, Student ID Card Lanyard, Dell Charger"
                    value={foundForm.title}
                    onChange={(e) => setFoundForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {/* Category & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-found-category"
                      value={foundForm.category}
                      onChange={(e) => setFoundForm(p => ({ ...p, category: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Documents">Documents / ID Cards</option>
                      <option value="Books">Books & Stationary</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Keys">Keys</option>
                      <option value="Bags">Bags & Backpacks</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Found Location on Campus <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      id="input-found-location"
                      placeholder="e.g. LH-201 row 4, Canteen Table 12"
                      value={foundForm.found_location}
                      onChange={(e) => setFoundForm(p => ({ ...p, found_location: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                </div>

                {/* Date & Handover Custody */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Date Found <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={foundForm.found_date}
                      onChange={(e) => setFoundForm(p => ({ ...p, found_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Custody / Handover Point <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={foundForm.custody_status}
                      onChange={(e) => setFoundForm(p => ({ ...p, custody_status: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    >
                      <option value="Security_Desk">Main Gate Security Desk</option>
                      <option value="Library_Desk">Central Library Front Desk</option>
                      <option value="Department_Office">Department Staff Office</option>
                      <option value="Administrative_Office">Campus Administrative Office</option>
                      <option value="Finder_Custody">Retained in Finder Custody</option>
                    </select>
                  </div>
                </div>

                {/* Public Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Public Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    id="input-found-description"
                    placeholder="General description without disclosing secret markings or passwords..."
                    value={foundForm.description}
                    onChange={(e) => setFoundForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {/* Challenge-Response Security Verification */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#0f2942]" />
                    <span>Ownership Challenge Question</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A question only the true owner would know the answer to. This will be asked before releasing the item.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Public Challenge Question <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. What name or sticker is visible on the inner slider?"
                      value={foundForm.challenge_question}
                      onChange={(e) => setFoundForm(p => ({ ...p, challenge_question: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Secret Correct Answer (Stored securely for automated match verification)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HIET ECE 2026 or blue sticker"
                      value={foundForm.challenge_answer}
                      onChange={(e) => setFoundForm(p => ({ ...p, challenge_answer: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Optional Item Photo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="file-found-image"
                      onChange={(e) => handleImageFileSelect(e, false)}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-found-image"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 text-slate-700 font-semibold text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{foundForm.image_url ? 'Replace Photo' : 'Upload Photo'}</span>
                    </label>
                    {foundForm.image_url && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFoundModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-found-item-btn"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Catalog Found Item</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 3: CLAIM FOUND ITEM (CHALLENGE QUESTION)
         ======================================================================= */}
      {selectedItemForClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0f2942]" />
                <h3 className="font-bold text-slate-900 text-base">Claim Found Property</h3>
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
                <CheckCircle2 className="w-12 h-12 text-[#0f2942] mx-auto" />
                <p className="text-xs text-slate-700 leading-relaxed">{claimResult.msg}</p>
                <button
                  type="button"
                  onClick={() => setSelectedItemForClaim(null)}
                  className="px-5 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Item</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedItemForClaim.title}</p>
                  <span className="text-[10px] font-mono text-slate-400">{selectedItemForClaim.reference_code}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-[#0f2942]">
                    <HelpCircle className="w-3.5 h-3.5 text-[#0f2942]" /> Ownership Challenge Question:
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    {selectedItemForClaim.challenge_question || 'What are the unique identifying features of this item?'}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Your Specific Verification Answer / Identifying Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide exact identification features (serial numbers, password hint, markings, stickers, engravings)..."
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Mobile Number for Verification</label>
                  <input
                    type="text"
                    required
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
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
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 4: VIEW SPECIFIC ITEM MATCHES
         ======================================================================= */}
      {selectedItemForMatches && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0f2942]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Potential Matches for {selectedItemForMatches.title}</h3>
                  <span className="text-[10px] font-mono text-slate-500">Ref: {selectedItemForMatches.reference_code}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForMatches(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {findPotentialMatches(selectedItemForMatches, items).map((match, mIdx) => {
                const oppositeItem = selectedItemForMatches.report_type === 'lost' ? match.foundItem : match.lostItem;
                return (
                  <div key={mIdx} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f2942] px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200">
                        {match.matchScore}% Confidence Match
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{oppositeItem.reference_code}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{oppositeItem.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{oppositeItem.description}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <span className="font-semibold text-slate-700">Location:</span> {oppositeItem.location || oppositeItem.found_location}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Date:</span> {oppositeItem.item_date || oppositeItem.found_date}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewDetailsItem(oppositeItem);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
                      >
                        Inspect Record
                      </button>
                      {oppositeItem.report_type === 'found' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForClaim(oppositeItem);
                            setSelectedItemForMatches(null);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Claim This Item</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedItemForMatches(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 5: FULL ITEM DETAILS VIEWER
         ======================================================================= */}
      {viewDetailsItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  viewDetailsItem.report_type === 'lost' ? 'bg-slate-100 text-[#0f2942] border border-slate-300' : 'bg-[#0f2942] text-white'
                }`}>
                  {viewDetailsItem.report_type === 'lost' ? 'Lost Belonging' : 'Found Item in Custody'}
                </span>
                <span className="text-xs font-mono text-slate-400">{viewDetailsItem.reference_code}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailsItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{viewDetailsItem.title}</h3>
                <span className="text-slate-500 font-semibold">{viewDetailsItem.category}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Description</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {viewDetailsItem.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {viewDetailsItem.report_type === 'lost' ? 'Last Seen Location' : 'Found Location'}
                  </span>
                  <span className="font-bold text-slate-800">{viewDetailsItem.location || viewDetailsItem.found_location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date Reported</span>
                  <span className="font-bold text-slate-800">{viewDetailsItem.item_date || viewDetailsItem.found_date}</span>
                </div>
                {viewDetailsItem.custody_status && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Custody Location</span>
                    <span className="font-bold text-slate-800">{viewDetailsItem.custody_status.replace(/_/g, ' ')}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                  <span className="font-bold text-slate-800">{viewDetailsItem.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Reporter Attribution */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-slate-500 text-[11px]">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Reported by: <span className="font-semibold text-slate-700">{viewDetailsItem.reporter_name || viewDetailsItem.founder_name}</span></span>
                {viewDetailsItem.reporter_roll_or_emp && (
                  <span className="font-mono text-slate-400">({viewDetailsItem.reporter_roll_or_emp})</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailsItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Close
              </button>
              {viewDetailsItem.report_type === 'found' && (viewDetailsItem.status === 'Reported' || viewDetailsItem.status === 'In_Custody') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemForClaim(viewDetailsItem);
                    setViewDetailsItem(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Claim Item</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
