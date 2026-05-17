-- Allow anonymous visitors to load public election results (RPC enforces visibility rules).

grant execute on function public.get_election_results(uuid) to anon;
