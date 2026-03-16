import { trpc } from '@/lib/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, User } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Home() {
  const { data, isLoading, error } = trpc.session.getAll.useQuery({ limit: 8 })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-destructive">
          <p>Failed to load sessions</p>
        </div>
      </div>
    )
  }

  const sessions = data?.sessions || []

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to Yoga Flow
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your journey to wellness starts here. Discover yoga classes for all levels.
        </p>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sessions.map((session: any) => (
          <Link key={session.id} to={`/session/${session.slug}`}>
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden bg-muted">
                {session.thumbnail ? (
                  <img 
                    src={session.thumbnail} 
                    alt={session.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {session.duration} min
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                  {session.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.duration} min
                  </span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {session.difficulty}
                  </Badge>
                  {session.instructor && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {session.instructor}
                    </span>
                  )}
                </div>
                {session.category && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {session.category.name}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No sessions available yet. Check back soon!</p>
        </div>
      )}
    </div>
  )
}
