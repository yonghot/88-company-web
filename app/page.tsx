import { DynamicChatInterface } from '@/components/chatbot/DynamicChatInterface';

export default function Home() {
  console.log('🚨🚨🚨 PAGE.TSX EMERGENCY_DEPLOY_CHECK_2024_12_15_16_30 🚨🚨🚨');
  return (
    <div>
      <div style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}>
        🚨 배포 확인 배너 - 2024-12-15 16:30 🚨
        <br />
        이 배너가 보이면 배포가 성공한 것입니다
      </div>
      <div style={{ marginTop: '120px' }}>
        <DynamicChatInterface />
      </div>
    </div>
  );
}