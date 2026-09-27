export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;
export type ISOTime = string;

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type NotificationType =
  | 'ASSIGNMENT'
  | 'NOTICE'
  | 'GRADE_UPDATE'
  | 'DOUBT_REPLY';