'use client'

import { useState } from 'react'
import { login } from './actions'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      const result = await login(formData)
      if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch (e) {
      // Next.js redirects throw NEXT_REDIRECT errors - don't show toast for those
      if (e && typeof e === 'object' && 'digest' in e && String((e as any).digest).includes('NEXT_REDIRECT')) {
        return // This is a successful redirect, not an error
      }
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm p-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            IQ Automations
          </h1>
          <p className="text-[#666] text-sm mt-1">Sign in to clock in/out</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#666] mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@iqautomations.com"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-[#666] mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary mt-6 py-2.5"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-[#444] text-xs">
          &copy; {new Date().getFullYear()} IQ Automations
        </p>
      </div>
    </div>
  )
}
