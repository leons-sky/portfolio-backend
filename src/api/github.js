import { Octokit } from "@octokit/core";

const octokit = new Octokit({
	auth: process.env.GH_ACCESS_TOKEN,
});

export async function getRepository(owner, name) {
	const response = await octokit.request("GET /repos/{owner}/{repo}", {
		owner: owner,
		repo: name,
	});
	return response.data;
}
