import { 
  FiCalendar, 
  FiType, 
  FiMail, 
  FiHash, 
  FiPenTool, 
  FiCheckSquare 
} from 'react-icons/fi'

export const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: <FiType />, color: '#6366f1' },
  { value: 'date', label: 'Date', icon: <FiCalendar />, color: '#10b981' },
  { value: 'email', label: 'Email', icon: <FiMail />, color: '#8b5cf6' },
  { value: 'signature', label: 'Signature', icon: <FiPenTool />, color: '#ec4899' },
  { value: 'checkbox', label: 'Checkbox', icon: <FiCheckSquare />, color: '#f59e0b' },
  { value: 'number', label: 'Number', icon: <FiHash />, color: '#3b82f6' }
]

export const INITIAL_FIELD = {
  id: '',
  x: 100,
  y: 100,
  width: 200,
  height: 40,
  type: 'text',
  label: '',
  required: false,
  placeholder: '',
  value: '',
  fieldId: '',
  zIndex: 1000,
  color: '#6366f1'
}