// 편집 가능한 챗봇 질문 설정 파일
// 이 파일을 수정하여 질문과 옵션을 쉽게 변경할 수 있습니다.

export const chatQuestions = {
  // 시작 질문
  welcome: {
    question: '안녕하세요! 88입니다. 어떤 서비스를 찾고 계신가요?',
    options: [
      '창업 컨설팅',
      '경영 전략 수립',
      '마케팅 전략',
      '투자 유치 지원',
      '기타 문의'
    ]
  },
  
  // 기타 문의 선택 시 상세 내용
  customService: {
    question: '어떤 도움이 필요하신지 자세히 알려주세요.',
    placeholder: '필요하신 서비스를 자세히 설명해주세요...'
  },
  
  // 예산 질문
  budget: {
    question: '예상하시는 예산 규모는 어느 정도인가요?',
    options: [
      '500만원 미만',
      '500만원 - 1,000만원',
      '1,000만원 - 3,000만원',
      '3,000만원 - 5,000만원',
      '5,000만원 이상',
      '협의 필요'
    ]
  },
  
  // 시작 시기 질문
  timeline: {
    question: '프로젝트는 언제 시작하실 예정인가요?',
    options: [
      '즉시 시작',
      '1주일 이내',
      '1개월 이내',
      '3개월 이내',
      '아직 미정'
    ]
  },
  
  // 추가 정보 질문
  details: {
    question: '프로젝트에 대해 추가로 알려주실 내용이 있나요?',
    placeholder: '현재 상황, 목표, 특별한 요구사항 등을 자유롭게 작성해주세요...'
  },
  
  // 이름 질문
  name: {
    question: '성함을 알려주세요.',
    placeholder: '홍길동'
  },
  
  // 전화번호 질문  
  phone: {
    question: '연락 가능한 전화번호를 입력해주세요.',
    placeholder: '010-0000-0000'
  },
  
  // 완료 메시지
  complete: {
    question: '감사합니다! 입력하신 정보를 확인했습니다. 빠른 시일 내에 연락드리겠습니다. 😊'
  }
};

// 질문 순서 설정
export const questionFlow = {
  welcome: ['budget', 'customService'], // welcome 다음 가능한 스텝
  customService: ['budget'],
  budget: ['timeline'],
  timeline: ['details'],
  details: ['name'],
  name: ['phone'],
  phone: ['complete'],
  complete: []
};

// 다음 스텝 결정 로직
export const getNextStepId = (currentStep: string, userInput: string): string => {
  console.log('🎯 getNextStepId called with:', { currentStep, userInput });

  if (currentStep === 'welcome' && userInput === '기타 문의') {
    console.log('✅ Special case: welcome -> customService');
    return 'customService';
  }

  const possibleNextSteps = questionFlow[currentStep as keyof typeof questionFlow];
  console.log('Possible next steps for', currentStep, ':', possibleNextSteps);

  if (possibleNextSteps && possibleNextSteps.length > 0) {
    console.log('✅ Using first possible step:', possibleNextSteps[0]);
    return possibleNextSteps[0];
  }

  console.log('✅ No steps found, going to complete');
  return 'complete';
};