import { useParams } from 'react-router-dom'

export function Session() {
  const { slug } = useParams()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Video Player */}
        <div className="aspect-video bg-muted rounded-2xl mb-6 flex items-center justify-center">
          <p className="text-muted-foreground">Video Player - Session: {slug}</p>
        </div>

        {/* Session Info */}
        <h1 className="text-3xl font-bold mb-2">Session Title</h1>
        <p className="text-muted-foreground mb-6">
          Session description will appear here...
        </p>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>45 min</span>
          <span>•</span>
          <span>Beginner</span>
          <span>•</span>
          <span>Instructor Name</span>
        </div>
      </div>
    </div>
  )
}
