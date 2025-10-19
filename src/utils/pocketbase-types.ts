// utils/pocketbase-types.ts

export enum Collections {
  Svg = "svg",
  Users = "users",
}

export type SvgRecord = {
  name: string
  nom: string
  code_svg: string
  chat_history: string 
  created?: string
  updated?: string
}

export type UsersRecord = {
  username: string
  email: string
  avatar?: string
}
