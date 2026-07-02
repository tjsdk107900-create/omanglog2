import { Link, useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Mascot from '../components/Mascot.jsx';

export default function PostDetailPage({ posts }) {
  const { id } = useParams();
  const post = posts.find((item) => item.id === id);

  if (!post) {
    return (
      <main className="page-shell">
        <section className="panel empty-card">
          <h2>게시글을 찾을 수 없어요.</h2>
          <Link to="/feed">피드로 돌아가기</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page">
      <article className="panel detail-card">
        <div className="post-body">
          <Mascot mood="mini" />
          <div className="post-copy">
            <div className="post-meta">
              <b>{post.author}</b>
              <span>{post.time}</span>
            </div>
            <h1>{post.title}</h1>
            <p>{post.body}</p>
            <div className="tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </div>
        <div className="detail-actions">
          <button className="laugh" type="button">공감 {post.empathy}</button>
          <Link to="/omang-card">오망카드 보기</Link>
        </div>
      </article>

      <section className="panel comments-card">
        <h2><MessageCircle size={20} /> 댓글 {post.comments}</h2>
        <ul>
          <li>나도 오늘 비슷하게 망했어요.</li>
          <li>이 정도면 오히려 기록감입니다.</li>
        </ul>
        <form>
          <input placeholder="댓글을 입력하세요" />
          <button type="button">등록</button>
        </form>
      </section>
    </main>
  );
}
