import { createContext, useContext, useState, useCallback } from 'react';
import { createTemplate, getAllTemplates,getTemplateData } from '../services/api';
import { submitContract as submitContractAPI } from '../services/api';
import { getContractsByTemplateId as fetchContracts } from '../services/api';



const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false); // ✅ FIX

  const createAndStoreTemplate = async ({ templateId, templateName, fields, uploadedPdfFile }) => {
    const formData = new FormData();
    formData.append('file', uploadedPdfFile);
    formData.append('templateId', templateId);
    formData.append('templateName', templateName);
    formData.append('role', 'client');
    formData.append('fields', JSON.stringify(fields || []));

    try {
      const res = await createTemplate(formData);

      const newTemplate = {
        templateId: res.data.template._id,
        templateName,
        fields,
        pdfUrl: URL.createObjectURL(uploadedPdfFile), // preview-friendly URL
      };

      const updated = [...templates, newTemplate];
      setTemplates(updated);

      return { success: true, data: res.data };
    } catch (err) {
      console.error('Upload failed:', err);
      return { success: false, error: err };
    }
  };

  const fetchTemplateById = useCallback(async (templateId) => {
  try {
    const res = await getTemplateData(templateId);
    return res?.data?.template;
  } catch (err) {
    console.error('Failed to fetch template:', err);
    return null;
  }
}, []);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await getAllTemplates();
      const apiTemplates = res.data.templates.map(t => ({
        templateId: t.id,
        templateName: t.name,
        pdfUrl: `http://localhost:3000/${t.pdfPath}` // ✅ Add full URL if needed
      }));
      setTemplates(apiTemplates);
    } catch (err) {
      console.error('Failed to load templates from API', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  const fetchContractsForTemplate = async (templateId) => {
  try {
    const res = await fetchContracts(templateId);
    return res.data.contracts || [];
  } catch (err) {
    console.error("Failed to fetch contracts:", err);
    return [];
  }
};


  const submitContract = async ({ templateId, fields, submittedBy }) => {
  try {
    const payload = {
      templateId,
      submittedBy,
      fields: Object.fromEntries(
        fields.map(f => [f.id, { id: f.id, value: f.value }])
      )
    };

    const res = await submitContractAPI(payload);
    return res.data;
  } catch (err) {
    console.error('Contract submission failed:', err);
    return { success: false, error: err };
  }
};

  return (
    <TemplateContext.Provider
      value={{ templates, createAndStoreTemplate, fetchTemplates, isLoadingTemplates,fetchTemplateById, submitContract, fetchContractsForTemplate }}
    >
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => useContext(TemplateContext);
