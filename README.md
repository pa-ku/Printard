# Printard

Crea, edita y exporta layouts de cartas (cards) listos para impresión. Printard ofrece un flujo de trabajo eficiente para diseñar cartas con textos, imágenes, marcos, fondos, íconos, códigos QR/barras y más, con controles de tamaño, márgenes y sangrado profesional.

## ✨ Características

- Editor de layouts de cartas con guía de retícula y alineación.
- Plantillas reutilizables por tamaño y juego/colección.
- Soporte de capas: fondo, arte, marco, texto, símbolos, etc.
- Tipografías personalizadas, estilos y efectos (tracking, leading, sombra/desborde).
- Variables y datasets: importación de datos por CSV/JSON para generar múltiples cartas.
- Inserción de imágenes (PNG/JPG/SVG) y assets reutilizables.
- Campos dinámicos: atributos, rareza, costo, fuerza, etc.
- Generación por lote: render masivo de cartas desde una planilla de datos.
- Exportación a PDF/PNG con control de DPI, sangrado y marcas de corte.
- Hojas de impresión: n×m cartas por página, con espaciado configurable.
- Perfiles de color (opcional) y control de negro enriquecido para impresión.

## 📦 Requisitos

- [Opcional] Python 3.8+ o Node.js 18+ (dependiendo del stack de este repo).
- Sistema operativo Windows/macOS/Linux.
- Paquetes/fuentes del proyecto (ver `requirements.txt` o `package.json` si aplica).

Nota: Si este repositorio incluye un ejecutable o app empaquetada, puedes omitir la instalación de dependencias y pasar directo a "Uso".

## 🚀 Instalación

1) Clonar el repositorio:
```bash
git clone https://github.com/yourusername/Printard.git
cd Printard
```

2) Instalar dependencias (elige el que corresponda):
- Python
```bash
pip install -r requirements.txt
```
- Node.js
```bash
npm install
# o
pnpm install
# o
yarn install
```

## ▶️ Uso

- Modo interactivo (editor):
  1. Abre la aplicación/servidor según el stack del proyecto.
  2. Crea un layout o abre una plantilla existente.
  3. Define áreas: arte, marco, textos, iconos, etc.
  4. Ajusta tamaño de carta, márgenes y sangrado.
  5. Guarda la plantilla para reutilizarla con datasets.

- Render por lote (datasets):
  1. Prepara un archivo CSV/JSON con columnas como `titulo`, `descripcion`, `rareza`, `costo`, `imagen`, etc.
  2. Asocia el dataset a una plantilla.
  3. Genera las cartas de forma masiva.

Ejemplos de comandos (ajusta a tu stack real):
```bash
# Python
python main.py

# Node.js
npm run dev
```

## ⚙️ Configuración

- Tamaño de carta: por ejemplo 63×88 mm (tipo estándar) u otros tamaños personalizados.
- Sangrado (bleed): recomendado 3 mm.
- Márgenes de seguridad: recomendado 3–5 mm.
- Resolución: 300 DPI para impresión.
- Fuentes: coloca tus tipografías en `assets/fonts/` y cárgalas en la plantilla.
- Imágenes: coloca arte y marcos en `assets/images/`.
- Variables: define campos dinámicos en la plantilla (p. ej. `{titulo}`, `{ataque}`, `{defensa}`).

## 🖨️ Exportación e impresión

- Exporta a PDF con sangrado y marcas de corte cuando sea necesario.
- Genera hojas de impresión con grilla n×m para optimizar papel.
- Verifica perfiles de color (CMYK) si tu imprenta lo requiere.
- Revisa sobreimpresiones/negro enriquecido para textos y marcos oscuros.

## 🗂️ Estructura sugerida (puede variar)

```
Printard/
├─ assets/
│  ├─ fonts/
│  └─ images/
├─ templates/           # Plantillas de layouts
├─ datasets/            # CSV/JSON con datos de cartas
├─ exports/             # Salidas (PDF/PNG)
├─ src/                 # Código fuente
├─ README.md            # Este archivo
└─ requirements.txt / package.json
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para proponer mejoras:
- Crea un fork del repositorio.
- Abre una rama para tu feature/fix.
- Envía un Pull Request con una descripción clara y capturas si aplica.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más información.

## 📬 Contacto

- Autor: [Tu Nombre]
- Email: [tu-email@dominio.com]
- Issues y sugerencias: usa la pestaña "Issues" del repositorio.

