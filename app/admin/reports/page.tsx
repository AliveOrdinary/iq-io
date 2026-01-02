import { createClient } from '@/lib/supabase/server'
import ReportExport from '@/components/admin/ReportExport'
import { format } from 'date-fns'

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
    .neq('role', 'super_admin')

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
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Payroll Reports</h2>
          <p className="text-[#666] text-sm mt-0.5">Generate and export payroll data</p>
        </div>
        
        <ReportExport data={reportData} dateRange={{ from, to }} />
      </header>

      {/* Date Filter */}
      <div className="card p-4">
        <form className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Start Date</label>
            <input 
              name="from" 
              type="date" 
              defaultValue={from}
              className="w-auto"
            />
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">End Date</label>
            <input 
              name="to" 
              type="date" 
              defaultValue={to}
              className="w-auto"
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Report Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#222]">
          <h3 className="font-medium text-white">Summary: {from} to {to}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Rate</th>
                <th>Hours</th>
                <th className="text-right">Gross Pay</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.email}>
                  <td>
                    <div className="font-medium text-white">{row.name}</div>
                    <div className="text-xs text-[#666]">{row.email}</div>
                  </td>
                  <td className="font-mono text-[#999]">
                    ${row.hourly_rate.toFixed(2)}/hr
                  </td>
                  <td className="font-mono text-accent">
                    {row.total_hours.toFixed(2)}h
                  </td>
                  <td className="text-right">
                    <span className="font-semibold text-white">
                      ${row.gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#666]">
                    No data for selected period
                  </td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot className="bg-[#0a0a0a]">
                <tr>
                  <td colSpan={3} className="text-right text-xs text-[#666] uppercase tracking-wide font-medium">
                    Total Payroll
                  </td>
                  <td className="text-right font-bold text-xl text-accent">
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
