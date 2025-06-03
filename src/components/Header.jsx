import {
  FiEdit2,
  FiMove,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiSave,
  FiEye,
  FiRefreshCw,
  FiX,
  FiLink
} from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useTemplateContext } from '../context/TemplateContext';

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
  isLoadingTemplates,
  handleSaveFields,
  isContractPreviewOpen,
  setIsContractPreviewOpen,
  handleGenerateMagicLink,
  contractorFillMode,      // <- add here
  setContractorFillMode
}) {
  const { fetchContractsForTemplate } = useTemplateContext();
  const [contracts, setContracts] = useState([]);
  const [selectedContractPdf, setSelectedContractPdf] = useState(null);
  const [templateId, setTemplateId] = useState(localStorage.getItem('lastUsedTemplateId'));

  const loadContractsForCurrentTemplate = async (id) => {
    if (id) {
      const data = await fetchContractsForTemplate(id);
      setContracts(data);
    }
  };

  // Watch for localStorage changes to templateId
  useEffect(() => {
    const interval = setInterval(() => {
      const storedId = localStorage.getItem('lastUsedTemplateId');
      if (storedId !== templateId) {
        setTemplateId(storedId);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [templateId]);

  // Fetch contracts when templateId or mode changes
  useEffect(() => {
    if (mode === 'contractor' && templateId) {
      loadContractsForCurrentTemplate(templateId);
      setSelectedContractPdf(null); // clear old preview
    }
  }, [templateId, mode]);

  // Reset PDF preview when contracts change
  useEffect(() => {
    setSelectedContractPdf(null);
  }, [contracts]);

  const handleSelectContract = async (contractId) => {
  if (!contractId) return;
  try {
    const res = await fetch(`http://localhost:3000/api/auth/contracts/filled-pdf/${contractId}`);
    const blob = await res.blob();
    const pdfUrl = URL.createObjectURL(blob);
    setSelectedContractPdf(pdfUrl);
    setIsContractPreviewOpen(true); // 👈 ADD THIS
  } catch (err) {
    console.error('Failed to fetch filled PDF:', err);
  }
};

  

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

            {/* Contracts Dropdown */}
            <select
              className="contract-dropdown"
              onChange={(e) => handleSelectContract(e.target.value)}
            >
              <option value="">Select Contract</option>
              {contracts.map(contract => (
                <option key={contract._id} value={contract._id}>
                  {contract.submittedBy || 'Anonymous'} - {new Date(contract.submittedAt).toLocaleDateString()}
                </option>
              ))}
            </select>

            <button
              onClick={handleSaveFields}
              className="save-button"
              aria-label="Save Template Fields"
            >
              <FiSave className="download-icon" />
              <span>Save Fields</span>
            </button>
            <button
              onClick={handleGenerateMagicLink}
              className="magic-link-button"
              aria-label="Generate Magic Link"
            >
              <FiLink className="magic-link-icon" />
              <span>Generate Magic Link</span>
            </button>

            <button
              onClick={fetchTemplates}
              className="history-button"
              disabled={isLoadingTemplates}
              aria-label="Refresh Templates"
            >
              <FiRefreshCw />
            </button>
            


            <button 
              onClick={() => setContractorFillMode(prev => !prev)}
              className="toggle-fill-button"
              aria-pressed={contractorFillMode}
            >
              {contractorFillMode ? 'Edit Fields' : 'Fill Fields'}
            </button>
          </div>
        )}

        {mode === 'user' ? (
          <>
          <button onClick={handleSaveFields} className="action-button secondary">
              Save Data
            </button>
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

      {/* Preview Modal */}
      {selectedContractPdf && (
        <div className="contract-preview-modal">
          <div className="modal-header">
            <h3>Filled Contract Preview</h3>
            <button onClick={() => {setSelectedContractPdf(null);
    setIsContractPreviewOpen(false);}} className="close-button">
              <FiX />
            </button>
          </div>
          <iframe
            src={selectedContractPdf}
            width="100%"
            height="500px"
            style={{ border: '1px solid #ccc', borderRadius: '8px' }}
          />
          <div className="modal-actions" style={{ textAlign: 'right', marginTop: '1rem' }}>
            <a href={selectedContractPdf} download="contract.pdf">
              <button className="download-button">
                <FiDownload /> Download
              </button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
