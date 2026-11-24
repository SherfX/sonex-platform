-- Clients can create their own profile row when the auth trigger did not run (e.g. legacy users)

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());