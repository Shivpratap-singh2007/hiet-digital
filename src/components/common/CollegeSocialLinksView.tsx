import React from 'react';
import { Globe, ExternalLink, Share2, ShieldCheck } from 'lucide-react';
import { dataStore } from '../../lib/mockData';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-pink-600' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-blue-700' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-red-600' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export const CollegeSocialLinksView: React.FC = () => {
  const socialLinks = dataStore.getSocialLinks();

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Official Website':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'Instagram':
        return <InstagramIcon className="w-5 h-5 text-pink-600" />;
      case 'Facebook':
        return <FacebookIcon className="w-5 h-5 text-blue-700" />;
      case 'YouTube':
        return <YoutubeIcon className="w-5 h-5 text-red-600" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          <span>Official HIET Digital Presence</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified official communication channels and media handles of HIET Shahpur
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {socialLinks.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                {getPlatformIcon(link.platform)}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {link.platform}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {link.handle}
                </p>
              </div>
            </div>

            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </a>
        ))}
      </div>

      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
        <span>All links above are authenticated official college communication handles approved by HIET administration.</span>
      </div>
    </div>
  );
};
