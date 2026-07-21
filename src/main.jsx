import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import './lib/supabase.js';
import AppLayout from './components/AppLayout.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import PostListState from './components/PostListState.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { createPost, deletePost, fetchPosts, togglePostLike, updatePost } from './lib/posts.js';
import AuthPage from './pages/AuthPage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import HomePage from './pages/HomePage.jsx';
import MyPage from './pages/MyPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import OmangCardPage from './pages/OmangCardPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';
import ProfileSetupPage from './pages/ProfileSetupPage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import WritePage from './pages/WritePage.jsx';
import './styles.css';

function ProtectedRoute() {
  const { user, loading, profileLoading, hasProfile } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return <main className="auth-loading">로그인 상태 확인 중...</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasProfile && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  return <AppLayout />;
}

function AppRoutes() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [likePendingByPostId, setLikePendingByPostId] = useState({});
  const [postActionPendingByPostId, setPostActionPendingByPostId] = useState({});
  const [pendingDeletePost, setPendingDeletePost] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  const loadPosts = useCallback(async () => {
    if (!user) return;

    setPostsLoading(true);
    setPostsError('');

    try {
      const nextPosts = await fetchPosts({ userId: user.id, sort: 'latest' });
      setPosts(nextPosts);
    } catch (error) {
      console.error('[Supabase] posts load failed', error);
      setPosts([]);
      setPostsError(error.message || '게시글 조회 중 오류가 발생했습니다.');
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPosts();
    } else {
      setPosts([]);
      setPostsLoading(false);
      setPostsError('');
      setLikePendingByPostId({});
      setPostActionPendingByPostId({});
      setPendingDeletePost(null);
      setDeleteError('');
    }
  }, [loadPosts, user]);

  const handleCreatePost = async (postInput) => {
    await createPost({
      ...postInput,
      userId: user.id,
    });
    await loadPosts();
    navigate('/feed');
  };

  const handleUpdatePost = async (postId, postInput) => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    setPostActionPendingByPostId((current) => ({ ...current, [postId]: true }));

    try {
      const updatedPost = await updatePost({
        postId,
        userId: user.id,
        ...postInput,
      });

      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === postId
          ? {
            ...post,
            title: updatedPost.title,
            body: updatedPost.body,
            tags: updatedPost.tags ?? postInput.tags,
            level: Number(updatedPost.level ?? postInput.level),
            cardText: updatedPost.card_text ?? postInput.cardText,
          }
          : post
      )));
      navigate(`/post/${postId}`, { replace: true });
    } finally {
      setPostActionPendingByPostId((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
    }
  };

  const handleRequestDeletePost = (postId, redirectToFeed = false) => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (postActionPendingByPostId[postId]) return;
    setDeleteError('');
    setPendingDeletePost({ postId, redirectToFeed });
  };

  const handleCancelDeletePost = () => {
    if (!pendingDeletePost || postActionPendingByPostId[pendingDeletePost.postId]) return;
    setPendingDeletePost(null);
    setDeleteError('');
  };

  const handleConfirmDeletePost = async () => {
    if (!user || !pendingDeletePost) return;

    const { postId, redirectToFeed } = pendingDeletePost;
    if (postActionPendingByPostId[postId]) return;

    setPostActionPendingByPostId((current) => ({ ...current, [postId]: true }));
    setDeleteError('');

    try {
      await deletePost({ postId, userId: user.id });
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      setPendingDeletePost(null);
      if (redirectToFeed) {
        navigate('/feed', { replace: true });
      }
    } catch (error) {
      console.error('[Supabase] post delete failed', error);
      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === postId
          ? { ...post, actionError: error.message || '게시글 삭제 중 오류가 발생했습니다.' }
          : post
      )));
      setDeleteError(error.message || '게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPostActionPendingByPostId((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
    }
  };

  const handleToggleLike = async (postId) => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (likePendingByPostId[postId]) return;

    const currentPost = posts.find((post) => post.id === postId);
    if (!currentPost) return;

    const nextLiked = !currentPost.likedByMe;
    const nextCount = Math.max(0, currentPost.empathy + (nextLiked ? 1 : -1));

    setLikePendingByPostId((current) => ({ ...current, [postId]: true }));
    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId
        ? { ...post, likedByMe: nextLiked, empathy: nextCount, likeError: '' }
        : post
    )));

    try {
      await togglePostLike({
        postId,
        userId: user.id,
        liked: currentPost.likedByMe,
      });
    } catch (error) {
      console.error('[Supabase] post like toggle failed', error);
      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === postId
          ? {
            ...post,
            likedByMe: currentPost.likedByMe,
            empathy: currentPost.empathy,
            likeError: error.message || '공감 처리 중 오류가 발생했습니다.',
          }
          : post
      )));
    } finally {
      setLikePendingByPostId((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
    }
  };

  const handleCommentCountChange = (postId, delta) => {
    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId
        ? { ...post, comments: Math.max(0, post.comments + delta) }
        : post
    )));
  };

  const postStateProps = {
    posts,
    postsLoading,
    postsError,
    onRetryPosts: loadPosts,
    onToggleLike: handleToggleLike,
    likePendingByPostId,
    onCommentCountChange: handleCommentCountChange,
    currentUserId: user?.id ?? null,
    onDeletePost: handleRequestDeletePost,
    postActionPendingByPostId,
  };

  const renderEditPage = () => (
    <PostEditRoute
      posts={posts}
      postsLoading={postsLoading}
      postsError={postsError}
      currentUserId={user?.id ?? null}
      onRetryPosts={loadPosts}
      onUpdatePost={handleUpdatePost}
    />
  );

  const pendingDeleteTitle = pendingDeletePost
    ? posts.find((post) => post.id === pendingDeletePost.postId)?.title
    : '';

  return (
    <>
      <Routes>
      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="signup" element={<AuthPage mode="signup" />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<HomePage {...postStateProps} />} />
        <Route path="feed" element={<FeedPage {...postStateProps} />} />
        <Route path="search" element={<SearchPage {...postStateProps} />} />
        <Route path="write" element={<WritePage onCreatePost={handleCreatePost} />} />
        <Route path="stats" element={<StatsPage {...postStateProps} />} />
        <Route path="ranking" element={<RankingPage {...postStateProps} />} />
        <Route path="mypage" element={<MyPage {...postStateProps} />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users/:id" element={<UserProfilePage {...postStateProps} />} />
        <Route path="profile-setup" element={<ProfileSetupPage />} />
        <Route path="post/:id" element={<PostDetailPage {...postStateProps} />} />
        <Route path="post/:id/edit" element={renderEditPage()} />
        <Route path="omang-card" element={<OmangCardPage {...postStateProps} />} />
      </Route>
      </Routes>
      <ConfirmDialog
        open={Boolean(pendingDeletePost)}
        title="게시글 삭제"
        description={pendingDeleteTitle ? `"${pendingDeleteTitle}" 기록을 삭제할까요?` : '이 기록을 삭제할까요?'}
        confirmLabel="삭제"
        loading={Boolean(pendingDeletePost && postActionPendingByPostId[pendingDeletePost.postId])}
        error={deleteError}
        onCancel={handleCancelDeletePost}
        onConfirm={handleConfirmDeletePost}
      />
    </>
  );
}

function PostEditRoute({
  posts,
  postsLoading,
  postsError,
  currentUserId,
  onRetryPosts,
  onUpdatePost,
}) {
  const { id } = useParams();
  const post = posts.find((item) => item.id === id);

  if (postsLoading || postsError) {
    return <PostListState loading={postsLoading} error={postsError} empty={false} onRetry={onRetryPosts} />;
  }

  if (!post) {
    return (
      <main className="page-shell">
        <section className="panel empty-card">
          <h2>게시글을 찾을 수 없습니다.</h2>
        </section>
      </main>
    );
  }

  if (post.authorId !== currentUserId) {
    return (
      <main className="page-shell">
        <section className="panel empty-card">
          <h2>수정 권한이 없습니다.</h2>
        </section>
      </main>
    );
  }

  return <WritePage mode="edit" initialPost={post} onUpdatePost={onUpdatePost} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
