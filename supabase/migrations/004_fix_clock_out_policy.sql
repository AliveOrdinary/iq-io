-- Add policy to allow users to update their own time entries (needed for clocking out)
CREATE POLICY "Users can update own entries" ON "public"."time_entries"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
