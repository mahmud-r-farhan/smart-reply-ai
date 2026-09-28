import { generateTranslations, FORMATS, isValidFormat } from "../services/openRouterService.js";

export const translateText = async (req, res, next) => {
  try {
    const { text, language = "english", format = FORMATS.PROFESSIONAL, providerConfig } = req.body;

    // Validation
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: "Text must be under 2000 characters" });
    }
    if (!language || language.trim().length === 0) {
      return res.status(400).json({ error: "Language is required" });
    }
    if (!/^[a-zA-Z\s\-]+$/.test(language)) {
      return res.status(400).json({ error: "Invalid language" });
    }
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        error: `Invalid format. Supported formats: ${Object.values(FORMATS).join(", ")}` 
      });
    }

    const translations = await generateTranslations(text.trim(), language, format, providerConfig);
    res.json({ translations });
  } catch (error) {
    next(error);
  }
};