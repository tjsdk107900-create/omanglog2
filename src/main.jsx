import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Copy,
  Crown,
  Link,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import './styles.css';

const hotPosts = [
  {
    name: '익명의 망개',
    time: '2분 전',
    text: '알람 7개 맞춰놓고 다 자버림... 진짜 내일은 일어나겠지...?',
    tags: '#늦잠',
    laugh: 23,
    tap: 11,
  },
  {
    name: '흑역사 제조기',
    time: '5분 전',
    text: '스타벅스 벤티 시켰다가 다 쏟았어요... 하...',
    tags: '#민망 #커피테러',
    laugh: 47,
    tap: 18,
  },
  {
    name: '이번엔 진짜',
    time: '8분 전',
    text: '헬스장 등록하고 첫날부터 몸살... 이게 맞나?',
    tags: '#작심삼일 #운동',
    laugh: 32,
    tap: 9,
  },
];

const feedPosts = [
  {
    name: '익명의 망개',
    time: '10분 전',
    title: '발표 준비를 밤새 했는데...',
    body: '파일을 저장 안 했지 뭐야? 😅',
    tags: ['#발표', '#파일날림', '#멘붕'],
    laugh: 56,
    tap: 23,
    comments: 7,
    sketch: '띠-용!',
  },
  {
    name: '자영업은 어렵다',
    time: '25분 전',
    title: '재료 주문을 2배로 해버려서',
    body: '냉장고 터질 예정...😭',
    tags: ['#자영업', '#실수', '#재고폭탄'],
    laugh: 81,
    tap: 34,
    comments: 12,
    sketch: '망했다...',
  },
  {
    name: '또다이어트실패',
    time: '37분 전',
    title: '오늘도 야식 클리어.',
    body: '내일부터 진짜... 진짜...',
    tags: ['#야식', '#의지박약', '#맛있음'],
    laugh: 44,
    tap: 16,
    comments: 5,
    sketch: '또 먹음',
  },
];

const ranks = [
  ['#늦잠', '1,234'],
  ['#소비', '987'],
  ['#게으름', '755'],
  ['#작심삼일', '542'],
  ['#민망', '501'],
];

const recordTags = ['#소비', '#실수', '#키피아웃', '#지각', '#다이어트실패', '#유머망함'];
const failLevels = ['😐', '😬', '😵', '😭', '💀'];

const onboardingPreviewPosts = [
  {
    title: '회의 10분 전에 발표 자료 저장 안 한 걸 발견함',
    body: '파일명은 최종_진짜최종이었는데 정작 내용은 첫 장뿐...',
    tag: '#업무망함',
  },
  {
    title: '버스 문 닫히는 순간 카드 찍고 서 있었음',
    body: '기사님이랑 눈 마주치고 둘 다 아무 말도 못 했다.',
    tag: '#지각확정',
  },
];

function Mascot({ mood = 'neutral', label }) {
  return (
    <div className={`mascot mascot-${mood}`} aria-label={label ?? '오망로그 캐릭터'}>
      <span className="ear left" />
      <span className="ear right" />
      <span className="face">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
      </span>
    </div>
  );
}

function OnboardingScreen({ onStart, onLogin }) {
  return (
    <main className="onboarding-screen">
      <header className="onboarding-logo" aria-label="오망로그">
        <Mascot mood="dizzy" label="XX눈 캐릭터" />
        <strong>오망로그</strong>
      </header>

      <section className="onboarding-hero" aria-labelledby="onboarding-title">
        <div>
          <h1 id="onboarding-title">오늘도 망한 사람들 모여라</h1>
          <p>익명으로 가볍게 구경해봐!</p>
        </div>

        <div className="onboarding-preview" aria-label="피드 미리보기">
          {onboardingPreviewPosts.map((post) => (
            <article className="onboarding-card" key={post.title}>
              <div className="onboarding-card-head">
                <Mascot mood="mini" />
                <div>
                  <b>익명 망한 사람</b>
                  <span>방금</span>
                </div>
              </div>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
              <em>{post.tag}</em>
            </article>
          ))}
        </div>
      </section>

      <footer className="onboarding-actions">
        <button type="button" onClick={onStart}>1초 만에 내 망함 기록하기</button>
        <button className="onboarding-login" type="button" onClick={onLogin}>
          로그인하고 더 많은 기능 이용하기
        </button>
      </footer>
    </main>
  );
}

function SketchCard({ text }) {
  return (
    <div className="sketch-card">
      <p>{text}</p>
      <div className="laptop">
        <Mascot mood="worried" />
        <span className="screen">!</span>
      </div>
      <button>오망 카드 보기</button>
    </div>
  );
}

