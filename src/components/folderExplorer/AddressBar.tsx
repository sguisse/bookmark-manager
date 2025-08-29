import React, { useState } from 'react';

interface AddressBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ currentPath, onNavigate }) => {
  const [path, setPath] = useState(currentPath);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <form onSubmit={handleSubmit} className="address-bar-container">
      <input
        type="text"
        value={path}
        onChange={handleChange}
        className="address-bar-input"
        placeholder="Entrez un chemin d'accès..."
      />
      <button type="submit" className="address-bar-button">Go</button>
    </form>
  );
};

export default AddressBar;
