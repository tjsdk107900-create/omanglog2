import RankingPanel from '../components/RankingPanel.jsx';

export default function RankingPage({ posts }) {
  return (
    <main className="page-shell ranking-grid">
      <RankingPanel posts={posts} />
      <RankingPanel posts={posts} mode="empathy" />
      <section className="panel ranking-card full-ranking">
        <div className="section-head">
          <h3>전체 랭킹 보기</h3>
        </div>
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
    </main>
  );
}
