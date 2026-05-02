// Utility function to format date to DD/MM/YYYY
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Utility to convert DD/MM/YYYY to YYYY-MM-DD for input
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  // If already in YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // Convert from DD/MM/YYYY to YYYY-MM-DD
  const parts = dateString.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  return dateString;
};

// Format date for display
export const formatDisplayDate = (dateString) => {
  return formatDate(dateString);
};