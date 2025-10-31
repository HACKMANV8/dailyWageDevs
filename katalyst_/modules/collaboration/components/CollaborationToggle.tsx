// modules/collaboration/components/CollaborationToggle.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CollaborationToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const CollaborationToggle: React.FC<CollaborationToggleProps> = ({
  isEnabled,
  onToggle
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={isEnabled ? "default" : "outline"}
            onClick={() => onToggle(!isEnabled)}
          >
            {isEnabled ? (
              <Users className="h-4 w-4" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isEnabled ? 'Disable Collaboration' : 'Enable Collaboration'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};