import { Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-dark-900 border-b border-dark-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Prompt Punk
            </h1>
            <p className="text-dark-400 text-sm">
              AI-powered prompt engineering platform
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
