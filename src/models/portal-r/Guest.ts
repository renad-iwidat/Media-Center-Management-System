/**
 * Guest Model
 * Represents a guest on a program/episode
 */

export interface Guest {
  id: bigint;
  name: string;
  title?: string; // Job title
  bio?: string;
  phone?: string;
  created_at: Date;
}

export interface CreateGuestDTO {
  name: string;
  title?: string;
  bio?: string;
  phone?: string;
}

export interface UpdateGuestDTO {
  name?: string;
  title?: string;
  bio?: string;
  phone?: string;
}
