import React, { useState, useEffect } from 'react';
import {
  AiFeatureConfig,
  AI_FEATURES,
  getAiFeatureByKey,
  getAiFeatureByRoute
} from '../../config/aiFeatures';
import { AiCampusOverviewPage } from './AiCampusOverviewPage';
import { AiFeatureComingSoonPage } from './AiFeatureComingSoonPage';
import { NavTab } from '../../components/common/Sidebar';

interface Props {
  currentTab?: NavTab;
  onNavigateTab?: (tab: NavTab) => void;
  initialFeatureKey?: string;
}

export const AiCampusView: React.FC<Props> = ({
  currentTab,
  onNavigateTab,
  initialFeatureKey
}) => {
  const [selectedFeature, setSelectedFeature] = useState<AiFeatureConfig | null>(() => {
    if (initialFeatureKey) {
      return getAiFeatureByKey(initialFeatureKey) || null;
    }
    // Check window.location.pathname if available
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/app/ai/')) {
        return getAiFeatureByRoute(path) || null;
      }
    }
    return null;
  });

  // Listen to tab changes
  useEffect(() => {
    if (currentTab && currentTab.startsWith('ai_') && currentTab !== 'ai_campus') {
      const featureKey = currentTab.replace('ai_', '');
      const feat =
        AI_FEATURES.find(
          f =>
            f.key === featureKey ||
            f.key.replace(/_/g, '') === featureKey.replace(/_/g, '')
        ) || null;
      if (feat) {
        setSelectedFeature(feat);
      }
    } else if (currentTab === 'ai_campus') {
      // If returning to main overview tab
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!path.startsWith('/app/ai/')) {
        setSelectedFeature(null);
      }
    }
  }, [currentTab]);

  const handleSelectFeature = (feat: AiFeatureConfig) => {
    setSelectedFeature(feat);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', feat.route);
    }
  };

  const handleBackToOverview = () => {
    setSelectedFeature(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/app/ai');
    }
    if (onNavigateTab) {
      onNavigateTab('ai_campus');
    }
  };

  if (selectedFeature) {
    return (
      <AiFeatureComingSoonPage
        feature={selectedFeature}
        onBack={handleBackToOverview}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <AiCampusOverviewPage
      onSelectFeature={handleSelectFeature}
      onNavigateTab={onNavigateTab}
    />
  );
};
