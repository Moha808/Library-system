import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle2, 
  Scale, 
  HeartHandshake,
  ChevronRight,
  Activity,
  Globe2,
  Cpu,
  Home,
  BarChart2,
  Fish,
  Stethoscope,
  Wheat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';

export function LandingPage() {
  const { currentUser } = useAuth();

  const academicDisciplines = [
    {
      name: 'Public Health & Epidemiology',
      badge: 'Health Sciences',
      icon: Activity,
      desc: 'Disease surveillance, epidemiology, community health nursing, health education & immunology.',
      standardText: 'Principles of Epidemiology & Public Health Practice'
    },
    {
      name: 'Environmental Health Technology',
      badge: 'Applied Sciences',
      icon: Globe2,
      desc: 'Environmental sanitation, water quality monitoring, toxicology, waste management & vector control.',
      standardText: 'Environmental Health Engineering & Waste Management'
    },
    {
      name: 'Computer Science & Information Tech',
      badge: 'Information Technology',
      icon: Cpu,
      desc: 'Database systems, algorithms, network infrastructure, software engineering & agricultural data tech.',
      standardText: 'Database System Concepts & Modern Computing'
    },
    {
      name: 'Home & Rural Economics',
      badge: 'Applied Sciences',
      icon: Home,
      desc: 'Applied human nutrition, family resource economics, food processing & rural enterprise development.',
      standardText: 'Human Nutrition, Dietetics & Rural Community Development'
    },
    {
      name: 'Statistics & Data Analytics',
      badge: 'Mathematical Sciences',
      icon: BarChart2,
      desc: 'Biostatistics, probability theory, statistical inference, quantitative modelling & research methods.',
      standardText: 'Statistical Methods for Applied Sciences & Research'
    },
    {
      name: 'Fisheries & Aquaculture Technology',
      badge: 'Aquatic Sciences',
      icon: Fish,
      desc: 'Freshwater aquaculture, fish pathology, hatchery operations, water chemistry & pond ecology.',
      standardText: 'Fish Pathology, Breeding & Hatchery Management'
    },
    {
      name: 'Animal Health & Clinical Technology',
      badge: 'Veterinary Sciences',
      icon: Stethoscope,
      desc: 'Veterinary pharmacology, clinical pathology, surgical nursing, parasitology & diagnostics.',
      standardText: 'Veterinary Clinical Pathology & Therapeutics'
    },
    {
      name: 'Animal Production Technology',
      badge: 'Agricultural Sciences',
      icon: Wheat,
      desc: 'Tropical livestock production, dairy science, poultry flock management & pasture agronomy.',
      standardText: 'Tropical Cattle Production & Dairy Husbandry'
    }
  ];

  const faqs = [
    {
      q: 'Does my library credit score affect my academic CGPA or examination results?',
      a: 'No. LibCredit measures borrowing reliability strictly within library operations. It has no bearing on your academic grades, examination eligibility, or transcript GPA. Its sole purpose is determining your textbook loan allowances.'
    },
    {
      q: 'Why did FCAHPT Vom replace cash late fines with a credit score system?',
      a: 'Monetary fines unfairly penalize students without solving book shortages. LibCredit focuses on civic responsibility: returning textbooks promptly protects your borrowing tier and ensures all students across our sciences and vocational disciplines have equal access to scarce reference literature.'
    },
    {
      q: 'Which academic departments at FCAHPT Vom are covered by LibCredit?',
      a: 'All diploma, higher diploma, and vocational students across all departments — including Public Health, Environmental Health, Computer Science, Home and Rural Economics, Statistics, Fisheries, Animal Health, and Animal Production.'
    },
    {
      q: 'What if a book suffered normal wear during lab practicals or fieldwork?',
      a: 'Books returned in "Fair" condition (normal shelf or lab wear) carry 0 penalty points. Our librarians distinguish between everyday study wear and negligent damage (torn pages, water soaking, missing covers).'
    },
    {
      q: 'How can a student rebuild their credit score after past defaults?',
      a: 'Every on-time return in good condition awards +15 points (+10 punctuality bonus and +5 condition bonus). By returning current books on time, students in Fair or Poor tiers can steadily climb back into Good (60–79) and Excellent (80–100) status.'
    }
  ];

  return (
    <div className="space-y-14 py-2 relative">
      {/* Background Campus Photograph across Landing Page */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10 opacity-10 pointer-events-none"
        style={{ backgroundImage: `url('/fcahpt-library.jpg')` }}
      />

      {/* Hero Section with Official College Library Building Background */}
      <section className="relative overflow-hidden rounded-3xl text-white p-8 sm:p-12 lg:p-14 shadow-2xl border border-emerald-800/40">
        {/* Real photo background of FCAHPT Vom Library & Administration Building */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-102"
          style={{ backgroundImage: `url('/fcahpt-library.jpg')` }}
        />
        {/* Rich deep institutional gradient overlay ensuring sharp text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/90 to-slate-950/85 backdrop-blur-[1px]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-xs">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Federal College of Animal Health & Production Technology (FCAHPT), Vom</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white m-0">
              An Automated Credit Score for <span className="text-amber-400">Books Borrowing System</span> for the College
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
              Welcome to <strong>LibCredit</strong> — the automated library credit score platform serving the diverse academic community of FCAHPT Vom across <strong>Public Health, Environmental Health, Computer Science, Home & Rural Economics, Statistics, Fisheries, Animal Health, and Agricultural Sciences</strong>.
              Every patron maintains an objective borrowing reliability score (0–100) that rewards punctual returns and textbook care with expanded borrowing privileges.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {currentUser ? (
                <Link
                  to={currentUser.role === 'admin' ? '/admin' : '/patron'}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition-all hover:scale-102"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 transition-all hover:scale-102"
                  >
                    <span>Register Student Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                  >
                    <span>Student Login</span>
                  </Link>
                </>
              )}

              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 hover:text-white px-3 py-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Scoring Rules & Formula</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Visual: Authentic Photograph of FCAHPT Vom Library Interior Holdings */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl group bg-slate-900">
              <img 
                src="/fcahpt-library-interior.jpg" 
                alt="FCAHPT Vom College Library Monograph Stacks and Reading Facility" 
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-104 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-1.5 backdrop-blur-[2px]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-800/90 text-white text-[10px] font-bold uppercase tracking-wider border border-emerald-400/40">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  <span>College Library Stacks</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                  FCAHPT Vom Monograph Collections
                </h4>
                <p className="text-2xs text-emerald-200/90 leading-relaxed">
                  Open-stack academic volumes supporting accredited curricula across all 14 college departments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            How LibCredit Supports FCAHPT Vom
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Built to ensure fair circulation of core academic textbooks across all colleges, departments, and laboratory disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-emerald-100/80 via-white to-emerald-50/90 p-6 rounded-2xl border border-emerald-300 shadow-xs space-y-3 hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center border border-emerald-800 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Civic Reliability, Not Cash Fines</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Monetary fines penalize students without returning books to the shelves. LibCredit measures borrowing punctuality and book care, rewarding responsible patrons with expanded borrowing privileges.
            </p>
          </div>

          <div className="bg-gradient-to-b from-emerald-100/80 via-white to-emerald-50/90 p-6 rounded-2xl border border-emerald-300 shadow-xs space-y-3 hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-blue-700 shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">100% Explainable & Auditable</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Every score adjustment is logged with a human-readable justification. Students can review their full score history and submit formal dispute appeals directly to the library desk.
            </p>
          </div>

          <div className="bg-gradient-to-b from-emerald-100/80 via-white to-emerald-50/90 p-6 rounded-2xl border border-emerald-300 shadow-xs space-y-3 hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center border border-amber-700 shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Staff-Assisted Discretion</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              The algorithm assists college librarians — it does not replace them. Librarians retain complete discretion to review physical book condition, resolve disputes, and grant overrides for academic research.
            </p>
          </div>
        </div>
      </section>

      {/* Credit Classification Tiers Overview */}
      <section className="bg-gradient-to-br from-emerald-100/90 via-emerald-50/80 to-emerald-100/70 rounded-3xl border-2 border-emerald-300 p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">Credit Score Tiers & Borrowing Entitlements</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your reliability score decides how many books you can borrow concurrently and your maximum loan duration.
            </p>
          </div>
          <Link
            to="/how-it-works"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
          >
            <span>Full Scoring Rules & Policy</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                80 – 100 Score
              </span>
              <h4 className="text-sm font-bold text-emerald-950 mt-2">Excellent</h4>
              <p className="text-[11px] text-emerald-800 mt-1">Priority borrowing for top patrons</p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 text-xs font-semibold text-emerald-900">
              <p>Up to 5 books</p>
              <p className="text-[11px] text-emerald-700 font-normal">21-day loan period</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                60 – 79 Score
              </span>
              <h4 className="text-sm font-bold text-blue-950 mt-2">Good</h4>
              <p className="text-[11px] text-blue-800 mt-1">Normal standard borrowing</p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 text-xs font-semibold text-blue-900">
              <p>Up to 4 books</p>
              <p className="text-[11px] text-blue-700 font-normal">14-day loan period</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                40 – 59 Score
              </span>
              <h4 className="text-sm font-bold text-amber-950 mt-2">Fair (Baseline)</h4>
              <p className="text-[11px] text-amber-800 mt-1">Initial baseline for new students</p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 text-xs font-semibold text-amber-900">
              <p>Up to 3 books</p>
              <p className="text-[11px] text-amber-700 font-normal">14-day loan period</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                20 – 39 Score
              </span>
              <h4 className="text-sm font-bold text-orange-950 mt-2">Poor</h4>
              <p className="text-[11px] text-orange-800 mt-1">Restricted borrowing privileges</p>
            </div>
            <div className="mt-4 pt-3 border-t border-orange-200/60 text-xs font-semibold text-orange-900">
              <p>1 book only</p>
              <p className="text-[11px] text-orange-700 font-normal">7-day loan period</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                0 – 19 Score
              </span>
              <h4 className="text-sm font-bold text-red-950 mt-2">Very Poor</h4>
              <p className="text-[11px] text-red-800 mt-1">High default rate</p>
            </div>
            <div className="mt-4 pt-3 border-t border-red-200/60 text-xs font-semibold text-red-900">
              <p className="text-red-700 font-bold">Borrowing Blocked</p>
              <p className="text-[11px] text-red-600 font-normal">Requires librarian clearance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Multidisciplinary Science & Department Collections */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Multidisciplinary Science & Vocational Disciplines
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Explore library resources across science, technology, health, and agriculture at FCAHPT Vom.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Search Library Catalogue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {academicDisciplines.map((dept, index) => {
            const Icon = dept.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-b from-emerald-100/70 via-white to-emerald-50/90 p-5 rounded-2xl border border-emerald-300 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center border border-emerald-800 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-100 border border-emerald-600">
                      {dept.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-3">{dept.name}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{dept.desc}</p>
                </div>

                <div className="pt-3 border-t border-emerald-200/80 text-[11px]">
                  <span className="text-emerald-800 font-semibold">Core Reference:</span>
                  <p className="font-bold text-emerald-950 truncate mt-0.5">
                    &ldquo;{dept.standardText}&rdquo;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Common questions regarding borrowing rights, score calculation, and library procedures.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gradient-to-r from-emerald-100/70 via-emerald-50/80 to-emerald-100/60 p-5 rounded-2xl border border-emerald-300 shadow-2xs space-y-2 hover:border-emerald-400 transition-colors">
              <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-700 pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-8 sm:p-12 border border-emerald-700/50 text-center space-y-6 shadow-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white m-0">
            Access FCAHPT Vom Library Services Online
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in with your student credentials to check your current credit tier, browse books across all departments, and place loan requests online.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            Register Student Account
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-200 border border-slate-700 transition-all"
          >
            Access Patron Portal
          </Link>
        </div>
      </section>
    </div>
  );
}
