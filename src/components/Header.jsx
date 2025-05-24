import { FiEdit2, FiMove, FiChevronLeft, FiChevronRight, FiDownload, FiSave, FiEye, FiRefreshCw } from 'react-icons/fi'

export default function Header({
  mode,
  setMode,
  pdfDoc,
  templateName,
  currentPage,
  totalPages,
  undo,
  redo,
  historyIndex,
  history,
  handleDownloadPdf,
  handleSubmitContract,
  toggleDataInspector,
  fetchTemplates,
  isLoadingTemplates
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">
          <span className="gradient-text">eContract</span>
        </h1>
        {pdfDoc && (
          <div className="document-info">
            <span className="document-name">{templateName || 'Untitled Document'}</span>
            <span className="document-pages">Page {currentPage} of {totalPages}</span>
          </div>
        )}
      </div>
      
      <div className="header-right">
        <div className="mode-toggle">
          <button 
            onClick={() => setMode('contractor')} 
            className={`mode-button ${mode === 'contractor' ? 'active' : ''}`}
            aria-label="Design Mode"
          >
            <FiEdit2 className="mode-icon" />
            <span>Design Mode</span>
          </button>
          <button 
            onClick={() => setMode('user')} 
            className={`mode-button ${mode === 'user' ? 'active' : ''}`}
            aria-label="Fill Mode"
          >
            <FiMove className="mode-icon" />
            <span>Fill Mode</span>
          </button>
        </div>

        {mode === 'contractor' && (
          <div className="history-controls">
            <button 
              onClick={undo} 
              disabled={historyIndex <= 0} 
              className="history-button"
              aria-label="Undo"
              data-tooltip="Undo (Ctrl+Z)"
            >
              <FiChevronLeft />
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1} 
              className="history-button"
              aria-label="Redo"
              data-tooltip="Redo (Ctrl+Y)"
            >
              <FiChevronRight />
            </button>
            <button 
              onClick={fetchTemplates}
              className="history-button"
              disabled={isLoadingTemplates}
              aria-label="Refresh Templates"
            >
              <FiRefreshCw />
            </button>
          </div>
        )}

        {mode === 'user' ? (
          <>
            <button onClick={handleDownloadPdf} className="download-button">
              <FiDownload className="download-icon" />
              <span>Download PDF</span>
            </button>
            <button onClick={handleSubmitContract} className="download-button">
              <FiSave className="download-icon" />
              <span>Submit Contract</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={toggleDataInspector} 
              className="inspect-button"
            >
              <FiEye />
              <span>Inspect Data</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}