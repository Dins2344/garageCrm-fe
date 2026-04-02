import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    garageName: ''
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await register(form);
        toast.success('Garage registered successfully! 🎉');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back! 🔧');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-shape shape-1"></div>
        <div className="login-bg-shape shape-2"></div>
        <div className="login-bg-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="url(#lg)"/>
                <path d="M12 28V17L20 12L28 17V28L20 23L12 28Z" fill="white" fillOpacity="0.9"/>
                <path d="M20 12V23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#3B5FF8"/>
                    <stop offset="1" stopColor="#7C3AED"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1>GarageFlow</h1>
            <p>{isRegister ? 'Register your garage and get started' : 'Sign in to manage your workshop'}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    className="form-input"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Garage Name</label>
                  <input
                    className="form-input"
                    type="text"
                    name="garageName"
                    value={form.garageName}
                    onChange={handleChange}
                    placeholder="Speed Auto Works"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                isRegister ? 'Create Garage Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                className="login-toggle-btn"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Sign In' : 'Register your garage'}
              </button>
            </p>
          </div>
        </div>

        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">📋</span>
            <div>
              <h4>Job Card Management</h4>
              <p>Track every vehicle from intake to delivery</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">💰</span>
            <div>
              <h4>Billing & Invoices</h4>
              <p>Generate professional estimations and invoices</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">📦</span>
            <div>
              <h4>Inventory Tracking</h4>
              <p>Never run out of critical parts again</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
