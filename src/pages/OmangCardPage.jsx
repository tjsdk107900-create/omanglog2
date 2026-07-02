import { Download, Share2 } from 'lucide-react';
import Mascot from '../components/Mascot.jsx';

export default function OmangCardPage({ posts }) {
  return (
    <main className="page-shell card-page">
      <div className="page-section-head">
        <h2>오망카드</h2>
      </div>
      <div className="omang-card-grid">
        {posts.slice(0, 4).map((post) => (
          <article className="panel omang-card" key={post.id}>
            <Mascot mood={post.level >= 4 ? 'dizzy' : 'worried'} />
            <p>{post.cardText}</p>
            <strong>{post.tags[0]}</strong>
          </article>
        ))}
      </div>
      <div className="card-actions">
        <button type="button"><Download size={18} /> 저장</button>
        <button type="button"><Share2 size={18} /> 공유</button>
      </div>
    </main>
  );
}
