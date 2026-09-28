import { generateSummaries, FORMATS, isValidFormat } from "../services/openRouterService.js";

export const summarizeText = async (req, res, next) => {
  try {
    const { text, format = FORMATS.CONCISE, providerConfig } = req.body;

    // Validation
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text to summarize is required" });
    }
    if (text.length > 8000) {
      return res.status(400).json({ error: "Text must be under 8000 characters" });
    }
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        error: `Invalid format. Supported formats: ${Object.values(FORMATS).join(", ")}` 
      });
    }

    const summaries = await generateSummaries(text.trim(), format, providerConfig);
    res.json({ summaries });
  } catch (error) {
    next(error);
  }
};
