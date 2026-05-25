
CREATE TABLE public.rpvm_users (
  student_id TEXT PRIMARY KEY CHECK (student_id ~ '^[0-9]{10}$'),
  name TEXT NOT NULL,
  bottle_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rpvm_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES public.rpvm_users(student_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','withdraw')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rpvm_tx_student_idx ON public.rpvm_transactions(student_id, created_at DESC);

ALTER TABLE public.rpvm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpvm_transactions ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (server-side) can read/write.

-- Atomic deposit: add bottle points + insert transaction
CREATE OR REPLACE FUNCTION public.rpvm_deposit(p_student_id TEXT, p_amount INTEGER)
RETURNS public.rpvm_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u public.rpvm_users;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;
  UPDATE public.rpvm_users
     SET bottle_points = bottle_points + p_amount
   WHERE student_id = p_student_id
   RETURNING * INTO u;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student not found';
  END IF;
  INSERT INTO public.rpvm_transactions(student_id, amount, type)
    VALUES (p_student_id, p_amount, 'deposit');
  RETURN u;
END;
$$;

-- Atomic withdraw: subtract points (2 pts per sheet) + insert transaction
CREATE OR REPLACE FUNCTION public.rpvm_withdraw(p_student_id TEXT, p_sheets INTEGER)
RETURNS public.rpvm_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u public.rpvm_users;
  cost INTEGER;
BEGIN
  IF p_sheets IS NULL OR p_sheets <= 0 THEN
    RAISE EXCEPTION 'sheets must be positive';
  END IF;
  cost := p_sheets * 2;
  UPDATE public.rpvm_users
     SET bottle_points = bottle_points - cost
   WHERE student_id = p_student_id
     AND bottle_points >= cost
   RETURNING * INTO u;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient points or student not found';
  END IF;
  INSERT INTO public.rpvm_transactions(student_id, amount, type)
    VALUES (p_student_id, p_sheets, 'withdraw');
  RETURN u;
END;
$$;
