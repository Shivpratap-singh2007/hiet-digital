import React, { useEffect } from 'react';
import { navigateTo } from '../../lib/appNavigation';

/**
 * Campus Gallery & Social Sphere has been decommissioned as requested.
 * Safe fallback component that gracefully redirects to home dashboard.
 */
export const CampusGalleryView: React.FC = () => {
  useEffect(() => {
    navigateTo('dashboard');
  }, []);

  return null;
};

export default CampusGalleryView;
