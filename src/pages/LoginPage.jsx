import { useState, useEffect } from 'react';

import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { authAPI } from '../api/services';

import { useAuth } from '../context/AuthContext';

import { getGoogleOAuthLoginUrl, getOAuthLoginErrorMessage } from '../config/urls';

import coBrotherLogo from '../assets/Cobrother_logo.png';



export default function LoginPage() {

  const { t } = useTranslation();

  const { user, loading, login, refreshUser } = useAuth();

  const navigate  = useNavigate();

  const location  = useLocation();

  const [searchParams] = useSearchParams();

  const from = location.state?.from?.pathname || '/dashboard';



  const [mode, setMode]   = useState('password');

  const [step, setStep]   = useState(1);

  const [form, setForm]   = useState({ email: '', password: '', otpCode: '' });

  const [busy, setBusy]   = useState(false);

  const [error, setError] = useState('');

  const [info, setInfo]   = useState('');



  // ── If already logged in, redirect away ──────────────────────────────────

  useEffect(() => {

    if (!loading && user) {

      navigate(user.profileComplete ? '/dashboard' : '/complete-profile', { replace: true });

    }

  }, [user, loading]);



  // ── Show OAuth error if redirected back with ?error= ─────────────────────

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (!oauthError) return;
    const friendly = getOAuthLoginErrorMessage(oauthError);
    if (friendly) {
      setError(friendly);
      return;
    }
    // Backend may pass a plain-text message (e.g. email not verified).
    if (oauthError.includes(' ')) {
      setError(oauthError);
      return;
    }
    setError(t('googleSignInFailed'));
  }, [searchParams, t]);



  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });



  // ── Helper: handle any successful login response ──────────────────────────

  const handleLoginSuccess = async (data) => {

    // Backend may nest under data.data

    const payload = data?.data ?? data;

    const accessToken  = payload?.accessToken  || payload?.token;

    const refreshToken = payload?.refreshToken;



    if (!accessToken) throw new Error('No access token in response');



    login({ accessToken, refreshToken }, null);

    const fetchedUser = await refreshUser();

    navigate(fetchedUser?.profileComplete ? from : '/complete-profile', { replace: true });

  };



  // ── Password login ────────────────────────────────────────────────────────

  const handlePasswordLogin = async e => {

    e.preventDefault();

    setBusy(true); setError('');

    try {

      const { data } = await authAPI.login({ email: form.email, password: form.password });

      await handleLoginSuccess(data);

    } catch (err) {

      setError(err.response?.data?.error || err.message || t('invalidEmailOrPassword'));

    } finally { setBusy(false); }

  };



  // ── OTP: send ─────────────────────────────────────────────────────────────

  const handleSendOtp = async e => {

    e.preventDefault();

    setBusy(true); setError('');

    try {

      await authAPI.sendOtp(form.email);

      setStep(2);

      setInfo(`${t('otpSentTo')} ${form.email}`);

    } catch (err) {

      setError(err.response?.data?.error || t('failedToSendOtp'));

    } finally { setBusy(false); }

  };



  // ── OTP: verify ───────────────────────────────────────────────────────────

  const handleVerifyOtp = async e => {

    e.preventDefault();

    setBusy(true); setError('');

    try {

      const { data } = await authAPI.verifyOtp(form.email, form.otpCode);

      await handleLoginSuccess(data);

    } catch (err) {

      setError(err.response?.data?.error || t('invalidOtp'));

    } finally { setBusy(false); }

  };



  // ── Google OAuth ─────────────────────────────────────────────────────────────

  const handleGoogleLogin = () => {

    window.location.href = getGoogleOAuthLoginUrl();

  };



  // Don't flash login page if already loading auth state

  if (loading) return null;



  return (

    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden bg-gradient-to-b from-gray-50 to-indigo-50">

      <div className="fixed inset-0 z-0 pointer-events-none">

        <div className="absolute w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px] bg-purple/16 rounded-full blur-[80px] opacity-70 -top-[120px] -right-[120px] md:-top-[150px] md:-right-[100px]" />

        <div className="absolute w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] bg-blue-500/12 rounded-full blur-[80px] opacity-70 -bottom-[80px] -left-[80px] md:-bottom-[100px] md:-left-[100px]" />

        <div className="absolute inset-0 opacity-65" style={{backgroundImage: 'linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />

      </div>



      <div className="relative z-10 w-full max-w-[420px] sm:max-w-[440px] bg-white/92 px-5 pt-16 pb-6 sm:px-8 sm:pt-16 sm:pb-8 md:p-10 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white/60 backdrop-blur-xl">

        <button

          onClick={() => navigate('/')}

          className="absolute top-3 left-3 sm:top-4 sm:left-4 group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_4px_15px_rgba(147,51,234,0.4)] hover:shadow-[0_8px_25px_rgba(147,51,234,0.5)] hover:-translate-y-0.5 transition-all duration-300"

        >

          <svg

            className="w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-x-0.5"

            fill="none"

            stroke="currentColor"

            viewBox="0 0 24 24"

            strokeWidth="2.5"

            strokeLinecap="round"

            strokeLinejoin="round"

          >

            <path d="M19 12H5M12 19l-7-7 7-7" />

          </svg>

        </button>

        <div className="text-center mb-6 sm:mb-8">

          <img src={coBrotherLogo} alt="CoBrother" className="w-[170px] sm:w-[190px] md:w-[200px] h-auto object-contain mx-auto mb-3 sm:mb-4 block" />

          <h1 className="font-display text-[1.9rem] sm:text-[2rem] font-semibold text-gray-900 leading-tight">Welcome to CoBrother</h1>

          {/* <p className="text-gray-600 text-[1rem] sm:text-[1.05rem] mt-2 sm:mt-2.5 max-w-[260px] sm:max-w-[300px] mx-auto">Where ventures f */}

        </div>



        <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 sm:py-3 bg-white border-2 border-gray-200 text-gray-700 text-sm sm:text-base font-medium rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:border-gray-400 hover:bg-gray-50 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]" onClick={handleGoogleLogin}>

          <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">

            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>

            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>

            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>

          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>

          </svg>

          Continue with Google

        </button>

{/* 

        <div className="auth-divider"><span>or</span></div>



        <div className="auth-mode-toggle">

          <button

            className={mode === 'password' ? 'active' : ''}

            onClick={() => { setMode('password'); setError(''); setStep(1); }}

          >Password</button>

          <button

            className={mode === 'otp' ? 'active' : ''}

            onClick={() => { setMode('otp'); setError(''); setStep(1); }}

          >OTP Login</button>

        </div>



        {error && <div className="form-error">{error}</div>}

        {info  && <div className="form-info">{info}</div>}



        {mode === 'password' && (

          <form onSubmit={handlePasswordLogin} className="auth-form">

            <div className="form-group">

              <label>Email</label>

              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />

            </div>

            <div className="form-group">

              <label>Password</label>

              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />

            </div>

            <button type="submit" className="btn-primary full-width" disabled={busy}>

              {busy ? <span className="btn-spinner" /> : 'Sign In'}

            </button>

          </form>

        )}



        {mode === 'otp' && step === 1 && (

          <form onSubmit={handleSendOtp} className="auth-form">

            <div className="form-group">

              <label>Email</label>

              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />

            </div>

            <button type="submit" className="btn-primary full-width" disabled={busy}>

              {busy ? <span className="btn-spinner" /> : 'Send OTP'}

            </button>

          </form>

        )}



        {mode === 'otp' && step === 2 && (

          <form onSubmit={handleVerifyOtp} className="auth-form">

            <div className="form-group">

              <label>Enter OTP sent to {form.email}</label>

              <input name="otpCode" value={form.otpCode} onChange={handleChange}

                placeholder="6-digit code" maxLength={6} className="otp-input" required />

            </div>

            <button type="submit" className="btn-primary full-width" disabled={busy}>

              {busy ? <span className="btn-spinner" /> : 'Verify & Sign In'}

            </button>

            <button type="button" className="btn-ghost full-width"

              onClick={() => { setStep(1); setInfo(''); setForm(f => ({ ...f, otpCode: '' })); }}>

              ← Back

            </button>

          </form>

        )}



        <div className="auth-links">

          <span>Don't have an account?</span>

          <Link to="/register">Register</Link>

        </div> */}

      </div>

    </div>

  );

}



