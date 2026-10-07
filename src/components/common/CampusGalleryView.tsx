import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Heart, 
  Download, 
  Share2, 
  X, 
  Filter, 
  Sparkles, 
  Camera, 
  PhoneCall, 
  Mail, 
  MapPin, 
  Award, 
  BookOpen, 
  Cpu, 
  Trophy, 
  Users,
  CheckCircle2,
  Maximize2,
  Plus,
  UploadCloud
} from 'lucide-react';
import { Card3D } from '../3d/Card3D';
import { HietCollegeLogo } from './HietCollegeLogo';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';


const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export interface GalleryPhoto {
  id: string;
  title: string;
  category: 'campus' | 'labs' | 'fest' | 'placements' | 'sports';
  imageUrl: string;
  caption: string;
  date: string;
  likes: number;
  tags: string[];
}

const GALLERY_DATA: GalleryPhoto[] = [
  {
    id: 'photo-1',
    title: 'Dhauladhar Foothills Campus Panorama',
    category: 'campus',
    imageUrl: '/images/hiet_campus.jpg',
    caption: 'Official wide-angle view of HIET Shahpur academic blocks against the snow-capped Himalayan Dhauladhar range.',
    date: 'March 2026',
    likes: 342,
    tags: ['Campus', 'Dhauladhar', 'Architecture', 'Shahpur']
  },
  {
    id: 'photo-2',
    title: 'Advanced Robotics & AI Research Lab',
    category: 'labs',
    imageUrl: '/images/hiet_robotics_ai_lab.jpg',
    caption: 'Engineering students collaborating on autonomous rovers, sensor telemetry, and neural network algorithms in Lab 3.',
    date: 'February 2026',
    likes: 289,
    tags: ['B.Tech CSE', 'Robotics', 'Artificial Intelligence', 'Innovation']
  },
  {
    id: 'photo-3',
    title: 'Pratibha Annual Cultural Festival Live Stage',
    category: 'fest',
    imageUrl: '/images/hiet_annual_fest.jpg',
    caption: 'Electrifying open-air rock concert and cultural night during Pratibha \'24 with laser lights and student performances.',
    date: 'November 2025',
    likes: 512,
    tags: ['Pratibha Fest', 'Cultural', 'Rock Night', 'Campus Life']
  },
  {
    id: 'photo-4',
    title: 'Annual Convocation & Campus Placement Drive',
    category: 'placements',
    imageUrl: '/images/hiet_convocation_placements.jpg',
    caption: 'Graduating engineering batch celebrating placement offers from top tech MNCs including Infosys, TCS, and Tech Mahindra.',
    date: 'January 2026',
    likes: 478,
    tags: ['Placements', 'Convocation', 'Success', 'HPTU']
  },
  {
    id: 'photo-5',
    title: 'Central Digital Library & Academic Resource Section',
    category: 'campus',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    caption: 'Air-conditioned digital library equipped with over 25,000+ volumes, IEEE subscriptions, and e-learning pods.',
    date: 'October 2025',
    likes: 195,
    tags: ['Library', 'Research', 'Self Study', 'Digital Learning']
  },
  {
    id: 'photo-6',
    title: 'Heavy Mechanical & Mechatronics Engineering Workshop',
    category: 'labs',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    caption: 'Precision CNC lathe machines, engine test rigs, and automated hydraulic fabrication bays for mechanical engineers.',
    date: 'December 2025',
    likes: 210,
    tags: ['Mechanical', 'CNC Machines', 'Workshops', 'HandsOn']
  },
  {
    id: 'photo-7',
    title: 'Annual Inter-College Sports Meet & Cricket Ground',
    category: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    caption: 'HIET campus sports arena hosting the Kangra inter-college cricket championship tournament.',
    date: 'January 2026',
    likes: 318,
    tags: ['Sports', 'Cricket', 'Athletics', 'Championship']
  },
  {
    id: 'photo-8',
    title: 'Hotel Management Commercial Training Kitchen',
    category: 'labs',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    caption: 'Students of BHM master culinary arts, bakery production, and international five-star hospitality service.',
    date: 'September 2025',
    likes: 174,
    tags: ['BHM', 'Hospitality', 'Culinary Arts', 'Gourmet Lab']
  },
  {
    id: 'photo-9',
    title: 'Campus Hackathon & 24-Hour Code Sprint',
    category: 'fest',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    caption: '50+ developer teams building full-stack AI and mobile prototypes during the Kangra Valley CodeSprint.',
    date: 'February 2026',
    likes: 364,
    tags: ['Hackathon', 'Coding', 'Web Dev', 'Innovation']
  }
];

