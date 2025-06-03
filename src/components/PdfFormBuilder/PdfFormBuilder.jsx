import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FiX, FiCopy, FiTrash2, FiLink, FiLink2, FiSquare,FiCheckSquare } from 'react-icons/fi';
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import SignaturePad from 'react-signature-canvas'

import Header from '../Header'
import Toolbar from './Toolbar'
import PdfViewer from './PdfViewer'
import FieldConfigPanel from './FieldConfigPanel'
import FillFormPanel from './FillFormPanel'
import SignatureModal from './SignatureModal'
import TemplateModal from './TemplateModal'
import DataInspectorModal from './DataInspectorModal'
import ContractorFillPanel from './ContractorFillPanel';
import { FIELD_TYPES, INITIAL_FIELD } from '../../constants/fieldTypes'
import { useTemplateContext } from '../../context/TemplateContext'; // top of the file
import { uploadFilledContractPdf } from '../../services/api';



pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`

const PdfFormBuilder = ({ forceMode }) => {

  
  const [mode, setMode] = useState(forceMode || 'contractor')
  const currentRenderTask = useRef(null);
  const [contractorFillMode, setContractorFillMode] = useState(false);
  const [isUserContractSubmitted, setIsUserContractSubmitted] = useState(false);


  const [isContractPreviewOpen, setIsContractPreviewOpen] = useState(false);

  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageRendered, setPageRendered] = useState(false)
  const [fields, setFields] = useState([])
  const [activeField, setActiveField] = useState(null)
 
  const [scale, setScale] = useState(1.5)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [exportProgress, setExportProgress] = useState(0)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [signatureFieldId, setSignatureFieldId] = useState(null)
  const [contractData, setContractData] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showDataInspector, setShowDataInspector] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [templateName, setTemplateName] = useState('')
  
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  
  const [uploadedPdfFile, setUploadedPdfFile] = useState(null)
  const {
  createAndStoreTemplate,
  fetchTemplates,
  templates,
  submitContract,
  isLoadingTemplates,
  fetchTemplateById,
  fetchContractsForTemplate

  
} = useTemplateContext()

  const pdfContainerRef = useRef(null)
  const pdfCanvasRef = useRef(null)
  const signaturePadRef = useRef(null)
  const fileInputRef = useRef(null)
  const nextId = useRef(1)

  const [fieldConfig, setFieldConfig] = useState({ ...INITIAL_FIELD })

  const enhancedFieldTypes = useMemo(() => {
    return FIELD_TYPES.map(type => ({
      ...type,
      tooltip: `Add ${type.label} Field`
    }))
  }, [])

  const saveToHistory = useCallback((currentFields) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.stringify(currentFields))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setFields(JSON.parse(history[newIndex]))
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setFields(JSON.parse(history[newIndex]))
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  const handleGenerateMagicLink = async () => {
  if (!templateId) {
    alert("Please save the template first to generate a magic link.");
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/auth/generate-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    });
    const data = await response.json();

    if (data.success) {
      prompt("🎉 Magic link generated. Share this with the user:", data.link);
    } else {
      alert("Failed to generate magic link: " + (data.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Magic link generation failed:", error);
    alert("Failed to generate magic link due to network error.");
  }
};


  //savefields to backend

            const saveFieldsToBackend = async () => {
  if (!templateId || fields.length === 0) {
    alert('No fields to save or template not selected.');
    return;
  }

  const fieldsObj = Object.fromEntries(
    fields.map(field => [field.id, field])
  );

  try {
    const res = await fetch('http://localhost:3000/api/auth/update-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateID: templateId,
        fields: fieldsObj,
      }),
    });

    const result = await res.json();

    if (!result.success) {
      console.error(result.error);
      alert('Failed to save fields.');
      return;
    }

    alert('✅ Fields saved successfully!');
  } catch (err) {
    console.error('Save error:', err);
    alert('❌ Failed due to network/server issue.');
  }
};







  const loadTemplate = async (template) => {
  try {
    setSelectedTemplate(template);
    localStorage.setItem("lastUsedTemplateId", template.templateId);
    setTemplateId(template.templateId);
    setTemplateName(template.templateName);

    const pdfUrl = `http://localhost:3000/api/auth/get-pdf/${template.templateId}`;
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    // ✅ Use context to fetch full template from DB
    const fullTemplate = await fetchTemplateById(template.templateId);
    const fieldArray = Object.values(fullTemplate?.fields || {});

    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
    setFields(fieldArray);
    setActiveField(null);
    setCurrentPage(1);
    renderPdfPage(pdf, 1);
  } catch (error) {
    console.error('Error loading template:', error);
    alert('Failed to load template. Please try again.');
  }
};



      const saveAsTemplate = async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!pdfDoc || !templateId || !templateName || !uploadedPdfFile) {
        alert('Please provide a Template ID, Template Name, and PDF');
        return;
      }

      const result = await createAndStoreTemplate({
        templateId,
        templateName,
        fields,
        uploadedPdfFile,
      });

      if (result.success) {
        const newId = result.data.template._id; // ✅ get actual MongoDB ObjectId
          setTemplateId(newId);                   // ✅ update state with real _id
          alert('Template uploaded successfully to backend!');
          console.log("Now using templateId:", newId); // optional debug
          setShowTemplateModal(false);
      } else {
        alert('Failed to upload template.');
        console.error(result.error);
      }
    };

  

  const fetchContractData = async () => {
  if (!templateId) return;
  setIsLoadingData(true);
  try {
    const contracts = await fetchContractsForTemplate(templateId);
    setContractData(contracts);
  } catch (err) {
    console.error('Failed to fetch contract data:', err);
  } finally {
    setIsLoadingData(false);
  }
};

  const toggleDataInspector = async () => {
    setShowDataInspector(!showDataInspector)
    if (!showDataInspector) {
      await fetchContractData()
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadedPdfFile(file)
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const pdf = await pdfjsLib.getDocument(e.target.result).promise
          setPdfDoc(pdf)
          setTotalPages(pdf.numPages)
          setFields([])
          setActiveField(null)
          setCurrentPage(1)
          renderPdfPage(pdf, 1)
          
          setShowTemplateModal(true)
        } catch (error) {
          console.error('PDF loading error:', error)
          alert('Failed to load PDF file. Please try a different file.')
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('File upload error:', error)
      alert('Error uploading file. Please try again.')
    }
  }

        const renderPdfPage = async (pdf, pageNum) => {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = pdfCanvasRef.current;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (currentRenderTask.current) {
      currentRenderTask.current.cancel();
    }

    const task = page.render({ canvasContext: context, viewport });
    currentRenderTask.current = task;
    await task.promise;

    setPageRendered(true);
  } catch (error) {
    if (error?.name === "RenderingCancelledException") {
      // Silently ignore expected cancellation
      return;
    }

    console.error('PDF rendering error:', error);
    alert('Failed to render PDF page.');
  }
};



  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    renderPdfPage(pdfDoc, newPage)
  }

  const addField = (type) => {
    const newField = {
      ...INITIAL_FIELD,
      id: `field_${Date.now()}`,
      type,
      page: currentPage,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      ...(type === 'signature' && { 
        fieldId: `sig-group-${Date.now()}`,
        width: 200,
        height: 80 
      }),
      color: FIELD_TYPES.find(t => t.value === type)?.color || '#6366f1'
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    setActiveField(newField.id);
    setFieldConfig(newField);
    saveToHistory(newFields);
  };

  const updateFieldConfig = (id, updates) => {
    const fieldToUpdate = fields.find(field => field.id === id);
    if (!fieldToUpdate) return fields;

    if (fieldToUpdate.type === 'signature' && updates.value !== undefined && fieldToUpdate.fieldId) {
      const updatedFields = fields.map(field => {
        if (field.type === 'signature' && field.fieldId === fieldToUpdate.fieldId) {
          return { ...field, ...updates };
        }
        return field.id === id ? { ...field, ...updates } : field;
      });
      
      setFields(updatedFields);
      if (activeField === id) {
        setFieldConfig(prev => ({ ...prev, ...updates }));
      }
      saveToHistory(updatedFields);
      return;
    }

    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    );
    
    setFields(updatedFields);
    if (activeField === id) {
      setFieldConfig(prev => ({ ...prev, ...updates }));
    }
    saveToHistory(updatedFields);
  };

  const deleteField = async (id) => {
  const newFields = fields.filter(field => field.id !== id)
  setFields(newFields)
  if (activeField === id) {
    setActiveField(null)
  }
  saveToHistory(newFields)

  // Save updated fields to backend after delete
  if (templateId) {
    try {
      const fieldsObj = Object.fromEntries(newFields.map(f => [f.id, f]))

      const res = await fetch('http://localhost:3000/api/auth/update-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateID: templateId,
          fields: fieldsObj,
        }),
      })

      const result = await res.json()

      if (!result.success) {
        console.error(result.error)
        alert('Failed to save fields after deletion')
      } else {
        alert('Field deleted and changes saved successfully!')
      }
    } catch (err) {
      console.error('Error saving fields after deletion:', err)
      alert('Failed to save fields after deletion due to network/server issue')
    }
  } else {
    alert('Please save the template first before deleting fields.')
  }
}


  const duplicateField = (id) => {
    const fieldToDuplicate = fields.find(field => field.id === id)
    if (!fieldToDuplicate) return

    const newField = {
      ...fieldToDuplicate,
      id: `field_${nextId.current++}`,
      x: fieldToDuplicate.x + 20,
      y: fieldToDuplicate.y + 20,
      value: fieldToDuplicate.type === 'signature' && !fieldToDuplicate.fieldId ? '' : fieldToDuplicate.value
    }

    const newFields = [...fields, newField]
    setFields(newFields)
    setActiveField(newField.id)
    setFieldConfig(newField)
    saveToHistory(newFields)
  }

  const handleMouseDown = (e, field) => {
    if (mode !== 'contractor') return
    setIsDragging(true)
    setActiveField(field.id)

    const viewer = pdfContainerRef.current
    const rect = viewer.getBoundingClientRect()
    const scrollLeft = viewer.scrollLeft
    const scrollTop = viewer.scrollTop
    
    const startX = e.clientX - rect.left + scrollLeft
    const startY = e.clientY - rect.top + scrollTop
    const fieldLeft = field.x
    const fieldTop = field.y

    const onMouseMove = (moveEvent) => {
      const newX = fieldLeft + (moveEvent.clientX - rect.left + scrollLeft - startX)
      const newY = fieldTop + (moveEvent.clientY - rect.top + scrollTop - startY)
      
      const maxX = viewer.scrollWidth - field.width
      const maxY = viewer.scrollHeight - field.height
      
      updateFieldConfig(field.id, {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const onMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mouseleave', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseleave', onMouseUp)
  }

  const handleResizeMouseDown = (e, field, direction) => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = field.width
    const startHeight = field.height

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      let newWidth = startWidth
      let newHeight = startHeight

      if (direction.includes('e')) newWidth = Math.max(40, startWidth + deltaX)
      if (direction.includes('w')) newWidth = Math.max(40, startWidth - deltaX)
      if (direction.includes('s')) newHeight = Math.max(24, startHeight + deltaY)
      if (direction.includes('n')) newHeight = Math.max(24, startHeight - deltaY)

      updateFieldConfig(field.id, { width: newWidth, height: newHeight })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleOpenSignaturePad = (fieldId) => {
    setSignatureFieldId(fieldId)
    setShowSignaturePad(true)
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  const handleSaveSignature = () => {
    if (!signaturePadRef.current || !signatureFieldId) return;
    
    const canvas = signaturePadRef.current.getCanvas();
    const signatureUrl = canvas.toDataURL();
    
    const fieldToUpdate = fields.find(f => f.id === signatureFieldId);
    if (!fieldToUpdate) return;

    const updatedFields = fields.map(field => {
      if (field.type === 'signature' && field.fieldId === fieldToUpdate.fieldId) {
        return { ...field, value: signatureUrl };
      }
      return field;
    });

    setFields(updatedFields);
    setShowSignaturePad(false);
  };

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  const handleCopySignature = (sourceFieldId) => {
    const sourceField = fields.find(f => f.id === sourceFieldId)
    if (!sourceField || !sourceField.value) return
    
    updateFieldConfig(activeField, {
      value: sourceField.value,
      width: sourceField.width,
      height: sourceField.height
    })
  }

  const toggleFieldLink = (fieldId) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return

    if (field.fieldId) {
      updateFieldConfig(fieldId, { fieldId: '' })
    } else {
      updateFieldConfig(fieldId, { fieldId: `sig_${Date.now()}` })
    }
  }

  const linkedFields = useMemo(() => {
    if (!activeField) return []
    const currentField = fields.find(f => f.id === activeField)
    if (!currentField || !currentField.fieldId) return []
    
    return fields.filter(f => 
      f.type === 'signature' && 
      f.fieldId === currentField.fieldId && 
      f.id !== activeField
    )
  }, [activeField, fields])

  const handleDownloadPdf = async () => {
    if (!pdfDoc || !pdfCanvasRef.current) {
      alert('Please upload and render a PDF first');
      return;
    }

    try {
      setExportProgress(0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setExportProgress(Math.round((pageNum / totalPages) * 50));
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = `${canvas.width}px`;
        container.style.height = `${canvas.height}px`;
        document.body.appendChild(container);

        container.appendChild(canvas);

        const pageFields = fields.filter(field => field.page === pageNum);
        const fieldsContainer = document.createElement('div');
        fieldsContainer.style.position = 'absolute';
        fieldsContainer.style.top = '0';
        fieldsContainer.style.left = '0';
        fieldsContainer.style.width = '100%';
        fieldsContainer.style.height = '100%';

        const signatureFields = pageFields.filter(f => f.type === 'signature' && f.value);
        const loadedImages = await Promise.all(
          signatureFields.map(field => {
            return new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.onload = () => resolve({ id: field.id, img });
              img.onerror = () => resolve(null);
              img.src = field.value;
            });
          })
        );

        pageFields.forEach(field => {
          const fieldDiv = document.createElement('div');
          fieldDiv.style.cssText = `
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.width}px;
            height: ${field.height}px;
            background-color: transparent;
            padding: 0.2rem;
            box-sizing: border-box;
          `;

          if (field.type === 'checkbox') {
            const label = document.createElement('label');
            label.style.cssText = `
              display: flex;
              align-items: center;
              height: 100%;
              cursor: default;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = field.value || false;
            checkbox.disabled = true;
            checkbox.style.cssText = `
              width: auto;
              height: auto;
              margin-right: 5px;
            `;
            
            const text = document.createElement('span');
            text.textContent = field.label || '';
            text.style.cssText = `
              color: #000;
              font-size: 14px;
            `;
            
            label.appendChild(checkbox);
            label.appendChild(text);
            fieldDiv.appendChild(label);
          } 
          else if (field.type === 'signature' && field.value) {
            const img = document.createElement('img');
            const loadedImg = loadedImages.find(i => i?.id === field.id);
            img.src = loadedImg ? loadedImg.img.src : field.value;
            img.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: contain;
              background-color: white;
            `;
            fieldDiv.appendChild(img);
          }
          else {
            const inputElement = document.createElement('input');
            inputElement.type = field.type === 'date' ? 'text' : field.type;
            inputElement.value = field.value || '';
            inputElement.disabled = true;
            inputElement.style.cssText = `
              width: 100%;
              height: 100%;
              background: transparent;
              border: 1px solid #ccc;
              padding: 4px;
              color: #000;
              font-size: 14px;
              box-sizing: border-box;
            `;
            
            if (field.type === 'date' && field.value) {
              const date = new Date(field.value);
              inputElement.value = date.toLocaleDateString();
            }
            
            fieldDiv.appendChild(inputElement);
          }

          fieldsContainer.appendChild(fieldDiv);
        });

        container.appendChild(fieldsContainer);

        const canvasImage = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          windowWidth: canvas.width,
          windowHeight: canvas.height
        });

        const imgData = canvasImage.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;

        if (pageNum > 1) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        document.body.removeChild(container);
        setExportProgress(Math.round((pageNum / totalPages) * 100));
      }

      pdf.save('filled-form.pdf');
      setExportProgress(100);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error.message}`);
      setExportProgress(0);
    }
  };

const generatePdfBlob = async () => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    await page.render({ canvasContext: context, viewport }).promise;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = `${canvas.width}px`;
    container.style.height = `${canvas.height}px`;
    document.body.appendChild(container);

    container.appendChild(canvas);

    const pageFields = fields.filter(f => f.page === pageNum);
    const fieldsContainer = document.createElement('div');
    fieldsContainer.style.position = 'absolute';
    fieldsContainer.style.top = '0';
    fieldsContainer.style.left = '0';
    fieldsContainer.style.width = '100%';
    fieldsContainer.style.height = '100%';

    const signatureFields = pageFields.filter(f => f.type === 'signature' && f.value);
    const loadedImages = await Promise.all(
      signatureFields.map(field => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve({ id: field.id, img });
          img.onerror = () => resolve(null);
          img.src = field.value;
        });
      })
    );

    pageFields.forEach(field => {
      const fieldDiv = document.createElement('div');
      fieldDiv.style.cssText = `
        position: absolute;
        left: ${field.x}px;
        top: ${field.y}px;
        width: ${field.width}px;
        height: ${field.height}px;
        background-color: transparent;
      `;

      if (field.type === 'signature' && field.value) {
        const img = document.createElement('img');
        const loadedImg = loadedImages.find(i => i?.id === field.id);
        img.src = loadedImg ? loadedImg.img.src : field.value;
        img.style.cssText = `width: 100%; height: 100%; object-fit: contain; background-color: white;`;
        fieldDiv.appendChild(img);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = field.value || '';
        input.disabled = true;
        input.style.cssText = `
          width: 100%;
          height: 100%;
          border: 1px solid #ccc;
          background: transparent;
          color: #000;
          font-size: 14px;
        `;
        fieldDiv.appendChild(input);
      }

      fieldsContainer.appendChild(fieldDiv);
    });

    container.appendChild(fieldsContainer);

    const imageCanvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      windowWidth: canvas.width,
      windowHeight: canvas.height
    });

    const imgData = imageCanvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (imageCanvas.height * imgWidth) / imageCanvas.width;

    if (pageNum > 1) {
      pdf.addPage();
    }
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    document.body.removeChild(container);
  }

  return pdf.output('blob'); // 📦 Return the PDF blob
};


  const handleSubmitContract = async () => {
  if (!templateId || fields.length === 0) {
    alert("No data to submit.");
    return;
  }

  try {
    const result = await submitContract({
      templateId,
      submittedBy: "user@example.com",
      fields,
    });

    if (!result.success) {
      alert("Contract submission failed");
      return;
    }

    const contractId = result.contract._id;
    const pdfBlob = await generatePdfBlob();

    const formData = new FormData();
    formData.append("contractId", contractId);
    formData.append("pdf", pdfBlob, "filled-contract.pdf");

    // 👇 This is the missing line
    await uploadFilledContractPdf(formData);
    setIsUserContractSubmitted(true);
    alert("✅ Contract submitted and PDF saved!");
  } catch (err) {
    console.error("Submit contract failed:", err);
    alert("Something went wrong while submitting.");
  }
};



  const renderFieldValue = (field) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return <span className="field-value">{field.value || ''}</span>
      case 'date':
        return (
          <span className="field-value">
            {field.value ? new Date(field.value).toLocaleDateString() : ''}
          </span>
        )
      case 'checkbox':
        return (
          <div className="checkbox-display">
            {field.value ? (
              <FiCheckSquare className="checked-icon" />
            ) : (
              <FiSquare className="unchecked-icon" />
            )}
          </div>
        )
      case 'signature':
        return field.value ? (
          <img src={field.value} alt="Signature" className="signature-display" />
        ) : (
          <span className="signature-placeholder">No signature</span>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode !== 'contractor') return

      if (e.key === 'Delete' && activeField) {
        deleteField(activeField)
      }
      
      if (e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault()
          undo()
        } else if (e.key === 'y') {
          e.preventDefault()
          redo()
        } else if (e.key === 'd' && activeField) {
          e.preventDefault()
          duplicateField(activeField)
        } else if (e.key === 'c' && activeField) {
          e.preventDefault()
          const field = fields.find(f => f.id === activeField)
          if (field?.type === 'signature' && field.value) {
            const otherSignatureFields = fields.filter(f => 
              f.type === 'signature' && f.id !== activeField
            )
            if (otherSignatureFields.length > 0) {
              updateFieldConfig(otherSignatureFields[0].id, {
                value: field.value,
                width: field.width,
                height: field.height
              })
            }
          }
        } else if (e.key === 'l' && activeField) {
          e.preventDefault()
          const field = fields.find(f => f.id === activeField)
          if (field?.type === 'signature') {
            toggleFieldLink(activeField)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeField, mode, undo, redo, fields, deleteField, duplicateField, updateFieldConfig, toggleFieldLink])

  const hasOtherSignatureValues = useMemo(() => {
    if (!activeField) return false
    const currentField = fields.find(f => f.id === activeField)
    return currentField?.type === 'signature' && 
      fields.some(f => f.type === 'signature' && f.id !== activeField && f.value)
  }, [activeField, fields])

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
  if (showDataInspector || isContractPreviewOpen) {
    document.body.classList.add('contract-preview-open');
  } else {
    document.body.classList.remove('contract-preview-open');
  }
}, [showDataInspector, isContractPreviewOpen]);


  


  useEffect(() => {
  const lastId = localStorage.getItem("lastUsedTemplateId");

  // Auto-load the template when forceMode is 'user' and no template is loaded
  if (forceMode === 'user' && lastId && !pdfDoc) {
    const selected = templates.find(t => t.templateId === lastId);
    if (selected) {
      loadTemplate(selected);
    } else {
      fetchTemplateById(lastId).then(template => {
        if (template) {
          loadTemplate({
            templateId: template._id,
            templateName: template.templateName,
            pdfUrl: `http://localhost:3000/${template.pdfPath}`
          });
        }
      });
    }
  }
}, [forceMode, templates, pdfDoc, fetchTemplateById]);


  return (
    <div className={`pdf-form-builder ${isDragging ? 'dragging' : ''}`}>
      <Header
        mode={mode}
        setMode={setMode}
        pdfDoc={pdfDoc}
        templateName={templateName}
        currentPage={currentPage}
        totalPages={totalPages}
        undo={undo}
        redo={redo}
        historyIndex={historyIndex}
        history={history}
        handleDownloadPdf={handleDownloadPdf}
        handleSubmitContract={handleSubmitContract}
        toggleDataInspector={toggleDataInspector}
        fetchTemplates={fetchTemplates}
        isLoadingTemplates={isLoadingTemplates}
        handleSaveFields={saveFieldsToBackend}
         isContractPreviewOpen={isContractPreviewOpen}
      setIsContractPreviewOpen={setIsContractPreviewOpen}
      handleGenerateMagicLink={handleGenerateMagicLink}
      contractorFillMode={contractorFillMode}
      setContractorFillMode={setContractorFillMode}
      />

      <Toolbar
        mode={mode}
        templates={templates}
        isLoadingTemplates={isLoadingTemplates}
        selectedTemplate={selectedTemplate}
        loadTemplate={loadTemplate}
        fetchTemplates={fetchTemplates}
        enhancedFieldTypes={enhancedFieldTypes}
        addField={addField}
        pdfDoc={pdfDoc}
        scale={scale}
        setScale={setScale}
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />
 
      <div className="workspace">
  {mode === 'contractor' && (
    contractorFillMode ? (
      <ContractorFillPanel
        fields={fields}
        updateFieldConfig={updateFieldConfig}
        saveFieldsToBackend={saveFieldsToBackend}
        templateId={templateId}
      />
    ) : (
      <FieldConfigPanel
        fields={fields}
        activeField={activeField}
        setActiveField={setActiveField}
        fieldConfig={fieldConfig}
        setFieldConfig={setFieldConfig}
        updateFieldConfig={updateFieldConfig}
        FIELD_TYPES={FIELD_TYPES}
        linkedFields={linkedFields}
        toggleFieldLink={toggleFieldLink}
        hasOtherSignatureValues={hasOtherSignatureValues}
        handleCopySignature={handleCopySignature}
        duplicateField={duplicateField}
        deleteField={deleteField}
        currentPage={currentPage}
      />
    )
  )}

  {mode === 'user' && (
    <FillFormPanel
      fields={fields.filter(field => field.visible !== false)}  
      updateFieldConfig={updateFieldConfig}
      handleDownloadPdf={handleDownloadPdf}
      handleOpenSignaturePad={handleOpenSignaturePad}
      isUserContractSubmitted={isUserContractSubmitted}
    />
  )}

  <PdfViewer
    pdfDoc={pdfDoc}
    pdfContainerRef={pdfContainerRef}
    pdfCanvasRef={pdfCanvasRef}
    pageRendered={pageRendered}
    renderPdfPage={renderPdfPage}
    currentPage={currentPage}
    mode={mode}
    fields={fields}
    activeField={activeField}
    setActiveField={setActiveField}
    handleMouseDown={handleMouseDown}
    handleFileUpload={handleFileUpload}
    handleOpenSignaturePad={handleOpenSignaturePad}
    renderFieldValue={renderFieldValue}
    isDragging={isDragging}
  />
</div>


      {showSignaturePad && (
        <SignatureModal
          signaturePadRef={signaturePadRef}
          signatureFieldId={signatureFieldId}
          hasOtherSignatureValues={hasOtherSignatureValues}
          fields={fields}
          setShowSignaturePad={setShowSignaturePad}
          handleClearSignature={handleClearSignature}
          handleSaveSignature={handleSaveSignature}
          handleCopySignature={handleCopySignature}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          templateId={templateId}
          setTemplateId={setTemplateId}
          templateName={templateName}
          setTemplateName={setTemplateName}
          uploadedPdfFile={uploadedPdfFile}
          setShowTemplateModal={setShowTemplateModal}
          saveAsTemplate={saveAsTemplate}
        />
      )}

      {showDataInspector && (
        <DataInspectorModal
          templateName={templateName}
          setShowDataInspector={setShowDataInspector}
          isLoadingData={isLoadingData}
          contractData={contractData}
          fields={fields}
        />
      )}

      {exportProgress > 0 && exportProgress < 100 && (
        <div className="export-progress">
          <div className="progress-bar" style={{ width: `${exportProgress}%` }}></div>
          <span className="progress-text">Generating PDF... {exportProgress}%</span>
        </div>
      )}
    </div>
  )
}

export default PdfFormBuilder