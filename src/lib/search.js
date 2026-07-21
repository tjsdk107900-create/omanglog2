import { supabase } from './supabase.js';
import { fetchCommentMetadata, fetchLikeMetadata, fetchProfilesForPosts, mapPost } from './posts.js';
import { cleanTagName } from './tags.js';

const DEFAULT_AUTHOR = '오망로그 사용자';
const LIMIT = 12;

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function normalizeQuery(query) {
  return query.trim().replace(/\s+/g, ' ');
}

function mapUser(row, followingIds = new Set()) {
  return {
    id: row.id,
    nickname: row.nickname ?? DEFAULT_AUTHOR,
    profileImage: row.profile_image ?? null,
    bio: row.bio ?? row.introduction ?? '',
    identifier: row.username ?? row.handle ?? row.id,
    isFollowing: followingIds.has(row.id),
    followError: '',
  };
}

async function fetchFollowingIds(currentUserId, targetIds) {
  if (!currentUserId || !targetIds.length) return { followingIds: new Set(), error: '' };

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)
    .in('following_id', targetIds);

  if (error) {
    if (['PGRST106', 'PGRST205', '42P01'].includes(error.code)) {
      return { followingIds: new Set(), error: '팔로우 기능 DB 설정이 필요합니다.' };
    }
    return { followingIds: new Set(), error: error.message };
  }

  return { followingIds: new Set((data ?? []).map((item) => item.following_id)), error: '' };
}

async function searchUsers(pattern, currentUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image, updated_at')
    .ilike('nickname', pattern)
    .limit(LIMIT);

  if (error) throw error;

  const users = data ?? [];
  const { followingIds, error: followError } = await fetchFollowingIds(
    currentUserId,
    users.map((user) => user.id).filter((id) => id !== currentUserId),
  );

  return users.map((user) => ({
    ...mapUser(user, followingIds),
    followError,
  }));
}

async function searchPosts(pattern, query, currentUserId) {
  const tag = cleanTagName(query);
  const legacyTag = tag ? `#${tag}` : '';
  const [titleResponse, bodyResponse, tagResponse, legacyTagResponse] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .ilike('title', pattern)
      .order('created_at', { ascending: false })
      .limit(LIMIT),
    supabase
      .from('posts')
      .select('*')
      .ilike('body', pattern)
      .order('created_at', { ascending: false })
      .limit(LIMIT),
    tag
      ? supabase
        .from('posts')
        .select('*')
        .contains('tags', [tag])
        .order('created_at', { ascending: false })
        .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
    legacyTag
      ? supabase
        .from('posts')
        .select('*')
        .contains('tags', [legacyTag])
        .order('created_at', { ascending: false })
        .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (titleResponse.error) throw titleResponse.error;
  if (bodyResponse.error) throw bodyResponse.error;

  const rowsById = new Map();
  for (const row of titleResponse.data ?? []) rowsById.set(row.id, row);
  for (const row of bodyResponse.data ?? []) rowsById.set(row.id, row);
  if (!tagResponse.error) {
    for (const row of tagResponse.data ?? []) rowsById.set(row.id, row);
  }
  if (!legacyTagResponse.error) {
    for (const row of legacyTagResponse.data ?? []) rowsById.set(row.id, row);
  }

  const rows = [...rowsById.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, LIMIT);

  const [profilesById, likeMetadata, commentMetadata] = await Promise.all([
    fetchProfilesForPosts(rows),
    fetchLikeMetadata(rows, currentUserId),
    fetchCommentMetadata(rows),
  ]);

  return rows.map((row) => mapPost(row, profilesById, likeMetadata, commentMetadata));
}

export async function searchAll(query, currentUserId) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return { users: [], posts: [] };

  const textQuery = normalizedQuery.replace(/^#+/, '');
  const pattern = `%${escapeLikePattern(textQuery)}%`;
  const [users, posts] = await Promise.all([
    searchUsers(pattern, currentUserId),
    searchPosts(pattern, normalizedQuery, currentUserId),
  ]);

  return { users, posts };
}
