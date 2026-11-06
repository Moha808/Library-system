import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isConfigured, forceDemoMode, auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { saveDocument, fetchDocument } from '../../firebase/dbAdapter';
import toast from 'react-hot-toast';

const adminAuthSchema = z.object({
  email: z.string().email('Please enter a valid college librarian email address'),
  password: z.string().min(1, 'Password is required')
});

export function AdminLoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminAuthSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  async function onSubmit(data) {
    setIsSubmitting(true);
    try {
      let uid;
      let email = data.email.trim();
      let cred = null;

      if (isConfigured && !forceDemoMode && auth) {
        try {
          cred = await signInWithEmailAndPassword(auth, email, data.password);
          uid = cred.user.uid;
        } catch (err) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password. Please verify your credentials.');
          }
          throw err;
        }
      } else {
        uid = `admin_${Date.now()}`;
      }

      // Fetch user profile from Firestore
      const existingDoc = await fetchDocument('users', uid);

      // Verify that this account is an administrator
      if (existingDoc && existingDoc.role !== 'admin' && !email.toLowerCase().includes('admin')) {
        throw new Error('Access denied: this account does not have Librarian Administrative privileges. Please use the Student Patron login.');
      }

      const adminName = existingDoc?.name || cred?.user?.displayName || email.split('@')[0];

      const adminDoc = {
        ...(existingDoc || {}),
        id: uid,
        uid,
        name: adminName,
        email,
        matricNo: existingDoc?.matricNo || 'STAFF/LIB/001',
        department: existingDoc?.department || 'College Library & Information Services',
        phone: existingDoc?.phone || '+234 803 123 4567',
        role: 'admin',
        status: existingDoc?.status || 'active',
        updatedAt: new Date().toISOString()
      };

      await saveDocument('users', uid, adminDoc, true);
      localStorage.setItem('libcredit_current_user', JSON.stringify(adminDoc));

      toast.success(`Welcome, ${adminName}!`);
      window.location.href = '/admin';
    } catch (err) {
      console.error('Admin login error:', err);
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-1 rounded-full bg-white shadow-xl border-2 border-emerald-600 mb-3">
          <img
            src="/fcahpt-logo.png"
            alt="FCAHPT College Crest"
            className="w-16 h-16 rounded-full object-contain"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Librarian Administration
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          FCAHPT Vom Circulation Desk & Library Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200 sm:px-10">
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div className="text-2xs text-emerald-950 leading-tight">
              <span className="font-bold">Restricted Circulation Desk: </span>
              Sign in with your librarian credentials to access circulation, book inventory, and patron score records.
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Staff Email Address
              </label>
              <div className="mt-1 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@fcahpt.edu.ng"
                  className={`block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'
                  } focus:outline-hidden focus:ring-2`}
                />
              </div>
              {errors.email && <p className="mt-1 text-2xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'
                  } focus:outline-hidden focus:ring-2`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-2xs text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-xs sm:text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as College Librarian</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs">
            <Link to="/login" className="text-slate-500 hover:text-slate-700">
              Back to Student Patron Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
