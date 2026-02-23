-- 1. PROFILES TABLE
-- This table stores user-specific data like credits and banned status.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    credits INTEGER DEFAULT 15,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. CARTS TABLE
-- This table stores the generated applications/games.
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT,
    prompt TEXT,
    code TEXT,
    model TEXT,
    is_listed BOOLEAN DEFAULT TRUE,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on carts
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Carts Policies
CREATE POLICY "Public carts are viewable by everyone" ON public.carts
    FOR SELECT USING (is_listed = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own carts" ON public.carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carts" ON public.carts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any cart" ON public.carts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND username = 'homelessman'
        )
    );

-- 3. CREDIT REQUESTS TABLE
-- For the donation/credit system.
CREATE TABLE IF NOT EXISTS public.credit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT,
    cashtag TEXT,
    amount_usd DECIMAL(10,2),
    credits_requested INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on credit_requests
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- Credit Requests Policies
CREATE POLICY "Users can view own requests" ON public.credit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert requests" ON public.credit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.credit_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND username = 'homelessman'
        )
    );

CREATE POLICY "Admins can update requests" ON public.credit_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND username = 'homelessman'
        )
    );

-- 4. AUTOMATIC PROFILE CREATION
-- This function and trigger ensure a profile is created whenever a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, credits)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        15
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
