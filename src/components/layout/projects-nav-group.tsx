import { IconChecklist, IconFolders } from "@tabler/icons-react";

import { NavGroup } from "./nav-group";
import { NavItem } from "./types";
import { Project } from "@/backends/types";
import TodoBackend from "@/backends/nextcloud-todo/nextcloud-todo";
import { useSuspenseQuery } from "@tanstack/react-query";

const getProjects = async () => {
    const backend = new TodoBackend();
    const projects: Project[] = await backend.getProjects();
    const navItems: NavItem[] = projects.map((project): NavItem => {
        return {
            title: project.title,
            icon: IconFolders,
            badge: project.taskCount > 0 ? String(project.taskCount) : undefined,
            url : `/project/${project.id}`,
        };
    })

    return navItems
}

export const ProjectsNavGroup = () => {
    const { data } = useSuspenseQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    return <NavGroup key="projects" title="Projects" items={data} />;
};
