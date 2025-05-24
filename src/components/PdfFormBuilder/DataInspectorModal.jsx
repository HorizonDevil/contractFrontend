import { FiX } from 'react-icons/fi'

export default function DataInspectorModal({
  templateName,
  setShowDataInspector,
  isLoadingData,
  contractData,
  fields
}) {
  return (
    <div className="data-inspector-modal">
      <div className="data-inspector-content">
        <div className="modal-header">
          <h3>Contract Data Inspector - {templateName}</h3>
          <button 
            onClick={() => setShowDataInspector(false)}
            className="close-button"
          >
            <FiX />
          </button>
        </div>
        
        {isLoadingData ? (
          <div className="loading-indicator">Loading contract data...</div>
        ) : contractData.length === 0 ? (
          <div className="no-data-message">No contract data found for this template</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  {fields.map(field => (
                    <th key={field.id}>{field.label || field.id}</th>
                  ))}
                  <th>Date Signed</th>
                </tr>
              </thead>
              <tbody>
                {contractData.map(contract => (
                  <tr key={contract.id || contract._id}>
                    <td>
                      {(contract.id || contract._id)?.substring(0, 6) || 'N/A'}...
                    </td>
                    {fields.map(field => {
                      const fieldData = contract.fields?.find(f => f.fieldId === field.id)
                      return (
                        <td key={`${contract.id}-${field.id}`}>
                          {fieldData ? (
                            fieldData.fieldType === 'signature' ? (
                              <img 
                                src={fieldData.value} 
                                alt="Signature" 
                                className="signature-thumbnail"
                              />
                            ) : (
                              String(fieldData.value || '')
                            )
                          ) : (
                            <span className="empty-value">-</span>
                          )}
                        </td>
                      )
                    })}
                    <td>{contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}