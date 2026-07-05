import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './lib/supabase.js';
import AppLayout from './components/AppLayout.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { initialPosts } from './data/mockData.js';
import AuthPage from './pages/AuthPage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import HomePage from './pages/HomePage.jsx';
import MyPage from './pages/MyPage.jsx';
import OmangCardPage from './pages/OmangCardPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';
import ProfileSetupPage from './pages/ProfileSetupPage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
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
  const [posts, setPosts] = useState(initialPosts);
  const navigate = useNavigate();

  const handleCreatePost = (postInput) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: '오망로그 사용자',
      time: '방금',
      comments: 0,
      empathy: 0,
      cardText: '오늘의 오망 기록 완료',
      ...postInput,
    };

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    navigate('/feed');
  };

  return (
    <Routes>
      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="signup" element={<AuthPage mode="signup" />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<HomePage posts={posts} />} />
        <Route path="feed" element={<FeedPage posts={posts} />} />
        <Route path="write" element={<WritePage onCreatePost={handleCreatePost} />} />
        <Route path="stats" element={<StatsPage posts={posts} />} />
        <Route path="ranking" element={<RankingPage posts={posts} />} />
        <Route path="mypage" element={<MyPage posts={posts} />} />
        <Route path="profile-setup" element={<ProfileSetupPage />} />
        <Route path="post/:id" element={<PostDetailPage posts={posts} />} />
        <Route path="omang-card" element={<OmangCardPage posts={posts} />} />
      </Route>
    </Routes>
  );
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
