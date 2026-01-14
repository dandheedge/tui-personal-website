// Projects Section
import { projectsContent } from '../utils/content';

export function createProjectsSection(): HTMLElement {
  const { frontmatter } = projectsContent;
  const projects = frontmatter.projects;

  const container = document.createElement('div');
  container.className = 'projects-section';

  const header = document.createElement('h2');
  header.className = 'section-header';
  header.textContent = 'tree ./projects';
  container.appendChild(header);

  // ASCII tree representation
  const treeContainer = document.createElement('div');
  treeContainer.className = 'project-tree';

  const pre = document.createElement('pre');
  let treeOutput = '<span style="color: var(--accent)">projects/</span>\n';

  projects.forEach((project, index) => {
    const isLast = index === projects.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const linePrefix = isLast ? '    ' : '│   ';

    treeOutput += `${prefix}<span class="project-name">${project.name}/</span>\n`;
    treeOutput += `${linePrefix}├── <span class="project-description">${project.description}</span>\n`;
    treeOutput += `${linePrefix}└── tech: ${project.tech.join(', ')}\n`;

    if (!isLast) {
      treeOutput += '│\n';
    }
  });

  pre.innerHTML = treeOutput;
  treeContainer.appendChild(pre);
  container.appendChild(treeContainer);

  // Project cards
  const cardsContainer = document.createElement('div');
  cardsContainer.style.marginTop = '1.5rem';

  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'experience-item';
    card.innerHTML = `
      <div class="exp-header">
        <span class="exp-company">${project.name}</span>
      </div>
      <p class="exp-description">${project.description}</p>
      <div class="exp-tech">
        ${project.tech.map(t => `<span class="badge">${t}</span>`).join('')}
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  container.appendChild(cardsContainer);

  return container;
}
