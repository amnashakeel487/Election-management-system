-- Mask format: ********5678 (8 asterisks + last 4 characters)

create or replace function public._mask_secret_voter_id_display(p_secret text)
returns text
language sql
immutable
parallel safe
as $$
  with norm as (
    select upper(trim(p_secret)) as t
  )
  select case
    when length(t) = 0 then '****'
    else repeat('*', 8) || right(t, 4)
  end
  from norm;
$$;
