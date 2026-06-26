import { gql } from '@apollo/client';

export const GET_CHARACTERS = gql`
  query GetCharacters($limit: Int, $offset: Int, $search: String) {
    characters(limit: $limit, offset: $offset, search: $search) {
      id
      userId
      name
      description
      personality
      scenario
      firstMessage
      avatarUrl
      worldInfo
      metadata
      isPublic
      tags
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id
      userId
      name
      description
      personality
      scenario
      firstMessage
      avatarUrl
      worldInfo
      metadata
      isPublic
      tags
      createdAt
      updatedAt
    }
  }
`;

export const GET_WORLD_INFO_ENTRIES = gql`
  query GetWorldInfoEntries($characterId: ID!) {
    worldInfoEntries(characterId: $characterId) {
      id
      characterId
      key
      content
      position
      orderIndex
      enabled
      selective
      secondaryKeys
      comment
      createdAt
      updatedAt
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

export const IMPORT_CHARACTER = gql`
  mutation ImportCharacter($data: String!) {
    importCharacter(data: $data) {
      id
      name
      description
    }
  }
`;

export const EXPORT_CHARACTER = gql`
  mutation ExportCharacter($id: ID!) {
    exportCharacter(id: $id)
  }
`;

export const CREATE_WORLD_INFO_ENTRY = gql`
  mutation CreateWorldInfoEntry($characterId: ID!, $input: WorldInfoInput!) {
    createWorldInfoEntry(characterId: $characterId, input: $input) {
      id
      key
      content
    }
  }
`;

export const UPDATE_WORLD_INFO_ENTRY = gql`
  mutation UpdateWorldInfoEntry($id: ID!, $input: WorldInfoInput!) {
    updateWorldInfoEntry(id: $id, input: $input) {
      id
      key
      content
    }
  }
`;

export const DELETE_WORLD_INFO_ENTRY = gql`
  mutation DeleteWorldInfoEntry($id: ID!) {
    deleteWorldInfoEntry(id: $id)
  }
`;
