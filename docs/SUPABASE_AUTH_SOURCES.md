# Referencias técnicas de Supabase Auth

Estas fuentes oficiales se consultaron para la migración de autenticación:

1. [Supabase JavaScript: signUp](https://supabase.com/docs/reference/javascript/auth-signup). La documentación indica que `@supabase/supabase-js` proporciona `signUp`, clientes Auth y configuración de sesión persistente o no persistente.
2. [Supabase JavaScript: signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword). Se usa para autenticar correo y contraseña sin almacenar ni verificar contraseñas en la aplicación.
3. [Supabase JavaScript: getUser](https://supabase.com/docs/reference/javascript/auth-getuser). `getUser` realiza una solicitud al servidor de Auth y permite basar la autorización en un usuario validado por Supabase.
4. [Supabase: crear un cliente server-side](https://supabase.com/docs/guides/auth/server-side/creating-a-client). La guía distingue entre `getClaims`/`getUser` para validar identidad y `getSession` para acceder a tokens; no se debe confiar únicamente en el objeto de usuario obtenido de una sesión no revalidada.
5. [Supabase: políticas RLS y Data API](https://supabase.com/docs/reference/javascript/auth-signup). Antes de exponer tablas por Data API se debe habilitar RLS, crear políticas y otorgar permisos mínimos a los roles `anon`, `authenticated` y `service_role`.
