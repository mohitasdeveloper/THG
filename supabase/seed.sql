-- Optional: seed the 20 demo teams + 5 demo locations from the spec.
-- You can also do this from the Admin > Database Tools > "Seed Demo Data" button
-- once the app is deployed (it calls the same logic via the API).

insert into teams (name, login_token) values
  ('Team Alpha',   'tk_alpha_8f7d2e9a1b'),
  ('Team Beta',    'tk_beta_3k9m1p4q2c'),
  ('Team Gamma',   'tk_gamma_7r2n5x8v3d'),
  ('Team Delta',   'tk_delta_4w6h9j1m4e'),
  ('Team Epsilon', 'tk_epsilon_2p8k3n7q5f'),
  ('Team Zeta',    'tk_zeta_6d1v4r9x6g'),
  ('Team Eta',     'tk_eta_9m3b7k2w7h'),
  ('Team Theta',   'tk_theta_5j8n1p6v8i'),
  ('Team Iota',    'tk_iota_3x7m4d9k9j'),
  ('Team Kappa',   'tk_kappa_1v5r8h2n0k'),
  ('Team Lambda',  'tk_lambda_8k2j6v4m1l'),
  ('Team Mu',      'tk_mu_4n9x1r7b2m'),
  ('Team Nu',      'tk_nu_7b3m5k9j3n'),
  ('Team Xi',      'tk_xi_2w6v8n4x4o'),
  ('Team Omicron', 'tk_omicron_9j1k3m7v5p'),
  ('Team Pi',      'tk_pi_5r4n8b2k6q'),
  ('Team Rho',     'tk_rho_3m7v1j9n7r'),
  ('Team Sigma',   'tk_sigma_6k2x5r4b8s'),
  ('Team Tau',     'tk_tau_1n8j7v3m9t'),
  ('Team Upsilon', 'tk_upsilon_4x5k2n6j0u')
on conflict (name) do nothing;

insert into locations (name, description) values
  ('Library', 'Where knowledge sleeps in rows'),
  ('Clock Tower', 'Where time is always on display'),
  ('Mirror Hall', 'Where reflections never lie'),
  ('Fireplace', 'Where warmth and memories gather'),
  ('Main Gate', 'Where journeys begin and end')
on conflict (name) do nothing;

-- After running this, go to Admin > Location Orders and click
-- "Auto-Generate Random Orders", then Admin > Clues to write your
-- own clue text and hints for each of the 100 team/step combos
-- (or use Admin > Database Tools > Seed Demo Data to also generate
-- placeholder clue text automatically).
