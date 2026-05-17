-- Voters can read their own sent notification log entries (in-app inbox)

create policy "Voters read own notification logs"
  on public.notification_logs
  for select
  to authenticated
  using (
    recipient_user_id = auth.uid()
    and status = 'sent'
  );
