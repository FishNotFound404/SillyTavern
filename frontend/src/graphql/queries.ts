import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      avatarUrl
    }
  }
`;

export const GET_CHARACTERS = gql`
  query GetCharacters($limit: Int, $offset: Int, $search: String) {
    characters(limit: $limit, offset: $offset, search: $search) {
      id
      name
      description
      avatarUrl
      tags
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id
      name
      description
      personality
      scenario
      firstMessage
      avatarUrl
      worldInfo
      metadata
      createdAt
      updatedAt
      isPublic
      tags
    }
  }
`;

export const GET_CONVERSATIONS = gql`
  query GetConversations($limit: Int, $offset: Int) {
    conversations(limit: $limit, offset: $offset) {
      id
      title
      character {
        id
        name
        avatarUrl
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!, $limit: Int, $offset: Int) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      role
      content
      createdAt
      tokensUsed
    }
  }
`;
