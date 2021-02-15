import {
  ClientIDSecretCredentials,
  ParsedAuthorizationResponse,
  ParsedCancelResponse,
  ParsedCaptureResponse,
  PayPalOrder,
  ProcessorConnection,
  RawAuthorizationRequest,
  RawCancelRequest,
  RawCaptureRequest,
} from '@primer-io/app-framework';
import { resolveTripleslashReference } from 'typescript';

/**
 * Use the HTTP Client to make requests to PayPal's orders API
 */
import HTTPClient from '../common/HTTPClient';

const PayPalConnection: ProcessorConnection<
  ClientIDSecretCredentials,
  PayPalOrder
> = {
  name: 'PAYPAL',

  website: 'https://paypal.com',

  configuration: {
    accountId: 'sb-vhl0e5067701@business.example.com',
    clientId:
      'Ada6dwJGvQoO5VlUvd029a9IpzI_aDpctUb9o8CU2zhZDodLp8JxMZsH4wba18-uX2gOduhp-mGO_u7B',
    clientSecret:
      'EJtBIcUOh-aYEJQYAU36GPcC-U2RVi26OVwCPHmDoThO24lNnfqDNf4Brvrc4AdPsh1WGNKqnMzI1ALE',
  },

  /**
   * Authorize a PayPal order
   * Use the HTTPClient and the request info to authorize a paypal order
   */
  authorize(
    request: RawAuthorizationRequest<ClientIDSecretCredentials, PayPalOrder>,
  ): Promise<ParsedAuthorizationResponse> {
    const url: string = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${request.paymentMethod.orderId}/authorize`;

    //Setting the <cliendId:clientSecret> string and encoding it to base64
    const authorization: string = `${request.processorConfig.clientId}:${request.processorConfig.clientSecret}`;
    const encodedAuth = Buffer.from(authorization).toString('base64');

    return HTTPClient.request(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedAuth}`,
      },
      method: 'post',
      body: '',
    }).then((response) => {
      const responseText = JSON.parse(response.responseText);
      let authResponse: ParsedAuthorizationResponse;
      //Switch statement that handles different HTTP status codes of the response.
      switch (response.statusCode) {
        case 201:
          if (responseText.status === 'VOIDED') {
            authResponse = {
              declineReason: 'Insufficient funds',
              transactionStatus: 'DECLINED',
            };
          } else {
            authResponse = {
              processorTransactionId:
                responseText.purchase_units[0].payments.authorizations[0].id,
              transactionStatus: 'AUTHORIZED',
            };
          }
          break;
        case 401:
          authResponse = {
            errorMessage: 'Invalid credentials',
            transactionStatus: 'FAILED',
          };
          break;
        case 422:
          authResponse = {
            errorMessage: 'Transaction has already been authorized',
            transactionStatus: 'FAILED',
          };
        default:
          authResponse = {
            errorMessage:
              'The HTTP status code is different than 201, 401, 422. Unhandled Error!',
            transactionStatus: 'FAILED',
          };
          break;
      }
      return authResponse;
    });
  },

  /**
   * Cancel a PayPal order
   * Use the HTTPClient and the request information to cancel the PayPal order
   */
  cancel(
    request: RawCancelRequest<ClientIDSecretCredentials>,
  ): Promise<ParsedCaptureResponse> {
    const url: string = `https://api-m.sandbox.paypal.com/v2/payments/authorizations/${request.processorTransactionId}/void`;
    //Setting the <cliendId:clientSecret> string and encoding it to base64
    const authorization: string = `${request.processorConfig.clientId}:${request.processorConfig.clientSecret}`;
    const encodedAuth = Buffer.from(authorization).toString('base64');
    return HTTPClient.request(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedAuth}`,
      },
      method: 'post',
      body: '',
    }).then((response) => {
      let cancelResponse: ParsedCancelResponse;
      switch (response.statusCode) {
        case 204:
          cancelResponse = {
            transactionStatus: 'CANCELLED',
          };
          break;
        case 401:
          cancelResponse = {
            errorMessage: 'Invalid credentialsuncau',
            transactionStatus: 'FAILED',
          };
          break;
        case 422:
          cancelResponse = {
            errorMessage: 'Transaction has aready been voided',
            transactionStatus: 'FAILED',
          };
          break;
        default:
          cancelResponse = {
            errorMessage:
              'The HTTP status code is different than 204, 401, 422. Unhandled Error!',
            transactionStatus: 'FAILED',
          };
          break;
      }
      console.log(cancelResponse);
      return cancelResponse;
    });
  },

  /**
   * Capture a PayPal order (You can ignore this method for the exercise)
   */
  capture(
    request: RawCaptureRequest<ClientIDSecretCredentials>,
  ): Promise<ParsedCaptureResponse> {
    throw new Error('Not Implemented');
  },
};

export default PayPalConnection;
