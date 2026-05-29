// Class names merger helper
export function cn(...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]) {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

// Format ISO date to human readable string
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Just now';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Just now';
  }
}

// Generate anonymous browser tracking token
export function generateToken(): string {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('uprc_user_token');
    if (existing) return existing;
    
    const newToken = 'usr_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('uprc_user_token', newToken);
    return newToken;
  }
  return '';
}
