// Re-export chat types for backward compatibility
export {
  type MessageType,
  type Message,
  type ChatStep,
  type ChatState,
  type LeadData
} from './chat/types';

export {
  type ChatFlowStep,
  type ChatFlowMap,
  type ErrorResponse,
  type VerificationResult
} from './chat/flow-types';