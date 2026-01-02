'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { format } from 'date-fns'

type ReportEntry = {
  name: string
  email: string
  role: string
  hourly_rate: number
  total_hours: number
  gross_pay: number
}

export default function ReportExport({ data, dateRange }: { data: ReportEntry[], dateRange: { from: string, to: string } }) {
  const [loading, setLoading] = useState(false)

  const downloadCSV = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payroll_report_${dateRange.from}_to_${dateRange.to}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadPDF = () => {
    const doc = new jsPDF() as any
    
    // Header
    doc.setFontSize(22)
    doc.setTextColor(37, 99, 235) // Blue-600
    doc.text('IQ Automations', 15, 20)
    
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Payroll Report: ${dateRange.from} to ${dateRange.to}`, 15, 28)
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 15, 34)

    // Table
    const tableData = data.map(row => [
      row.name,
      row.role,
      `$${row.hourly_rate.toFixed(2)}`,
      `${row.total_hours.toFixed(2)}`,
      `$${row.gross_pay.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Employee', 'Role', 'Rate', 'Hours', 'Gross Pay']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { top: 45 },
    })

    // Totals
    const totalPay = data.reduce((acc, curr) => acc + curr.gross_pay, 0)
    const finalY = (doc as any).lastAutoTable.finalY || 150
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(`Total Payroll: $${totalPay.toFixed(2)}`, 15, finalY + 15)

    doc.save(`payroll_report_${dateRange.from}_to_${dateRange.to}.pdf`)
  }

  return (
    <div className="flex gap-4">
      <button 
        onClick={downloadCSV}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
      >
        Export CSV
      </button>
      <button 
        onClick={downloadPDF}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
      >
        Download PDF
      </button>
    </div>
  )
}
