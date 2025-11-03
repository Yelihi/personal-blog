import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  period: string;
  tech: string;
  achievements: string[];
}

interface Experience {
  period: string;
  company: string;
  role: string;
  description: string;
  projects: Project[];
}

interface ExperienceSectionProps {
  experiences: Experience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  return (
    <div className="space-y-16">
      {experiences.map((exp) => (
        <div key={exp.company} className="space-y-6 sm:space-y-8">
          {/* Company Header */}
          <div className="grid grid-cols-12 gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-border">
            <div className="col-span-12 lg:col-span-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {exp.period}
              </p>
              <h3 className="text-xl sm:text-2xl tracking-tight">
                {exp.company}
              </h3>
              <p className="text-sm text-muted-foreground">{exp.role}</p>
            </div>
            <div className="col-span-12 lg:col-span-8 lg:flex lg:items-end">
              <p className="text-sm text-muted-foreground leading-relaxed border-l border-border pl-4 sm:pl-6 mt-4 lg:mt-0">
                {exp.description}
              </p>
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-4">
            {exp.projects.map((project) => (
              <div
                key={project.id}
                className="border border-border overflow-hidden hover:border-foreground transition-colors"
              >
                <button
                  onClick={() =>
                    setExpandedProject(
                      expandedProject === project.id ? null : project.id
                    )
                  }
                  className="w-full p-4 sm:p-6 md:p-8 text-left hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                        <span>{project.period}</span>
                      </div>
                      <h4 className="text-lg sm:text-xl tracking-tight">
                        {project.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {project.tech}
                      </p>
                    </div>
                    <div
                      className="pt-1 transition-transform duration-200"
                      style={{
                        transform:
                          expandedProject === project.id
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                </button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: expandedProject === project.id ? '1000px' : '0',
                    opacity: expandedProject === project.id ? 1 : 0,
                  }}
                >
                  <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 space-y-4 border-t border-border pt-4 sm:pt-6">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Impact
                    </p>
                    <ul className="space-y-3">
                      {project.achievements.map((achievement, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground leading-relaxed flex gap-3"
                        >
                          <span className="text-foreground mt-1.5 flex-shrink-0">
                            —
                          </span>
                          <span className="break-words">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
