import { useState } from 'react';

export default function ContractorFillPanel({ 
  fields, 
  updateFieldConfig, 
  saveFieldsToBackend, 
  templateId 
}) {
  const [localValues, setLocalValues] = useState(() => {
    // Initialize local state from fields values
    const initial = {};
    fields.forEach(f => {
      initial[f.id] = f.value || '';
    });
    return initial;
  });

  const handleChange = (fieldId, value) => {
    setLocalValues(prev => ({ ...prev, [fieldId]: value }));
    updateFieldConfig(fieldId, { value }); // Update in main state
  };

  const handleSave = () => {
    saveFieldsToBackend();
  };

  return (
    <div className="contractor-fill-sidebar">
      <h3>Fill Field Data</h3>
      {fields.length === 0 ? (
        <p>No fields available to fill</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {fields.map(field => (
            <div key={field.id} className="form-group">
              <label htmlFor={`fill-${field.id}`} className="form-label">
                {field.label} {field.required && '*'}
              </label>
              {renderInputField(field, localValues[field.id], handleChange)}
            </div>
          ))}
          <button type="submit" className="action-button primary">
            Save Filled Data
          </button>
        </form>
      )}
    </div>
  );
}

function renderInputField(field, value, onChange) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <input
          id={`fill-${field.id}`}
          type={field.type === 'number' ? 'number' : field.type}
          value={value}
          required={field.required}
          onChange={e => onChange(field.id, e.target.value)}
          className="field-input"
          placeholder={field.placeholder || ''}
        />
      );
    case 'date':
      return (
        <input
          id={`fill-${field.id}`}
          type="date"
          value={value}
          required={field.required}
          onChange={e => onChange(field.id, e.target.value)}
          className="field-input"
        />
      );
    case 'checkbox':
      return (
        <input
          id={`fill-${field.id}`}
          type="checkbox"
          checked={!!value}
          required={field.required}
          onChange={e => onChange(field.id, e.target.checked)}
          className="checkbox-input"
        />
      );
    // Signature could be more complicated, but you can disable it here or show placeholder
    case 'signature':
      return <p>Signature filling not supported here</p>;
    default:
      return null;
  }
}
