import { useParams, Link } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { Loader2, Clock, User, Calendar, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'

export function Session() {
  const { slug } = useParams()

  const { data: session, isLoading, error } = trpc.session.getBySlug.useQuery({
    slug: slug || '',
  })

  const { data: relatedSessions } = trpc.session.getAll.useQuery({ limit: 4 })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Session not found</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Video Player */}
      <div className="aspect-video w-full bg-black relative">
        {session.video_url ? (
          <video
            src={session.video_url}
            controls
            className="w-full h-full"
            poster={session.thumbnail || undefined}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Video coming soon</p>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title & Info */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{session.title}</h1>
              {session.description && (
                <p className="text-muted-foreground mb-4">{session.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {session.duration} min
                </span>
                <Badge variant="secondary" className="capitalize">
                  {session.difficulty}
                </Badge>
                {session.instructor && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {session.instructor}
                  </span>
                )}
                {session.live_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(session.live_at), 'MMM d, yyyy h:mm a')}
                  </span>
                )}
              </div>
            </div>

            {/* Category & Theme */}
            {(session.category || session.theme) && (
              <div className="flex gap-2 mb-6">
                {session.category && (
                  <Badge variant="outline">{session.category.name}</Badge>
                )}
                {session.theme && (
                  <Badge 
                    variant="outline" 
                    style={{ borderColor: session.theme.color || undefined }}
                  >
                    {session.theme.name}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - More Classes */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">More Classes</h3>
                <div className="space-y-3">
                  {relatedSessions?.sessions
                    ?.filter((s: any) => s.id !== session.id)
                    ?.slice(0, 4)
                    .map((s: any) => (
                      <Link key={s.id} to={`/session/${s.slug}`}>
                        <div className="flex gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {s.thumbnail ? (
                              <img 
                                src={s.thumbnail} 
                                alt={s.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{s.title}</p>
                            <p className="text-xs text-muted-foreground">{s.duration} min</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
