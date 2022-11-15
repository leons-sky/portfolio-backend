function rnd() {
	return Math.random().toString(36).substring(2);
}

console.log(rnd() + rnd() + rnd());
