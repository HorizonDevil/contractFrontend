import { FiX, FiCheck, FiCopy } from 'react-icons/fi';
import SignaturePad from 'react-signature-canvas';  // Correct import for SignaturePad

export default function SignatureModal({
  signaturePadRef,
  signatureFieldId,
  hasOtherSignatureValues,
  fields,
  setShowSignaturePad,
  handleClearSignature,
  handleSaveSignature,
  handleCopySignature
}) {
  return (
    <div className="signature-modal">
      <div className="signature-modal-content">
        <div className="modal-header">
          <h3>Sign Below</h3>
          <button 
            onClick={() => setShowSignaturePad(false)}
            className="close-button"
            aria-label="Close signature modal"
          >
            <FiX />
          </button>
        </div>
        <SignaturePad
          ref={signaturePadRef}
          canvasProps={{
            className: 'signature-canvas',
            width: 500,
            height: 200
          }}
          clearOnResize={false}
          velocityFilterWeight={0.7}
          minWidth={1.5}
          maxWidth={2.5}
          penColor="black"
        />
        <div className="signature-modal-buttons">
          <button 
            onClick={handleClearSignature} 
            className="secondary-button"
            type="button"
          >
            Clear
          </button>
          <button 
            onClick={handleSaveSignature} 
            className="primary-button"
            type="button"
          >
            <FiCheck />
            Save Signature
          </button>
          {hasOtherSignatureValues && (
            <button 
              onClick={() => {
                const otherField = fields.find(f => 
                  f.type === 'signature' && f.id !== signatureFieldId && f.value
                );
                if (otherField) {
                  handleCopySignature(otherField.id);
                  setShowSignaturePad(false);
                }
              }}
              className="secondary-button copy-button"
              type="button"
            >
              <FiCopy />
              Use Existing Signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
}