export const CampusGalleryView: React.FC = () => {
  const { role, user } = useAuth();
  const isStaff = role === 'teacher' || role === 'hod' || role === 'admin' || role === 'principal';

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'campus' | 'labs' | 'fest' | 'placements' | 'sports'>('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [dbPhotos, setDbPhotos] = useState<GalleryPhoto[]>([]);
  const [photoLikes, setPhotoLikes] = useState<Record<string, number>>(
    GALLERY_DATA.reduce((acc, p) => ({ ...acc, [p.id]: p.likes }), {})
  );
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  // Staff Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'campus' | 'labs' | 'fest' | 'placements' | 'sports'>('campus');
  const [uploadImageUrl, setUploadImageUrl] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      const items = await apiService.getGalleryItems();
      const mapped: GalleryPhoto[] = items.map(item => ({
        id: item.id,
        title: item.title,
        category: (['campus', 'labs', 'fest', 'placements', 'sports'].includes(item.category) ? item.category : 'campus') as any,
        imageUrl: item.image_url,
        caption: item.description || item.title,
        date: item.event_date ? new Date(item.event_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent',
        likes: 180,
        tags: [item.category ? item.category.toUpperCase() : 'CAMPUS', 'Official HIET']
      }));
      setDbPhotos(mapped);
    } catch (e) {
      console.warn('Failed to load gallery data from Supabase:', e);
    }
  };

  const allPhotos = [...dbPhotos, ...GALLERY_DATA];

  const filteredPhotos = selectedCategory === 'all' 
    ? allPhotos 
    : allPhotos.filter(p => p.category === selectedCategory);

  const handleUploadMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadImageUrl.trim()) return;
    setUploading(true);

    try {
      await apiService.createGalleryItem({
        title: uploadTitle.trim(),
        description: uploadDesc.trim(),
        image_url: uploadImageUrl.trim(),
        category: uploadCategory,
        event_date: uploadDate,
        uploaded_by: user?.teacher_id || user?.id,
        status: isStaff ? 'approved' : 'pending'
      });

      alert('Campus photo published to gallery successfully!');
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadImageUrl('');
      loadGalleryData();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLiked = userLiked[id];
    setUserLiked(prev => ({ ...prev, [id]: !isLiked }));
    setPhotoLikes(prev => ({
      ...prev,
      [id]: isLiked ? (prev[id] || 0) - 1 : (prev[id] || 0) + 1
    }));
  };

  const handleShare = (photo: GalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: photo.title,
        text: `${photo.title} - Himachal Institute of Engineering & Technology (HIET Shahpur)`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${photo.title} • HIET Shahpur: ${window.location.origin}${photo.imageUrl}`);
      alert('Photo link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header & College Introduction */}
      <div className="relative rounded-3xl overflow-hidden border border-blue-500/30 shadow-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-8 lg:p-10">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/20 text-cyan-300 text-[11px] sm:text-xs font-mono font-bold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>HIET SHAHPUR OFFICIAL MEDIA HUB</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Campus Gallery & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">Social Sphere</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed">
              Explore the vibrant academic life, scenic Dhauladhar foothill campus, state-of-the-art tech laboratories, and official social media streams of <strong>Himachal Institute of Engineering & Technology, Shahpur</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 text-[11px] sm:text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Shahpur, Distt. Kangra (H.P.)</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>AICTE Approved • HPTU Affiliated</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>5,000+ Students & Alumni</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md self-center md:self-auto">
            <HietCollegeLogo size="md" variant="badge" />
            <span className="text-[10px] sm:text-[11px] font-mono text-cyan-200 mt-2 font-semibold">ESTD. 2010 • Kangra Valley</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: OFFICIAL SOCIAL MEDIA CHANNELS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span>Official College Social Media Channels</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct links to HIET Shahpur’s verified feeds, video broadcasts, and campus communities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* YouTube Channel */}
          <Card3D depth={12} className="rounded-2xl h-full">
            <a
              href="https://www.youtube.com/@hietgroupofinstitutionssha2981"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 rounded-2xl bg-gradient-to-br from-red-600/10 via-slate-900/80 to-slate-950 border border-red-500/30 hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-red-500/30 group h-full flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-115 group-hover:rotate-6 transition-all duration-300">
                    <YoutubeIcon className="w-7 h-7 animate-icon-float icon-glow-rose" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 group-hover:bg-red-500/30 transition-colors">
                    SUBSCRIBE <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white group-hover:text-red-400 transition-colors">
                  YouTube Channel
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  HIET Group of Institutions Shahpur • Annual fest recaps, lab demos, and student documentaries.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-red-300 font-semibold">
                <span>@hietgroupofinstitutions...</span>
                <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">Watch Videos →</span>
              </div>
            </a>
          </Card3D>

          {/* Facebook Official Page */}
          <Card3D depth={12} className="rounded-2xl h-full">
            <a
              href="https://www.facebook.com/people/Himachal-Institute-Of-Engineering-And-TechnologyHIET-ShahpurKangra/100083210332801/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 rounded-2xl bg-gradient-to-br from-blue-600/10 via-slate-900/80 to-slate-950 border border-blue-500/30 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 group h-full flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 group-hover:scale-115 group-hover:-rotate-6 transition-all duration-300">
                    <FacebookIcon className="w-7 h-7 animate-icon-float-delayed icon-glow-cyan" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                    FOLLOW <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white group-hover:text-blue-400 transition-colors">
                  Facebook Page
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  HIET Shahpur Kangra Official • University circulars, admission updates, and event photos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-300 font-semibold">
                <span>HIET Shahpur Official</span>
                <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">View Feed →</span>
              </div>
            </a>
          </Card3D>

          {/* Instagram Official Handle */}
          <Card3D depth={12} className="rounded-2xl h-full">
            <a
              href="https://www.instagram.com/hiet_shahpur/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 rounded-2xl bg-gradient-to-br from-pink-600/10 via-slate-900/80 to-slate-950 border border-pink-500/30 hover:border-pink-500 transition-all duration-300 shadow-lg hover:shadow-pink-500/30 group h-full flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-600/40 group-hover:scale-115 group-hover:rotate-12 transition-all duration-300">
                    <InstagramIcon className="w-7 h-7 animate-icon-wiggle icon-glow-purple" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 group-hover:bg-pink-500/30 transition-colors">
                    REELS <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white group-hover:text-pink-400 transition-colors">
                  Instagram Hub
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  @hiet_shahpur • Student reels, mountain photography, campus fests, and campus stories.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-pink-300 font-semibold">
                <span>@hiet_shahpur</span>
                <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">Explore Reels →</span>
              </div>
            </a>
          </Card3D>

          {/* Official College Portal & Helpline */}
          <Card3D depth={12} className="rounded-2xl h-full">
            <a
              href="http://hiet.co.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 rounded-2xl bg-gradient-to-br from-emerald-600/10 via-slate-900/80 to-slate-950 border border-emerald-500/30 hover:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 group h-full flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 group-hover:scale-115 group-hover:rotate-6 transition-all duration-300">
                    <Globe className="w-7 h-7 animate-spin-slow icon-glow-emerald" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
                    PORTAL <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors">
                  Official Website
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  hiet.co.in • Online admissions, syllabus download, faculty roster, and anti-ragging cell.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span>Helpline: 88945-19999</span>
                <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">Visit Site →</span>
              </div>
            </a>
          </Card3D>
        </div>
      </div>

      {/* SECTION 2: PHOTO GALLERY & CAMPUS HIGHLIGHTS */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Campus Photography & Event Highlights</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-definition snapshots of student life, labs, sports, and fest celebrations at HIET Shahpur.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({allPhotos.length})
            </button>
            <button
              onClick={() => setSelectedCategory('campus')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'campus'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏔️ Campus
            </button>
            <button
              onClick={() => setSelectedCategory('labs')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'labs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              💻 Tech & Labs
            </button>
            <button
              onClick={() => setSelectedCategory('fest')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'fest'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎭 Fests & Events
            </button>
            <button
              onClick={() => setSelectedCategory('placements')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'placements'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎓 Placements
            </button>
            <button
              onClick={() => setSelectedCategory('sports')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'sports'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏆 Sports
            </button>
          </div>

          {isStaff && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs active:scale-95 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Campus Photo</span>
            </button>
          )}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map(photo => (
            <Card3D key={photo.id} depth={10} className="rounded-3xl h-full">
              <div 
                onClick={() => setLightboxPhoto(photo)}
                className="group cursor-pointer rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all flex flex-col h-full relative"
              >
                {/* Photo Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Category Pill Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 text-cyan-300 border border-cyan-400/40 backdrop-blur-md uppercase tracking-wider">
                      {photo.category}
                    </span>
                  </div>

                  {/* Date badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-black/60 text-slate-300 backdrop-blur-md">
                      {photo.date}
                    </span>
                  </div>

                  {/* Hover Quick Zoom Trigger Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="p-3 rounded-full bg-blue-600/90 text-white shadow-xl backdrop-blur-md transform scale-75 group-hover:scale-100 transition-transform">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Photo Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {photo.caption}
                    </p>
                  </div>

                  {/* Tags & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleLike(photo.id, e)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          userLiked[photo.id]
                            ? 'bg-rose-500/20 text-rose-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500'
                        }`}
                        title="Like photo"
                      >
                        <Heart className={`w-3.5 h-3.5 ${userLiked[photo.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{photoLikes[photo.id]}</span>
                      </button>

                      <button
                        onClick={(e) => handleShare(photo, e)}
                        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition"
                        title="Share photo"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* SECTION 3: CAMPUS INFORMATION & CONTACT FOOTER CARDS */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900/60 border border-blue-500/20 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Campus Address</span>
            </h4>
            <p className="leading-relaxed">
              Himachal Institute of Engineering & Technology (HIET)<br />
              Vidyanagar, Village Shahpur, Tehsil Shahpur<br />
              District Kangra, Himachal Pradesh – 176223, India
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Official Helplines</span>
            </h4>
            <p className="leading-relaxed font-mono">
              Admission Helpline: +91-88945-19999<br />
              Student Support: +91-98055-04552<br />
              Anti-Ragging 24x7 Toll Free: 1800-180-5522
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Official Email & Web</span>
            </h4>
            <p className="leading-relaxed">
              Admissions: admission@hiet.co.in<br />
              Administration: info@hiet.co.in<br />
              Official Portal: <a href="http://hiet.co.in" target="_blank" rel="noreferrer" className="text-cyan-300 underline">hiet.co.in</a>
            </p>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div 
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
          >
            {/* Modal Top Bar */}
            <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {lightboxPhoto.title}
                </h3>
                <p className="text-xs text-slate-400">
                  HIET Shahpur • {lightboxPhoto.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleLike(lightboxPhoto.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                >
                  <Heart className={`w-4 h-4 ${userLiked[lightboxPhoto.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{photoLikes[lightboxPhoto.id]}</span>
                </button>

                <a
                  href={lightboxPhoto.imageUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Download / View HD"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Area */}
            <div className="relative bg-black max-h-[65vh] flex items-center justify-center overflow-hidden">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Modal Caption & Details */}
            <div className="p-5 sm:p-6 bg-slate-900 border-t border-slate-800 space-y-2">
              <p className="text-sm text-slate-200 leading-relaxed">
                {lightboxPhoto.caption}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {lightboxPhoto.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-cyan-300 font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Upload Moment Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Publish Official Campus Moment
                </h3>
                <p className="text-xs text-slate-500">
                  Authorized Faculty / Staff Media Publisher
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadMoment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Moment / Event Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Annual Tech Symposium & Project Expo 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="campus">🏔️ Campus & Infrastructure</option>
                    <option value="labs">💻 Tech & Laboratories</option>
                    <option value="fest">🎭 Fests & Cultural Events</option>
                    <option value="placements">🎓 Placements & Convocation</option>
                    <option value="sports">🏆 Sports & Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={e => setUploadDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Caption</label>
                <textarea
                  rows={3}
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  placeholder="Highlight key achievements, student participants, or event details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo Image URL *</label>
                <input
                  type="url"
                  required
                  value={uploadImageUrl}
                  onChange={e => setUploadImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded CDN image link"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {uploading ? 'Publishing...' : 'Publish to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
