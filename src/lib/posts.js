import { supabase } from './supabase.js';
import { normalizeTags } from './tags.js';

const DEFAULT_AUTHOR = '오망로그 사용자';
const FALLBACK_BODY = '아직 자세한 설명은 없지만, 기록은 남겨두었습니다.';
const LIKE_SETUP_ERROR = '공감 기능 DB 설정이 필요합니다.';
const COMMENT_SETUP_ERROR = '댓글 기능 DB 설정이 필요합니다.';
const MISSING_SCHEMA_CODES = ['PGRST106', 'PGRST205', '42P01'];

function getPostAuthorId(row) {
  return row.user_id ?? row.author_id ?? row.profile_id ?? null;
}

function getProfileFromRow(row, profilesById) {
  const embeddedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return embeddedProfile ?? profilesById?.get(getPostAuthorId(row)) ?? null;
}

function formatRelativeTime(value) {
  if (!value) return '';

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return '';

  const diffMs = Date.now() - createdAt.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;

  return createdAt.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function isMissingSchemaError(error) {
  return MISSING_SCHEMA_CODES.includes(error?.code);
}

export function mapPost(row, profilesById, likeMetadata, commentMetadata) {
  const profile = getProfileFromRow(row, profilesById);
  const createdAt = row.created_at ?? row.inserted_at ?? row.updated_at ?? null;
  const title = row.title ?? row.card_text ?? row.cardText ?? '제목 없는 기록';
  const body = row.body ?? row.content ?? row.description ?? FALLBACK_BODY;
  const id = String(row.id);
  const fallbackLikes = Number(row.empathy ?? row.empathy_count ?? 0);
  const fallbackComments = Number(row.comments ?? row.comment_count ?? 0);

  return {
    id,
    author: profile?.nickname ?? row.author ?? DEFAULT_AUTHOR,
    authorAvatar: profile?.profile_image ?? row.profile_image ?? null,
    authorId: getPostAuthorId(row),
    time: formatRelativeTime(createdAt),
    createdAt,
    createdAtMs: createdAt ? new Date(createdAt).getTime() : 0,
    title,
    body,
    tags: normalizeTags(row.tags),
    level: Number(row.level ?? row.fail_level ?? 1),
    empathy: likeMetadata?.countsByPostId.get(id) ?? fallbackLikes,
    likedByMe: likeMetadata?.likedPostIds.has(id) ?? false,
    likeError: likeMetadata?.error ?? '',
    comments: commentMetadata?.countsByPostId.get(id) ?? fallbackComments,
    commentError: commentMetadata?.error ?? '',
    cardText: row.card_text ?? row.cardText ?? title,
  };
}

function mapComment(row, profilesById) {
  const embeddedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const profile = embeddedProfile ?? profilesById?.get(row.user_id) ?? null;

  return {
    id: String(row.id),
    postId: String(row.post_id),
    userId: row.user_id,
    author: profile?.nickname ?? DEFAULT_AUTHOR,
    authorAvatar: profile?.profile_image ?? null,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    time: formatRelativeTime(row.created_at),
    edited: Boolean(row.updated_at && row.created_at && row.updated_at !== row.created_at),
  };
}

async function fetchProfilesByIds(profileIds) {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image')
    .in('id', uniqueIds);

  if (error) throw error;

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

export async function fetchProfilesForPosts(rows) {
  return fetchProfilesByIds(rows.map(getPostAuthorId));
}

export async function fetchLikeMetadata(rows, userId) {
  const postIds = rows.map((row) => String(row.id));
  const countsByPostId = new Map();
  const likedPostIds = new Set();

  if (!postIds.length) {
    return { countsByPostId, likedPostIds, error: '' };
  }

  const [countsResponse, mineResponse] = await Promise.all([
    supabase
      .from('post_like_counts')
      .select('post_id, like_count')
      .in('post_id', postIds),
    userId
      ? supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const likeError = countsResponse.error || mineResponse.error;
  if (likeError) {
    if (isMissingSchemaError(likeError)) {
      return { countsByPostId, likedPostIds, error: LIKE_SETUP_ERROR };
    }
    return { countsByPostId, likedPostIds, error: likeError.message };
  }

  for (const item of countsResponse.data ?? []) {
    countsByPostId.set(String(item.post_id), Number(item.like_count ?? 0));
  }

  for (const item of mineResponse.data ?? []) {
    likedPostIds.add(String(item.post_id));
  }

  return { countsByPostId, likedPostIds, error: '' };
}

export async function fetchCommentMetadata(rows) {
  const postIds = rows.map((row) => String(row.id));
  const countsByPostId = new Map();

  if (!postIds.length) {
    return { countsByPostId, error: '' };
  }

  const { data, error } = await supabase
    .from('post_comment_counts')
    .select('post_id, comment_count')
    .in('post_id', postIds);

  if (error) {
    if (isMissingSchemaError(error)) {
      return { countsByPostId, error: COMMENT_SETUP_ERROR };
    }
    return { countsByPostId, error: error.message };
  }

  for (const item of data ?? []) {
    countsByPostId.set(String(item.post_id), Number(item.comment_count ?? 0));
  }

  return { countsByPostId, error: '' };
}

function normalizePostSort(sort) {
  return sort === 'popular' ? 'popular' : 'latest';
}

function sortMappedPosts(posts, sort) {
  const normalizedSort = normalizePostSort(sort);
  return [...posts].sort((a, b) => {
    if (normalizedSort === 'popular') {
      const likeDelta = Number(b.empathy ?? 0) - Number(a.empathy ?? 0);
      if (likeDelta !== 0) return likeDelta;
    }

    const timeDelta = Number(b.createdAtMs ?? 0) - Number(a.createdAtMs ?? 0);
    if (timeDelta !== 0) return timeDelta;
    return String(a.id).localeCompare(String(b.id));
  });
}

export async function fetchPosts(options = {}) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const userId = typeof options === 'string' ? options : options.userId;
  const sort = typeof options === 'string' ? 'latest' : normalizePostSort(options.sort);

  const joinedResponse = await supabase
    .from('posts')
    .select('*, profiles(id, nickname, profile_image)')
    .order('created_at', { ascending: false });

  if (!joinedResponse.error) {
    const [likeMetadata, commentMetadata] = await Promise.all([
      fetchLikeMetadata(joinedResponse.data ?? [], userId),
      fetchCommentMetadata(joinedResponse.data ?? []),
    ]);
    return sortMappedPosts((joinedResponse.data ?? []).map((row) => (
      mapPost(row, undefined, likeMetadata, commentMetadata)
    )), sort);
  }

  const response = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (response.error) throw response.error;

  const [profilesById, likeMetadata, commentMetadata] = await Promise.all([
    fetchProfilesForPosts(response.data ?? []),
    fetchLikeMetadata(response.data ?? [], userId),
    fetchCommentMetadata(response.data ?? []),
  ]);

  return sortMappedPosts((response.data ?? []).map((row) => (
    mapPost(row, profilesById, likeMetadata, commentMetadata)
  )), sort);
}

export async function createPost({ title, body, tags, level, cardText, userId }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const payload = {
    user_id: userId,
    title,
    body,
    tags: normalizeTags(tags),
    level,
    card_text: cardText,
  };

  const { error } = await supabase.from('posts').insert(payload);
  if (error) throw error;
}

export async function updatePost({ postId, userId, title, body, tags, level, cardText }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const normalizedTitle = title.trim();
  const normalizedBody = body.trim();

  if (!normalizedTitle) {
    throw new Error('제목을 입력해주세요.');
  }

  if (!normalizedBody) {
    throw new Error('내용을 입력해주세요.');
  }

  const { data, error } = await supabase
    .from('posts')
    .update({
      title: normalizedTitle,
      body: normalizedBody,
      tags: normalizeTags(tags),
      level,
      card_text: cardText?.trim() || normalizedTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('수정 권한이 없거나 게시글을 찾을 수 없습니다.');
    }
    throw error;
  }
  return data;
}

export async function deletePost({ postId, userId }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  if (!data?.length) {
    throw new Error('삭제 권한이 없거나 게시글을 찾을 수 없습니다.');
  }
}

export async function togglePostLike({ postId, userId, liked }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  if (liked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return { liked: false };
  }

  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId });

  if (error) {
    if (error.code === '23505') return { liked: true };
    throw error;
  }

  return { liked: true };
}

export async function fetchComments(postId) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const joinedResponse = await supabase
    .from('comments')
    .select('*, profiles(id, nickname, profile_image)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (!joinedResponse.error) {
    return (joinedResponse.data ?? []).map((row) => mapComment(row));
  }

  if (isMissingSchemaError(joinedResponse.error)) {
    throw new Error(COMMENT_SETUP_ERROR);
  }

  const response = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (response.error) {
    if (isMissingSchemaError(response.error)) throw new Error(COMMENT_SETUP_ERROR);
    throw response.error;
  }

  const profilesById = await fetchProfilesByIds((response.data ?? []).map((row) => row.user_id));
  return (response.data ?? []).map((row) => mapComment(row, profilesById));
}

export async function createComment({ postId, userId, content }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    throw new Error('댓글 내용을 입력해주세요.');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: normalizedContent,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateComment({ commentId, userId, content }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    throw new Error('댓글 내용을 입력해주세요.');
  }

  const { data, error } = await supabase
    .from('comments')
    .update({
      content: normalizedContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment({ commentId, userId }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) throw error;
}
