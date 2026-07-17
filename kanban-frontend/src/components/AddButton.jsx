import React, { useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';

export function AddButton({ 
  onAdd, 
  placeholder = "Enter title...", 
  buttonText = "Add",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value);
      setValue('');
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setValue('');
    setIsOpen(false);
  };

  return (
    <div className={`add-button-wrapper ${className}`}>
      {isOpen ? (
        <div className="add-button-form">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <div className="form-actions">
            <button className="save" onClick={handleSubmit}>
              {buttonText}
            </button>
            <button className="cancel" onClick={handleCancel}>
              <FiX size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button className="add-button" onClick={() => setIsOpen(true)}>
          <FiPlus /> {buttonText}
        </button>
      )}
    </div>
  );
}