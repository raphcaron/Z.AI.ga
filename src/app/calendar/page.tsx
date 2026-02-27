'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/yoga/navigation';
import { Footer } from '@/components/yoga/footer';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  User,
  Video,
  RadioTower,
  Play,
  ArrowRight,
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay, isAfter } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ScheduledSession {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: number;
  difficulty: string;
  instructor: string | null;
  liveAt: string;
  isLive: boolean;
  category: { name: string } | null;
  theme: { name: string; color: string | null } | null;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CalendarPage() {
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const res = await fetch('/api/sessions/live');
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  // Get sessions for selected date
  const sessionsOnSelectedDate = selectedDate
    ? sessions.filter((session) => isSameDay(parseISO(session.liveAt), selectedDate))
    : [];

  // Get dates that have sessions for calendar highlights
  const sessionDates = sessions.map((s) => startOfDay(parseISO(s.liveAt)));

  // Get upcoming sessions (next 7 days)
  const upcomingSessions = sessions
    .filter((s) => isAfter(parseISO(s.liveAt), new Date()))
    .sort((a, b) => new Date(a.liveAt).getTime() - new Date(b.liveAt).getTime())
    .slice(0, 10);

  const handleSessionClick = (session: ScheduledSession) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="py-8 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Class Schedule</h1>
            </div>
            <p className="text-muted-foreground">
              View upcoming live sessions and scheduled classes
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-1">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Select Date</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      modifiers={{
                        hasSession: sessionDates,
                      }}
                      modifiersClassNames={{
                        hasSession: 'calendar-session-dot',
                      }}
                      className="rounded-xl border p-4"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sessions for selected date */}
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Selected Date Sessions */}
                    <Card className="rounded-3xl mb-8">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                        </CardTitle>
                        <CardDescription>
                          {sessionsOnSelectedDate.length} session{sessionsOnSelectedDate.length !== 1 ? 's' : ''} scheduled
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sessionsOnSelectedDate.length === 0 ? (
                          <div className="text-center py-8">
                            <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No sessions scheduled for this date</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sessionsOnSelectedDate.map((session) => (
                              <div
                                key={session.id}
                                onClick={() => handleSessionClick(session)}
                                className="flex gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                              >
                                {/* Thumbnail */}
                                <div className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/20">
                                  {session.thumbnail ? (
                                    <img
                                      src={session.thumbnail}
                                      alt={session.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {session.isLive ? (
                                        <RadioTower className="w-8 h-8 text-red-500" />
                                      ) : (
                                        <Play className="w-8 h-8 text-primary/30" />
                                      )}
                                    </div>
                                  )}
                                  {session.isLive && (
                                    <div className="absolute top-2 left-2">
                                      <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                        LIVE
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold mb-1 line-clamp-1">{session.title}</h3>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs rounded-full ${difficultyColors[session.difficulty] || ''}`}
                                    >
                                      {session.difficulty}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(parseISO(session.liveAt), 'h:mm a')}
                                    </span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Video className="w-3 h-3" />
                                      {session.duration} min
                                    </span>
                                  </div>
                                  {session.instructor && (
                                    <p className="text-sm text-muted-foreground">
                                      with <span className="text-foreground font-medium">{session.instructor}</span>
                                    </p>
                                  )}
                                </div>

                                <ArrowRight className="w-5 h-5 text-muted-foreground self-center" />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Upcoming Sessions Quick View */}
                    <Card className="rounded-3xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <RadioTower className="w-5 h-5 text-primary" />
                          Upcoming Sessions
                        </CardTitle>
                        <CardDescription>
                          Next scheduled classes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {upcomingSessions.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
                        ) : (
                          <div className="space-y-3">
                            {upcomingSessions.map((session) => (
                              <div
                                key={session.id}
                                onClick={() => handleSessionClick(session)}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors"
                              >
                                <div className="text-center min-w-[50px]">
                                  <p className="text-sm font-semibold">
                                    {format(parseISO(session.liveAt), 'MMM d')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(parseISO(session.liveAt), 'h:mm a')}
                                  </p>
                                </div>
                                <Separator orientation="vertical" className="h-10" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1">{session.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {session.instructor && `with ${session.instructor}`}
                                  </p>
                                </div>
                                {session.isLive && (
                                  <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                    LIVE
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Session Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedSession.title}</DialogTitle>
                <DialogDescription>
                  {selectedSession.description || 'Join this yoga session for a transformative practice.'}
                </DialogDescription>
              </DialogHeader>

              {/* Thumbnail */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/20">
                {selectedSession.thumbnail ? (
                  <img
                    src={selectedSession.thumbnail}
                    alt={selectedSession.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-16 h-16 text-primary/30" />
                  </div>
                )}
                {selectedSession.isLive && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <RadioTower className="w-3 h-3 mr-1" />
                      LIVE NOW
                    </Badge>
                  </div>
                )}
              </div>

              {/* Session Details */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge
                    variant="secondary"
                    className={`rounded-full ${difficultyColors[selectedSession.difficulty] || ''}`}
                  >
                    {selectedSession.difficulty}
                  </Badge>
                  {selectedSession.category && (
                    <Badge variant="outline" className="rounded-full">
                      {selectedSession.category.name}
                    </Badge>
                  )}
                  {selectedSession.theme && (
                    <Badge
                      variant="outline"
                      className="rounded-full"
                      style={{ borderColor: selectedSession.theme.color || undefined }}
                    >
                      {selectedSession.theme.name}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(parseISO(selectedSession.liveAt), 'EEEE, MMMM d')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(parseISO(selectedSession.liveAt), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Video className="w-4 h-4" />
                    <span>{selectedSession.duration} minutes</span>
                  </div>
                  {selectedSession.instructor && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{selectedSession.instructor}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Link href={`/live/${selectedSession.id}`} className="flex-1">
                    <Button className="w-full rounded-xl">
                      {selectedSession.isLive ? (
                        <>
                          <RadioTower className="w-4 h-4 mr-2" />
                          Join Live Session
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          View Session
                        </>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
