export function Settings() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <p className="text-muted-foreground">Profile settings will be here...</p>
        </div>

        {/* Favorites Section */}
        <div className="border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Favorites</h2>
          <p className="text-muted-foreground">Your favorite sessions will appear here...</p>
        </div>
      </div>
    </div>
  )
}
