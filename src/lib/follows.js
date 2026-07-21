import { supabase } from './supabase.js';

const DEFAULT_AUTHOR = '오망로그 사용자';
const FOLLOW_SETUP_ERROR = '팔로우 기능 DB 설정이 필요합니다.';
const MISSING_SCHEMA_CODES = ['PGRST106', 'PGRST205', '42P01'];

function isMissingSchemaError(error) {
  return MISSING_SCHEMA_CODES.includes(error?.code);
}

function mapProfile(row, counts, isFollowing = false, followError = '') {
  return {
    id: row.id,
    nickname: row.nickname ?? DEFAULT_AUTHOR,
    profileImage: row.profile_image ?? null,
    updatedAt: row.updated_at ?? null,
    followerCount: counts?.followerCount ?? 0,
    followingCount: counts?.followingCount ?? 0,
    isFollowing,
    followError,
  };
}

function mapFollowProfile(row) {
  if (!row) return null;
  const profile = row.follower ?? row.following ?? row.profiles ?? row;

  return {
    id: profile.id,
    nickname: profile.nickname ?? DEFAULT_AUTHOR,
    profileImage: profile.profile_image ?? null,
  };
}

async function fetchFollowCounts(profileIds) {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  const countsByProfileId = new Map();

  if (!uniqueIds.length) return { countsByProfileId, error: '' };

  const { data, error } = await supabase
    .from('follow_counts')
    .select('profile_id, follower_count, following_count')
    .in('profile_id', uniqueIds);

  if (error) {
    if (isMissingSchemaError(error)) {
      return { countsByProfileId, error: FOLLOW_SETUP_ERROR };
    }
    return { countsByProfileId, error: error.message };
  }

  for (const item of data ?? []) {
    countsByProfileId.set(item.profile_id, {
      followerCount: Number(item.follower_count ?? 0),
      followingCount: Number(item.following_count ?? 0),
    });
  }

  return { countsByProfileId, error: '' };
}

export async function fetchUserProfile(profileId, currentUserId) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image, updated_at')
    .eq('id', profileId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [{ countsByProfileId, error: followError }, followingResponse] = await Promise.all([
    fetchFollowCounts([profileId]),
    currentUserId && currentUserId !== profileId
      ? supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  let isFollowing = Boolean(followingResponse.data);
  let resolvedFollowError = followError;

  if (followingResponse.error && !['PGRST116'].includes(followingResponse.error.code)) {
    if (isMissingSchemaError(followingResponse.error)) {
      resolvedFollowError = FOLLOW_SETUP_ERROR;
    } else {
      resolvedFollowError = followingResponse.error.message;
    }
    isFollowing = false;
  }

  return mapProfile(
    data,
    countsByProfileId.get(profileId),
    isFollowing,
    resolvedFollowError,
  );
}

export async function toggleFollow({ currentUserId, targetUserId, isFollowing }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!currentUserId) {
    throw new Error('로그인이 필요합니다.');
  }

  if (currentUserId === targetUserId) {
    throw new Error('자기 자신은 팔로우할 수 없습니다.');
  }

  if (isFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId);

    if (error) {
      if (isMissingSchemaError(error)) throw new Error(FOLLOW_SETUP_ERROR);
      throw error;
    }
    return { isFollowing: false };
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    });

  if (error) {
    if (isMissingSchemaError(error)) throw new Error(FOLLOW_SETUP_ERROR);
    if (error.code === '23505') return { isFollowing: true };
    throw error;
  }

  return { isFollowing: true };
}

export async function fetchFollowList(profileId, type) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const select =
    type === 'followers'
      ? 'follower:profiles!follows_follower_id_fkey(id, nickname, profile_image)'
      : 'following:profiles!follows_following_id_fkey(id, nickname, profile_image)';
  const column = type === 'followers' ? 'following_id' : 'follower_id';

  const joinedResponse = await supabase
    .from('follows')
    .select(select)
    .eq(column, profileId)
    .order('created_at', { ascending: false });

  if (!joinedResponse.error) {
    return (joinedResponse.data ?? []).map(mapFollowProfile);
  }

  if (isMissingSchemaError(joinedResponse.error)) {
    throw new Error(FOLLOW_SETUP_ERROR);
  }

  const fallbackResponse = await supabase
    .from('follows')
    .select(type === 'followers' ? 'follower_id' : 'following_id')
    .eq(column, profileId)
    .order('created_at', { ascending: false });

  if (fallbackResponse.error) {
    if (isMissingSchemaError(fallbackResponse.error)) throw new Error(FOLLOW_SETUP_ERROR);
    throw fallbackResponse.error;
  }

  const ids = (fallbackResponse.data ?? []).map((row) => (
    type === 'followers' ? row.follower_id : row.following_id
  ));

  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image')
    .in('id', ids);

  if (error) throw error;

  const profilesById = new Map((data ?? []).map((profile) => [profile.id, profile]));
  return ids.map((id) => mapFollowProfile(profilesById.get(id))).filter(Boolean);
}
