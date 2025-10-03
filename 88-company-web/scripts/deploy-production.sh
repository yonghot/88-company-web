#!/bin/bash

# 프로덕션 배포 스크립트
# 사용법: ./scripts/deploy-production.sh

echo "🚀 88 Company SMS 시스템 프로덕션 배포 시작"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경 확인
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local 파일이 없습니다${NC}"
    echo "먼저 .env.example을 복사하여 .env.local을 생성하세요:"
    echo "cp .env.example .env.local"
    exit 1
fi

# 필수 환경 변수 확인
check_env() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}❌ $1 환경 변수가 설정되지 않았습니다${NC}"
        return 1
    fi
    return 0
}

echo "📋 환경 변수 확인 중..."

# .env.local 로드
export $(cat .env.local | grep -v '^#' | xargs)

# 필수 변수 체크
MISSING_VARS=0

check_env "NEXT_PUBLIC_SUPABASE_URL" || MISSING_VARS=1
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" || MISSING_VARS=1
check_env "SMS_PROVIDER" || MISSING_VARS=1

# SMS 프로바이더별 체크
if [ "$SMS_PROVIDER" = "twilio" ]; then
    check_env "TWILIO_ACCOUNT_SID" || MISSING_VARS=1
    check_env "TWILIO_AUTH_TOKEN" || MISSING_VARS=1
    check_env "TWILIO_PHONE_NUMBER" || MISSING_VARS=1
elif [ "$SMS_PROVIDER" = "aligo" ]; then
    check_env "ALIGO_API_KEY" || MISSING_VARS=1
    check_env "ALIGO_USER_ID" || MISSING_VARS=1
    check_env "ALIGO_SENDER" || MISSING_VARS=1
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo -e "${RED}필수 환경 변수가 누락되었습니다. .env.local을 확인하세요${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 환경 변수 확인 완료${NC}"

# 테스트 실행
echo "🧪 테스트 실행 중..."
npm run test:sms

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 테스트 실패. 문제를 해결하고 다시 시도하세요${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 테스트 통과${NC}"

# 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 빌드 실패${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 빌드 성공${NC}"

# Git 상태 확인
echo "📦 Git 상태 확인 중..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다${NC}"
    echo "계속하시겠습니까? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "배포 취소됨"
        exit 0
    fi
fi

# Vercel CLI 확인
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI가 설치되어 있지 않습니다. 설치하시겠습니까? (y/n)${NC}"
    read -r response
    if [ "$response" = "y" ]; then
        npm i -g vercel
    else
        echo "Vercel CLI가 필요합니다. 'npm i -g vercel'로 설치하세요"
        exit 1
    fi
fi

# 프로덕션 배포 전 확인
echo -e "${YELLOW}⚠️  프로덕션 배포 체크리스트:${NC}"
echo "  □ SMS 프로바이더 계정이 활성화되어 있습니까?"
echo "  □ 프로바이더 잔액이 충분합니까?"
echo "  □ Supabase 데이터베이스가 설정되어 있습니까?"
echo "  □ ADMIN_SECRET_KEY가 설정되어 있습니까?"
echo "  □ SHOW_DEMO_CODE가 false로 설정되어 있습니까?"
echo ""
echo -e "${YELLOW}프로덕션 배포를 진행하시겠습니까? (yes/no)${NC}"
read -r response

if [ "$response" != "yes" ]; then
    echo "배포 취소됨"
    exit 0
fi

# Vercel 배포
echo "🚀 Vercel 프로덕션 배포 중..."
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 프로덕션 배포 완료!${NC}"
    echo ""
    echo "📋 배포 후 체크리스트:"
    echo "  1. 프로덕션 URL에서 SMS 발송 테스트"
    echo "  2. 관리자 API 인증 테스트"
    echo "  3. 모니터링 대시보드 확인"
    echo "  4. 비용 알림 설정 확인"
    echo ""
    echo "🔗 Vercel 대시보드에서 환경 변수를 설정하세요:"
    echo "   https://vercel.com/dashboard"
else
    echo -e "${RED}❌ 배포 실패${NC}"
    exit 1
fi