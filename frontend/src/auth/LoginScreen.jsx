import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError(null);

    setIsSubmitting(true);
    try {
      await login({
        email: formState.email,
        password: formState.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <h1>CRM Sign in</h1>
          <p>Use your field ops credentials to open the Visits dashboard.</p>
        </div>

        {error && (
          <div role="alert" className="login-card__error">
            {error}
          </div>
        )}

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formState.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formState.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
