-- Run before 023_waitlist_system.sql (same migration batch, or alone in SQL editor first).
-- PostgreSQL cannot use new enum labels in the same transaction as ALTER TYPE ... ADD VALUE.

alter type public.notification_type add value if not exists 'waitlist_joined';
alter type public.notification_type add value if not exists 'waitlist_promoted';

alter type public.voter_registration_status add value if not exists 'rejected';
