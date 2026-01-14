// About Section
import { aboutContent } from '../utils/content';

export function createAboutSection(): HTMLElement {
  const { frontmatter, html } = aboutContent;

  const container = document.createElement('div');
  container.className = 'about-section';

  container.innerHTML = `
    <h2 class="section-header">whoami</h2>

    <div class="about-content">
      <p>
        <span class="about-name">${frontmatter.name}</span> (a.k.a. <span class="about-highlight">"${frontmatter.alias}"</span>)
      </p>

      <p>
        ${frontmatter.title} with <span class="badge badge-primary">${frontmatter.experience}</span> of experience
        building web applications. Based in <span class="badge">${frontmatter.location}</span> (${frontmatter.timezone}).
      </p>

      <hr class="separator">

      <div class="about-body">${html}</div>

      <hr class="separator">

      <p class="about-quote">
        <em>"${frontmatter.quote}"</em>
      </p>
    </div>
  `;

  return container;
}
