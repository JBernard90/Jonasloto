import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'agent' | 'client';
  status: 'active' | 'suspended';
  displayName?: string;
  phoneNumber?: string;
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  displayName: string,
  phoneNumber?: string
) {
  try {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
          phoneNumber,
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('Sign up failed');

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        uid: user.id,
        email,
        displayName,
        phoneNumber,
        role: 'client',
        status: 'active'
      });

    if (profileError) throw profileError;

    return {
      success: true,
      message: 'Inscription réussie! Vérifiez votre email pour confirmer votre compte.',
      user
    };
  } catch (error: any) {
    throw new Error(error.message || 'Sign up failed');
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!session) throw new Error('Sign in failed');

    return {
      success: true,
      session,
      user: session.user
    };
  } catch (error: any) {
    throw new Error(error.message || 'Sign in failed');
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`
      }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Google sign in failed');
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Sign out failed');
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('uid', user.id)
      .single();

    if (!userData) return null;

    return {
      id: user.id,
      email: user.email || '',
      role: userData.role,
      status: userData.status,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<AuthUser>
) {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('uid', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Update failed');
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return {
      success: true,
      message: 'Vérifiez votre email pour réinitialiser votre mot de passe.'
    };
  } catch (error: any) {
    throw new Error(error.message || 'Password reset failed');
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(email: string, otp: string) {
  try {
    const response = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (!response.ok) throw new Error('OTP verification failed');
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'OTP verification failed');
  }
}

/**
 * Send OTP
 */
export async function sendOTP(email: string) {
  try {
    const response = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) throw new Error('Failed to send OTP');
    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send OTP');
  }
}
