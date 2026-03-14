import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { envConfigService } from 'src/config/env-config.service';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const origin = req.headers.origin as string;
        if (origin && envConfigService.getOrigins().includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS',
        );
        res.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization',
        );
        res.header('Access-Control-Allow-Credentials', 'true'); // Needed for credentials
        if (req.method === 'OPTIONS') {
            return res.status(204).end(); // Respond to preflight requests
        }
        next();
    }
}
