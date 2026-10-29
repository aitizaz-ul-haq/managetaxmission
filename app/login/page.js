'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../lib/auth/dashboardPath';
import styles from './page.module.css';

function Icon({ name, ...props }) {
  const paths = {
    invoice: <><path d="M7 3h7l5 5v13H5V3h2Z" /><path d="M14 3v6h5M8 13h8M8 17h8" /></>,
    tax: <><path d="m6 20 12-16" /><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /></>,
    reports: <><rect x="4" y="14" width="3" height="7" rx="1" /><rect x="11" y="9" width="3" height="12" rx="1" /><rect x="18" y="3" width="3" height="18" rx="1" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 6 8 7 8-7" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}

function BrandLogo() {
  return (
    <div className={styles.logo}>
      <Image
        src="/images/Mnagae_taxmission_logo_new.png"
        alt="Manage Taxmission — Sales Tax / FED Invoice Platform"
        width={1448}
        height={1086}
        sizes="280px"
        className={styles.logoImage}
        priority
      />
    </div>
  );
}

const features = [
  { icon: 'invoice', title: 'Invoice Management', description: 'Create, track and manage invoices' },
  { icon: 'tax', title: 'Tax Submissions', description: 'Stay compliant with ease' },
  { icon: 'reports', title: 'Accounts & Reports', description: 'Real-time insights for better decisions' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(getDashboardPath(user));
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.introduction} aria-labelledby="login-heading">
          <BrandLogo />

          <div className={styles.pitch}>
            <h1 id="login-heading">Simplify Your<br /><span>Tax Compliance</span></h1>
            <p className={styles.description}>
              Manage tax submissions, invoices, and accounts with confidence. A secure, modern platform built for businesses.
            </p>
          </div>

          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature.title}>
                <span className={styles.featureIcon}><Icon name={feature.icon} /></span>
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="sign-in-heading">
          <div className={styles.cardBrand}><BrandLogo /></div>

          <div className={styles.welcome}>
            <h2 id="sign-in-heading">Welcome back</h2>
            <p>Sign in to your account to manage your tax submissions, invoices and accounts.</p>
          </div>

          {error && <div className={styles.error} role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form} aria-busy={loading}>
            <div className={styles.field}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <Icon name="mail" className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <Icon name="lock" className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.passwordInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls="password"
                >
                  <Icon name="eye" />
                </button>
              </div>
            </div>

            <div className={styles.options}>
              {/* Visual placeholders only; persistence and recovery are deferred. */}
              <label className={styles.remember}>
                <input type="checkbox" disabled aria-label="Remember me (coming soon)" />
                <span>Remember me</span>
              </label>
              <button type="button" className={styles.forgotPassword} disabled>Forgot password?</button>
            </div>

            <button type="submit" className={styles.submit} disabled={loading}>
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
              {!loading && <Icon name="arrow" />}
            </button>
          </form>

          <p className={styles.security}><Icon name="lock" />Secure access to your tax submission workspace.</p>
        </section>
      </div>
    </main>
  );
}
