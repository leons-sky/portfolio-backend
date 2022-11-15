export default function (options) {
	return function (req, res, next) {
		if (
			!req.headers.authorization ||
			req.headers.authorization != process.env.API_TOKEN
		) {
			req.isAuth = false;
			if (options.dontRespond) {
				next();
				return;
			}
			return res.status(401).send("Missing valid authorization header");
		}
		req.isAuth = true;
		next();
	};
}
