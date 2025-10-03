@echo off
REM 프로덕션 배포 스크립트 (Windows)
REM 사용법: scripts\deploy-production.bat

echo ========================================
echo 88 Company SMS 시스템 프로덕션 배포
echo ========================================
echo.

REM 환경 파일 확인
if not exist ".env.local" (
    echo [ERROR] .env.local 파일이 없습니다
    echo .env.example을 복사하여 .env.local을 생성하세요:
    echo copy .env.example .env.local
    exit /b 1
)

echo [1/5] 환경 변수 확인 중...

REM 필수 파일 확인
if not exist "package.json" (
    echo [ERROR] package.json 파일을 찾을 수 없습니다
    echo 프로젝트 루트 디렉토리에서 실행하세요
    exit /b 1
)

echo [OK] 환경 파일 확인 완료
echo.

REM 테스트 실행
echo [2/5] SMS 시스템 테스트 중...
call npm run test:sms

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 테스트 실패. 문제를 해결하고 다시 시도하세요
    exit /b 1
)

echo [OK] 테스트 통과
echo.

REM 빌드
echo [3/5] 프로덕션 빌드 중...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 빌드 실패
    exit /b 1
)

echo [OK] 빌드 성공
echo.

REM Git 상태 확인
echo [4/5] Git 상태 확인 중...
git status --porcelain > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] 커밋되지 않은 변경사항이 있을 수 있습니다
    set /p continue="계속하시겠습니까? (y/n): "
    if /i not "!continue!"=="y" (
        echo 배포가 취소되었습니다
        exit /b 0
    )
)

REM Vercel CLI 확인
where vercel > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Vercel CLI가 설치되어 있지 않습니다
    set /p install="설치하시겠습니까? (y/n): "
    if /i "!install!"=="y" (
        npm i -g vercel
    ) else (
        echo Vercel CLI가 필요합니다. 'npm i -g vercel'로 설치하세요
        exit /b 1
    )
)

echo.
echo ========================================
echo 프로덕션 배포 체크리스트
echo ========================================
echo.
echo [ ] SMS 프로바이더 계정이 활성화되어 있습니까?
echo [ ] 프로바이더 잔액이 충분합니까?
echo [ ] Supabase 데이터베이스가 설정되어 있습니까?
echo [ ] ADMIN_SECRET_KEY가 설정되어 있습니까?
echo [ ] SHOW_DEMO_CODE가 false로 설정되어 있습니까?
echo.

set /p deploy="프로덕션 배포를 진행하시겠습니까? (yes/no): "
if /i not "%deploy%"=="yes" (
    echo 배포가 취소되었습니다
    exit /b 0
)

REM Vercel 배포
echo.
echo [5/5] Vercel 프로덕션 배포 중...
vercel --prod

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] 프로덕션 배포 완료!
    echo ========================================
    echo.
    echo 배포 후 체크리스트:
    echo   1. 프로덕션 URL에서 SMS 발송 테스트
    echo   2. 관리자 API 인증 테스트
    echo   3. 모니터링 대시보드 확인
    echo   4. 비용 알림 설정 확인
    echo.
    echo Vercel 대시보드에서 환경 변수를 설정하세요:
    echo https://vercel.com/dashboard
) else (
    echo [ERROR] 배포 실패
    exit /b 1
)

pause