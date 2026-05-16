-- User interface language preference

alter table public.users
  add column if not exists locale_preference text not null default 'en'
    check (locale_preference in ('en', 'ur', 'ar', 'hi'));

comment on column public.users.locale_preference is
  'UI language: en, ur, ar, or hi';
