const fsp = require('fs').promises
const crypto = require('crypto')

const arguments = process.argv.slice(2);

const file_path_in = arguments[0]

if (!file_path_in) {
	throw new Error('Input file path not specified')
}
console.log("Node arg #1", file_path_in)
const file_path_out = arguments[1]

if (!file_path_out) {
	throw new Error('Output file path not specified')
}
console.log("Node arg #2", file_path_out)
const file_path_obfs = arguments[2]

if (!file_path_obfs) {
	//throw new Error('Obfuscation data file path not specified')
}
console.log("Node arg #3", file_path_obfs)
let varTypes = {
	'e': 'entity',
	's': 'string',
	'r': 'array',
	't': 'table',
	'n': 'number',
	'v': "vector",
	'xv2': "vector2",
	'xv4': "vector4",
	'xwl': "wirelink",
	'xgt': "gtable",

	'ENTITY': 'entity',
	'STRING': 'string',
	'ARRAY': 'array',
	'TABLE': 'table',
	'NUMBER': 'number',
	'VECTOR': "vector",
	'VECTOR2': "vector2",
	'VECTOR4': "vector4",
	'WIRELINK': 'wirelink',
	'GTABLE': 'gtable',

	'NORMAL': 'normal',
}

const comments = [
	() => `#[if ${generateVar(2, 't')} for ${generateVar(2, 't')}/*--${generateVar(2, 't')} ## while ##${generateVar(2, 't')}--/*]#`,
	() => `#[repeat ${generateVar(2, 't')} while ${generateVar(2, 't')}/*--${generateVar(2, 't')} ## for ${generateVar(2, 't')}##--/*]#`	
]

function generateComment() {
	const random = Math.floor(Math.random() * comments.length);
	return comments[random]()
}

function getType(input) {
	if (varTypes[input] == undefined) {
		throw new Error(`varType ${input} does not exist`)
	}

	return varTypes[input]
}

function getRndInteger(min, max) {
	return Math.floor(Math.random() * (max - min)) + min
}

function generateVar(length, prefix = 'TRIXX') {
	let split = getRndInteger(1,prefix.length)
	let pre = prefix.substring(0,split)
	let post = prefix.substring(split)

	return `${pre}${crypto.randomBytes(length).toString('hex')}${post}`
}

const obfuscatedFunctions = {}
function getObfuscatedFunction(name, onlyGenerated = false) {
	if (obfuscatedFunctions.hasOwnProperty(name)) {
		return obfuscatedFunctions[name]
	} else if (onlyGenerated) {
		return name
	}

	obfuscatedFunctions[name] = generateVar(4, 'trixx')
	return obfuscatedFunctions[name]
}

const blacklistedVars = {}
const obfuscatedVars = {}
function getObfuscatedVar(name) {
	if (blacklistedVars[name]) {
		return name
	}

	if (obfuscatedVars[name]) {
		return obfuscatedVars[name]
	}

	obfuscatedVars[name] = generateVar(4)
	return obfuscatedVars[name]
}

