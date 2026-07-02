import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import { initialPosts } from './data/mockData.js';
import FeedPage from './pages/FeedPage.jsx';
import HomePage from './pages/HomePage.jsx';
import MyPage from './pages/MyPage.jsx';
import OmangCardPage from './pages/OmangCardPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import WritePage from './pages/WritePage.jsx';
import './styles.css';

function AppRoutes() {
  const [posts, setPosts] = useState(initialPosts);
  const navigate = useNavigate();

  const handleCreatePost = (postInput) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: '익명의 오망러',
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
      <Route element={<AppLayout />}>
        <Route index element={<HomePage posts={posts} />} />
        <Route path="feed" element={<FeedPage posts={posts} />} />
        <Route path="write" element={<WritePage onCreatePost={handleCreatePost} />} />
        <Route path="stats" element={<StatsPage posts={posts} />} />
        <Route path="ranking" element={<RankingPage posts={posts} />} />
        <Route path="mypage" element={<MyPage posts={posts} />} />
        <Route path="post/:id" element={<PostDetailPage posts={posts} />} />
        <Route path="omang-card" element={<OmangCardPage posts={posts} />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);
