import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiActivity } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function DoctorLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Doctor email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login(form);
      if (res.user?.role !== 'DOCTOR' && res.user?.role !== 'ADMIN') {
        await useAuthStore.getState().logout();
        toast.error('This portal is restricted to clinical doctors and practitioners.');
        return;
      }
      toast.success(`Welcome Dr. ${res.user?.name || ''}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Doctor login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page doctor-portal-page">
      <div className="auth-card auth-card--doctor">
        <div className="auth-card__header">
          <div className="doctor-portal-badge">
            <FiActivity size={16} /> <span>Medical Staff Portal</span>
          </div>
          <h1>Doctor Sign In</h1>
          <p>Sign in with your practitioner credentials to view consultations</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="doc-email">Doctor Email Address</label>
            <div className="input-icon-wrap">
              <FiMail className="input-icon" />
              <input
                id="doc-email"
                type="email"
                placeholder="doctor@clinic.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={errors.email ? 'input-error' : ''}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="doc-password">Password</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" />
              <input
                id="doc-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your doctor password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={errors.password ? 'input-error' : ''}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <span className="spinner spinner--sm" /> : <FiLogIn size={18} />}
            {loading ? 'Authenticating...' : 'Access Doctor Dashboard'}
          </button>
        </form>

        <div className="auth-card__footer">
          <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
            Clinical accounts are provisioned exclusively by the Clinic Administration.
          </p>
        </div>
      </div>
    </div>
  );
}
