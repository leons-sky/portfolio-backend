import express from "express";
import cors from "cors";
import githubRouter from "./routes/github";
import projectsRouter from "./routes/projects";
import tagsRouter from "./routes/tags";
import categoriesRouter from "./routes/categories";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/github", githubRouter);
app.use("/projects", projectsRouter);
app.use("/tags", tagsRouter);
app.use("/categories", categoriesRouter);

export default app;
