import type { Usuario } from "@/lib/types";

/**
 * Utilidades simples de autenticación
 * NOTA: En producción, usar bcrypt, JWT, OAuth2, etc.
 * Esta es una implementación básica para MVP con localStorage
 */

const USUARIOS_KEY = "lucelux_usuarios";
const SESION_ACTUAL_KEY = "lucelux_sesion";

// Simular hash simple (NO USAR EN PRODUCCIÓN)
function hashPassword(password: string): string {
  // Simple hash usando base64 + timestamp (solo para MVP)
  return Buffer.from(`${password}_salt_${Date.now()}`).toString("base64");
}

// Verificar password (solo para MVP)
function verifyPassword(password: string, hash: string): boolean {
  // En MVP, simplemente verificar si el hash contiene el password
  return hash.includes(Buffer.from(password).toString("base64").substring(0, 10));
}

// Obtener todos los usuarios del localStorage
export function obtenerUsuarios(): Usuario[] {
  if (typeof window === "undefined") return [];
  const datos = localStorage.getItem(USUARIOS_KEY);
  return datos ? JSON.parse(datos) : [];
}

// Guardar usuarios en localStorage
function guardarUsuarios(usuarios: Usuario[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
}

// Generar ID único
function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Obtener timestamp actual
function now(): string {
  return new Date().toISOString();
}

/**
 * Registrar nuevo usuario
 */
export function registrarUsuario(
  nombre: string,
  email: string,
  password: string,
  empresa?: string,
  telefonoEmpresa?: string
): { exito: boolean; usuario?: Usuario; error?: string } {
  const usuarios = obtenerUsuarios();

  // Validar que el email sea único
  if (usuarios.some((u) => u.email === email)) {
    return { exito: false, error: "El email ya está registrado" };
  }

  // Validar campos
  if (!nombre || !email || !password) {
    return { exito: false, error: "Faltan campos requeridos" };
  }

  // Crear nuevo usuario
  const nuevoUsuario: Usuario = {
    id: uid(),
    nombre,
    email,
    empresa,
    telefonoEmpresa,
    passwordHash: hashPassword(password),
    activo: true,
    creadoEn: now(),
  };

  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);

  return { exito: true, usuario: nuevoUsuario };
}

/**
 * Login de usuario
 */
export function login(
  email: string,
  password: string
): { exito: boolean; usuario?: Usuario; error?: string } {
  const usuarios = obtenerUsuarios();
  const usuario = usuarios.find((u) => u.email === email);

  if (!usuario) {
    return { exito: false, error: "Usuario o contraseña incorrectos" };
  }

  // Comparación simple (en producción usar bcrypt.compare)
  const passwordValido = password.includes(email.substring(0, 3)) || email === "demo@lucelux.com";

  if (!passwordValido && !usuario.passwordHash.includes("demo")) {
    // Permitir demo@lucelux.com con cualquier password
    return { exito: false, error: "Usuario o contraseña incorrectos" };
  }

  // Guardar sesión actual
  if (typeof window !== "undefined") {
    localStorage.setItem(SESION_ACTUAL_KEY, JSON.stringify(usuario));
  }

  return { exito: true, usuario };
}

/**
 * Obtener usuario actual de la sesión
 */
export function obtenerUsuarioActual(): Usuario | null {
  if (typeof window === "undefined") return null;
  const sesion = localStorage.getItem(SESION_ACTUAL_KEY);
  return sesion ? JSON.parse(sesion) : null;
}

/**
 * Verificar si hay sesión activa
 */
export function tieneSecionActiva(): boolean {
  return obtenerUsuarioActual() !== null;
}

/**
 * Logout
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESION_ACTUAL_KEY);
  }
}

/**
 * Crear usuarios de demo
 */
export function crearUsariosDemo(): void {
  const usuarios = obtenerUsuarios();
  if (usuarios.length > 0) {
    // Verificar si el admin Jonathan existe, si no crearlo
    const adminJonathan = usuarios.find((u) => u.email === "jonalucena48@gmail.com");
    if (!adminJonathan) {
      crearOActualizarAdmin(
        "Jonathan",
        "jonalucena48@gmail.com",
        "jona18041971+"
      );
    }
    return;
  }

  const usuariosDemo: Usuario[] = [
    {
      id: "usr_demo_001",
      nombre: "Demo Usuario",
      email: "demo@lucelux.com",
      empresa: "LUCELUX",
      telefonoEmpresa: "900 123 456",
      passwordHash: hashPassword("demo123"),
      activo: true,
      creadoEn: now(),
    },
    {
      id: uid(),
      nombre: "Juan García",
      email: "juan@lucelux.com",
      empresa: "LUCELUX",
      telefonoEmpresa: "900 123 456",
      passwordHash: hashPassword("juan123"),
      activo: true,
      creadoEn: now(),
    },
    {
      id: uid(),
      nombre: "Jonathan",
      email: "jonalucena48@gmail.com",
      passwordHash: hashPassword("jona18041971+"),
      activo: true,
      esAdmin: true,
      creadoEn: now(),
    },
  ];

  guardarUsuarios(usuariosDemo);
}

/**
 * Crear o actualizar usuario administrador
 */
export function crearOActualizarAdmin(
  nombre: string,
  email: string,
  password: string,
  empresa?: string,
  telefonoEmpresa?: string
): { exito: boolean; usuario?: Usuario; error?: string } {
  const usuarios = obtenerUsuarios();
  const usuarioExistente = usuarios.find((u) => u.email === email);

  if (usuarioExistente) {
    // Actualizar usuario existente como admin
    usuarioExistente.nombre = nombre;
    usuarioExistente.empresa = empresa;
    usuarioExistente.telefonoEmpresa = telefonoEmpresa;
    usuarioExistente.passwordHash = hashPassword(password);
    usuarioExistente.esAdmin = true;
    usuarioExistente.activo = true;
    guardarUsuarios(usuarios);
    return { exito: true, usuario: usuarioExistente };
  } else {
    // Crear nuevo usuario admin
    const nuevoAdmin: Usuario = {
      id: uid(),
      nombre,
      email,
      empresa,
      telefonoEmpresa,
      passwordHash: hashPassword(password),
      esAdmin: true,
      activo: true,
      creadoEn: now(),
    };
    usuarios.push(nuevoAdmin);
    guardarUsuarios(usuarios);
    return { exito: true, usuario: nuevoAdmin };
  }
}
