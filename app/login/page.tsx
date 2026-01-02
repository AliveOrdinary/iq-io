'use client'

import { login } from './actions'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            IQ <span className="text-blue-500">Automations</span>
          </h1>
          <p className="text-gray-400 text-sm">Sign in to your account to clock in/out</p>
        </div>

        <form 
          action={async (formData) => {
            const result = await login(formData);
            if (result?.error) {
              alert(result.error);
            }
          }} 
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@iqautomations.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} IQ Automations. All rights reserved.
        </p>
      </div>
    </div>
  )
}
