// Contact Section
import { contactContent } from '../utils/content';

export function createContactSection(): HTMLElement {
  const { frontmatter } = contactContent;

  const container = document.createElement('div');
  container.className = 'contact-section';

  const header = document.createElement('h2');
  header.className = 'section-header';
  header.textContent = 'cat contact.txt';
  container.appendChild(header);

  // ASCII box with contact info
  const contactBox = document.createElement('div');
  contactBox.className = 'contact-box';

  const introLines = frontmatter.intro.trim().split('\n');
  const maxLineLength = Math.max(...introLines.map(l => l.length), 20);
  const boxWidth = maxLineLength + 4;

  const pre = document.createElement('pre');
  let boxContent = `┌${'─'.repeat(boxWidth)}┐\n`;
  boxContent += `│${' '.repeat(boxWidth)}│\n`;
  boxContent += `│   <span style="color: var(--accent)">CONTACT INFORMATION</span>${' '.repeat(boxWidth - 23)}│\n`;
  boxContent += `│${' '.repeat(boxWidth)}│\n`;

  introLines.forEach(line => {
    const padding = boxWidth - line.length - 3;
    boxContent += `│   ${line}${' '.repeat(Math.max(0, padding))}│\n`;
  });

  boxContent += `│${' '.repeat(boxWidth)}│\n`;
  boxContent += `└${'─'.repeat(boxWidth)}┘`;

  pre.innerHTML = boxContent;
  contactBox.appendChild(pre);
  container.appendChild(contactBox);

  // Clickable links
  const linksContainer = document.createElement('div');
  linksContainer.className = 'contact-links';

  frontmatter.links.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = link.url.startsWith('mailto:') ? '_self' : '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'contact-link';

    anchor.innerHTML = `
      <span class="contact-link-icon">[${link.shortcut}]</span>
      <span style="color: var(--accent)">${link.icon}</span>
      <span>${link.label}:</span>
      <span style="color: var(--text-secondary)">${link.display}</span>
    `;

    linksContainer.appendChild(anchor);
  });

  container.appendChild(linksContainer);

  // Footer note
  const footer = document.createElement('p');
  footer.style.marginTop = '2rem';
  footer.style.color = 'var(--text-muted)';
  footer.style.fontSize = '0.85rem';
  footer.innerHTML = `
    <em>Timezone: ${frontmatter.footer.timezone}</em><br>
    <em>Response time: ${frontmatter.footer.response_time}</em>
  `;
  container.appendChild(footer);

  return container;
}
