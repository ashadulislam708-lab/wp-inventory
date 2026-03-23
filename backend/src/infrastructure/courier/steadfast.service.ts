import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { envConfigService } from '../../config/env-config.service.js';
import { normalizeBDPhone } from '../../shared/utils/phone.util.js';

export interface SteadfastCreateOrderRequest {
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    note?: string;
}

export interface SteadfastConsignment {
    consignment_id: number | string;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
}

export interface SteadfastCreateOrderResponse {
    status: number;
    message: string;
    consignment: SteadfastConsignment;
}

@Injectable()
export class SteadfastService {
    private readonly logger = new Logger(SteadfastService.name);
    private readonly client: AxiosInstance;

    constructor() {
        const config = envConfigService.getSteadfastConfig();

        this.client = axios.create({
            baseURL: config.STEADFAST_BASE_URL,
            headers: {
                'Api-Key': config.STEADFAST_API_KEY,
                'Secret-Key': config.STEADFAST_SECRET_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    /**
     * Create a consignment order on Steadfast
     * Returns consignment details or null if API call fails
     */
    async createOrder(
        request: SteadfastCreateOrderRequest,
    ): Promise<{ consignmentId: string; trackingCode: string } | null> {
        try {
            const config = envConfigService.getSteadfastConfig();

            // Skip if no API key configured
            if (!config.STEADFAST_API_KEY || !config.STEADFAST_SECRET_KEY) {
                this.logger.warn(
                    'Steadfast API credentials not configured. Skipping courier push.',
                );
                return null;
            }

            // Normalize phone to 11-digit BD format required by Steadfast
            const normalizedRequest = {
                ...request,
                recipient_phone: normalizeBDPhone(request.recipient_phone),
            };

            this.logger.log(
                `Steadfast push: invoice=${request.invoice}, phone=${normalizedRequest.recipient_phone}`,
            );

            const response =
                await this.client.post<SteadfastCreateOrderResponse>(
                    '/create_order',
                    normalizedRequest,
                );

            if (response.data.status === 200 && response.data.consignment) {
                const consignment = response.data.consignment;
                this.logger.log(
                    `Steadfast order created: invoice=${request.invoice}, consignmentId=${consignment.consignment_id}, trackingCode=${consignment.tracking_code}`,
                );
                return {
                    consignmentId: String(consignment.consignment_id),
                    trackingCode: consignment.tracking_code,
                };
            }

            this.logger.error(
                `Steadfast create order returned non-200: status=${response.data.status}, message=${response.data.message}, invoice=${request.invoice}`,
            );
            return null;
        } catch (error: any) {
            this.logger.error(
                `Steadfast API error: invoice=${request.invoice}, httpStatus=${error.response?.status}, message=${error.message}, response=${JSON.stringify(error.response?.data)}`,
            );
            return null;
        }
    }

    /**
     * Cancel a consignment via return request
     * Note: Official API uses create_return_request, not cancel_order
     */
    async cancelOrder(consignmentId: string): Promise<boolean> {
        try {
            const config = envConfigService.getSteadfastConfig();

            if (!config.STEADFAST_API_KEY || !config.STEADFAST_SECRET_KEY) {
                this.logger.warn(
                    'Steadfast API credentials not configured. Skipping courier cancellation.',
                );
                return false;
            }

            const response = await this.client.post('/create_return_request', {
                consignment_id: Number(consignmentId),
                reason: 'Order cancelled',
            });

            return response.data.status === 200 || response.status === 200;
        } catch (error: any) {
            this.logger.error(
                `Steadfast cancel error: ${error.message}`,
                error.response?.data,
            );
            return false;
        }
    }

    /**
     * Check delivery status by consignment ID
     */
    async checkStatus(consignmentId: string): Promise<string | null> {
        try {
            const response = await this.client.get(
                `/status_by_cid/${consignmentId}`,
            );

            if (response.data.status === 200) {
                return response.data.delivery_status;
            }

            return null;
        } catch (error: any) {
            this.logger.error(`Steadfast status check error: ${error.message}`);
            return null;
        }
    }
}
