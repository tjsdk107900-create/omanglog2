import RankingPanel from '../components/RankingPanel.jsx';
import PostListState from '../components/PostListState.jsx';

export default function RankingPage({ posts, postsLoading, postsError, onRetryPosts }) {
  return (
    <main className="page-shell ranking-page">
      <PostListState
        loading={postsLoading}
        error={postsError}
        empty={!posts.length}
        onRetry={onRetryPosts}
      />
      {!postsLoading && !postsError && posts.length ? (
        <>
          <div className="ranking-grid">
            <RankingPanel posts={posts} />
            <RankingPanel posts={posts} mode="empathy" />
          </div>
          <section className="panel ranking-list">
            <h2>실시간 공감 랭킹</h2>
            <ol>
              {[...posts].sort((a, b) => b.empathy - a.empathy).map((post, index) => (
                <li key={post.id}>
                  <span>{index + 1}</span>
                  <b>{post.title}</b>
                  <em>{post.empathy}</em>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}
    </main>
  );
}
