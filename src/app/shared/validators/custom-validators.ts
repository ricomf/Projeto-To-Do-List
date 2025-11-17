import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/**
 * Custom validators for form validation
 */
export class CustomValidators {
  /**
   * Password strength validator
   * Requirements:
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const isValidLength = value.length >= 8;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

      if (!passwordValid) {
        return {
          passwordStrength: {
            hasUpperCase,
            hasLowerCase,
            hasNumeric,
            hasSpecialChar,
            isValidLength,
            message: 'A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais'
          }
        };
      }

      return null;
    };
  }

  /**
   * Password match validator (for confirm password)
   */
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordField);
      const confirmPassword = formGroup.get(confirmPasswordField);

      if (!password || !confirmPassword) {
        return null;
      }

      if (confirmPassword.errors && !confirmPassword.errors['passwordMatch']) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMatch: { message: 'As senhas não coincidem' } });
        return { passwordMatch: true };
      } else {
        confirmPassword.setErrors(null);
        return null;
      }
    };
  }

  /**
   * Email format validator (more strict than default)
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailRegex.test(value)) {
        return {
          email: {
            message: 'Formato de email inválido'
          }
        };
      }

      return null;
    };
  }

  /**
   * Brazilian phone number validator
   */
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Remove non-numeric characters
      const phone = value.replace(/\D/g, '');

      // Brazilian phone: (DDD) + 8 or 9 digits
      const phoneRegex = /^(\d{2})(\d{4,5})(\d{4})$/;

      if (!phoneRegex.test(phone)) {
        return {
          phoneNumber: {
            message: 'Formato de telefone inválido. Use (XX) XXXXX-XXXX'
          }
        };
      }

      return null;
    };
  }

  /**
   * Brazilian CPF validator
   */
  static cpf(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Remove non-numeric characters
      const cpf = value.replace(/\D/g, '');

      if (cpf.length !== 11) {
        return {
          cpf: {
            message: 'CPF deve conter 11 dígitos'
          }
        };
      }

      // Check for known invalid CPFs
      if (/^(\d)\1{10}$/.test(cpf)) {
        return {
          cpf: {
            message: 'CPF inválido'
          }
        };
      }

      // Validate CPF algorithm
      let sum = 0;
      let remainder;

      for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
      }

      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(9, 10))) {
        return {
          cpf: {
            message: 'CPF inválido'
          }
        };
      }

      sum = 0;
      for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
      }

      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(10, 11))) {
        return {
          cpf: {
            message: 'CPF inválido'
          }
        };
      }

      return null;
    };
  }

  /**
   * URL validator
   */
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      try {
        new URL(value);
        return null;
      } catch {
        return {
          url: {
            message: 'URL inválida'
          }
        };
      }
    };
  }

  /**
   * Date range validator
   */
  static dateRange(minDate?: Date, maxDate?: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const date = new Date(value);

      if (isNaN(date.getTime())) {
        return {
          dateRange: {
            message: 'Data inválida'
          }
        };
      }

      if (minDate && date < minDate) {
        return {
          dateRange: {
            message: `Data deve ser posterior a ${minDate.toLocaleDateString()}`
          }
        };
      }

      if (maxDate && date > maxDate) {
        return {
          dateRange: {
            message: `Data deve ser anterior a ${maxDate.toLocaleDateString()}`
          }
        };
      }

      return null;
    };
  }

  /**
   * Future date validator
   */
  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        return {
          futureDate: {
            message: 'Data deve ser futura'
          }
        };
      }

      return null;
    };
  }

  /**
   * Past date validator
   */
  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (date > today) {
        return {
          pastDate: {
            message: 'Data deve ser passada'
          }
        };
      }

      return null;
    };
  }

  /**
   * Min age validator
   */
  static minAge(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < minAge) {
        return {
          minAge: {
            message: `Idade mínima: ${minAge} anos`
          }
        };
      }

      return null;
    };
  }

  /**
   * No whitespace validator
   */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const isWhitespace = (value || '').trim().length === 0;

      if (isWhitespace) {
        return {
          noWhitespace: {
            message: 'Campo não pode conter apenas espaços em branco'
          }
        };
      }

      return null;
    };
  }

  /**
   * No special characters validator
   */
  static noSpecialChars(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;

      if (specialCharsRegex.test(value)) {
        return {
          noSpecialChars: {
            message: 'Campo não pode conter caracteres especiais'
          }
        };
      }

      return null;
    };
  }

  /**
   * Alphanumeric only validator
   */
  static alphanumeric(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const alphanumericRegex = /^[a-zA-Z0-9]+$/;

      if (!alphanumericRegex.test(value)) {
        return {
          alphanumeric: {
            message: 'Campo deve conter apenas letras e números'
          }
        };
      }

      return null;
    };
  }

  /**
   * Min words validator
   */
  static minWords(minWords: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const words = value.trim().split(/\s+/);

      if (words.length < minWords) {
        return {
          minWords: {
            message: `Mínimo de ${minWords} palavras`,
            actualWords: words.length
          }
        };
      }

      return null;
    };
  }

  /**
   * Max words validator
   */
  static maxWords(maxWords: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const words = value.trim().split(/\s+/);

      if (words.length > maxWords) {
        return {
          maxWords: {
            message: `Máximo de ${maxWords} palavras`,
            actualWords: words.length
          }
        };
      }

      return null;
    };
  }

  /**
   * File size validator (for file inputs)
   */
  static fileSize(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value;

      if (!file) {
        return null;
      }

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        return {
          fileSize: {
            message: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`,
            actualSize: (file.size / 1024 / 1024).toFixed(2),
            maxSize: maxSizeInMB
          }
        };
      }

      return null;
    };
  }

  /**
   * File type validator
   */
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value;

      if (!file) {
        return null;
      }

      const fileType = file.type;
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        return {
          fileType: {
            message: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`,
            actualType: fileType
          }
        };
      }

      return null;
    };
  }
}