let cases = {
	'call': (data) => {
		const functionName = getObfuscatedFunction(data[0],true)

		if (data[1]) {		
			return `${functionName}(${data[1].map(x => recurse(x)).join(',')})`
		}

		return `${functionName}()`
	},
	'literal': (data) => {
		switch (data[1]) {
			case 'n':
				return `${data[0]}`
			case 's':
				return `"${data[0].replace(/"/g,'\\"').replace(/,/g,'{COMMA}')}"`
		}
	},
	'switch': (data) => {
		let cases = data[1].map(x => {
			if (x.length > 1) {
				return `case ${recurse(x[0])},${recurse(x[1])}`
			}

			return `default,${recurse(x[0])}`
		}).join(',')

		return `switch(${recurse(data[0])}){${cases} }`
	},
	'methodcall': (data) => {
		if (data[2]) {
			return `${recurse(data[1])}:${getObfuscatedFunction(data[0],true)}(${data[2].map(x => recurse(x)).join(',')})`
		}

		return `${recurse(data[1])}:${getObfuscatedFunction(data[0],true)}()`
	},
	'stringcall': (data) => {
		if (data[1]) {
			if(data[2]) {
				return `${recurse(data[0])}(${data[1].map(x => recurse(x)).join(',')})[${getType(data[2])}]`
			}

			return `${recurse(data[0])}(${data[1].map(x => recurse(x)).join(',')})`
		}
		
		if(data[2]) {
			return `${recurse(data[0])}()[${getType(data[2])}]`
		}

		return `${recurse(data[0])}()`
	},
	'function': (data) => {
		let functionName = data[0].replace(/(.*?)\(.*?\)/, '$1')
		functionName = getObfuscatedFunction(functionName)
		
		let returnType = 'void'
		if (data[1].length > 0) {
			returnType = getType(data[1])
		}

		let args = data[3]
		let executedOnType
		if (data[2].length > 0) {
			executedOnType = getType(data[2])

			args = args.filter(x => x[0] != "This")
		}

		let processedArgs = args.map(x => `${getObfuscatedVar(x[0])}:${getType(x[1])}`).join(',')

		if (executedOnType) {
			return `function ${returnType} ${executedOnType}:${functionName}(${processedArgs}){local ${getObfuscatedVar('This')}=This,${recurse(data[4])}}`
		}

		return `function ${returnType} ${functionName}(${processedArgs}){${recurse(data[4])}}`
	},
	'return': (data) => {
		if (data[0]) {
			return `return ${recurse(data[0])}`
		}

		return `return`
	},
	'if': (data) => {
		if (data[2].length > 1) {
			return `if(${recurse(data[0])}){${recurse(data[1])}}else{${recurse(data[2])}}`
		}

		return `if(${recurse(data[0])}){${recurse(data[1])}}`
	},

	'fea': (data) => {
		if(data.length == 6) {
			return `foreach(${getObfuscatedVar(data[0])}:${getType(data[1])},${getObfuscatedVar(data[2])}:${getType(data[3])}=${recurse(data[4])}){${recurse(data[5])}}`
		}

		return `foreach(${getObfuscatedVar(data[0])},${getObfuscatedVar(data[1])}:${getType(data[2])}=${recurse(data[3])}){${recurse(data[4])}}`
	},
	'set': (data) => `${recurse(data[0])}[${recurse(data[1])},${getType(data[3])}] = ${recurse(data[2])}`,
	'get': (data) => `${recurse(data[0])}[${recurse(data[1])},${getType(data[2])}]`,
	'cnd': (data) => `(${recurse(data[0])}?${recurse(data[1])} :${recurse(data[2])})`,
	'seq': (data) => data.map(x => recurse(x)).join(','),
	'var': (data) => `${getObfuscatedVar(data[0])}`,
	
	'for': (data) => `for(${getObfuscatedVar(data[0])}=${recurse(data[1])},${recurse(data[2])}){${recurse(data[3])}}`,
	'whl': (data) => `while(${recurse(data[0])}){${recurse(data[1])}}`,
	'brk': (data) => `break`,
	'cnt': (data) => `continue`,
	'kvtable': (data) => `table(${data[0].map(x => `${recurse(x[0])}=${recurse(x[1])}`).join(',')})`,

	'ass': (data) => `${getObfuscatedVar(data[0])}=${recurse(data[1])}`,
	'assl': (data) => `local ${getObfuscatedVar(data[0])}=${recurse(data[1])}`,

	'add': (data) => `(${recurse(data[0])}+${recurse(data[1])})`,
	'sub': (data) => `(${recurse(data[0])}-${recurse(data[1])})`,
	'mul': (data) => `(${recurse(data[0])}*${recurse(data[1])})`,
	'div': (data) => `(${recurse(data[0])}/${recurse(data[1])})`,
	'mod': (data) => `(${recurse(data[0])}%${recurse(data[1])})`,
	'exp': (data) => `(${recurse(data[0])}^${recurse(data[1])})`,
	
	'aadd': (data) => `${recurse(data[0])}+=${recurse(data[1])}`,
	'asub': (data) => `${recurse(data[0])}-=${recurse(data[1])}`,
	'amul': (data) => `${recurse(data[0])}*=${recurse(data[1])}`,
	'adiv': (data) => `${recurse(data[0])}/=${recurse(data[1])}`,

	'eq': (data) => `${recurse(data[0])}==${recurse(data[1])}`,
	'neq': (data) => `${recurse(data[0])}!=${recurse(data[1])}`,
	'lth': (data) => `${recurse(data[0])}<${recurse(data[1])}`,
	'geq': (data) => `${recurse(data[0])}>=${recurse(data[1])}`,
	'leq': (data) => `${recurse(data[0])}<=${recurse(data[1])}`,
	'gth': (data) => `${recurse(data[0])}>${recurse(data[1])}`,

	'band': (data) => `${recurse(data[0])}&&${recurse(data[1])}`,
	'bor': (data) => `${recurse(data[0])}||${recurse(data[1])}`,
	'bxor': (data) => `${recurse(data[0])}^^${recurse(data[1])}`,
	'bshr': (data) => `${recurse(data[0])}>>${recurse(data[1])}`,
	'bshl': (data) => `${recurse(data[0])}<<${recurse(data[1])}`,

	'and': (data) => `(${recurse(data[0])}&${recurse(data[1])})`,
	'or': (data) => `(${recurse(data[0])}|${recurse(data[1])})`,

	'def': (data) => `(${recurse(data[0])}?:${recurse(data[1])})`,

	'inc': (data) => `${getObfuscatedVar(data[0])}++`,
	'dec': (data) => `${getObfuscatedVar(data[0])}--`,

	'not': (data) => `!${recurse(data[0])}`,
	'neg': (data) => `-${recurse(data[0])}`,

	'dlt': (data) => `$${getObfuscatedVar(data[0])}`,
	'trg': (data) => `~${getObfuscatedVar(data[0])}`,
	'iwc': (data) => `->${getObfuscatedVar(data[0])}`,
	'owc': (data) => `->${getObfuscatedVar(data[0])}`
}

