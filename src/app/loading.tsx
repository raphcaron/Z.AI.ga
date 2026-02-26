export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
            <div className="w-24 h-6 rounded bg-muted animate-pulse" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className="w-16 h-4 rounded bg-muted animate-pulse" />
            <div className="w-20 h-4 rounded bg-muted animate-pulse" />
            <div className="w-14 h-4 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-9 rounded-full bg-muted animate-pulse" />
            <div className="w-24 h-9 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Skeleton */}
        <section className="relative overflow-hidden bg-gradient-to-b from-accent/30 to-background">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-48 h-6 rounded-full bg-muted animate-pulse mx-auto mb-6" />
              <div className="space-y-4 mb-10">
                <div className="w-3/4 h-12 md:h-16 rounded bg-muted animate-pulse mx-auto" />
                <div className="w-1/2 h-12 md:h-16 rounded bg-muted animate-pulse mx-auto" />
              </div>
              <div className="w-full max-w-2xl h-6 rounded bg-muted animate-pulse mx-auto mb-10" />
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="w-36 h-11 rounded-full bg-muted animate-pulse" />
                <div className="w-36 h-11 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Live Sessions Skeleton */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="w-24 h-6 rounded-full bg-muted animate-pulse mb-3" />
                <div className="w-40 h-8 rounded bg-muted animate-pulse mb-2" />
                <div className="w-64 h-5 rounded bg-muted animate-pulse" />
              </div>
              <div className="w-36 h-10 rounded-full bg-muted animate-pulse" />
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-card border border-border/50 overflow-hidden p-0">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="w-3/4 h-5 rounded bg-muted animate-pulse" />
                    <div className="w-1/2 h-4 rounded bg-muted animate-pulse" />
                    <div className="flex gap-2">
                      <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                      <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="w-full h-10 rounded-xl bg-muted animate-pulse mt-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Classes Skeleton */}
        <section className="py-16 md:py-20 bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="w-24 h-6 rounded-full bg-muted animate-pulse mb-3" />
                <div className="w-40 h-8 rounded bg-muted animate-pulse mb-2" />
                <div className="w-64 h-5 rounded bg-muted animate-pulse" />
              </div>
              <div className="w-36 h-10 rounded-full bg-muted animate-pulse" />
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-card border border-border/50 overflow-hidden p-0">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="w-3/4 h-5 rounded bg-muted animate-pulse" />
                    <div className="flex gap-2">
                      <div className="w-20 h-5 rounded-full bg-muted animate-pulse" />
                      <div className="w-12 h-5 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="w-1/2 h-4 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
              <div className="w-24 h-5 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="w-20 h-4 rounded bg-muted animate-pulse" />
              <div className="w-20 h-4 rounded bg-muted animate-pulse" />
              <div className="w-20 h-4 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
