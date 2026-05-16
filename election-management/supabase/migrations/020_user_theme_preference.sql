-- User appearance / theme preference (light | dark | system)

alter table public.users
  add column if not exists theme_preference text not null default 'system'
    check (theme_preference in ('light', 'dark', 'system'));

comment on column public.users.theme_preference is
  'UI theme: light, dark, or system (follow OS prefers-color-scheme)';
