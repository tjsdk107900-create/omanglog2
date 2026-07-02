import { ChevronDown } from 'lucide-react';
import PostCard from '../components/PostCard.jsx';

export default function FeedPage({ posts }) {
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.time === '방금') return -1;
    if (b.time === '방금') return 1;
    return 0;
  });

  return (
    <main className="page-shell">
      <div className="feed-tabs">
        <div>
          <button className="active" type="button">전체 피드</button>
          <button type="button">팔로잉</button>
        </div>
        <button type="button">최신순 <ChevronDown size={15} /></button>
      </div>
      <div className="post-list">
        {sortedPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </main>
  );
}
