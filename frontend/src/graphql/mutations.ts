import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      refreshToken
      user {
        id
        username
        email
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        username
        email
      }
    }
  }
`;

export const CREATE_CHARACTER = gql`
  mutation CreateCharacter($input: CreateCharacterInput!) {
    createCharacter(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_CHARACTER = gql`
  mutation UpdateCharacter($id: ID!, $input: UpdateCharacterInput!) {
    updateCharacter(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_CHARACTER = gql`
  mutation DeleteCharacter($id: ID!) {
    deleteCharacter(id: $id)
  }
`;

export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($characterId: ID, $title: String) {
    createConversation(characterId: $characterId, title: $title) {
      id
      title
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $content: String!, $metadata: JSON) {
    sendMessage(conversationId: $conversationId, content: $content, metadata: $metadata) {
      id
      role
      content
      createdAt
    }
  }
`;
