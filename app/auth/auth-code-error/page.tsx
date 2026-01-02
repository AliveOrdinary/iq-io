import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-red-500">Authentication Error</h1>
        <p className="text-gray-400">
          There was a problem verifying your login link. It may have expired or already been used.
        </p>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-left break-all text-gray-500">
          <p>Please try:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Requesting a new invite/password reset</li>
            <li>Checking if you are already logged in</li>
            <li>Contacting your administrator</li>
          </ul>
        </div>
        <Link 
          href="/login" 
          className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
