# TUI Personal Website

A terminal-style personal portfolio website with vim-inspired keyboard navigation and multiple color themes.

## Features

- **Terminal UI Aesthetic** - Retro terminal look with ASCII art and monospace fonts
- **Vim-style Navigation** - Navigate using familiar vim keybindings
- **Multiple Themes** - Catppuccin, Gruvbox, Nord, Tokyo Night, and Dracula
- **Prerendered for SEO** - Static HTML generation for better search engine indexing
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **@webtui/css** - Terminal UI styling
- **Marked** - Markdown parsing for content
- **Puppeteer** - Prerendering for SEO

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js with npm)

### Installation

```bash
# Clone the repository
git clone https://github.com/damarrama/tui-personal-website.git
cd tui-personal-website

# Install dependencies
bun install

# Start development server
bun run dev
```

### Build for Production

```bash
bun run build
bun run preview
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-5` | Navigate to tabs (About, Skills, Experience, Projects, Contact) |
| `Tab` | Cycle through tabs |
| `j` / `k` | Scroll content down / up |
| `gg` | Scroll to top |
| `G` | Scroll to bottom |
| `ge` | Open email |
| `gh` | Open GitHub |
| `gl` | Open LinkedIn |
| `gx` | Open X (Twitter) |
| `t` | Open theme selector |
| `?` | Show help modal |
| `Esc` | Close modals |

## Customization

### Content

Edit the markdown files in `src/content/`:

- `about.md` - About section
- `skills.md` - Skills and technologies
- `experience.md` - Work experience
- `projects.md` - Portfolio projects
- `contact.md` - Contact information

### Themes

Themes are defined in `public/themes.json` and styled via CSS custom properties in `src/styles/`.

## Project Structure

```
src/
├── components/     # UI components (Header, TabBar, StatusBar, etc.)
├── sections/       # Page sections (About, Skills, Experience, etc.)
├── content/        # Markdown content files
├── styles/         # CSS styles
├── utils/          # Utilities (keyboard, theme, storage, content)
└── main.ts         # Application entry point
```

## Deployment

This project includes AWS SAM templates for deployment to S3 + CloudFront. See `template.yaml` and `samconfig.toml` for configuration.

## License

MIT
