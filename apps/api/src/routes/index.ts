import { Router } from 'express';

/** Global router: mounts every module router under /api/v1. */
export const apiRouter = Router();

// Module routers are mounted here as they are added.
