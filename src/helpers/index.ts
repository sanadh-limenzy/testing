// Toast notification helper
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Simple console log for now - you can replace with your preferred toast library
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // If you want to implement a proper toast, you could use:
  // - react-hot-toast
  // - react-toastify
  // - sonner
  // - or any other toast library
};
