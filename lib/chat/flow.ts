import { ChatStep } from './types';
import { chatQuestions, getNextStepId as getNextId } from './questions';

export const chatFlow: Record<string, ChatStep> = {
  welcome: {
    id: 'welcome',
    question: chatQuestions.welcome.question,
    inputType: 'select',
    options: chatQuestions.welcome.options,
    nextStep: (value) => getNextId('welcome', value)
  },
  
  customService: {
    id: 'customService',
    question: chatQuestions.customService.question,
    inputType: 'textarea',
    placeholder: chatQuestions.customService.placeholder,
    nextStep: () => getNextId('customService', '')
  },
  
  budget: {
    id: 'budget',
    question: chatQuestions.budget.question,
    inputType: 'select',
    options: chatQuestions.budget.options,
    nextStep: () => getNextId('budget', '')
  },
  
  timeline: {
    id: 'timeline',
    question: chatQuestions.timeline.question,
    inputType: 'select',
    options: chatQuestions.timeline.options,
    nextStep: () => getNextId('timeline', '')
  },
  
  details: {
    id: 'details',
    question: chatQuestions.details.question,
    inputType: 'textarea',
    placeholder: chatQuestions.details.placeholder,
    nextStep: () => getNextId('details', '')
  },
  
  name: {
    id: 'name',
    question: chatQuestions.name.question,
    inputType: 'text',
    placeholder: chatQuestions.name.placeholder,
    validation: (value) => value.length >= 2,
    nextStep: () => getNextId('name', '')
  },
  
  phone: {
    id: 'phone',
    question: chatQuestions.phone.question,
    inputType: 'phone',
    placeholder: chatQuestions.phone.placeholder,
    validation: (value) => {
      const phoneRegex = /^(01[0-9]{1})-?([0-9]{3,4})-?([0-9]{4})$/;
      return phoneRegex.test(value.replace(/-/g, ''));
    },
    nextStep: () => 'phoneVerification'
  },
  
  phoneVerification: {
    id: 'phoneVerification',
    question: '📱 인증번호 6자리를 입력해주세요.',
    inputType: 'text',
    placeholder: '인증번호 6자리',
    validation: (value) => {
      return /^[0-9]{6}$/.test(value);
    },
    nextStep: () => getNextId('phone', '')
  },
  
  complete: {
    id: 'complete',
    question: chatQuestions.complete.question,
    inputType: 'text',
    nextStep: () => 'complete'
  }
};

export const getNextStep = (currentStepId: string, userInput: string): ChatStep | null => {
  console.log('🔄 getNextStep called with:', { currentStepId, userInput });

  const currentStep = chatFlow[currentStepId];
  console.log('Current step found:', currentStep);

  if (!currentStep || !currentStep.nextStep) {
    console.log('❌ No current step or nextStep function found');
    return null;
  }

  const nextStepId = currentStep.nextStep(userInput);
  console.log('Next step ID calculated:', nextStepId);

  const nextStep = chatFlow[nextStepId];
  console.log('Next step object:', nextStep);

  return nextStep || null;
};

export const validateInput = (stepId: string, value: string): boolean => {
  const step = chatFlow[stepId];
  if (!step.validation) return true;
  return step.validation(value);
};