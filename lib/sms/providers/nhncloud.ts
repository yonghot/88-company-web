import { SMSProvider, SMSResult, SMSProviderError } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * NHN Cloud SMS 프로바이더 구현
 * Toast SMS API v3.0 기준
 */
export class NHNCloudSMSProvider implements SMSProvider {
  private appKey: string;
  private secretKey: string;
  private sendNo: string;
  private baseUrl: string;
  private projectId: string;

  constructor(config: {
    appKey: string;
    secretKey: string;
    sendNo: string;
    projectId?: string;
  }) {
    this.appKey = config.appKey;
    this.secretKey = config.secretKey;
    this.sendNo = config.sendNo;
    this.projectId = config.projectId || '';

    // API 엔드포인트 (리전별로 다를 수 있음)
    this.baseUrl = process.env.NHN_API_URL || 'https://api-sms.cloud.toast.com';

    if (!this.appKey || !this.secretKey || !this.sendNo) {
      throw new SMSProviderError(
        'NHN Cloud 설정이 불완전합니다',
        'nhncloud'
      );
    }
  }

  getName(): string {
    return 'NHN Cloud';
  }

  /**
   * SMS 발송
   */
  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const timestamp = Date.now();

      // API 엔드포인트
      const url = `${this.baseUrl}/sms/v3.0/appKeys/${this.appKey}/sender/sms`;

      // 요청 본문
      const requestBody = {
        body: message,
        sendNo: this.sendNo.replace(/-/g, ''), // 하이픈 제거
        recipientList: [
          {
            recipientNo: formattedPhone,
            countryCode: '82', // 한국
            internationalRecipientNo: formattedPhone,
            templateParameter: {}
          }
        ],
        userId: 'system', // 발송 요청자 ID
        statsId: this.generateStatsId(), // 통계 ID (선택사항)
      };

      // 인증 헤더 생성
      const headers = this.createAuthHeaders('POST', '/sms/v3.0/appKeys/' + this.appKey + '/sender/sms', timestamp);

