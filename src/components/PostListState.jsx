export default function PostListState({ loading, error, empty, onRetry }) {
  if (loading) {
    return (
      <section className="panel empty-card">
        <h2>게시글을 불러오는 중입니다.</h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel empty-card">
        <h2>게시글을 불러오지 못했습니다.</h2>
        <p>{error}</p>
        {onRetry ? <button type="button" onClick={onRetry}>다시 시도</button> : null}
      </section>
    );
  }

  if (empty) {
    return (
      <section className="panel empty-card">
        <h2>아직 작성된 게시글이 없습니다.</h2>
        <p>첫 번째 오망 기록을 남겨보세요.</p>
      </section>
    );
  }

  return null;
}
