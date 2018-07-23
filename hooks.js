const path = require('path');
const async_hooks = require('async_hooks');
const callsite = require('callsite');

let asyncTree = {}, currAsyncNode = undefined;

class AsyncCallbacks {
	constructor() {
		asyncTree = {};
	}
	init(asyncId) {
		let asyncNode = {
			'frames' : callsite()
		};

		const eid = async_hooks.executionAsyncId();
		if (asyncTree.hasOwnProperty(eid)) {
			asyncNode.parent = asyncTree[eid];
		}

		asyncTree[asyncId] = asyncNode;
	}
	before(asyncId) {
		currAsyncNode = asyncTree[asyncId];
	}
	destroy(asyncId) {
		delete asyncTree[asyncId];
	}
}

let hook = null, options = null;
const prepareStackTrace = Error.prepareStackTrace;

const kStackPrefix = '\n    at ';
const FormatFrame = frame => {
	if (!options.removeNativeCode) {
		return kStackPrefix + frame.toString();
	}

	let filename = frame.getFileName();
	if (typeof filename === 'string' && path.isAbsolute(filename)) {
		return kStackPrefix + frame.toString();
	} else {
		return '';
	}
};

const FormatStackTrace = (error, frames) => {
	let message = error.toString() || '<error>';

	for (let frame of frames) {
		message += FormatFrame(frame);
	}

	for (let asyncNode = currAsyncNode; asyncNode !== undefined; asyncNode = asyncNode.parent) {
		if (Array.isArray(asyncNode.frames)) {
			for (let i = 1; i < asyncNode.frames.length; i += 1) {
				message += FormatFrame(asyncNode.frames[i]);
			}
		}
	}

	return message;
};

exports.enable = opts => {
	options = Object.assign({
		'removeNativeCode' : false
	}, opts);

	hook = async_hooks.createHook(new AsyncCallbacks);
	Error.prepareStackTrace = FormatStackTrace;
	hook.enable();
};

exports.disable = () => {
	if (hook !== null) {
		hook.disable();
	}
	hook = null;
	Error.prepareStackTrace = prepareStackTrace;
};