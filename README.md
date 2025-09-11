# CTM Credenciales App

Sistema interno para crear, editar, buscar, previsualizar e imprimir credenciales de CTM.

## 🚀 Características

- **Autenticación**: Login único de administrador con sesiones seguras
- **Gestión de Usuarios**: Crear, editar, buscar usuarios con direcciones mexicanas
- **Vista Previa en Tiempo Real**: Previsualización de credenciales CTM con diseño exacto
- **Sistema de Impresión**: Impresión con medidas precisas CR80 (85.6mm x 54mm)
- **Vigencias**: Aplicar y gestionar vigencias de credenciales
- **Firmas**: Subir y gestionar firmas de usuarios y presidente
- **Búsqueda Avanzada**: Búsqueda por nombre, teléfono, credencial o gafete

## 🛠️ Stack Tecnológico

- **Frontend**: SolidJS + Vite + Tailwind CSS
- **Backend**: Bun + Elysia + Zod
- **Base de Datos**: SQLite con Prisma ORM
- **Autenticación**: Argon2 + Cookies HttpOnly
- **Archivos**: Sistema local con APIs de Bun

## 📁 Estructura del Proyecto

```
ctm-credenciales-app/
├── apps/
│   ├── api/          # Backend con Elysia
│   └── web/          # Frontend con SolidJS
├── packages/
│   ├── db/           # Esquema Prisma y migraciones
│   └── schema/       # Esquemas Zod compartidos
├── data/             # Bases de datos SQLite
└── storage/          # Firmas de usuarios y assets
```

## 🚀 Inicio Rápido

### Prerrequisitos

- [Bun](https://bun.sh/) >= 1.0.0

### Instalación

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <repo-url>
   cd ctm-credenciales-app
   bun run setup
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Iniciar en desarrollo:**
   ```bash
   bun run dev
   ```

4. **Acceder a la aplicación:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Credenciales por defecto: `admin@ctm.local` / `admin123`

## 📋 Scripts Disponibles

```bash
# Desarrollo
bun run dev              # Iniciar frontend y backend
bun run dev:api          # Solo backend
bun run dev:web          # Solo frontend

# Base de datos
bun run db:generate      # Generar cliente Prisma
bun run db:migrate       # Ejecutar migraciones
bun run db:seed          # Sembrar datos iniciales
bun run db:studio        # Abrir Prisma Studio

# Construcción
bun run build            # Construir todo
bun run build:api        # Construir backend
bun run build:web        # Construir frontend

# Calidad de código
bun run check            # Verificar con Biome
bun run check:fix        # Arreglar automáticamente
```

## 🖨️ Configuración de Impresión

Para imprimir credenciales correctamente:

### Configuración del Navegador
1. **Tamaño**: 100% (escala real)
2. **Márgenes**: Ninguno
3. **Encabezados/Pies**: Desactivados
4. **Orientación**: Automática (Portrait por defecto)

### Verificación de Calibración
- Use el botón "Guías" para mostrar líneas de referencia
- La línea de 50mm debe medir exactamente 50mm en papel
- Si no coincide, ajustar la configuración de la impresora

### Solución de Problemas
- **Credencial muy pequeña**: Verificar que está al 100% de escala
- **Cortada**: Eliminar márgenes de impresión
- **Rotada incorrectamente**: Usar botón "Rotar 90°" si es necesario

## 🔧 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/logout` - Cerrar sesión
- `GET /api/v1/auth/me` - Información del usuario actual

### Usuarios
- `GET /api/v1/users?query=...` - Buscar usuarios
- `POST /api/v1/users` - Crear usuario
- `GET /api/v1/users/:id` - Obtener usuario
- `PATCH /api/v1/users/:id` - Actualizar usuario
- `POST /api/v1/users/:id/vigency` - Aplicar vigencia
- `POST /api/v1/users/:id/signature` - Subir firma
- `GET /api/v1/users/:id/signature` - Obtener firma

### Configuraciones
- `GET /api/v1/settings` - Obtener configuraciones
- `PUT /api/v1/settings` - Actualizar configuraciones
- `POST /api/v1/settings/presidente-firma` - Subir firma del presidente

### Salud
- `GET /api/v1/health` - Estado del sistema

## 🎨 Diseño de Credencial

### Especificaciones
- **Tamaño**: CR80 estándar (85.6mm x 54mm)
- **Orientación**: Vertical (Portrait)
- **Colores CTM**:
  - Rojo primario: `#D32F2F`
  - Verde: `#2E7D32`
  - Ámbar: `#FFA000`

### Elementos del Frente
- Logo CTM (esquina superior derecha)
- Regla verde vertical con texto rotado
- Área de foto (esquina superior izquierda)
- Nombre completo en mayúsculas
- Números de credencial y gafete (rotados)
- Información de domicilio
- Edad y teléfono (verticales)
- Área de firma del presidente
- Indicador de vigencia

### Elementos del Reverso
- Datos compactos del usuario
- Números de ajustadores (Colima, Tecomán, Manzanillo)
- Información legal/seguros

## 🔐 Seguridad

- **Contraseñas**: Hash con Argon2
- **Sesiones**: Cookies HttpOnly, SameSite=Lax, 7 días
- **Rate Limiting**: Límite en intentos de login
- **Validación**: Zod en frontend y backend
- **Archivos**: Validación de tipo y tamaño (2MB máx, PNG/JPEG)

## 🚢 Despliegue

### Configuración del Servidor

1. **Instalar Bun** en el servidor de producción
2. **Configurar variables de entorno**:
   ```bash
   NODE_ENV=production
   DATABASE_URL="file:./data/prod.db"
   SESSION_SECRET="clave-super-secreta-de-produccion"
   ```
3. **Construir y desplegar**:
   ```bash
   bun run build
   bun run db:migrate
   bun run db:seed
   ```

### Systemd (Recomendado)

```ini
# /etc/systemd/system/ctm-api.service
[Unit]
Description=CTM Credenciales API
After=network.target

[Service]
Type=simple
User=ctm
WorkingDirectory=/opt/ctm-credenciales-app
ExecStart=/usr/local/bin/bun run apps/api/dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Nginx/Caddy

```nginx
# Nginx
server {
    listen 80;
    server_name credenciales.ctm.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Respaldo de Base de Datos

```bash
# Cron para respaldo diario
0 2 * * * sqlite3 /opt/ctm-credenciales-app/data/prod.db ".backup /backup/ctm-$(date +\%Y\%m\%d).db"
```

## 📝 Datos de Desarrollo

### Usuario Administrador
- **Email**: admin@ctm.local
- **Contraseña**: admin123

### Configuraciones por Defecto
- **Ajustador Colima**: 12345
- **Ajustador Tecomán**: 67890
- **Ajustador Manzanillo**: 54321

## 🐛 Solución de Problemas

### Error de Base de Datos
```bash
# Verificar conexión
bun run db:studio

# Regenerar cliente
bun run db:generate
```

### Error de Permisos de Archivos
```bash
# Verificar permisos de storage
chmod -R 755 storage/
chown -R user:user storage/
```

### Error de Importación de Módulos
```bash
# Limpiar y reinstalar
bun run clean
bun install
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es de uso interno de CTM.

---

**CTM Credenciales App** - Sistema de gestión de credenciales desarrollado con Bun, SolidJS y amor ❤️
