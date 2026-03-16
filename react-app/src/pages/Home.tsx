export function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">Welcome to Yoga Flow</h1>
      <p className="text-muted-foreground mb-8">
        Your journey to wellness starts here. Discover yoga classes for all levels.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Session cards will be rendered here */}
        <div className="p-6 rounded-2xl bg-muted/50">
          <div className="aspect-video bg-muted rounded-xl mb-4" />
          <h3 className="font-semibold mb-2">Sample Session</h3>
          <p className="text-sm text-muted-foreground">45 min • Beginner</p>
        </div>
      </div>
    </div>
  )
}
