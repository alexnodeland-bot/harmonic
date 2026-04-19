import React from 'react';
import '../styles/PatchCardSkeleton.css';

export const PatchCardSkeleton: React.FC = () => {
  return (
    <div className="patch-card-skeleton animate-skeleton-pulse">
      <div className="skeleton-header">
        <div className="skeleton-rank" />
        <div className="skeleton-fitness" />
      </div>
      <div className="skeleton-info">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
      <div className="skeleton-buttons">
        <div className="skeleton-button" />
        <div className="skeleton-button" />
      </div>
    </div>
  );
};

export default PatchCardSkeleton;
