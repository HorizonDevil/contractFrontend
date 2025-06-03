// src/components/MagicLinkLanding.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTemplateContext } from '../context/TemplateContext';
import PdfFormBuilder from './PdfFormBuilder/PdfFormBuilder';

const MagicLinkLanding = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [templateId, setTemplateId] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const { fetchTemplateById } = useTemplateContext();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/auth/verify-magic-link?token=${token}`);
        const result = await res.json();
        if (result.success && result.user?.templateId) {
          localStorage.setItem('lastUsedTemplateId', result.user.templateId);
          setTemplateId(result.user.templateId);
          setIsValid(true);
        }
      } catch (err) {
        console.error("Token verification failed", err);
        setIsValid(false);
      }
    };

    if (token) verify();
  }, [token]);

  if (!token) return <div>Missing token in URL.</div>;
  if (!isValid) return <div>Verifying...</div>;

  return (
    <PdfFormBuilder forceMode="user" />
  );
};

export default MagicLinkLanding;
