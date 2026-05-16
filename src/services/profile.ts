import { apiRequest, apiRequestFormData } from './client';
import type {
  CurrentProfile,
  Issue,
  UserCommentItem,
  UserProfileDetail,
} from '../types/api';

/**
 * Obté les dades del perfil de l'usuari autenticat (inclou la clau d'API).
 * Equival a `GET /profile`.
 */
export const fetchCurrentProfile = () =>
  apiRequest<CurrentProfile>('profile');

/**
 * Actualitza la biografia del perfil propi via JSON.
 */
export const updateProfileBio = (bio: string) =>
  apiRequest<{ message: string; bio: string; avatar: string | null }>(
    'profile',
    {
      method: 'PUT',
      body: { bio },
    },
  );

/**
 * Puja un nou avatar (i opcionalment biografia) emprant multipart/form-data.
 */
export const updateProfileAvatar = (avatar: File, bio?: string) => {
  const formData = new FormData();
  formData.append('avatar', avatar);
  if (bio !== undefined) {
    formData.append('bio', bio);
  }
  return apiRequestFormData<{
    message: string;
    bio: string;
    avatar: string | null;
  }>('profile', formData, 'PUT');
};

/**
 * Obté el perfil públic d'un usuari pel seu username (estadístiques incloses).
 */
export const fetchUserProfile = (username: string) =>
  apiRequest<UserProfileDetail>(`users/${encodeURIComponent(username)}`);

export const fetchUserAssignedIssues = (username: string) =>
  apiRequest<Issue[]>(`users/${encodeURIComponent(username)}/assigned`);

export const fetchUserWatchedIssues = (username: string) =>
  apiRequest<Issue[]>(`users/${encodeURIComponent(username)}/watched`);

export const fetchUserComments = (username: string) =>
  apiRequest<UserCommentItem[]>(`users/${encodeURIComponent(username)}/comments`);
