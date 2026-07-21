import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import PostCard from '../components/PostCard.jsx';
import PostListState from '../components/PostListState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchFollowList, fetchUserProfile, toggleFollow } from '../lib/follows.js';

function FollowListPanel({ profileId, type, title, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadList() {
      setLoading(true);
      setError('');

      try {
        const nextItems = await fetchFollowList(profileId, type);
        if (mounted) setItems(nextItems);
      } catch (loadError) {
        console.error('[Supabase] follow list load failed', loadError);
        if (mounted) setError(loadError.message || '목록을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadList();

    return () => {
      mounted = false;
    };
  }, [profileId, type]);

  return (
    <section className="panel follow-list-card">
      <div className="page-section-head">
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>닫기</button>
      </div>
      {loading ? <p className="comments-state">목록을 불러오는 중입니다.</p> : null}
      {error ? <p className="post-inline-error">{error}</p> : null}
      {!loading && !error && !items.length ? (
        <p className="comments-state">아직 표시할 사용자가 없습니다.</p>
      ) : null}
      {!loading && !error && items.length ? (
        <ul className="follow-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`/users/${item.id}`} onClick={onClose}>
                {item.profileImage ? (
                  <img className="profile-avatar comment-avatar" src={item.profileImage} alt="" />
                ) : (
                  <Mascot mood="mini" />
                )}
                <b>{item.nickname}</b>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function UserProfilePage({
  posts,
  postsLoading,
  postsError,
  onRetryPosts,
  onToggleLike,
  likePendingByPostId,
  currentUserId,
  onDeletePost,
  postActionPendingByPostId,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [followPending, setFollowPending] = useState(false);
  const [followMessage, setFollowMessage] = useState('');
  const [openList, setOpenList] = useState('');
  const userPosts = useMemo(() => posts.filter((post) => post.authorId === id), [id, posts]);
  const isMe = currentUserId === id;

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    setFollowMessage('');

    try {
      const nextProfile = await fetchUserProfile(id, currentUserId);
      if (!nextProfile) {
        setProfile(null);
        setProfileError('사용자를 찾을 수 없습니다.');
        return;
      }
      setProfile(nextProfile);
    } catch (error) {
      console.error('[Supabase] user profile load failed', error);
      setProfile(null);
      setProfileError(error.message || '프로필을 불러오지 못했습니다.');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id, currentUserId]);

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!profile || isMe || followPending) return;

    const previousProfile = profile;
    const nextFollowing = !profile.isFollowing;
    setFollowPending(true);
    setFollowMessage('');
    setProfile({
      ...profile,
      isFollowing: nextFollowing,
      followerCount: Math.max(0, profile.followerCount + (nextFollowing ? 1 : -1)),
      followError: '',
    });

    try {
      await toggleFollow({
        currentUserId: user.id,
        targetUserId: id,
        isFollowing: previousProfile.isFollowing,
      });
    } catch (error) {
      console.error('[Supabase] follow toggle failed', error);
      setProfile(previousProfile);
      setFollowMessage(error.message || '팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setFollowPending(false);
    }
  };

  if (profileLoading) {
    return (
      <main className="page-shell">
        <section className="panel empty-card"><h2>프로필을 불러오는 중입니다.</h2></section>
      </main>
    );
  }

  if (profileError || !profile) {
    return (
      <main className="page-shell">
        <section className="panel empty-card">
          <h2>{profileError || '사용자를 찾을 수 없습니다.'}</h2>
          <Link to="/feed">피드로 돌아가기</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell mypage-grid">
      <section className="panel profile-card user-profile-card">
        {profile.profileImage ? (
          <img className="profile-avatar" src={profile.profileImage} alt="프로필 이미지" />
        ) : (
          <Mascot mood="neutral" />
        )}
        <div>
          <p className="eyebrow">{isMe ? 'MY PROFILE' : 'USER PROFILE'}</p>
          <h2>{profile.nickname}</h2>
          <div className="follow-stats">
            <button type="button" onClick={() => setOpenList('followers')}>
              팔로워 <b>{profile.followerCount}</b>
            </button>
            <button type="button" onClick={() => setOpenList('following')}>
              팔로잉 <b>{profile.followingCount}</b>
            </button>
          </div>
          {profile.followError ? <p className="post-inline-error">{profile.followError}</p> : null}
          {followMessage ? <p className="post-inline-error">{followMessage}</p> : null}
        </div>
        {isMe ? (
          <button type="button" onClick={() => navigate('/mypage')}>내 프로필</button>
        ) : (
          <button type="button" disabled={followPending || Boolean(profile.followError)} onClick={handleToggleFollow}>
            {profile.isFollowing ? '팔로잉' : '팔로우'}
          </button>
        )}
      </section>

      {openList ? (
        <FollowListPanel
          profileId={id}
          type={openList}
          title={openList === 'followers' ? '팔로워' : '팔로잉'}
          onClose={() => setOpenList('')}
        />
      ) : null}

      <section>
        <div className="page-section-head">
          <h2>{isMe ? '내가 작성한 기록' : '작성한 기록'}</h2>
        </div>
        <div className="post-list">
          <PostListState
            loading={postsLoading}
            error={postsError}
            empty={!userPosts.length}
            onRetry={onRetryPosts}
          />
          {!postsLoading && !postsError
            ? userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                compact
                onToggleLike={onToggleLike}
                likePending={Boolean(likePendingByPostId[post.id])}
                currentUserId={currentUserId}
                onDeletePost={onDeletePost}
                postActionPending={Boolean(postActionPendingByPostId[post.id])}
              />
            ))
            : null}
        </div>
      </section>
    </main>
  );
}
