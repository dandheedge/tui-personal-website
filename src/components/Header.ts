// ASCII Art Header Component

export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'header-section';

  const asciiContainer = document.createElement('div');
  asciiContainer.className = 'ascii-header';

  // ASCII art for "dandhi damarrama" - clean retro style
  const asciiArt = `╺━╸ DANDHI DAMARRAMA ╺━╸`;

  const pre = document.createElement('pre');
  pre.setAttribute('aria-label', 'Dandhi Damarrama - ASCII art banner');
  pre.setAttribute('role', 'img');
  pre.textContent = asciiArt;

  const subtitle = document.createElement('p');
  subtitle.className = 'header-subtitle';
  subtitle.textContent = 'Front-end Developer | Jakarta, Indonesia';

  asciiContainer.appendChild(pre);
  asciiContainer.appendChild(subtitle);
  header.appendChild(asciiContainer);

  return header;
}
