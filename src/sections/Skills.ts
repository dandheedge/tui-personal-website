// Skills Section
import { skillsContent } from '../utils/content';

export function createSkillsSection(): HTMLElement {
  const { frontmatter } = skillsContent;

  const container = document.createElement('div');
  container.className = 'skills-section';

  const header = document.createElement('h2');
  header.className = 'section-header';
  header.textContent = 'cat skills.md';
  container.appendChild(header);

  frontmatter.categories.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'skill-category';

    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = category.name;
    categoryDiv.appendChild(categoryTitle);

    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'skill-badges';

    category.skills.forEach(skill => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = skill;
      badgeContainer.appendChild(badge);
    });

    categoryDiv.appendChild(badgeContainer);
    container.appendChild(categoryDiv);
  });

  return container;
}
