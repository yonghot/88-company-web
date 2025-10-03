-- ========================================
-- Leads 테이블 스키마 업데이트
-- 현재 챗봇 질문 구조에 맞춤
-- ========================================

-- 1. 기존 사용하지 않는 컬럼 삭제
ALTER TABLE leads DROP COLUMN IF EXISTS service;
ALTER TABLE leads DROP COLUMN IF EXISTS budget;
ALTER TABLE leads DROP COLUMN IF EXISTS timeline;
ALTER TABLE leads DROP COLUMN IF EXISTS message;
ALTER TABLE leads DROP COLUMN IF EXISTS details;
ALTER TABLE leads DROP COLUMN IF EXISTS custom_service;

-- 2. 새로운 질문에 맞는 컬럼 추가
-- Q1: 예비창업자 여부
ALTER TABLE leads ADD COLUMN IF NOT EXISTS welcome TEXT;

-- Q2: 정부지원사업 경험
ALTER TABLE leads ADD COLUMN IF NOT EXISTS experience TEXT;

-- Q3: 사업 아이템
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_idea TEXT;

-- Q4: 지역
ALTER TABLE leads ADD COLUMN IF NOT EXISTS region TEXT;

-- Q5: 성별
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gender TEXT;

-- Q6: 나이
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age TEXT;

-- 3. 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
