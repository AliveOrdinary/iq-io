-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Auto clock-out function
CREATE OR REPLACE FUNCTION public.auto_clock_out_all()
RETURNS void AS $$
DECLARE
  entry_record RECORD;
  now_time TIMESTAMP WITH TIME ZONE := NOW();
  end_time_val TEXT;
BEGIN
  -- Get the configured end time from settings
  SELECT value->>'end' INTO end_time_val FROM public.settings WHERE key = 'work_hours';
  
  -- For each active entry
  FOR entry_record IN 
    SELECT id, clock_in, user_id FROM public.time_entries WHERE clock_out IS NULL
  LOOP
    -- Calculate hours and update
    UPDATE public.time_entries 
    SET 
      clock_out = now_time,
      auto_clocked_out = TRUE,
      hours_worked = EXTRACT(EPOCH FROM (now_time - clock_in)) / 3600
    WHERE id = entry_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule auto clock-out at 3 PM daily (Monday-Friday)
-- Note: '0 15 * * 1-5' means 15:00 on Mon-Fri
SELECT cron.schedule('auto-clock-out', '0 15 * * 1-5', 'SELECT public.auto_clock_out_all()');

-- Bi-weekly payroll report email placeholder
-- Since email sending requires an external service (Resend), this usually stays in an Edge Function.
-- However, we can trigger the calculation logic here.

CREATE OR REPLACE FUNCTION public.get_payroll_report(from_date DATE, to_date DATE)
RETURNS TABLE (
  name TEXT,
  email TEXT,
  hours DECIMAL,
  gross_pay DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name,
    p.email,
    COALESCE(SUM(t.hours_worked), 0) as hours,
    COALESCE(SUM(t.hours_worked * p.hourly_rate), 0) as gross_pay
  FROM public.profiles p
  LEFT JOIN public.time_entries t ON t.user_id = p.id
  WHERE t.clock_in::DATE BETWEEN from_date AND to_date
  AND p.role != 'super_admin'
  GROUP BY p.id, p.name, p.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;