/**
 * Phone/browser Back closes what's open, top first (a sheet, then the open
 * group), before it leaves the page. Each open layer has a history entry on
 * the same URL, marked with its depth in history.state: nothing goes in the URL.
 */
type Layer = { close: () => void };

const layers: Layer[] = [];
let syncing = false;
let listening = false;

const depth = (): number => window.history.state?.sbLayer ?? 0;

// Brings history in line with what's open, a tick later, so a sheet that closes
// as another opens (View, then Edit) hands its entry over instead of going back.
// A Forward into an entry nothing holds any more is undone the same way.
function sync() {
	if (syncing) return;
	syncing = true;
	setTimeout(() => {
		syncing = false;
		const have = depth();
		for (let d = have + 1; d <= layers.length; d++) window.history.pushState({ sbLayer: d }, "");
		if (have > layers.length) window.history.go(layers.length - have);
	});
}

function onPopState() {
	const d = depth();
	while (layers.length > d) layers.pop()?.close();
	sync();
}

/**
 * Registers an open layer; Back calls `close`. `under` puts it beneath every
 * open sheet (the open group), whichever opened first. Returns the call for
 * when it closes in the app instead, which steps history back over its entry.
 */
export function openLayer(close: () => void, under = false): () => void {
	if (!listening) {
		window.addEventListener("popstate", onPopState);
		listening = true;
	}
	const layer = { close };
	if (under) layers.unshift(layer);
	else layers.push(layer);
	sync();
	return () => {
		const i = layers.indexOf(layer);
		if (i < 0) return;
		layers.splice(i, 1);
		sync();
	};
}
