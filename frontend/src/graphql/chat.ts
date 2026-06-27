import { gql } from '@apollo/client';

export type MessageRole = 'user' | 'assistant' | 'system';

export const GET_CONVERSATIONS = gql`
  query GetConversations($limit: Int, $offset: Int) {
    conversations(limit: $limit, offset: $offset) {
      id
      userId
      characterId
      title
      model
      provider
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONVERSATION = gql`
  query GetConversation($id: ID!) {
    conversation(id: $id) {
      id
      userId
      characterId
      title
      model
      provider
      createdAt
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!, $limit: Int, $offset: Int) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      conversationId
      role
      content
      tokensUsed
      model
      createdAt
    }
  }
`;

export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      id
      title
    }
  }
`;

export const DELETE_CONVERSATION = gql`
  mutation DeleteConversation($id: ID!) {
    deleteConversation(id: $id)
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $content: String!) {
    sendMessage(conversationId: $conversationId, content: $content) {
      id
      role
      content
      createdAt
    }
  }
`;

export const MESSAGE_STREAM = gql`
  subscription MessageStream($conversationId: ID!) {
    messageStream(conversationId: $conversationId) {
      chunk
      done
      message {
        id
        content
        createdAt
      }
    }
  }
`;

export const GET_LLM_CONFIGS = gql`
  query GetLLMConfigs {
    llmConfigs {
      id
      provider
      model
      baseUrl
      isDefault
    }
  }
`;

export const SAVE_LLM_CONFIG = gql`
  mutation SaveLLMConfig($input: LLMConfigInput!) {
    saveLLMConfig(input: $input) {
      id
      provider
      model
    }
  }
`;

export const DELETE_LLM_CONFIG = gql`
  mutation DeleteLLMConfig($id: ID!) {
    deleteLLMConfig(id: $id)
  }
`;
