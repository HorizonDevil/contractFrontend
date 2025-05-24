import { FiX, FiCopy, FiTrash2, FiLink, FiLink2, FiList } from 'react-icons/fi';
import PropTypes from 'prop-types';

export default function FieldConfigPanel({
  activeField,
  setActiveField,
  fieldConfig,
  setFieldConfig,
  updateFieldConfig,
  FIELD_TYPES,
  linkedFields,
  toggleFieldLink,
  hasOtherSignatureValues,
  handleCopySignature,
  duplicateField,
  deleteField,
  fields,
  currentPage
}) {
  const handleFieldChange = (key, value) => {
    const updatedConfig = { ...fieldConfig, [key]: value };
    setFieldConfig(updatedConfig);
    updateFieldConfig(activeField, { [key]: value });
  };

  const handleDimensionChange = (dimension, value) => {
    const numValue = parseInt(value) || (dimension === 'width' ? 100 : 40);
    handleFieldChange(dimension, numValue);
  };

  const handlePositionChange = (coord, value) => {
    const numValue = parseInt(value) || 0;
    handleFieldChange(coord, numValue);
  };

  const handleFieldSelect = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setActiveField(fieldId);
      setFieldConfig(field);
    }
  };

  // Filter fields for current page
  const currentPageFields = fields.filter(field => field.page === currentPage);

  return (
    <div className="fields-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">
          <FiList style={{ marginRight: '8px' }} />
          <span>Field Properties</span>
          {activeField && (
            <button 
              onClick={() => setActiveField(null)}
              className="clear-selection-button"
              aria-label="Clear selection"
            >
              <FiX />
            </button>
          )}
        </h3>
        
        {activeField ? (
          <div className="field-config">
            <div className="form-group">
              <label className="form-label">Field ID</label>
              <input
                type="text"
                value={fieldConfig.id}
                readOnly
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Field Label</label>
              <input
                type="text"
                value={fieldConfig.label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Field Type</label>
              <select
                value={fieldConfig.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="form-select"
              >
                {FIELD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {fieldConfig.type === 'signature' && (
              <div className="form-group">
                <label className="form-label">Signature Group ID</label>
                <div className="field-id-control">
                  <input
                    type="text"
                    value={fieldConfig.fieldId || ''}
                    onChange={(e) => handleFieldChange('fieldId', e.target.value)}
                    className="form-input"
                    placeholder="Enter group ID to link signatures"
                  />
                  <button 
                    onClick={() => toggleFieldLink(activeField)}
                    className={`link-button ${fieldConfig.fieldId ? 'active' : ''}`}
                    type="button"
                    title={fieldConfig.fieldId ? 'Unlink this signature' : 'Link to other signatures'}
                  >
                    {fieldConfig.fieldId ? <FiLink /> : <FiLink2 />}
                  </button>
                </div>
                {fieldConfig.fieldId && linkedFields.length > 0 && (
                  <div className="linked-fields-notice">
                    <FiLink className="link-icon" />
                    <span>Linked to {linkedFields.length} other signature(s)</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Placeholder</label>
              <input
                type="text"
                value={fieldConfig.placeholder || ''}
                onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={fieldConfig.required || false}
                  onChange={(e) => handleFieldChange('required', e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Required Field
              </label>
            </div>
            
            <div className="form-group">
              <label className="form-label">Dimensions</label>
              <div className="dimension-controls">
                <div className="dimension-input">
                  <span>W:</span>
                  <input
                    type="number"
                    value={fieldConfig.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    min="40"
                    className="small-input"
                  />
                  <span>px</span>
                </div>
                <div className="dimension-input">
                  <span>H:</span>
                  <input
                    type="number"
                    value={fieldConfig.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    min="24"
                    className="small-input"
                  />
                  <span>px</span>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Position</label>
              <div className="position-controls">
                <div className="position-input">
                  <span>X:</span>
                  <input
                    type="number"
                    value={fieldConfig.x}
                    onChange={(e) => handlePositionChange('x', e.target.value)}
                    min="0"
                    className="small-input"
                  />
                  <span>px</span>
                </div>
                <div className="position-input">
                  <span>Y:</span>
                  <input
                    type="number"
                    value={fieldConfig.y}
                    onChange={(e) => handlePositionChange('y', e.target.value)}
                    min="0"
                    className="small-input"
                  />
                  <span>px</span>
                </div>
              </div>
            </div>
            
            {fieldConfig.type === 'signature' && hasOtherSignatureValues && (
              <div className="form-group">
                <button 
                  onClick={() => {
                    const otherField = fields.find(f => 
                      f.type === 'signature' && 
                      f.id !== activeField && 
                      f.value &&
                      f.fieldId !== fieldConfig.fieldId // Only from different groups
                    );
                    if (otherField) {
                      handleCopySignature(otherField.id);
                    }
                  }}
                  className="action-button secondary"
                  aria-label="Copy existing signature"
                >
                  <FiCopy />
                  <span>Copy Signature from Another Group</span>
                </button>
              </div>
            )}
            
            <div className="field-actions">
              <button 
                onClick={() => duplicateField(activeField)} 
                className="action-button secondary"
                aria-label="Duplicate field"
              >
                <FiCopy />
                <span>Duplicate</span>
              </button>
              <button 
                onClick={() => deleteField(activeField)} 
                className="action-button danger"
                aria-label="Delete field"
              >
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="no-field-selected">
            <p>Select a field to edit its properties</p>
            <p className="hint-text">
              Or click on a field type in the toolbar to add a new one
            </p>
          </div>
        )}
      </div>

      {/* New section for field list */}
      <div className="sidebar-section">
            <h3 className="sidebar-title">
              <FiList style={{ marginRight: '8px' }} />
          <span>Fields on Page {currentPage}</span>
          
        </h3>
        
        {currentPageFields.length > 0 ? (
          <div className="field-list">
            {currentPageFields.map(field => (
              <div 
                key={field.id}
                className={`field-list-item ${activeField === field.id ? 'active' : ''}`}
                onClick={() => handleFieldSelect(field.id)}
              >
                <div className="field-type-indicator" style={{ backgroundColor: field.color }} />
                <div className="field-list-details">
                  <div className="field-list-label">
                    {field.label || `Unnamed ${field.type} field`}
                  </div>
                  <div className="field-list-type">
                    {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                  </div>
                </div>
                {field.required && <span className="required-badge">Required</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-fields-message">
            No fields added to this page yet
          </div>
        )}
      </div>
    </div>
  );
}

FieldConfigPanel.propTypes = {
  activeField: PropTypes.string,
  setActiveField: PropTypes.func.isRequired,
  fieldConfig: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    fieldId: PropTypes.string,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number
  }).isRequired,
  setFieldConfig: PropTypes.func.isRequired,
  updateFieldConfig: PropTypes.func.isRequired,
  FIELD_TYPES: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
      color: PropTypes.string.isRequired
    })
  ).isRequired,
  linkedFields: PropTypes.array.isRequired,
  toggleFieldLink: PropTypes.func.isRequired,
  hasOtherSignatureValues: PropTypes.bool.isRequired,
  handleCopySignature: PropTypes.func.isRequired,
  duplicateField: PropTypes.func.isRequired,
  deleteField: PropTypes.func.isRequired,
  fields: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentPage: PropTypes.number.isRequired
};