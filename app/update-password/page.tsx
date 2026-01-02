'use client'

import { updatePassword } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Handle implicit flow (hash tokens) from invite link
    const handleHash = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Parse params from hash
        const params = new URLSearchParams(hash.substring(1)) // remove #
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (!error) {
            // Clean URL
            router.replace('/update-password')
          }
        }
      }
    }
    handleHash()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Set Your Password
          </h1>
          <p className="text-gray-400 text-sm">Please create a secure password for your account.</p>
        </div>

        <form 
          action={async (formData) => {
            const res = await updatePassword(formData)
            if (res?.error) alert(res.error)
          }} 
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1" htmlFor="password">
              New Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            Set Password & Continue
          </button>
        </form>
      </div>
    </div>
  )
}
