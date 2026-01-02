import { createClient } from '@/lib/supabase/server'
import ReportExport from '@/components/admin/ReportExport'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string }
}) {
  const supabase = await createClient()

  const from = searchParams.from || format(new Date(), 'yyyy-MM-dd')
  const to = searchParams.to || format(new Date(), 'yyyy-MM-dd')

  // Fetch all profiles and their time entries for the period
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      role,
      hourly_rate,
      time_entries (
        hours_worked,
        clock_in
      )
    `)
    .neq('role', 'super_admin') // Filter out super admins

  // Process data for reports
  const reportData = (profiles || []).map(p => {
    const periodEntries = (p.time_entries || []).filter(e => {
      const entryDate = format(new Date(e.clock_in), 'yyyy-MM-dd')
      return entryDate >= from && entryDate <= to
    })

    const totalHours = periodEntries.reduce((acc, curr) => acc + (curr.hours_worked || 0), 0)
    const rate = p.hourly_rate || 0
    
    return {
      name: p.name || 'Unknown',
      email: p.email,
      role: p.role,
      hourly_rate: rate,
      total_hours: totalHours,
      gross_pay: totalHours * rate
    }
  })

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Payroll Reports</h2>
          <p className="text-gray-500 mt-1">Generate and export employee payroll data.</p>
        </div>
        
        <ReportExport data={reportData} dateRange={{ from, to }} />
      </header>

      {/* Date Filter Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <form className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Start Date</label>
            <input 
              name="from" 
              type="date" 
              defaultValue={from}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">End Date</label>
            <input 
              name="to" 
              type="date" 
              defaultValue={to}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/5">
            Filter Results
          </button>
        </form>
      </div>

      {/* Report Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl text-sm">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Summary for {from} to {to}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-bold">Employee</th>
                <th className="px-6 py-4 font-bold">Hourly Rate</th>
                <th className="px-6 py-4 font-bold">Total Hours</th>
                <th className="px-6 py-4 font-bold text-right">Gross Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reportData.map((row) => (
                <tr key={row.email} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="text-xs text-gray-500">{row.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">
                    ${row.hourly_rate.toFixed(2)}/hr
                  </td>
                  <td className="px-6 py-4 font-mono text-blue-400">
                    {row.total_hours.toFixed(2)} hrs
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-white">
                      ${row.gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                    No data found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot className="bg-white/[0.02]">
                <tr>
                  <td colSpan={3} className="px-6 py-6 font-bold text-gray-400 text-right uppercase tracking-widest text-xs">Total Payroll</td>
                  <td className="px-6 py-6 text-right font-bold text-2xl text-blue-500">
                    ${reportData.reduce((acc, curr) => acc + curr.gross_pay, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
