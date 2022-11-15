import Project from "./Project";
import Tag from "./Tag";
import Category from "./Category";

Category.hasMany(Project);
Project.belongsTo(Category);

Project.belongsToMany(Tag, { through: "project_tag" });
Tag.belongsToMany(Project, { through: "project_tag" });

export { Project, Tag, Category };
