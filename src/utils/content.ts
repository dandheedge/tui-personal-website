// Content loader utility - parses markdown files with YAML frontmatter
import { parse as parseYaml } from 'yaml';
import { marked } from 'marked';

// Import raw markdown content
import aboutRaw from '../content/about.md?raw';
import skillsRaw from '../content/skills.md?raw';
import experienceRaw from '../content/experience.md?raw';
import projectsRaw from '../content/projects.md?raw';
import contactRaw from '../content/contact.md?raw';

export interface ParsedContent<T = Record<string, unknown>> {
  frontmatter: T;
  content: string;
  html: string;
}

function parseFrontmatter<T>(raw: string): ParsedContent<T> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {} as T,
      content: raw,
      html: marked(raw) as string
    };
  }

  const [, yamlContent, markdownContent] = match;
  const frontmatter = parseYaml(yamlContent) as T;
  const content = markdownContent.trim();
  const html = marked(content) as string;

  return { frontmatter, content, html };
}

// Type definitions for each content type
export interface AboutFrontmatter {
  name: string;
  alias: string;
  title: string;
  experience: string;
  location: string;
  timezone: string;
  quote: string;
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface SkillsFrontmatter {
  categories: SkillCategory[];
}

export interface ExperiencePosition {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
  tech: string[];
}

export interface ExperienceFrontmatter {
  positions: ExperiencePosition[];
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  link?: string;
}

export interface ProjectsFrontmatter {
  projects: Project[];
}

export interface ContactLink {
  label: string;
  url: string;
  icon: string;
  display: string;
  shortcut: string;
}

export interface ContactFrontmatter {
  intro: string;
  links: ContactLink[];
  footer: {
    timezone: string;
    response_time: string;
  };
}

// Parsed content exports
export const aboutContent = parseFrontmatter<AboutFrontmatter>(aboutRaw);
export const skillsContent = parseFrontmatter<SkillsFrontmatter>(skillsRaw);
export const experienceContent = parseFrontmatter<ExperienceFrontmatter>(experienceRaw);
export const projectsContent = parseFrontmatter<ProjectsFrontmatter>(projectsRaw);
export const contactContent = parseFrontmatter<ContactFrontmatter>(contactRaw);
