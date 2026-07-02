import { useState } from 'react';
import { failLevels, tags as defaultTags } from '../data/mockData.js';

export default function WritePage({ onCreatePost }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState([defaultTags[0]]);
  const [customTag, setCustomTag] = useState('');
  const [level, setLevel] = useState(3);

  const toggleTag = (tag) => {
    setSelectedTags((current) => (
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    ));
  };

  const addCustomTag = () => {
    const normalized = customTag.trim().startsWith('#') ? customTag.trim() : `#${customTag.trim()}`;
    if (!customTag.trim() || selectedTags.includes(normalized)) return;
    setSelectedTags((current) => [...current, normalized]);
    setCustomTag('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    onCreatePost({
      title: title.trim(),
      body: body.trim() || '아직 자세한 설명은 없지만, 기록은 남겼습니다.',
      tags: selectedTags.length ? selectedTags : ['#기록'],
      level,
      cardText: title.trim(),
    });
  };

  return (
    <main className="write-page">
      <form className="record-sheet inline-record" onSubmit={handleSubmit}>
        <div className="record-question">
          <p className="eyebrow">WRITE</p>
          <h2>오늘 뭐가 망했나요?</h2>
        </div>

        <input
          className="record-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 발표 자료를 잘못 올렸다"
          maxLength={60}
        />

        <textarea
          className="record-input"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="조금 더 자세히 적어도 좋아요."
          rows={4}
          maxLength={180}
        />

        <div className="tag-row" aria-label="태그 선택">
          {defaultTags.map((tag) => (
            <button
              key={tag}
              className={selectedTags.includes(tag) ? 'active' : ''}
              type="button"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="custom-tag-row">
          <input
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder="직접 입력 태그"
          />
          <button type="button" onClick={addCustomTag}>추가</button>
        </div>

        <section className="fail-level" aria-label="오망 지수 선택">
          <span>오망 지수 선택</span>
          <div>
            {failLevels.map((item) => (
              <button
                key={item.value}
                className={level === item.value ? 'active' : ''}
                type="button"
                aria-label={`오망 지수 ${item.value}단계`}
                onClick={() => setLevel(item.value)}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </section>

        <button className="submit-record" type="submit" disabled={!title.trim()}>
          기록하기
        </button>
      </form>
    </main>
  );
}
