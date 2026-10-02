import { generateEnhancements } from "../services/openRouterService.js";
import { FORMATS, FORMAT_ALIASES } from "../utils/modelSelector.js";
import {
  LIMITS,
  requireText,
  requireFormat,
  requireProviderConfig,
} from "../utils/validation.js";

export const enhanceText = async (req, res, next) => {
  try {
    const text = requireText(req.body?.text, { field: "Text", max: LIMITS.ENHANCE });
    const format = requireFormat(req.body?.format, {
      fallback: FORMATS.PROFESSIONAL,
      validFormats: Object.values(FORMATS),
      aliases: FORMAT_ALIASES,
    });
    const providerConfig = requireProviderConfig(req.body?.providerConfig);
    const options = { refresh: req.body?.refresh === true };

    const { results, source, latencyMs, model } = await generateEnhancements(
      text,
      format,
      providerConfig,
      options
    );

    res.json({ enhancements: results, source, latencyMs, model });
  } catch (error) {
    next(error);
  }
};
