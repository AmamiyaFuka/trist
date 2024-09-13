const get_category = ({swim, bike, run}) => {
	if (swim >= 3.0 && bike >= 91 && run >= 22) return 'long';
	if (swim >= 1.999 && bike >= 80 && run >= 20) return 'middle';
	if (swim >= 1 && bike >= 35 && run >= 8) return 'standard';
	if (swim > 0.5 && bike > 13 && run > 3.5) return 'sprint';
	if (swim <= 0.5 && bike <= 13 && run <= 3.5) return 'super-sprint';
	throw new Error('Unknown category');
};

const get = id => {
	if (!id.category) id.category = get_category(id.distance);
	return (async () => id)();
};

export default {
	get,
};
