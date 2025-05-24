import { FiX, FiSave } from 'react-icons/fi'

export default function TemplateModal({
  templateId,
  setTemplateId,
  templateName,
  setTemplateName,
  uploadedPdfFile,
  setShowTemplateModal,
  saveAsTemplate
}) {
  return (
    <div className="template-modal" onClick={(e) => e.stopPropagation()}>
      <div className="template-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Save as Template</h3>
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowTemplateModal(false)
            }}
            className="close-button"
          >
            <FiX />
          </button>
        </div>
        <div className="form-group">
          <label className="form-label">Template ID</label>
          <input
            type="text"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            placeholder="Enter unique template ID"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Template Name</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
            className="form-input"
          />
        </div>
        <div className="file-selected">
          {uploadedPdfFile ? (
            <div>Selected: {uploadedPdfFile.name}</div>
          ) : (
            <div className="no-file-selected">No PDF file selected</div>
          )}
        </div>
        <div className="modal-actions">
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowTemplateModal(false)
            }}
            className="secondary-button"
          >
            Cancel
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              saveAsTemplate(e)
            }}
            className="primary-button"
            disabled={!templateId || !templateName || !uploadedPdfFile}
          >
            <FiSave />
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}