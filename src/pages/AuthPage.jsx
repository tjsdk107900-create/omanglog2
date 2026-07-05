import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    const { data, error } = isSignup ? await signUp(email, password) : await signIn(email, password);

    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (isSignup && !data?.session) {
      setMessage('회원가입이 완료되었습니다. 이메일 인증이 필요하면 메일을 확인해주세요.');
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <main className="auth-page">
      <section className="auth-card panel">
        <div className="auth-brand">
          <Mascot mood="neutral" />
          <div>
            <p className="eyebrow">OMANG LOG</p>
            <h1>{isSignup ? '회원가입' : '로그인'}</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6자 이상 입력"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {message ? <p className="auth-message">{message}</p> : null}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}
          <Link to={isSignup ? '/login' : '/signup'}>
            {isSignup ? '로그인' : '회원가입'}
          </Link>
        </p>
      </section>
    </main>
  );
}
