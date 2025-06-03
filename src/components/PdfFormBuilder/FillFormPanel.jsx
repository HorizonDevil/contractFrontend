import { FiDownload, FiPenTool } from 'react-icons/fi'

export default function FillFormPanel({
  fields,
  updateFieldConfig,
  handleDownloadPdf,
  handleOpenSignaturePad, // Now properly received as prop
  isUserContractSubmitted
}) {
  return (
    <div className="fill-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Fill Form Details</h3>
        <div className="form-fields">
          {fields.length > 0 ? (
            fields.map(field => (
              <div key={field.id} className="form-group">
                <label className="form-label">
                  {field.label}
                  {field.required && <span className="required-indicator">*</span>}
                </label>
                {renderFieldInput(field, isUserContractSubmitted)}
              </div>
            ))
          ) : (
            <div className="no-fields-message">
              <p>No form fields to fill</p>
              <p>Switch to Design Mode to add fields</p>
            </div>
          )}
        </div>
        {!isUserContractSubmitted && (
          <button onClick={handleDownloadPdf} className="action-button primary">
            <FiDownload className="action-icon" />
            <span>Download Filled PDF</span>
          </button>
        )}
      </div>
    </div>
  )

  function renderFieldInput(field, isUserContractSubmitted) {
    const disabled = isUserContractSubmitted;
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type === 'number' ? 'number' : field.type}
            value={field.value || ''}
            onChange={(e) => updateFieldConfig(field.id, { value: e.target.value })}
            placeholder={field.placeholder}
            className="field-input"
            required={field.required}
            disabled={disabled}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={field.value || ''}
            onChange={(e) => updateFieldConfig(field.id, { value: e.target.value })}
            className="field-input"
            required={field.required}
            disabled={disabled}
          />
        )
      case 'checkbox':
        return (
          <div className="checkbox-container">
            <input
              type="checkbox"
              id={`checkbox-${field.id}`}
              checked={field.value || false}
              onChange={(e) => updateFieldConfig(field.id, { value: e.target.checked })}
              className="checkbox-input"
              required={field.required}
              disabled={disabled}
            />
            <label htmlFor={`checkbox-${field.id}`} className="checkbox-label">
              {field.label}
            </label>
          </div>
        )
      case 'signature':
        return (
          <div className="signature-pad">
            {field.value ? (
              <>
                <img 
                  src={field.value} 
                  alt="Signature" 
                  className="signature-image"
                />
                <button 
                  className="sign-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenSignaturePad(field.id) // Now using the prop
                  }}
                  type="button"
                  disabled={disabled}
                >
                  <FiPenTool className="sign-icon" />
                  <span>Re-sign</span>
                </button>
              </>
            ) : (
              <button 
                className="sign-button"
                onClick={(e) => {
                  e.stopPropagation()
                    handleOpenSignaturePad(field.id) // Now using the prop
                }}
                type="button"
                disabled={disabled}
              >
                <FiPenTool className="sign-icon" />
                <span>Sign Here</span>
              </button>
            )}
          </div>
        )
      default:
        return null
    }
  }
}