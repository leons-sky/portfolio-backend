import validator from "express-validator";
import error from "./error";
import { getRepository } from "../github";
import NodeCache from "node-cache";

const repoCache = new NodeCache({
	stdTTL: 60 * 30,
	deleteOnExpire: true,
	useClones: true,
});

export async function _handle(options, { req }) {
	const key = `${options.owner}/${options.name}`;
	function isAllowed(repo) {
		if (repo.private && (!req.isAuth || !options.allowPrivate)) {
			throw {
				code: 401,
				msg: `(${key}) Repository is private`,
			};
		}
	}

	if (!options.force && repoCache.has(key)) {
		const repo = repoCache.get(key);
		isAllowed(repo);
		return repo;
	}

	let repo;
	try {
		repo = await getRepository(options.owner, options.name);
		repoCache.set(key, repo);
	} catch (err) {
		throw {
			code: err.status,
			msg: `Error when fetching github repository: ${err.data.message}`,
		};
	}

	isAllowed(repo);
	return repo;
}

export function params(options) {
	options = options ?? {};
	const ownerParam = options.ownerParam ?? "owner";
	const nameParam = options.nameParam ?? "repo";

	return [
		validator.param(options.ownerParam).exists(),
		validator.param(options.nameParam).exists(),
		error(400),
		function (req, res, next) {
			options.owner = req.params[ownerParam];
			options.name = req.params[nameParam];
			_handle(options, { req })
				.then((repo) => {
					req.repo = repo;
					next();
				})
				.catch((err) => {
					res.status(err.code).send(err.msg);
				});
		},
	];
}

export function body(options) {
	options = options ?? {};

	return [
		validator
			.body("repository", "Repository param is required in body")
			.isObject(),
		validator.body("repository.owner").isString(),
		validator.body("repository.name").isString(),
		validator.body("repository.force").optional().isBoolean(),
		error(400),
		function (req, res, next) {
			let info = req.body.repository;
			options.owner = info.owner;
			options.name = info.name;
			if (info.force) {
				options.force = true;
			}
			_handle(options, { req })
				.then((repo) => {
					req.repo = repo;
					next();
				})
				.catch((err) => {
					res.status(err.code).send(err.msg);
				});
		},
	];
}

export function custom(func, options) {
	options = options ?? {};

	return [
		async function (req, res, next) {
			try {
				let [owner, name] = await func(req);
				options.owner = owner;
				options.name = name;
				next();
			} catch (err) {
				res.status(500).send(err.message);
			}
		},
		function (req, res, next) {
			_handle(options, { req })
				.then((repo) => {
					req.repo = repo;
					next();
				})
				.catch((err) => {
					res.status(err.code).send(err.msg);
				});
		},
	];
}
