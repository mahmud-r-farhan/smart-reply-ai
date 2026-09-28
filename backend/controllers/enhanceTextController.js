import { generateEnhancements, FORMATS, isValidFormat } from "../services/openRouterService.js";

export const enhanceText = async (req, res, next) => {
  try {
    const { text, format = FORMATS.PROFESSIONAL, providerConfig } = req.body;

    // Validation
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: "Text must be under 2000 characters" });
    }
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        error: `Invalid format. Supported formats: ${Object.values(FORMATS).join(", ")}` 
      });
    }

    const enhancements = await generateEnhancements(text.trim(), format, providerConfig);
    res.json({ enhancements });
  } catch (error) {
    next(error);
  }
};