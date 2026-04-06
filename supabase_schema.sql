-- Supabase Schema for Jonas Loto Center

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT UNIQUE NOT NULL,
    "displayName" TEXT,
    "phoneNumber" TEXT,
    "dateOfBirth" DATE,
    "idType" TEXT CHECK ("idType" IN ('passport', 'license', 'cin')),
    "idNumber" TEXT,
    "idPhotoFront" TEXT,
    "idPhotoBack" TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'agent', 'supervisor')),
    status TEXT DEFAULT 'pending_verification' CHECK (status IN ('active', 'suspended', 'pending_verification', 'rejected')),
    balance NUMERIC DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = uid);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = uid);

CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE uid = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE uid = auth.uid() AND role = 'admin'
        )
    );

-- 2. OTPs Table
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'email',
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on otps
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Policies for otps
CREATE POLICY "Users can manage their own otps" ON public.otps
    FOR ALL USING (auth.uid() = "userId");

-- 3. Storage Bucket for Verification Documents
-- Note: You must create the bucket 'verification-docs' manually in the Supabase Dashboard
-- and then apply these policies.

-- Policy to allow users to upload their own documents
-- (Replace 'verification-docs' with your actual bucket name)
-- CREATE POLICY "Users can upload their own verification docs"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'verification-docs' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy to allow admins to view all documents
-- CREATE POLICY "Admins can view all verification docs"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'verification-docs' AND
--   EXISTS (
--     SELECT 1 FROM public.users
--     WHERE uid = auth.uid() AND role = 'admin'
--   )
-- );