function LeftRail({ onRecordClick }) {
  return (
    <aside className="left-rail">
      <div className="brand">
        <h1>오망로그</h1>
        <span>OMANG LOG</span>
      </div>

      <button className="record-button" onClick={onRecordClick} aria-label="망함 기록하기">
        <Plus size={24} />
        망함 기록하기
        <span className="badge">3초 컷!</span>
      </button>

      <section className="install-card panel">
        <button className="icon-only" aria-label="닫기">
          <X size={17} />
        </button>
        <strong>오망로그를 홈 화면에 추가!</strong>
        <p>앱처럼 더 빠르고 간편하게 매일 망함을 기록하세요.</p>
        <button className="small-button">추가하기</button>
        <div className="phone">
          <Mascot mood="neutral" />
          <span>+</span>
        </div>
      </section>

      <section className="panel hot-list">
        <div className="section-head">
          <strong>오늘도 망한 사람들</strong>
          <span>GUEST</span>
        </div>
        {hotPosts.map((post) => (
          <article className="mini-post" key={post.name}>
            <Mascot mood="mini" />
            <div>
              <div className="mini-meta">
                <b>{post.name}</b>
                <span>{post.time}</span>
              </div>
              <p>{post.text}</p>
              <em>{post.tags}</em>
              <div className="mini-actions">
                <span>ㅋㅋ {post.laugh}</span>
                <span>토닥 {post.tap}</span>
              </div>
            </div>
          </article>
        ))}
        <button className="outline-button">
          더 보기 <ChevronDown size={15} />
        </button>
      </section>

      <footer>
        <a>서비스 소개</a>
        <a>이용약관</a>
        <a>개인정보처리방침</a>
        <span>© 2024 OMANG LOG</span>
      </footer>
    </aside>
  );
}