let recurse = (object) => {
	if (typeof object == 'object' && !Array.isArray(object)) {
		throw new Error(`What you doing? Object was not an array.`);
	}

	for(let key in object) {
		let value = object[key]

		if (typeof value == 'object' && !Array.isArray(value)) {
			object.splice(key,1,[])	
		}
	}

	if (object.slice == undefined) {
		throw new Error(`What you doing? Object does not have slice function`);
	}

	let cse = object[0]
	let data = object.slice(1, object.length)

	if (!cases[cse]) {
		throw new Error(`case ${cse} does not exist`);
	}

	//console.log(cse,data)
	return cases[cse](data)
}

async function init() {
	const file = await fsp.readFile(file_path_in)
	const parsed = JSON.parse(file)

	let codeOutput = ''

	let preprocess = parsed[0]
	let preprocessLine = []

	preprocessLine.push(`@name ${preprocess['name']}`)

	if (Object.keys(preprocess['inputs'][2]).length > 0) {
		let inputs = []

		for (const [varName, varType] of Object.entries(preprocess['inputs'][2])) {
			inputs.push(`${varName}:${getType(varType)}`)
			blacklistedVars[varName] = true
		}

		preprocessLine.push(`@inputs ${inputs.join(' ')}`)
	}

	if (Object.keys(preprocess['outputs'][2]).length > 0) {
		let outputs = []

		for (const [varName, varType] of Object.entries(preprocess['outputs'][2])) {
			outputs.push(`${varName}:${getType(varType)}`)
			blacklistedVars[varName] = true
		}

		preprocessLine.push(`@outputs ${outputs.join(' ')}`)
	}

	if (Object.keys(preprocess['persist'][2]).length > 0) {
		let persist = []

		for (const [varName, varType] of Object.entries(preprocess['persist'][2])) {
			persist.push(`${getObfuscatedVar(varName)}:${getType(varType)}`)
		}

		preprocessLine.push(`@persist ${persist.join(' ')}`)
	}

	if (Object.keys(preprocess['trigger'][1]).length > 0) {
		let trigger = []

		for (const [varName] of Object.entries(preprocess['trigger'][1])) {
			trigger.push(`${varName}`)
		}

		preprocessLine.push(`@trigger ${trigger.join(' ')}`)
	}

	codeOutput += preprocessLine.join('\n')

	codeOutput += '\n'

	var code = parsed[1]
	//code.shift()

	codeOutput += recurse(code)
	.replace(/\n/g,'\\n')
	.replace(/break}/g, 'break }')
	.replace(/continue}/g, 'continue }')
	.replace(/,/g, () => {
		if(Math.random() < 0.15) {
			return `,${generateComment()}`
		}

		return ','
	})
	.replace(/\{COMMA\}/g,',')

	fsp.writeFile(file_path_out, codeOutput)
	
	if(file_path_obfs) {
		fsp.writeFile(file_path_obfs, JSON.stringify(obfuscatedVars))
	}
}
init().catch(console.error)