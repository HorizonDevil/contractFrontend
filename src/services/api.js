import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api/auth', 
  withCredentials: true             
});

export const createTemplate = (formData) =>
  API.post('/create-template', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getAllTemplates = () =>
  API.post('/get-all-template', { role: 'admin' });  

export const updateTemplateFields = (payload) =>
  API.post('/update-template', payload);

export const getTemplateData = (templateId) =>
  API.get(`/get-template-data?templateID=${templateId}`);

export const submitContract = (payload) =>
  API.post('/submit-contract', payload);

export const getContractsByTemplateId = (templateId) =>
  API.get(`/contracts/by-template/${templateId}`);


// ✅ ADD THIS
export const uploadFilledContractPdf = async (formData) => {
  return await fetch('http://localhost:3000/api/auth/contracts/upload-pdf', {
    method: 'POST',
    body: formData
  });
};
