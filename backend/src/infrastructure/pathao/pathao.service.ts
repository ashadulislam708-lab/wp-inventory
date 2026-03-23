import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

/**
 * Pathao Courier Service (Phase 6 scaffold)
 *
 * Pathao API documentation:
 * - Staging:    https://hermes-api.p-stageenv.xyz
 * - Production: https://api-hermes.pathao.com
 * - Auth: OAuth2 client_credentials grant
 *
 * This service will handle:
 * - OAuth2 token management (client_credentials)
 * - Order creation on Pathao
 * - Order status tracking
 * - City/Zone/Area list fetching for address selection
 *
 * NOT yet registered in app.module.ts -- this is a scaffold only.
 */

export interface PathaoCreateOrderRequest {
    store_id: number;
    merchant_order_id: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    recipient_city: number;
    recipient_zone: number;
    recipient_area: number;
    delivery_type: number;
    item_type: number;
    item_quantity: number;
    item_weight: number;
    amount_to_collect: number;
    special_instruction?: string;
}

export interface PathaoOrderResponse {
    consignment_id: string;
    merchant_order_id: string;
    order_status: string;
    delivery_fee: number;
}

export interface PathaoCity {
    city_id: number;
    city_name: string;
}

export interface PathaoZone {
    zone_id: number;
    zone_name: string;
}

export interface PathaoArea {
    area_id: number;
    area_name: string;
}

export interface PathaoAccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

@Injectable()
export class PathaoService {
    private readonly logger = new Logger(PathaoService.name);

    // Pathao API base URLs
    private static readonly STAGING_BASE_URL =
        'https://hermes-api.p-stageenv.xyz';
    private static readonly PRODUCTION_BASE_URL =
        'https://api-hermes.pathao.com';

    /**
     * Get OAuth2 access token using client_credentials grant.
     * Required before making any API calls.
     *
     * Env vars needed: PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_CLIENT_EMAIL, PATHAO_CLIENT_PASSWORD
     */
    getAccessToken(): Promise<PathaoAccessTokenResponse> {
        this.logger.warn(
            'PathaoService.getAccessToken() called but not implemented',
        );
        throw new NotImplementedException(
            'Pathao integration coming in Phase 6',
        );
    }

    /**
     * Create a delivery order on Pathao.
     * Requires valid access token.
     */
    createOrder(
        _request: PathaoCreateOrderRequest,
    ): Promise<PathaoOrderResponse> {
        this.logger.warn(
            'PathaoService.createOrder() called but not implemented',
        );
        throw new NotImplementedException(
            'Pathao integration coming in Phase 6',
        );
    }

    /**
     * Get delivery status by Pathao consignment ID.
     */
    getOrderStatus(_consignmentId: string): Promise<string> {
        this.logger.warn(
            'PathaoService.getOrderStatus() called but not implemented',
        );
        throw new NotImplementedException(
            'Pathao integration coming in Phase 6',
        );
    }

    /**
     * Fetch list of cities from Pathao.
     * Used for recipient address selection.
     */
    getCityList(): Promise<PathaoCity[]> {
        this.logger.warn(
            'PathaoService.getCityList() called but not implemented',
        );
        throw new NotImplementedException(
            'Pathao integration coming in Phase 6',
        );
    }

    /**
     * Fetch list of zones for a given city from Pathao.
     * Used for recipient address selection.
     */
    getZoneList(_cityId: number): Promise<PathaoZone[]> {
        this.logger.warn(
            'PathaoService.getZoneList() called but not implemented',
        );
        throw new NotImplementedException(
            'Pathao integration coming in Phase 6',
        );
    }

    /**
     * Fetch list of areas for a given zone from Pathao.
     * Used for recipient address selection.
     */
    getAreaList(_zoneId: number): Promise<PathaoArea[]> {
        this.logger.warn(
            'PathaoService.getAreaList() called but not implemented',
        );
        throw new NotImplementedException(
            'Pathao integration coming in Phase 6',
        );
    }
}
