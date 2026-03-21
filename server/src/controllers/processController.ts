import { Request, Response, NextFunction } from 'express';
import { ProcessTextSchema } from '../validators/ruleValidator';
import { getEnabledRules } from '../services/rulesService';
import { processText } from '../services/textProcessorService';

/**
 * Main entry point for the text analysis engine.
 * * Note: We use 'handleProcessText' to avoid shadowing the Node.js 
 * global 'process' object, which would break access to process.env.
 */
export async function handleProcessText(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = ProcessTextSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }

    // Process text against currently active rules only
    const rules = await getEnabledRules();
    const segments = processText(result.data.text, rules);

    res.json({ segments });
  } catch (err) {
    next(err);
  }
}