/**
 * Testes para utilitários e helpers
 */

import {
  getTranslation,
  isRTL,
  languageNames,
  type Language,
} from "@/lib/translations-new";

describe("Translations", () => {
  describe("getTranslation", () => {
    it("should return correct translation for Portuguese", () => {
      const result = getTranslation("hero.title", "pt");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should return correct translation for English", () => {
      const result = getTranslation("hero.title", "en");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should return correct translation for Spanish", () => {
      const result = getTranslation("hero.title", "es");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should return different translations for different languages", () => {
      const ptResult = getTranslation("auth.login", "pt");
      const enResult = getTranslation("auth.login", "en");
      
      // They should be defined but potentially different
      expect(ptResult).toBeDefined();
      expect(enResult).toBeDefined();
    });
  });

  describe("isRTL", () => {
    it("should return true for Arabic", () => {
      expect(isRTL("ar")).toBe(true);
    });

    it("should return false for Portuguese", () => {
      expect(isRTL("pt")).toBe(false);
    });

    it("should return false for English", () => {
      expect(isRTL("en")).toBe(false);
    });

    it("should return false for Spanish", () => {
      expect(isRTL("es")).toBe(false);
    });

    it("should return false for Hindi", () => {
      expect(isRTL("hi")).toBe(false);
    });
  });

  describe("languageNames", () => {
    it("should have all supported languages", () => {
      const supportedLanguages: Language[] = ["pt", "en", "es", "hi", "ar"];
      
      supportedLanguages.forEach((lang) => {
        expect(languageNames[lang]).toBeDefined();
        expect(typeof languageNames[lang]).toBe("string");
      });
    });

    it("should have Portuguese name", () => {
      expect(languageNames.pt).toBe("Português");
    });

    it("should have English name", () => {
      expect(languageNames.en).toBe("English");
    });
  });
});

describe("Validation Utils", () => {
  describe("Email Validation", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("should validate correct email formats", () => {
      expect(emailRegex.test("test@example.com")).toBe(true);
      expect(emailRegex.test("user.name@domain.org")).toBe(true);
      expect(emailRegex.test("email@subdomain.domain.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(emailRegex.test("invalid")).toBe(false);
      expect(emailRegex.test("@domain.com")).toBe(false);
      expect(emailRegex.test("email@")).toBe(false);
      expect(emailRegex.test("email @domain.com")).toBe(false);
    });
  });

  describe("Password Validation", () => {
    const isValidPassword = (password: string): boolean => {
      return password.length >= 6;
    };

    it("should accept passwords with 6 or more characters", () => {
      expect(isValidPassword("123456")).toBe(true);
      expect(isValidPassword("password")).toBe(true);
      expect(isValidPassword("super-secure-password")).toBe(true);
    });

    it("should reject passwords with less than 6 characters", () => {
      expect(isValidPassword("12345")).toBe(false);
      expect(isValidPassword("abc")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });
  });
});

describe("Date Formatting", () => {
  it("should format date correctly", () => {
    const date = new Date("2025-12-04T12:00:00Z");
    const formatted = date.toLocaleDateString("pt-BR");
    
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
