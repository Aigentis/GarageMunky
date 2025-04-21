
/**
 * Format a UK vehicle registration number for display
 * Handles different UK registration formats:
 * - Current format: AB12 CDE (2 letters, 2 numbers, 3 letters)
 * - Older format: A123 BCD (1 letter, 3 numbers, 3 letters)
 * - Even older: ABC 123D (3 letters, 3 numbers, 1 letter)
 */
export const formatRegistration = (input: string): string => {
  // Convert to uppercase and remove all spaces
  let reg = input.toUpperCase().replace(/\s/g, '');
  
  if (reg.length > 0) {
    // Current format (post-2001): AB12CDE -> AB12 CDE
    if (reg.length >= 4 && /^[A-Z]{2}\d{2}/.test(reg)) {
      reg = reg.substring(0, 4) + (reg.length > 4 ? ' ' + reg.substring(4) : '');
    } 
    // Older format (1983-2001): A123BCD -> A123 BCD
    else if (reg.length >= 4 && /^[A-Z]{1}\d{3}/.test(reg)) {
      reg = reg.substring(0, 4) + (reg.length > 4 ? ' ' + reg.substring(4) : '');
    }
    // Even older format (pre-1983): ABC123D -> ABC 123D
    else if (reg.length >= 3 && /^[A-Z]{3}/.test(reg)) {
      reg = reg.substring(0, 3) + (reg.length > 3 ? ' ' + reg.substring(3) : '');
    }
  }
  
  return reg;
};

/**
 * Prepare a registration number for API requests by removing all spaces
 */
export const cleanRegistrationForApi = (input: string): string => {
  return input.toUpperCase().replace(/\s/g, '');
};