      // API 호출
      logger.production(`🚀 NHN Cloud API 호출: ${url}`);
      logger.production(`📦 요청 데이터:`, {
        sendNo: requestBody.sendNo,
        recipientCount: requestBody.recipientList.length,
        messageLength: requestBody.body.length
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('🚨 NHN Cloud API 응답 파싱 실패:', responseText);
        logger.production('🚨 NHN Cloud API 응답 파싱 실패:', {
          status: response.status,
          statusText: response.statusText,
          responsePreview: responseText.substring(0, 200)
        });
        throw new SMSProviderError(
          'NHN Cloud API 응답 파싱 실패',
          'nhncloud',
          { responseText, parseError }
        );
      }

      logger.production(`📥 NHN Cloud API 응답:`, {
        isSuccessful: data.header?.isSuccessful,
        resultCode: data.header?.resultCode,
        resultMessage: data.header?.resultMessage,
        requestId: data.body?.data?.requestId
      });

      // NHN Cloud API 응답 처리
      if (data.header?.isSuccessful) {
        logger.info(`✅ SMS sent via NHN Cloud to ${formattedPhone}`);
        logger.production(`✅ SMS 발송 성공: ${formattedPhone}, requestId: ${data.body?.data?.requestId}`);

        return {
          success: true,
          messageId: data.body?.data?.requestId,
          provider: 'nhncloud',
          timestamp: new Date(),
          details: {
            requestId: data.body?.data?.requestId,
            requestTime: data.body?.data?.requestTime,
            statusCode: data.body?.data?.statusCode
          }
        };
      } else {
        const errorDetails = {
          resultCode: data.header?.resultCode,
          resultMessage: data.header?.resultMessage,
          responseData: data
        };

        logger.error('❌ NHN Cloud SMS 발송 실패:', errorDetails);
        logger.production('❌ NHN Cloud SMS 발송 실패:', errorDetails);

        throw new SMSProviderError(
          data.header?.resultMessage || 'NHN Cloud SMS 발송 실패',
          'nhncloud',
          errorDetails
        );
      }
    } catch (error) {
      if (error instanceof SMSProviderError) {
        throw error;
      }

      logger.error('NHN Cloud SMS 오류:', error);
      throw new SMSProviderError(
        'NHN Cloud SMS 발송 중 오류가 발생했습니다',
        'nhncloud',
        error
      );
    }
  }

  /**
   * 발송 결과 조회
   */
  async getMessageStatus(requestId: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    details?: any;
  }> {
    try {
      const url = `${this.baseUrl}/sms/v3.0/appKeys/${this.appKey}/sender/sms/${requestId}`;
      const timestamp = Date.now();

      const headers = this.createAuthHeaders('GET', `/sms/v3.0/appKeys/${this.appKey}/sender/sms/${requestId}`, timestamp);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const data = await response.json();

      if (data.header.isSuccessful) {
        const messageResult = data.body.data;

        // NHN Cloud 상태 코드 매핑
        let status: 'pending' | 'success' | 'failed' = 'pending';

        switch (messageResult.messageStatus) {
          case '0': // 발송 준비
          case '1': // 발송 중
            status = 'pending';
            break;
          case '2': // 발송 성공
            status = 'success';
            break;
          case '3': // 발송 실패
          case '4': // 예약 취소
            status = 'failed';
            break;
        }

        return {
          status,
          details: messageResult
        };
      }

      return {
        status: 'failed',
        details: data
      };
    } catch (error) {
      logger.error('발송 결과 조회 실패:', error);
      return {
        status: 'failed',
        details: error
      };
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 계정 정보 조회 API를 통한 헬스 체크
      const url = `${this.baseUrl}/sms/v3.0/appKeys/${this.appKey}/senders`;
      const timestamp = Date.now();

      const headers = this.createAuthHeaders('GET', `/sms/v3.0/appKeys/${this.appKey}/senders`, timestamp);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000) // 5초 타임아웃
      });

      const data = await response.json();
      return data.header?.isSuccessful === true;
    } catch (error) {
      logger.error('NHN Cloud health check 실패:', error);
      return false;
    }
  }

  /**
   * 인증 헤더 생성 (NHN Cloud 인증 방식)
   */
  private createAuthHeaders(method: string, path: string, timestamp: number): Record<string, string> {
    // NHN Cloud는 Secret Key를 사용한 HMAC-SHA256 인증을 사용
    const headers: Record<string, string> = {
      'X-Secret-Key': this.secretKey,
      'X-TC-TIMESTAMP': timestamp.toString()
    };

    // 프로젝트 ID가 있는 경우 추가
    if (this.projectId) {
      headers['X-TC-PROJECT-ID'] = this.projectId;
    }

    return headers;
  }

  /**
   * 전화번호 포맷팅
   */
  private formatPhoneNumber(phone: string): string {
    // 하이픈 및 공백 제거
    let cleaned = phone.replace(/[-\s]/g, '');

    // 국가 코드 제거 (한국)
    if (cleaned.startsWith('+82')) {
      cleaned = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('82')) {
      cleaned = '0' + cleaned.substring(2);
    }

    // 010-1234-5678 형식으로 변환 (NHN Cloud는 하이픈 없는 형식 선호)
    return cleaned;
  }

  /**
   * 통계 ID 생성 (발송 그룹 관리용)
   * NHN Cloud는 statsId가 8자리 이하여야 함
   */
  private generateStatsId(): string {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `88${random}`;
  }

  /**
   * 대량 발송 (배치)
   */
  async sendBulkSMS(recipients: Array<{ phone: string; message: string; variables?: Record<string, string> }>): Promise<{
    success: boolean;
    requestId: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    details?: any;
  }> {
    try {
      const url = `${this.baseUrl}/sms/v3.0/appKeys/${this.appKey}/sender/sms`;
      const timestamp = Date.now();

      // 수신자 목록 구성
      const recipientList = recipients.map(recipient => ({
        recipientNo: this.formatPhoneNumber(recipient.phone),
        countryCode: '82',
        internationalRecipientNo: this.formatPhoneNumber(recipient.phone),
        templateParameter: recipient.variables || {}
      }));

      // 메시지 본문 (첫 번째 메시지 사용 또는 공통 메시지)
      const body = recipients[0].message;

      const requestBody = {
        body,
        sendNo: this.sendNo,
        recipientList,
        userId: 'system',
        statsId: this.generateStatsId(),
      };

      const headers = this.createAuthHeaders('POST', `/sms/v3.0/appKeys/${this.appKey}/sender/sms`, timestamp);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.header.isSuccessful) {
        return {
          success: true,
          requestId: data.body.data.requestId,
          totalCount: recipientList.length,
          successCount: data.body.data.successCount || recipientList.length,
          failedCount: data.body.data.failedCount || 0,
          details: data.body.data
        };
      }

      throw new SMSProviderError(
        'NHN Cloud 대량 발송 실패',
        'nhncloud',
        data
      );
    } catch (error) {
      logger.error('NHN Cloud 대량 발송 오류:', error);
      throw error;
    }
  }

  /**
   * 발송 가능 여부 확인 (잔액 등)
   */
  async canSend(): Promise<{ canSend: boolean; reason?: string }> {
    try {
      // NHN Cloud는 후불제이므로 기본적으로 발송 가능
      // 단, 일일 한도나 기타 제한이 있을 수 있음
      const isHealthy = await this.healthCheck();

      if (!isHealthy) {
        return {
          canSend: false,
          reason: 'NHN Cloud 서비스 연결 실패'
        };
      }

      return {
        canSend: true
      };
    } catch (error) {
      return {
        canSend: false,
        reason: '서비스 상태 확인 실패'
      };
    }
  }
}