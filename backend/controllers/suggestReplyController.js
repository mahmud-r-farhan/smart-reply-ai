import { generateSuggestions, FORMATS, isValidFormat } from "../services/openRouterService.js";

export const suggestReply = async (req, res, next) => {
  try {
    const { message, format = FORMATS.PROFESSIONAL, providerConfig } = req.body;

    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message must be under 2000 characters" });
    }
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        error: `Invalid format. Supported formats: ${Object.values(FORMATS).join(", ")}` 
      });
    }

    const suggestions = await generateSuggestions(message.trim(), format, providerConfig);
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};