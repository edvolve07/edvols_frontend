import { AnimatePresence } from 'motion/react';
import { AgentChatIndicator } from './agent-chat-indicator';
import { Conversation, ConversationContent, ConversationScrollButton } from '../ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '../ai-elements/message';

export function AgentChatTranscript({ agentState, messages = [], className, ...props }) {
  return (
    <Conversation className={className} {...props}>
      <ConversationContent>
        {messages.map((receivedMessage) => {
          const { id, timestamp, from, message } = receivedMessage;
          const locale = navigator?.language ?? 'en-US';
          const messageOrigin = from?.isLocal ? 'user' : 'assistant';
          const time = new Date(timestamp);
          const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

          return (
            <Message key={id} title={title} from={messageOrigin}>
              <MessageContent>
                <MessageResponse>{message}</MessageResponse>
              </MessageContent>
            </Message>
          );
        })}
        <AnimatePresence>
          {agentState === 'thinking' && <AgentChatIndicator size="sm" />}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
