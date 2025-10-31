// modules/collaboration/components/ActiveUsers.tsx
"use client";

import React from 'react';
import { useYjs } from '../providers/YjsProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ActiveUsers: React.FC = () => {
  const { activeUsers, isConnected } = useYjs();

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="flex items-center gap-1.5"
            >
              {isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnected ? 'Collaborative editing active' : 'Collaborative editing inactive'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Active Users Count */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}
          </span>
        </div>
      )}

      {/* User Avatars */}
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 5).map((user) => (
          <TooltipProvider key={user.clientId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback 
                    style={{ backgroundColor: user.color }}
                    className="text-white text-xs font-semibold"
                  >
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {activeUsers.length > 5 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    +{activeUsers.length - 5}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{activeUsers.length - 5} more users</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};