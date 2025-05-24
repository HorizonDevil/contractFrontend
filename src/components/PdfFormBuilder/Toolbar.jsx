import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function Toolbar({
  mode,
  templates,
  isLoadingTemplates,
  selectedTemplate,
  loadTemplate,
  fetchTemplates,
  enhancedFieldTypes,
  addField,
  pdfDoc,
  scale,
  setScale,
  currentPage,
  totalPages,
  handlePageChange
}) {
  return (
    <div className="toolbar">
      {mode === 'contractor' && (
        <>
          <div className="template-selector">
            <select
              value={selectedTemplate?.templateId || ''}
              onChange={(e) => {
                const template = templates.find(t => t.templateId === e.target.value)
                if (template) loadTemplate(template)
              }}
              className="template-select"
              disabled={isLoadingTemplates}
            >
              <option value="">Select a template...</option>
              {templates.map(template => (
                <option key={template.templateId} value={template.templateId}>
                  {template.templateName} ({template.templateId})
                </option>
              ))}
            </select>
          </div>
          
          <div className="field-types">
            {enhancedFieldTypes.map(type => (
              <button 
                key={type.value} 
                onClick={() => addField(type.value)}
                className="field-type-button"
                title={type.tooltip}
                aria-label={type.tooltip}
                style={{ '--field-color': type.color }}
              >
                <span className="field-icon">{type.icon}</span>
                <span className="field-label">{type.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {pdfDoc && (
        <div className="zoom-controls">
          <button 
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))} 
            className="zoom-button"
            disabled={scale <= 0.5}
            aria-label="Zoom Out"
          >
            <FiZoomOut />
          </button>
          <span className="zoom-value">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(prev => Math.min(3, prev + 0.1))} 
            className="zoom-button"
            disabled={scale >= 3}
            aria-label="Zoom In"
          >
            <FiZoomIn />
          </button>
        </div>
      )}

      {pdfDoc && totalPages > 1 && (
        <div className="page-controls">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="page-button"
            aria-label="Previous Page"
          >
            <FiChevronLeft />
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="page-button"
            aria-label="Next Page"
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}