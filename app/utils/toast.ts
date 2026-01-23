// Toast notification utility
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Create a simple toast element
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-slide-in-up ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  }`;
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
