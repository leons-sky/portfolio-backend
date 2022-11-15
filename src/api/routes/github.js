import https from "https";
import validator from "express-validator";
import { Router } from "express";
import { auth, error, getRepo } from "../middleware";
import NodeCache from "node-cache";

const githubRouter = Router();

githubRouter.get(
	"/:owner/:repo",
	auth({
		dontRespond: true,
	}),
	getRepo.params(),
	(req, res) => {
		res.send(req.repo);
	}
);

const readmeCache = new NodeCache({
	stdTTL: 60 * 30,
	deleteOnExpire: true,
	useClones: false,
});

function getReadme(options) {
	return new Promise(async (resolve, reject) => {
		const key = `${options.owner}/${options.name}/${options.branch}`;
		if (readmeCache.has(key)) {
			const data = readmeCache.get(key);
			if (data.found) {
				resolve(data.content);
			} else {
				reject({
					code: 404,
				});
			}
			return;
		}

		function sendRequest(readmeName) {
			return new Promise((resolve, reject) => {
				const req = https.get(
					{
						host: "raw.githubusercontent.com",
						path: `${key}/${readmeName}.md`,
					},
					(res) => {
						if (res.statusCode != 200) {
							if (res.statusCode == 404) {
								readmeCache.set(key, {
									found: false,
								});
							}

							return reject({
								code: res.statusCode,
								msg: res.statusMessage,
							});
						}

						const data = [];
						res.on("data", (chunk) => {
							data.push(chunk);
						}).on("end", () => {
							const body = Buffer.concat(data);
							const markdown = body.toString();

							readmeCache.set(key, {
								found: true,
								content: markdown,
							});

							resolve(markdown);
						});
					}
				);

				req.on("error", (err) => {
					reject({
						status: 500,
						msg: err.message,
					});
				});
			});
		}

		let overallErr;
		for (let readmeName of [
			"README",
			"readme",
			"Readme",
			"ReadMe",
			"readMe",
		]) {
			try {
				const content = await sendRequest(readmeName);
				resolve(content);
				return;
			} catch (err) {
				if (!overallErr || overallErr.status < err.status) {
					overallErr = err;
				}
			}
		}
		reject(overallErr);
	});
}

githubRouter.get(
	"/:owner/:repo/readme",
	auth({
		dontRespond: true,
	}),
	getRepo.params(),
	(req, res) => {
		getReadme({
			owner: req.repo.owner.login,
			name: req.repo.name,
			branch: req.repo.default_branch,
		})
			.then((readme) => {
				res.send(readme);
			})
			.catch((err) => {
				if (!err.code) return res.status(500).send(err.message);
				if (!err.msg) return res.sendStatus(err.code);
				res.status(err.code).send(err.msg);
			});
	}
);

githubRouter.post(
	"/readmes",
	auth({
		dontRespond: true,
	}),
	[
		validator.body().isArray({
			min: 1,
		}),
		validator.body("*.owner").isString(),
		validator.body("*.name").isString(),
		validator.body("*.force").optional().isBoolean(),
		error(400),
	],
	async (req, res, next) => {
		const body = req.body;
		const promises = [];
		for (let info of body) {
			promises.push(
				getRepo._handle(
					{
						owner: info.owner,
						name: info.name,
						force: Boolean(info.force),
						allowPrivate: true,
					},
					{ req }
				)
			);
		}

		Promise.all(promises)
			.then((repos) => {
				delete req.repo;
				req.repos = repos;
				next();
			})
			.catch((err) => {
				res.status(err.code).send(err.msg);
			});
	},
	(req, res) => {
		const promises = [];
		for (let repo of req.repos) {
			promises.push(
				(async () => {
					if (repo.private) {
						return {
							owner: repo.owner.login,
							name: repo.name,
							readme: null,
						};
					}

					try {
						return {
							owner: repo.owner.login,
							name: repo.name,
							readme: await getReadme({
								owner: repo.owner.login,
								name: repo.name,
								branch: repo.default_branch,
							}),
						};
					} catch (err) {
						if (err.code != 404) {
							throw err;
						}
					}

					return {
						owner: repo.owner.login,
						name: repo.name,
						readme: null,
					};
				})()
			);
		}

		if (promises.length == 0) {
			return res.send([]);
		}

		Promise.all(promises)
			.then((readmes) => {
				res.send(readmes);
			})
			.catch((err) => {
				if (!err.code) return res.status(500).send(err.message);
				if (!err.msg) return res.sendStatus(err.code);
				res.status(err.code).send(err.msg);
			});
	}
);

export default githubRouter;
