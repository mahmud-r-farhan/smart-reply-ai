import { generateTranslations } from "../services/openRouterService.js";
import { FORMATS, FORMAT_ALIASES } from "../utils/modelSelector.js";
import {
  LIMITS,
  requireText,
  requireFormat,
  requireLanguage,
  requireProviderConfig,
} from "../utils/validation.js";

export const translateText = async (req, res, next) => {
  try {
    const text = requireText(req.body?.text, { field: "Text", max: LIMITS.TRANSLATE });
    const language = requireLanguage(req.body?.language, { fallback: "english" });
    const format = requireFormat(req.body?.format, {
      fallback: FORMATS.PROFESSIONAL,
      validFormats: Object.values(FORMATS),
      aliases: FORMAT_ALIASES,
    });
    const providerConfig = requireProviderConfig(req.body?.providerConfig);
    const options = { refresh: req.body?.refresh === true };

    const { results, source, latencyMs, model } = await generateTranslations(
      text,
      language,
      format,
      providerConfig,
      options
    );

    res.json({ translations: results, source, latencyMs, model });
  } catch (error) {
    next(error);
  }
};
