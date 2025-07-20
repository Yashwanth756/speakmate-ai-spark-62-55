import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoadmapBackButton = () => {
  const navigate = useNavigate();
  const showBackButton = localStorage.getItem('showRoadmapBackButton') === 'true';

  if (!showBackButton) return null;

  const handleBackToRoadmap = () => {
    localStorage.removeItem('showRoadmapBackButton');
    navigate('/skill-assessment');
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBackToRoadmap}
        className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border-2 hover:bg-primary/10 hover:border-primary/50 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Roadmap
      </Button>
    </div>
  );
};

export default RoadmapBackButton;