import React from 'react'

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Prompt Punk
              </h1>
              <p className="text-sm text-gray-600">
                The Rebellious AI Prompt Enhancement Platform
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  )
} 