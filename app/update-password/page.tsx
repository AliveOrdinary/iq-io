'use client'

import { updatePassword } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (!error) {
            router.replace('/update-password')
          }
        }
      }
    }
    handleHash()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm p-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Set Your Password
          </h1>
          <p className="text-[#666] text-sm mt-1">Create a secure password for your account</p>
        </div>

        <form 
          action={async (formData) => {
            const res = await updatePassword(formData)
            if (res?.error) {
              showToast(res.error, 'error')
            }
          }} 
          className="space-y-4"
        >
          <div>
            <label className="block text-sm text-[#666] mb-1.5" htmlFor="password">
              New Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-[#666] mb-1.5" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary mt-6 py-2.5"
          >
            Set Password & Continue
          </button>
        </form>
      </div>
    </div>
  )
}
