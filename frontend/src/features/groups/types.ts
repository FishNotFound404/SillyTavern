import type { Character } from '../characters/types'
import type { ChatLine, ChatMessage, ChatMetadata } from '../../api/types'

export type { ChatLine, ChatMessage, ChatMetadata }

export interface Group {
  id: string
  name: string
  members: string[]
  avatar_url?: string
  allow_self_responses: boolean
  activation_strategy: number
  generation_mode: number
  disabled_members: string[]
  fav?: boolean
  chat_id: string
  chats: string[]
  auto_mode_delay: number
  generation_mode_join_prefix: string
  generation_mode_join_suffix: string
  date_added?: number
  create_date?: string
  date_last_chat?: number
  chat_size?: number
}

export interface GroupMember extends Character {}

export interface GroupFormData {
  name: string
  members: string[]
  allow_self_responses: boolean
}

export const DEFAULT_GROUP_FORM: GroupFormData = {
  name: '',
  members: [],
  allow_self_responses: false,
}
