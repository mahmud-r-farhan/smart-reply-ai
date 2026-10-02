import { generateSuggestions } from "../services/openRouterService.js";
import { FORMATS, FORMAT_ALIASES } from "../utils/modelSelector.js";
import {
  LIMITS,
  requireText,
  requireFormat,
  requireProviderConfig,
} from "../utils/validation.js";

export const suggestReply = async (req, res, next) => {
  try {
    const message = requireText(req.body?.message, {
      field: "Message",
      max: LIMITS.SUGGEST,
    });
    const format = requireFormat(req.body?.format, {
      fallback: FORMATS.PROFESSIONAL,
      validFormats: Object.values(FORMATS),
      aliases: FORMAT_ALIASES,
    });
    const providerConfig = requireProviderConfig(req.body?.providerConfig);
    const options = { refresh: req.body?.refresh === true };

    const { results, source, latencyMs, model } = await generateSuggestions(
      message,
      format,
      providerConfig,
      options
    );

    res.json({ suggestions: results, source, latencyMs, model });
  } catch (error) {
    next(error);
  }
};
