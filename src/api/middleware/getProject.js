import getRecord from "./getRecord";
import { Project } from "../../db/models";

export default function getProject(options) {
	return getRecord("projectId", Project, options);
}
