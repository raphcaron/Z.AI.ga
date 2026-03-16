export function Admin() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage videos, live sessions, and users</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">
          Add Video
        </button>
      </div>

      {/* Tabs placeholder */}
      <div className="border rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Videos</h2>
        <p className="text-muted-foreground">Video management will be implemented here...</p>
      </div>
    </div>
  )
}
