import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 150)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-950 select-none">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-brand-600/5 to-transparent rounded-full animate-pulse-soft" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-600/5 to-transparent rounded-full animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo & Brand */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" />
            <path d="M8 11h8" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-bold mb-1">
          <span className="gradient-text">Vaahan</span>
          <span className="text-white">Books</span>
        </h1>
        <p className="text-surface-500 text-sm mb-8">Billing & Accounting Software</p>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-surface-600 text-xs mt-3">
          {progress < 30 ? 'Initializing database...' :
           progress < 60 ? 'Loading modules...' :
           progress < 90 ? 'Checking license...' :
           'Ready!'}
        </p>
      </div>

      {/* Version */}
      <p className="absolute bottom-6 text-surface-700 text-xs">v1.0.0</p>
    </div>
  )
}
