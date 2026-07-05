import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { hasProfile, loading, profileLoading, saveProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (!loading && !profileLoading && hasProfile) {
    return <Navigate to="/" replace />;
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    const { error } = await saveProfile({ nickname, avatarFile });

    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <main className="auth-page">
      <section className="auth-card profile-setup-card panel">
        <div className="auth-brand">
          {previewUrl ? (
            <img className="profile-avatar large" src={previewUrl} alt="프로필 미리보기" />
          ) : (
            <Mascot mood="neutral" />
          )}
          <div>
            <p className="eyebrow">PROFILE</p>
            <h1>프로필 설정</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            닉네임
            <input
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="오망로그에서 사용할 이름"
              maxLength={24}
              required
            />
          </label>

          <label>
            프로필 이미지
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>

          {message ? <p className="auth-message">{message}</p> : null}

          <button className="auth-submit" type="submit" disabled={submitting || !nickname.trim()}>
            {submitting ? '저장 중...' : '프로필 저장'}
          </button>
        </form>
      </section>
    </main>
  );
}
