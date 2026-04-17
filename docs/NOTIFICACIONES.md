# 📱 Sistema de Notificaciones - Seguimiento de Obra

## 🎯 Descripción

Sistema automático que envía notificaciones a los clientes vía **WhatsApp** o **SMS** cada vez que cambias el estado del seguimiento de su proyecto.

Cuando el admin marca una etapa como completada, el cliente recibe automáticamente un mensaje con:
- ✅ Estado actualizado (ej: "Material Disponible")
- 📝 Descripción de la etapa
- 💬 Notas adicionales (si las hay)
- 🔗 Link a su portal de seguimiento

---

## 🚀 Cómo funciona

### **Flujo automático:**

```
Admin marca "Fabricación Lista" como completado
        ↓
Sistema envía notificación al cliente
        ↓
Cliente recibe WhatsApp/SMS con actualización
        ↓
Cliente puede ver cambios en su portal
```

### **Ejemplo de mensaje:**

```
✓ Fabricación Lista

Fabricación completada

📝 Nota: Vidrio templado terminado, listo para instalar

--
LUCELUX | Tu proyecto en tiempo real
```

---

## 🔧 Configuración

### **Modo Desarrollo (Mock)**

Por defecto, las notificaciones se **simulan** en:
- 🖥️ **Consola del navegador** (F12 → Console)
- 💾 **localStorage** (historial de notificaciones)

**No requiere configuración.** Perfecto para testing.

### **Modo Producción (Twilio)**

Para **SMS y WhatsApp real**:

1. **Crear cuenta en Twilio:**
   - Ir a: https://www.twilio.com/console
   - Registrarse y crear proyecto
   - Copiar credenciales:
     - Account SID
     - Auth Token
     - Número Twilio (ej: +1234567890)

2. **Configurar variables de entorno:**
   ```bash
   # .env.local o .env.production
   NOTIFICACIONES_PROVEEDOR=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Restart servidor:**
   ```bash
   npm run dev
   ```

### **Modo Producción (WhatsApp API)**

Para usar **WhatsApp Business API** directamente:

1. **Crear cuenta Meta:**
   - Ir a: https://developers.facebook.com
   - Crear Business Account
   - Configurar WhatsApp Business

2. **Configurar variables de entorno:**
   ```bash
   NOTIFICACIONES_PROVEEDOR=whatsapp_api
   WHATSAPP_PHONE_NUMBER_ID=102xxx...
   WHATSAPP_ACCESS_TOKEN=EAABs...
   ```

---

## 📊 Estados que generan notificación

Automáticamente se notifica al cliente cuando:

| Estado | Emoji | Descripción |
|--------|-------|-------------|
| ✅ Aceptado | ✓ | Presupuesto aceptado |
| ⏳ Pendiente Material | ⏳ | Esperando disponibilidad |
| 📦 Material Disponible | 📦 | Materiales listos |
| 🔧 En Fabricación | 🔧 | En proceso |
| ✓ Fabricación Lista | ✓ | Completado |
| 📅 Pendiente Cita | 📅 | Esperando confirmación |
| 📌 Cita Confirmada | 📌 | Instalación agendada |
| 👷 En Instalación | 👷 | Equipo en obra |
| 🎉 Entregado | 🎉 | ¡Completado! |

---

## 🎮 Cómo usar

### **1. Abrir presupuesto aceptado**

Ve a **Presupuestos** → click en un presupuesto aceptado → **Editar**

### **2. Marcar etapa como completada**

En el panel "Editar Seguimiento de Obra":

- **Opción A (Rápido):** Click en botón verde **"Marcar ✓"**
  - Se marca automáticamente
  - Se envía notificación al cliente
  - Se asigna fecha actual

- **Opción B (Detallado):** Click en **"Editar"**
  - Personalizar fecha
  - Agregar notas
  - Marcar/desmarcar como completado
  - Click **"Guardar"** → Se envía notificación

### **3. Ver estado de envío**

Arriba del panel verás un mensaje:
- ✅ **Verde:** "Notificación enviada por SMS"
- ❌ **Rojo:** Error en envío
- ℹ️ **Gris:** Status del envío

---

## 🛠️ Desarrollo

### **Ver historial de notificaciones (Mock)**

Abre la consola del navegador:

```javascript
// En F12 → Console
JSON.parse(localStorage.getItem('lucelux_notificaciones_enviadas'))
```

Verás todas las notificaciones simuladas con:
- Teléfono del cliente
- Contenido del mensaje
- Fecha/hora
- Proveedor

### **Cambiar a modo Mock manual**

En `lib/notificaciones.ts`:

```typescript
const CONFIG_NOTIFICACIONES: ConfiguracionNotificaciones = {
  habilitada: true,
  proveedor: "mock", // Cambiar aquí
  apiKey: process.env.TWILIO_AUTH_TOKEN,
};
```

---

## 💬 Formato de mensaje

El sistema construye automáticamente:

```
[EMOJI] [ESTADO]

[DESCRIPCIÓN]

[OPCIONAL] 📝 Nota: [NOTAS DEL ADMIN]

--
LUCELUX | Tu proyecto en tiempo real
```

### **Ejemplo completo:**

```
🔧 En Fabricación

En proceso de fabricación

📝 Nota: Comenzamos con los marcos de aluminio. Todo según medidas del cliente.

--
LUCELUX | Tu proyecto en tiempo real
```

---

## 🔒 Privacidad

- ✅ Teléfono guardado en cada Cliente
- ✅ Notificaciones enviadas solo a clientes con presupuesto aceptado
- ✅ Historial local (no enviado a servidores)
- ✅ Puedes desactivar notificaciones: `habilitada: false`

---

## 📞 Costos (Twilio)

- **SMS:** ~€0.0075 por mensaje
- **WhatsApp:** Variable según volumen
- **Pruebas gratuitas:** $15 crédito inicial

---

## 🐛 Troubleshooting

### "Notificaciones deshabilitadas"
→ Verifica que `habilitada: true` en `lib/notificaciones.ts`

### "No hay teléfono registrado"
→ El cliente debe tener teléfono configurado

### "Error Twilio: 21211"
→ Número de teléfono inválido. Debe incluir código país: +34xxxxx

### "No recibe SMS"
→ Verifiquar credenciales de Twilio en `.env.local`

---

## 🎯 Próximas mejoras

- [ ] Email automático además de SMS
- [ ] Confirmación de lectura del mensaje
- [ ] Templates personalizables
- [ ] Scheduling de envíos
- [ ] Múltiples idiomas

---

**Commit:** `dc8faf9`
