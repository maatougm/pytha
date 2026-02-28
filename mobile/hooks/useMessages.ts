/**
 * useMessages Hook (Re-export)
 *
 * This file re-exports the hooks from the new location
 * for backward compatibility.
 */

export { useChannels, useSearchChannels } from '@/src/hooks/useChannels';
export { useChat } from '@/src/hooks/useChat';
export { 
  useSocket, 
  useMessageEvents, 
  useTypingIndicator, 
  useUserPresence, 
  useMessageEmitters 
} from '@/src/hooks/useSocket';
