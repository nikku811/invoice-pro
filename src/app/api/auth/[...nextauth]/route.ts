// ============================================================
// Auth.js API Route Handler
// Handles: GET & POST for /api/auth/*
// (sign-in, sign-out, session, csrf, callback, etc.)
// ============================================================

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
