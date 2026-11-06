import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  GraduationCap, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid institutional email address'),
  matricNo: z.string().min(3, 'Valid Student Matriculation No. is required'),
  department: z.string().min(2, 'Please select your department'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const DEPARTMENTS = [
  'Public Health & Disease Surveillance',
  'Environmental Health Technology',
  'Computer Science & Information Tech',
  'Home and Rural Economics',
  'Statistics & Data Analytics',
  'Fisheries & Aquaculture Technology',
  'Animal Health & Clinical Technology',
  'Animal Production Technology',
  'Veterinary Laboratory Technology',
  'Agricultural Extension & Management',
  'Pasture & Range Management'
];

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      matricNo: '',
      department: DEPARTMENTS[0],
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  async function onSubmit(data) {
    setIsSubmitting(true);
    try {
      const user = await registerUser({
        name: data.name,
        email: data.email,
        matricNo: data.matricNo,
        department: data.department,
        phone: data.phone,
        password: data.password,
        role: 'patron'
      });

      toast.success('Registration successful! Baseline credit score of 50 assigned.');
      navigate('/patron', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-1 rounded-full bg-white shadow-md border-2 border-emerald-600 mb-3">
          <img
            src="/fcahpt-logo.png"
            alt="FCAHPT College Crest"
            className="w-16 h-16 rounded-full object-contain"
          />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Student LibCredit Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Federal College of Animal Health and Production Technology (FCAHPT), Vom
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div className="text-xs text-emerald-900 leading-tight">
              <span className="font-bold">Instant Baseline Credit Score: </span>
              All registered FCAHPT students begin in the <strong>Fair Tier (50 pts)</strong> with up to 3 concurrent book loans.
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g., Fatima Adamu"
                  className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border ${
                    errors.name ? 'border-red-300' : 'border-slate-300'
                  } focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                />
              </div>
              {errors.name && <p className="mt-1 text-2xs text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="student@fcahpt.edu.ng"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border ${
                      errors.email ? 'border-red-300' : 'border-slate-300'
                    } focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-2xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="08012345678"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border ${
                      errors.phone ? 'border-red-300' : 'border-slate-300'
                    } focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-2xs text-red-600">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Matric No & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Matriculation Number
                </label>
                <div className="mt-1 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register('matricNo')}
                    placeholder="FCAHPT/2026/CS/001"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border uppercase font-mono ${
                      errors.matricNo ? 'border-red-300' : 'border-slate-300'
                    } focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                  />
                </div>
                {errors.matricNo && <p className="mt-1 text-2xs text-red-600">{errors.matricNo.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Department
                </label>
                <div className="mt-1 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <select
                    {...register('department')}
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden truncate"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.department && <p className="mt-1 text-2xs text-red-600">{errors.department.message}</p>}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className={`block w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg border ${
                      errors.password ? 'border-red-300' : 'border-slate-300'
                    } focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className={`block w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                    } focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-2xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-xs text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-800 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
