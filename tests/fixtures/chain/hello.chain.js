() => {
	const dataTransform = (data) => {
		const d = JSON.parse(data);
		d.say_hi = 'hello from dataTransform';
		return JSON.stringify(d);
	}
	return {
		"steps": [
			{
				"id": "first",
				"zencode": "Given nothing\nWhen I write the string 'hello' in 'say hi'\nThen print 'say_hi'",
			},
			{
				"id": "second",
				"dataFromStep": "first",
				"dataTransform": dataTransform,
				"zencode": "Given I have a 'string' named 'say_hi'\nThen print the data"
			}
		]
	}
}