import { Module } from '@nestjs/common';
import { PathaoService } from './pathao.service.js';

/**
 * Pathao Courier Module (Phase 6 scaffold)
 *
 * NOT registered in app.module.ts yet.
 * When ready for Phase 6, register this module in AppModule imports.
 *
 * Required env vars (to be added in Phase 6):
 * - PATHAO_CLIENT_ID
 * - PATHAO_CLIENT_SECRET
 * - PATHAO_CLIENT_EMAIL
 * - PATHAO_CLIENT_PASSWORD
 * - PATHAO_BASE_URL (staging or production)
 */
@Module({
    providers: [PathaoService],
    exports: [PathaoService],
})
export class PathaoModule {}
