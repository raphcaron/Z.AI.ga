import { useState } from 'react'

export function Auth() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="border rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-xl bg-background"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-xl bg-background"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-primary text-primary-foreground rounded-xl"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
