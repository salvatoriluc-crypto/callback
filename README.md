# Callback · tus castings, claros

Web responsive para que actores y modelos tengan en un solo sitio todo lo que les envía su agencia:
convocatorias, roles que encajan con su perfil, pasos del selftape, día del casting presencial,
plazos con avisos en el calendario y un panel de conversión.

- Funciona en el navegador del móvil y del ordenador (no hay que instalar nada).
- Sin servidor ya funciona en **modo demo**: datos de ejemplo guardados solo en tu navegador.
- Con el backend (Supabase + Claude + Postmark, todo con plan gratuito o de pago por uso) tiene
  usuarios con contraseña, guarda los datos en la nube y lee solo las convocatorias.

---

## 1. Publicarla en GitHub Pages (10 minutos)

1. Entra en GitHub y crea un repositorio nuevo llamado `callback` (público o privado con Pages).
2. Pulsa **Add file › Upload files**, arrastra **todo el contenido** de esta carpeta
   (`index.html`, `css`, `js`, `assets`, `supabase`, `README.md`) y pulsa **Commit changes**.
3. Ve a **Settings › Pages**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En un par de minutos la web estará en `https://TU-USUARIO.github.io/callback/`.

Así ya puedes enseñarla: arranca en modo demo, se entra con cualquier email y contraseña.

## 2. Usuarios reales con Supabase (gratis)

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (región *Frankfurt* o *Paris*).
2. Abre **SQL Editor › New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**.
   Crea las tablas y las reglas para que cada persona solo vea sus propios castings.
3. **Authentication › Sign In / Providers › Email**: deja Email activado y **desactiva "Allow new users to sign up"**
   (así solo entra quien tú invites).
4. **Authentication › URL Configuration**: en *Site URL* pon `https://TU-USUARIO.github.io/callback/`.
5. Para cada tester: **Authentication › Users › Add user › Create new user**, con su email y una contraseña
   (marca *Auto Confirm User*). Pásale el enlace de la web y su contraseña; puede cambiarla con "¿Olvidaste tu contraseña?".
6. **Project Settings › API**: copia *Project URL* y la clave *anon public*.
   Edita `js/config.js` en GitHub (icono del lápiz) y pégalas en `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
   Al guardar, la web deja el modo demo y pide login real.

> La clave *anon* es pública por diseño; lo que protege los datos son las reglas de `schema.sql`.
> **Nunca** pegues en la web la clave *service_role* ni la de Claude.

## 3. Lectura automática con Claude (pago por uso, céntimos por convocatoria)

1. Crea una clave en [console.anthropic.com](https://console.anthropic.com) › API Keys (añade algo de saldo).
2. En Supabase: **Edge Functions › Secrets** y añade:
   - `ANTHROPIC_API_KEY` = tu clave de Claude
   - `INBOUND_TOKEN` = una palabra larga inventada (p. ej. `callback-7f3k2q9x`), sirve de contraseña para el paso 4
   - (opcional) `CLAUDE_MODEL` si quieres usar otro modelo; por defecto `claude-haiku-5-5`
3. **Edge Functions › Deploy a new function › Via Editor**:
   - Nombre `extract`, pega el contenido de `supabase/functions/extract/index.ts` y despliega.
   - Nombre `inbound`, pega `supabase/functions/inbound/index.ts`, despliega y en su configuración
     **desactiva "Enforce JWT verification"** (la llama Postmark, que no inicia sesión).

Con esto ya funcionan **"Pega el email"** y **"Sube el PDF"** en *Añadir casting*.

## 4. Reenvío de emails con Postmark (sin dominio propio)

1. Crea una cuenta en [postmarkapp.com](https://postmarkapp.com) y un *Server*.
2. En el *Server* abre **Default Inbound Stream › Settings**:
   - Copia la dirección de entrada (algo como `abc123@inbound.postmarkapp.com`).
   - En *Webhook URL* pon `https://TU-PROYECTO.supabase.co/functions/v1/inbound?token=TU_INBOUND_TOKEN`.
   - Activa *Include raw email content* si quieres, no es necesario.
3. Pega la dirección de entrada en `INBOUND_ADDRESS` dentro de `js/config.js`.

Cada tester reenvía los emails de su agencia a esa dirección **desde el mismo email con el que entra en la web**;
así la app sabe de quién es cada casting. Dos formas:

- **A mano**: reenviar cada convocatoria (no necesita configurar nada).
- **Automático (Gmail)**: Ajustes › Reenvío y correo POP/IMAP › *Añadir una dirección de reenvío* con la dirección de entrada.
  Gmail manda un código de confirmación: **aparecerá dentro de la app** como una tarjeta "Gmail · confirmar reenvío".
  Después crea un filtro: *De:* `@5thmanagement.com` (o el dominio de su agencia) › *Reenviar a* la dirección de entrada.

## 5. Avisos de plazos

- La pantalla de Inicio destaca lo que vence en las próximas 48 h y la agenda de la semana.
- En cada casting, **Añadir al calendario** descarga un `.ics` con avisos 1 día y 3 horas antes:
  al abrirlo en el móvil se añade al calendario con sus notificaciones.

---

## Estructura

```
index.html                 entrada de la web
css/styles.css             estilos (paleta violeta + lima, móvil y escritorio)
js/config.js               claves públicas de Supabase y dirección de reenvío
js/app.js                  rutas, estado y eventos
js/views.js                pantallas
js/logic.js                estados, encaje de roles, fechas, panel, .ics
js/store.js                datos: modo demo (navegador) o Supabase
js/demo-data.js            castings de ejemplo
supabase/schema.sql        tablas y seguridad
supabase/functions/        funciones: extract (pegar/PDF) e inbound (emails reenviados)
```

Para probarla en tu ordenador sin publicar: dentro de la carpeta ejecuta `python3 -m http.server`
y abre `http://localhost:8000`.