function Header() {
  return (
    <header className="top-nav">
      <nav>
        <a className="active">홈</a>
        <a>피드</a>
        <a>통계</a>
        <a>랭킹</a>
        <a>마이페이지</a>
      </nav>
      <div className="top-tools">
        <label className="search">
          <Search size={18} />
          <input placeholder="망함 태그, 키워드 검색" />
        </label>
        <button className="bell icon-only" aria-label="알림">
          <Bell size={24} />
          <span>2</span>
        </button>
        <button className="avatar icon-only" aria-label="프로필">
          <Mascot mood="mini" />
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero panel">
      <button className="icon-only" aria-label="닫기">
        <X size={18} />
      </button>
      <div className="browser-art">
        <div className="browser-bar">
          <span />
          <span />
          <span />
          <b />
        </div>
        <div className="browser-body">
          <div className="monitor" />
          <Sparkles className="burst" size={40} />
          <Mascot mood="dizzy" />
        </div>
      </div>
      <div className="hero-copy">
        <h2>괜찮아, 누구나 망해.<br />여기는 오늘을 기록하는 곳이야.</h2>
        <p>오늘의 망함도 데이터가 돼!</p>
        <div className="dots">
          <span className="active" />
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function Feed({ posts, latestPostId }) {
  return (
    <main className="feed-column">
      <Hero />
      <div className="feed-tabs">
        <div>
          <button className="active">전체 피드</button>
          <button>팔로잉</button>
        </div>
        <button>
          최신순 <ChevronDown size={15} />
        </button>
      </div>
      <div className="post-list">
        {posts.map((post) => (
          <article className={`post panel${post.id === latestPostId ? ' is-new' : ''}`} key={post.id ?? post.name + post.time}>
            <div className="post-body">
              <Mascot mood="mini" />
              <div className="post-copy">
                <div className="post-meta">
                  <b>{post.name}</b>
                  <span>{post.time}</span>
                </div>
                <h3>{post.title}<br />{post.body}</h3>
                <div className="tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            </div>
            <SketchCard text={post.sketch} />
            <div className="post-actions">
              <button className="laugh">ㅋㅋ {post.laugh}</button>
              <button>토닥 {post.tap}</button>
              <button className="ghost">
                <MessageCircle size={17} /> 댓글 {post.comments}
              </button>
              <span />
              <button className="icon-only" aria-label="공유">
                <Share2 size={18} />
              </button>
              <button className="icon-only" aria-label="더 보기">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function StatsColumn() {
  return (
    <aside className="stats-column">
      <section className="panel weekly-card">
        <h3>이번 주 나의 한눈에 보기</h3>
        <p>05.06 (월) - 05.12 (일)</p>
        <div className="weekly-box">
          <div>
            <strong>이번 주 기록한 망함</strong>
            <p><b>12</b> 회</p>
          </div>
          <div className="speech">수고했어...<br />우리...</div>
          <Mascot mood="tired" />
        </div>
      </section>

      <section className="panel donut-card">
        <h3>망함 카테고리 TOP 5</h3>
        <div className="donut-wrap">
          <div className="donut"><span>TOP<br />5</span></div>
          <ul>
            <li><i className="c1" />소비 <b>30%</b></li>
            <li><i className="c2" />늦잠 <b>25%</b></li>
            <li><i className="c3" />게으름 <b>20%</b></li>
            <li><i className="c4" />일/공부 <b>15%</b></li>
            <li><i className="c5" />기타 <b>10%</b></li>
          </ul>
        </div>
      </section>

      <section className="panel worst-card">
        <h3>이번 주 나의 최대 적</h3>
        <strong>[ 소비 ]</strong>
        <p>였습니다!</p>
        <Mascot mood="sad" />
      </section>

      <section className="panel streak-card">
        <h3>연속 기록 중!</h3>
        <p><b>7</b>일 연속</p>
        <div aria-label="연속 기록">
          <span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span><span>♡</span>
        </div>
      </section>
    </aside>
  );
}

function RightRail() {
  return (
    <aside className="right-rail">
      <section className="panel ranking-card">
        <div className="section-head">
          <h3><Crown size={22} /> 주간 오망왕 랭킹</h3>
          <CircleHelp size={18} />
        </div>
        <div className="rank-tabs">
          <button className="active">태그 랭킹</button>
          <button>공감 랭킹</button>
        </div>
        <ol>
          {ranks.map(([tag, count], index) => (
            <li key={tag}>
              <span>{index + 1}</span>
              <b>{tag}</b>
              <em>{count}</em>
            </li>
          ))}
        </ol>
        <button className="outline-button">전체 랭킹 보기</button>
      </section>

      <section className="panel quote-card">
        <h3>이번 주 공감 폭발 글 <mark>NEW</mark></h3>
        <blockquote>
          소개팅 나갔는데<br />
          핸드폰을 집에 두고 옴..<br />
          연락처도 몰라... 안녕...
        </blockquote>
        <p>#민망 #레전드 #흑역사</p>
        <div><b>ㅋㅋ 1.2K</b><b>토닥 426</b></div>
      </section>

      <section className="panel share-card">
        <h3>친구에게 오망로그 공유하기</h3>
        <p>재미있는 망함은 같이 나눠야 제맛!</p>
        <div className="share-buttons">
          <button aria-label="카카오톡"><MessageCircle size={24} /></button>
          <button aria-label="링크 복사"><Link size={24} /></button>
          <button aria-label="X 공유"><X size={24} /></button>
        </div>
        <div className="share-labels">
          <span>카카오톡</span><span>링크 복사</span><span>X(트위터)</span>
        </div>
      </section>

      <div className="error-toast">
        <div>OMG! ERROR <button aria-label="닫기">×</button></div>
        <section>
          <Mascot mood="pixel" />
          <p><b>오늘도 망하셨습니다!</b><br />괜찮아요, 우리는 모두 망해요.</p>
          <button>확인</button>
        </section>
      </div>
    </aside>
  );
}

function RecordInputScreen({
  inputRef,
  text,
  setText,
  tag,
  setTag,
  failLevel,
  setFailLevel,
  canSubmit,
  onClose,
  onSubmit,
}) {
  return (
    <div className="sheet-layer" role="presentation">
      <form className="record-sheet" onSubmit={onSubmit} role="dialog" aria-modal="true" aria-label="망함 기록">
        <header className="record-topbar">
          <button className="icon-only record-menu" type="button" aria-label="메뉴" onClick={onClose}>
            <Menu size={25} />
          </button>
          <strong>오망로그</strong>
          <span aria-hidden="true" />
        </header>

        <div className="record-question">
          <h2>오늘 뭐가 망했냐?</h2>
        </div>

        <textarea
          ref={inputRef}
          className="record-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="ex) 커피 쏟음, 늦잠, 과소비..."
          rows={4}
          maxLength={120}
          autoFocus
          enterKeyHint="done"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              onSubmit(event);
            }
          }}
        />

        <div className="tag-row" aria-label="태그 선택">
          {recordTags.map((item) => (
            <button
              key={item}
              className={item === tag ? 'active' : ''}
              type="button"
              onClick={() => setTag(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="fail-level" aria-label="망함 지수 선택">
          <span>망함 지수 선택</span>
          <div>
            {failLevels.map((emoji, index) => (
              <button
                key={emoji}
                className={failLevel === index ? 'active' : ''}
                type="button"
                aria-label={`망함 지수 ${index + 1}단계`}
                onClick={() => setFailLevel(index)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <button className="add-tag-button" type="button">+ 직접 입력 태그 추가</button>

        <button className="submit-record" type="submit" disabled={!canSubmit}>
          망함 기록하기
        </button>
      </form>
    </div>
  );
}

function QuickRecordSheet({ isOpen, onClose, onSubmit }) {
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const [tag, setTag] = useState(recordTags[0]);
  const [failLevel, setFailLevel] = useState(2);

  useEffect(() => {
    if (!isOpen) return;
    const focusInput = () => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.setSelectionRange?.(inputRef.current.value.length, inputRef.current.value.length);
    };
    focusInput();
    const animationFrame = window.requestAnimationFrame(focusInput);
    const focusTimer = window.setTimeout(focusInput, 120);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    const resetTimer = window.setTimeout(() => {
      setText('');
      setTag(recordTags[0]);
      setFailLevel(2);
    }, 160);
    return () => window.clearTimeout(resetTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = text.trim().length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      id: `post-${Date.now()}`,
      name: '나의 망함',
      time: '방금',
      title: text.trim(),
      body: '그래도 기록했으니 오늘은 통과.',
      tags: [tag],
      laugh: failLevel + 1,
      tap: 0,
      comments: 0,
      sketch: '망함 기록 완료',
    });
  };

  return (
    <RecordInputScreen
      inputRef={inputRef}
      text={text}
      setText={setText}
      tag={tag}
      setTag={setTag}
      failLevel={failLevel}
      setFailLevel={setFailLevel}
      canSubmit={canSubmit}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );

  return (
    <div className="sheet-layer" role="presentation">
      <button className="sheet-scrim" aria-label="닫기" onClick={onClose} />
      <form className="record-sheet" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-label="망함 기록">
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div>
            <strong>지금 망함 기록</strong>
            <span>쓰고, 태그 하나 고르면 바로 완료</span>
          </div>
          <button className="icon-only sheet-close" type="button" aria-label="닫기" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <textarea
          ref={inputRef}
          className="record-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="방금 뭐가 망했나요?"
          rows={4}
          maxLength={120}
          autoFocus
          enterKeyHint="done"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              handleSubmit(event);
            }
          }}
        />
        <div className="tag-row" aria-label="태그 선택">
          {recordTags.map((item) => (
            <button
              key={item}
              className={item === tag ? 'active' : ''}
              type="button"
              onClick={() => setTag(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="submit-record" type="submit" disabled={!canSubmit}>
          망함 기록하기
        </button>
      </form>
    </div>
  );
}

function QuickCompleteDialog({ isOpen, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="retro-dialog-layer" role="presentation">
      <div className="retro-dialog" role="alertdialog" aria-modal="true" aria-label="OOPS popup">
        <div className="retro-title">
          <span>OOPS!</span>
          <button aria-label="닫기" onClick={onConfirm}>X</button>
        </div>
        <section>
          <div className="retro-emoji" aria-hidden="true">૮₍ ´ ꒳ `₎ა</div>
          <p><b>망함 기록 완료!</b><br />방금 쓴 오망을 피드에 올릴게요.</p>
          <button onClick={onConfirm}>확인</button>
        </section>
      </div>
    </div>
  );
}

function App() {
  const [posts, setPosts] = useState(feedPosts);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [pendingPost, setPendingPost] = useState(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [latestPostId, setLatestPostId] = useState(null);

  const orderedPosts = useMemo(() => posts, [posts]);

  const handleSubmitRecord = (post) => {
    setPendingPost(post);
    setIsSheetOpen(false);
    window.setTimeout(() => setIsCompleteOpen(true), 90);
  };

  const handleConfirmComplete = () => {
    if (pendingPost) {
      setPosts((currentPosts) => [pendingPost, ...currentPosts]);
      setLatestPostId(pendingPost.id);
      window.requestAnimationFrame(() => {
        document.querySelector('.post-list')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
    setPendingPost(null);
    setIsCompleteOpen(false);
  };

  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingScreen
          onStart={() => {
            setHasCompletedOnboarding(true);
            setIsSheetOpen(true);
          }}
          onLogin={() => setHasCompletedOnboarding(true)}
        />
      </>
    );
  }

  return (
    <div className="app-shell">
      <LeftRail onRecordClick={() => setIsSheetOpen(true)} />
      <div className="content">
        <Header />
        <div className="dashboard">
          <Feed posts={orderedPosts} latestPostId={latestPostId} />
          <StatsColumn />
          <RightRail />
        </div>
      </div>
      <QuickRecordSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={handleSubmitRecord}
      />
      <QuickCompleteDialog isOpen={isCompleteOpen} onConfirm={handleConfirmComplete} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
