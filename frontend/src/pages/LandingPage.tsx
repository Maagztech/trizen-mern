import { Link } from 'react-router-dom';
import { Wrench, Shield, CheckCircle, Lock, Layers, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const features = [
  { icon: CheckCircle, title: 'Easy Registration', desc: 'Sign up in minutes with email or Google' },
  { icon: Lock, title: 'Secure Verification', desc: 'Document verification for trusted providers' },
  { icon: Layers, title: 'Flexible Services', desc: 'Choose from 15+ service categories' },
  { icon: BarChart3, title: 'Application Tracking', desc: 'Real-time status updates and notifications' },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold">ServiceProvider</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <Shield className="h-4 w-4" /> Trusted by 1000+ service providers
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Become a Verified<br />
          <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Service Provider
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Join our platform to connect with customers, showcase your skills, and grow your business.
          Complete a simple onboarding process and start earning.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/register" className="btn-primary px-8 py-3 text-base">Get Started</Link>
          <Link to="/login" className="btn-secondary px-8 py-3 text-base">Login</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card text-center transition hover:shadow-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                <Icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-800">
        <p>&copy; 2026 Service Provider Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
