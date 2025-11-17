/**
 * Utility functions for input sanitization
 */
export class SanitizationUtils {
  /**
   * Sanitize HTML to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (!input) {
      return '';
    }

    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Remove HTML tags from string
   */
  static stripHtml(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Sanitize SQL input to prevent SQL injection
   */
  static sanitizeSql(input: string): string {
    if (!input) {
      return '';
    }

    // Remove common SQL injection patterns
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, ''); // Remove block comment end
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email: string): string {
    if (!email) {
      return '';
    }

    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._+-]/g, '');
  }

  /**
   * Sanitize phone number (remove non-numeric characters except +)
   */
  static sanitizePhone(phone: string): string {
    if (!phone) {
      return '';
    }

    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Sanitize Brazilian CPF (keep only numbers)
   */
  static sanitizeCpf(cpf: string): string {
    if (!cpf) {
      return '';
    }

    return cpf.replace(/\D/g, '');
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    if (!url) {
      return '';
    }

    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return '';
      }
      return parsedUrl.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    if (!filename) {
      return '';
    }

    // Remove path separators and special characters
    return filename
      .replace(/[\/\\]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize alphanumeric (keep only letters and numbers)
   */
  static sanitizeAlphanumeric(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Sanitize text (remove control characters and trim)
   */
  static sanitizeText(input: string): string {
    if (!input) {
      return '';
    }

    return input
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  /**
   * Sanitize number (extract numeric value)
   */
  static sanitizeNumber(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/[^\d.-]/g, '');
  }

  /**
   * Sanitize integer (keep only digits)
   */
  static sanitizeInteger(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/\D/g, '');
  }

  /**
   * Sanitize username (alphanumeric, underscore, hyphen)
   */
  static sanitizeUsername(username: string): string {
    if (!username) {
      return '';
    }

    return username
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 50); // Limit length
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query) {
      return '';
    }

    return query
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, 200); // Limit length
  }

  /**
   * Sanitize JSON string
   */
  static sanitizeJson(input: string): string {
    if (!input) {
      return '';
    }

    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed);
    } catch {
      return '';
    }
  }

  /**
   * Deep sanitize object (recursively sanitize all string properties)
   */
  static sanitizeObject<T>(obj: T, sanitizeFn: (value: string) => string = this.sanitizeText): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return sanitizeFn(obj) as any;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, sanitizeFn)) as any;
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject((obj as any)[key], sanitizeFn);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Escape regex special characters
   */
  static escapeRegex(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Normalize whitespace (replace multiple spaces with single space)
   */
  static normalizeWhitespace(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/\s+/g, ' ').trim();
  }

  /**
   * Truncate string to max length
   */
  static truncate(input: string, maxLength: number, suffix: string = '...'): string {
    if (!input || input.length <= maxLength) {
      return input;
    }

    return input.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Mask sensitive data (e.g., credit card, CPF)
   */
  static maskSensitive(input: string, visibleChars: number = 4, maskChar: string = '*'): string {
    if (!input || input.length <= visibleChars) {
      return input;
    }

    const masked = maskChar.repeat(input.length - visibleChars);
    return masked + input.slice(-visibleChars);
  }

  /**
   * Sanitize credit card number
   */
  static sanitizeCreditCard(card: string): string {
    if (!card) {
      return '';
    }

    return card.replace(/\D/g, '').substring(0, 16);
  }

  /**
   * Sanitize CVV
   */
  static sanitizeCvv(cvv: string): string {
    if (!cvv) {
      return '';
    }

    return cvv.replace(/\D/g, '').substring(0, 4);
  }

  /**
   * Sanitize postal code (CEP)
   */
  static sanitizePostalCode(postalCode: string): string {
    if (!postalCode) {
      return '';
    }

    return postalCode.replace(/\D/g, '').substring(0, 8);
  }

  /**
   * Check if string contains only safe characters
   */
  static isSafe(input: string): boolean {
    if (!input) {
      return true;
    }

    // Check for common malicious patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Remove null bytes
   */
  static removeNullBytes(input: string): string {
    if (!input) {
      return '';
    }

    return input.replace(/\0/g, '');
  }

  /**
   * Sanitize for different contexts
   */
  static sanitizeForContext(input: string, context: 'html' | 'sql' | 'url' | 'email' | 'text'): string {
    switch (context) {
      case 'html':
        return this.sanitizeHtml(input);
      case 'sql':
        return this.sanitizeSql(input);
      case 'url':
        return this.sanitizeUrl(input);
      case 'email':
        return this.sanitizeEmail(input);
      case 'text':
      default:
        return this.sanitizeText(input);
    }
  }
}
