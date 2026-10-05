import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiCalendar,
  FiMapPin,
  FiActivity,
  FiCheckCircle,
  FiUserPlus,
} from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    isMarried: false,
    address: '',
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  // Comprehensive Input Validation
  const validateField = (name, value, allValues = form) => {
    let err = '';
    switch (name) {
      case 'name':
        if (!value.trim()) err = 'Full name is required';
        else if (value.trim().length < 2) err = 'Name must be at least 2 characters';
        else if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) err = 'Name should only contain letters and spaces';
        break;
      case 'email':
        if (!value.trim()) err = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) err = 'Please enter a valid email address';
        break;
      case 'password':
        if (!value) err = 'Password is required';
        else if (value.length < 6) err = 'Password must be at least 6 characters';
        else if (!/(?=.*[0-9]|.*[!@#$%^&*])/.test(value)) {
          err = 'Password should contain at least 1 number or symbol';
        }
        break;
      case 'confirmPassword':
        if (!value) err = 'Please confirm your password';
        else if (value !== allValues.password) err = 'Passwords do not match';
        break;
      case 'phone':
        if (!value.trim()) err = 'Phone number is required';
        else if (!/^\+?[0-9\s-]{10,15}$/.test(value.trim().replace(/[\s()-]/g, ''))) {
          err = 'Enter a valid phone number (at least 10 digits)';
        }
        break;
      case 'dob':
        if (!value) err = 'Date of birth is required';
        else {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate > today) err = 'Date of birth cannot be in the future';
          else if (today.getFullYear() - selectedDate.getFullYear() > 120) err = 'Please enter a valid birth year';
        }
        break;
      case 'gender':
        if (!value) err = 'Gender is required';
        break;
      case 'bloodGroup':
        if (!value) err = 'Blood group is required';
        break;
      case 'address':
        if (!value.trim()) err = 'Residential address is required';
        else if (value.trim().length < 5) err = 'Please provide a complete address (min 5 characters)';
        break;
      default:
        break;
    }
    return err;
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);

    // Validate current field in real-time
    const err = validateField(field, value, updated);
    setErrors((prev) => ({ ...prev, [field]: err }));

    // Re-check confirm password if password changed
    if (field === 'password' && form.confirmPassword) {
      const confirmErr = validateField('confirmPassword', form.confirmPassword, updated);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key], form);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Please resolve the errors highlighted below.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'PATIENT', // Strictly patient registration
        phone: form.phone.trim(),
        dob: form.dob,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        isMarried: form.isMarried,
        address: form.address.trim(),
      };

      await register(payload);
      toast.success('Patient registered successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide" style={{ maxWidth: '640px' }}>
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">
            <span className="landing__brand-icon">✚</span>
            <span className="landing__brand-text">Clinic Plus</span>
          </Link>
          <h1>Patient Registration</h1>
          <p>Register as a patient to book appointments and track health records</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Section 1: Account Credentials */}
          <div className="form-section-title">
            <FiLock size={15} /> <span>Account Credentials</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-email">Email Address *</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="patient@example.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'input-error' : ''}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Phone Number *</label>
              <div className="input-icon-wrap">
                <FiPhone className="input-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={errors.phone ? 'input-error' : ''}
                />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Password *</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 chars with number/symbol"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={errors.password ? 'input-error' : ''}
                  autoComplete="new-password"
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

            <div className="form-group">
              <label htmlFor="reg-confirm-password">Confirm Password *</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          {/* Section 2: Personal Details */}
          <div className="form-section-title" style={{ marginTop: '0.5rem' }}>
            <FiUser size={15} /> <span>Personal Information</span>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="reg-name">Full Name *</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Johnathan Doe"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={errors.name ? 'input-error' : ''}
                />
              </div>
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-dob">Date of Birth *</label>
              <div className="input-icon-wrap">
                <FiCalendar className="input-icon" />
                <input
                  id="reg-dob"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={form.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className={errors.dob ? 'input-error' : ''}
                />
              </div>
              {errors.dob && <span className="field-error">{errors.dob}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-gender">Gender *</label>
              <select
                id="reg-gender"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className={`select-input ${errors.gender ? 'input-error' : ''}`}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && <span className="field-error">{errors.gender}</span>}
            </div>
          </div>

          {/* Section 3: Medical & Contact Details */}
          <div className="form-section-title" style={{ marginTop: '0.5rem' }}>
            <FiActivity size={15} /> <span>Medical & Residential Details</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-blood">Blood Group *</label>
              <select
                id="reg-blood"
                value={form.bloodGroup}
                onChange={(e) => handleChange('bloodGroup', e.target.value)}
                className={`select-input ${errors.bloodGroup ? 'input-error' : ''}`}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && <span className="field-error">{errors.bloodGroup}</span>}
            </div>

            <div className="form-group form-group--checkbox">
              <label className="checkbox-label" htmlFor="reg-married" style={{ marginTop: '1.6rem' }}>
                <input
                  id="reg-married"
                  type="checkbox"
                  checked={form.isMarried}
                  onChange={(e) => handleChange('isMarried', e.target.checked)}
                />
                <span>Married</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-address">Residential Address *</label>
            <div className="input-icon-wrap">
              <textarea
                id="reg-address"
                rows={2}
                placeholder="Apartment, Street address, City, State, ZIP..."
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={errors.address ? 'input-error' : ''}
              />
            </div>
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading} style={{ marginTop: '0.75rem' }}>
            {loading ? <span className="spinner spinner--sm" /> : <FiUserPlus size={18} />}
            {loading ? 'Creating Patient Profile...' : 'Complete Patient Registration'}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
