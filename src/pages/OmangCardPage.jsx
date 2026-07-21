import { Download, Share2 } from 'lucide-react';
import Mascot from '../components/Mascot.jsx';
import PostListState from '../components/PostListState.jsx';
import { formatTagLabel } from '../lib/tags.js';

export default function OmangCardPage({ posts, postsLoading, postsError, onRetryPosts }) {
  return (
    <main className="page-shell card-page">
      <div className="page-section-head">
        <h2>오망카드</h2>
      </div>
      <div className="omang-card-grid">
        <PostListState
          loading={postsLoading}
          error={postsError}
          empty={!posts.length}
          onRetry={onRetryPosts}
        />
        {!postsLoading && !postsError
          ? posts.slice(0, 4).map((post) => (
            <article className="panel omang-card" key={post.id}>
              <Mascot mood={post.level >= 4 ? 'dizzy' : 'worried'} />
              <p>{post.cardText}</p>
              {post.tags[0] ? <strong>{formatTagLabel(post.tags[0])}</strong> : null}
            </article>
          ))
          : null}
      </div>
      <div className="card-actions">
        <button type="button"><Download size={18} /> 저장</button>
        <button type="button"><Share2 size={18} /> 공유</button>
      </div>
    </main>
  );
}
