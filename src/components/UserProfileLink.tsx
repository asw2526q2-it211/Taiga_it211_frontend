import React from 'react';
import { Link } from 'react-router-dom';

interface UserProfileLinkProps {
  username: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Enllaç al perfil públic d'un usuari (`/profile/:username`).
 * Manté l'estètica accent del frontend (equivalent a `users:profile` al Django).
 */
export const UserProfileLink: React.FC<UserProfileLinkProps> = ({
  username,
  className = '',
  children,
}) => (
  <Link
    to={`/profile/${encodeURIComponent(username)}`}
    className={['issue-user-profile-link', className].filter(Boolean).join(' ')}
    title={`View ${username}'s profile`}
  >
    {children ?? username}
  </Link>
);
