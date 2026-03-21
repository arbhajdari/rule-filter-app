import { Request, Response, NextFunction } from 'express';
import { CreateRuleSchema, UpdateRuleSchema } from '../validators/ruleValidator';
import * as rulesService from '../services/rulesService';

/**
 * Handles the HTTP boundary for Rule management. 
 * Maps incoming requests to the rulesService and manages error propagation.
 */

export async function getRules(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rules = await rulesService.getAllRules();
    res.json(rules);
  } catch (err) {
    next(err);
  }
}

export async function createRule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // safeParse allows us to catch Zod validation errors and 
    // respond with a 400 instead of a 500 error.
    const result = CreateRuleSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }

    const rule = await rulesService.createRule(result.data);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
}

export async function updateRule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid Rule ID provided' });
      return;
    }

    const result = UpdateRuleSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }

    const rule = await rulesService.updateRule(id, result.data);
    res.json(rule);
  } catch (err) {
    // Errors from the service layer are forwarded to global error middleware
    next(err);
  }
}

export async function deleteRule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid Rule ID provided' });
      return;
    }

    await rulesService.deleteRule(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}