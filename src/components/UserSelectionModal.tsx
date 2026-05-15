import React, { useState, useMemo } from 'react';
import type { UserResource } from '../types/api';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: UserResource[];
  initialSelected: string[];
  isMultiple: boolean;
  onAdd: (selectedUsernames: string[]) => void;
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  users,
  initialSelected,
  isMultiple,
  onAdd,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(initialSelected);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  if (!isOpen) return null;

  const handleUserClick = (username: string) => {
    if (isMultiple) {
      if (selected.includes(username)) {
        setSelected(selected.filter(u => u !== username));
      } else {
        setSelected([...selected, username]);
      }
    } else {
      setSelected([username]);
    }
  };

  const handleAddClick = () => {
    onAdd(selected);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Header */}
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-search-bar">
            <input 
              type="text" 
              placeholder="Search for users" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>

          <div className="modal-user-list">
            {filteredUsers.map(user => {
              const isSelected = selected.includes(user.username);
              return (
                <div 
                  key={user.username} 
                  className={`modal-user-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className="modal-user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <div className="modal-user-avatar-placeholder">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="modal-user-name">{user.username}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-add-btn" onClick={handleAddClick}>
            ADD
          </button>
        </div>
      </div>
    </div>
  );
};
