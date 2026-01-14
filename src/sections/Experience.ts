// Experience Section
import { experienceContent } from '../utils/content';

export function createExperienceSection(): HTMLElement {
  const { frontmatter } = experienceContent;

  const container = document.createElement('div');
  container.className = 'experience-section';

  const header = document.createElement('h2');
  header.className = 'section-header';
  header.textContent = 'ls -la ./experience';
  container.appendChild(header);

  frontmatter.positions.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'experience-item';

    item.innerHTML = `
      <div class="exp-header">
        <span class="exp-company">${exp.company}</span>
        <span class="exp-period">${exp.period}</span>
      </div>
      <div class="exp-role">${exp.role} | ${exp.location}</div>
      <p class="exp-description">${exp.description}</p>
      <div class="exp-tech">
        ${exp.tech.map(t => `<span class="badge">${t}</span>`).join('')}
      </div>
    `;

    container.appendChild(item);
  });

  return container;
}
