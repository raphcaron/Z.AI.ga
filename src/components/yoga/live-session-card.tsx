'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Users, Clock, Calendar, Bell } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface LiveSessionCardProps {
  session: {
    id: string;
    title: string;
    instructor: string;
    scheduledAt: string;
    thumbnail: string | null;
    isLive: boolean;
    viewerCount?: number;
  };
}

export function LiveSessionCard({ session }: LiveSessionCardProps) {
  const scheduledDate = new Date(session.scheduledAt);
  const isToday = format(scheduledDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
  const cardContent = (
    <Card className={`group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-card p-0 ${session.isLive ? 'cursor-pointer' : ''}`}>
      <div className="relative aspect-video overflow-hidden rounded-t-2xl">
        {/* Thumbnail */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30">
          {session.thumbnail ? (
            <img 
              src={session.thumbnail} 
              alt={session.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-primary/40" />
            </div>
          )}
        </div>
        
        {/* Live badge */}
        {session.isLive && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1.5 px-3 py-1 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" />
              LIVE
            </Badge>
          </div>
        )}

        {/* Viewer count */}
        {session.isLive && session.viewerCount && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-black/60 text-white border-0">
              <Users className="w-3.5 h-3.5" />
              {session.viewerCount} watching
            </Badge>
          </div>
        )}

        {/* Scheduled time badge for upcoming */}
        {!session.isLive && (
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-black/60 text-white border-0">
              <Calendar className="w-3.5 h-3.5" />
              {isToday ? 'Today' : format(scheduledDate, 'MMM d')}
            </Badge>
          </div>
        )}

        {/* Play button overlay */}
        {session.isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 rounded-full bg-red-500/90 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-7 h-7 text-white ml-1" />
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
          {session.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          with {session.instructor}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{isToday ? 'Today' : format(scheduledDate, 'MMM d')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{format(scheduledDate, 'h:mm a')}</span>
          </div>
        </div>

        {session.isLive ? (
          <Button className="w-full mt-4 rounded-xl bg-red-500 hover:bg-red-600 text-white">
            <Play className="w-4 h-4 mr-2" />
            Join Live Session
          </Button>
        ) : (
          <Button 
            variant="outline"
            className="w-full mt-4 rounded-xl gap-2"
          >
            <Bell className="w-4 h-4" />
            Set Reminder
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (session.isLive) {
    return (
      <Link href={`/live/${session.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
