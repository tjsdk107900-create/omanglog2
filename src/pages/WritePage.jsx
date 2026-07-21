import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { failLevels, tags as defaultTags } from '../data/postOptions.js';
import { MAX_TAGS_PER_POST, MAX_TAG_LENGTH, cleanTagName, formatTagLabel, normalizeTags } from '../lib/tags.js';

export default function WritePage({ onCreatePost, onUpdatePost, initialPost, mode = 'create' }) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [body, setBody] = useState(initialPost?.body ?? '');
  const [selectedTags, setSelectedTags] = useState(
    initialPost?.tags?.length ? normalizeTags(initialPost.tags) : normalizeTags([defaultTags[0]]),
  );
  const [customTag, setCustomTag] = useState('');
  const [level, setLevel] = useState(initialPost?.level ?? 3);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!initialPost) return;
    setTitle(initialPost.title ?? '');
    setBody(initialPost.body ?? '');
    setSelectedTags(initialPost.tags?.length ? normalizeTags(initialPost.tags) : normalizeTags([defaultTags[0]]));
    setLevel(initialPost.level ?? 3);
  }, [initialPost]);

  const toggleTag = (tag) => {
    const normalized = cleanTagName(tag);
    if (!normalized) return;
    setSelectedTags((current) => (
      current.includes(normalized)
        ? current.filter((item) => item !== normalized)
        : current.length >= MAX_TAGS_PER_POST
          ? current
          : [...current, normalized]
    ));
  };

  const addCustomTag = () => {
    const normalized = cleanTagName(customTag);
    if (!normalized || selectedTags.includes(normalized) || selectedTags.length >= MAX_TAGS_PER_POST) return;
    setSelectedTags((current) => [...current, normalized]);
    setCustomTag('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || (isEdit && !body.trim()) || submitting) return;

    setSubmitting(true);
    setMessage('');

    try {
      const payload = {
        title: title.trim(),
        body: body.trim() || '아직 자세한 설명은 없지만, 기록은 남겨두었습니다.',
        tags: normalizeTags(selectedTags.length ? selectedTags : ['기록']),
        level,
        cardText: title.trim(),
      };

      if (isEdit) {
        await onUpdatePost(initialPost.id, payload);
      } else {
        await onCreatePost(payload);
      }
    } catch (error) {
      console.error(`[Supabase] post ${isEdit ? 'update' : 'create'} failed`, error);
      setMessage(error.message || `게시글 ${isEdit ? '수정' : '저장'} 중 오류가 발생했습니다.`);
      setSubmitting(false);
    }
  };

  return (
    <main className="write-page">
      <form className="record-sheet inline-record" onSubmit={handleSubmit}>
        <div className="record-question">
          <p className="eyebrow">{isEdit ? 'EDIT' : 'WRITE'}</p>
          <h2>{isEdit ? '기록을 수정할까요?' : '오늘 뭐가 망했나요?'}</h2>
        </div>

        <input
          className="record-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 발표 자료를 잘못 올렸어요"
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
              className={selectedTags.includes(cleanTagName(tag)) ? 'active' : ''}
              type="button"
              onClick={() => toggleTag(tag)}
            >
              {formatTagLabel(tag)}
            </button>
          ))}
        </div>

        {selectedTags.length ? (
          <div className="selected-tags" aria-label="선택된 태그">
            {selectedTags.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}>
                {formatTagLabel(tag)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="custom-tag-row">
          <input
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="직접 입력 태그"
            maxLength={MAX_TAG_LENGTH + 1}
          />
          <button
            type="button"
            disabled={!cleanTagName(customTag) || selectedTags.length >= MAX_TAGS_PER_POST}
            onClick={addCustomTag}
          >
            추가
          </button>
        </div>

        <section className="fail-level" aria-label="오망 지수 선택">
          <span>오망 지수 선택</span>
          <div>
            {failLevels.map((item) => (
              <button
                key={item.value}
                className={level === item.value ? 'active' : ''}
                type="button"
                aria-label={`오망 지수 ${item.value}단계: ${item.label}`}
                onClick={() => setLevel(item.value)}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </section>

        {message ? <p className="auth-message">{message}</p> : null}

        <div className="write-actions">
          {isEdit ? (
            <button className="secondary-record" type="button" disabled={submitting} onClick={() => navigate(`/post/${initialPost.id}`)}>
              취소
            </button>
          ) : null}
          <button className="submit-record" type="submit" disabled={!title.trim() || (isEdit && !body.trim()) || submitting}>
            {submitting ? '저장 중...' : isEdit ? '수정하기' : '기록하기'}
          </button>
        </div>
      </form>
    </main>
  );
}
