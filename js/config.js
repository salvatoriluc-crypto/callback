// Configuración de Callback.
// Si SUPABASE_URL está vacío, la web funciona en MODO DEMO:
// datos de ejemplo guardados solo en tu navegador y login con cualquier email.
// Cuando crees tu proyecto en Supabase, pega aquí la URL y la "anon public key"
// (Supabase › Project Settings › API). Ambas son públicas por diseño:
// la seguridad la dan las reglas RLS de supabase/schema.sql.

export const CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  // Dirección a la que los testers reenvían los emails de su agencia
  // (la de tu servidor de entrada en Postmark, p. ej. abc123@inbound.postmarkapp.com).
  INBOUND_ADDRESS: ''
};
