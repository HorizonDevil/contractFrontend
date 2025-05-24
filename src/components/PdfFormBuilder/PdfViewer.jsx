import { FiUpload, FiLink } from 'react-icons/fi';
import PropTypes from 'prop-types';

export default function PdfViewer({
  pdfDoc,
  pdfContainerRef,
  pdfCanvasRef,
  pageRendered,
  renderPdfPage,
  currentPage,
  mode,
  fields,
  activeField,
  setActiveField,
  handleMouseDown,
  handleFileUpload,
  handleOpenSignaturePad,
  renderFieldValue,
  isDragging,
  updateFieldConfig
}) {
  // Filter fields to only show those for the current page
  const currentPageFields = fields.filter(field => field.page === currentPage);

  return (
    <div className="pdf-viewer-container" ref={pdfContainerRef}>
      {!pdfDoc ? (
        <div className="pdf-empty-state">
          <div className="upload-card">
            <FiUpload className="empty-icon" />
            <h3>Upload a PDF to get started</h3>
            <p>Drag and drop a PDF file or click the button below</p>
            <label className="upload-button">
              <span>Select PDF File</span>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="file-input" 
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="pdf-viewer">
          <canvas ref={pdfCanvasRef} className="pdf-canvas" />
          {currentPageFields.map(field => (
            <div
              key={field.id}
              className={`form-field ${field.type} ${activeField === field.id ? 'active' : ''}`}
              style={{
                left: `${field.x}px`,
                top: `${field.y}px`,
                width: `${field.width}px`,
                height: `${field.height}px`,
                zIndex: field.zIndex,
                borderColor: field.color || 'var(--primary)'
              }}
              onMouseDown={(e) => mode === 'contractor' && handleMouseDown(e, field)}
              onClick={() => mode === 'contractor' && setActiveField(field.id)}
            >
              {mode === 'user' ? (
                <div className="fill-field-display">
                  {renderFieldValue(field)}
                </div>
              ) : (
                <div className="field-label">
                  <span>{field.label}</span>
                  {field.required && <span className="required-indicator">*</span>}
                  {field.type === 'signature' && field.fieldId && (
                    <span className="field-id-badge">
                      <FiLink size={12} />
                      <span>{field.fieldId}</span>
                    </span>
                  )}
                </div>
              )}
              
              {mode === 'contractor' && activeField === field.id && (
                <>
                  <div 
                    className="resize-handle nw" 
                    onMouseDown={(e) => handleResizeMouseDown(e, field, 'nw')}
                  />
                  <div 
                    className="resize-handle ne" 
                    onMouseDown={(e) => handleResizeMouseDown(e, field, 'ne')}
                  />
                  <div 
                    className="resize-handle sw" 
                    onMouseDown={(e) => handleResizeMouseDown(e, field, 'sw')}
                  />
                  <div 
                    className="resize-handle se" 
                    onMouseDown={(e) => handleResizeMouseDown(e, field, 'se')}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function handleResizeMouseDown(e, field, direction) {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = field.width;
    const startHeight = field.height;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('e')) newWidth = Math.max(40, startWidth + deltaX);
      if (direction.includes('w')) newWidth = Math.max(40, startWidth - deltaX);
      if (direction.includes('s')) newHeight = Math.max(24, startHeight + deltaY);
      if (direction.includes('n')) newHeight = Math.max(24, startHeight - deltaY);

      updateFieldConfig(field.id, { width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}

PdfViewer.propTypes = {
  pdfDoc: PropTypes.object,
  pdfContainerRef: PropTypes.object.isRequired,
  pdfCanvasRef: PropTypes.object.isRequired,
  pageRendered: PropTypes.bool.isRequired,
  renderPdfPage: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  mode: PropTypes.oneOf(['contractor', 'user']).isRequired,
  fields: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeField: PropTypes.string,
  setActiveField: PropTypes.func.isRequired,
  handleMouseDown: PropTypes.func.isRequired,
  handleFileUpload: PropTypes.func.isRequired,
  handleOpenSignaturePad: PropTypes.func.isRequired,
  renderFieldValue: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  updateFieldConfig: PropTypes.func.isRequired
};