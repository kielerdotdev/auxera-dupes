
function E2Lib.errorHandler(message)
	if string.match(message, " at line ") then return message end

	print("Internal error - please report to https://github.com/wiremod/wire/issues")
	print(message)
	return "Internal error, see console for more details"
end

E2Lib.optable_inv = {
	add = "+",
	sub = "-",
	mul = "*",
	div = "/",
	mod = "%",
	exp = "^",
	ass = "=",
	aadd = "+=",
	asub = "-=",
	amul = "*=",
	adiv = "/=",
	inc = "++",
	dec = "--",
	eq = "==",
	neq = "!=",
	lth = "<",
	geq = ">=",
	leq = "<=",
	gth = ">",
	band = "&&",
	bor = "||",
	bxor = "^^",
	bshr = ">>",
	bshl = "<<",
	["not"] = "!",
	["and"] = "&",
	["or"] = "|",
	qsm = "?",
	col = ":",
	def = "?:",
	com = ",",
	lpa = "(",
	rpa = ")",
	lcb = "{",
	rcb = "}",
	lsb = "[",
	rsb = "]",
	dlt = "$",
	trg = "~",
	imp = "->",
}

E2Lib.optable = {}
for token, op in pairs(E2Lib.optable_inv) do
	local current = E2Lib.optable
	for i = 1, #op do
		local c = op:sub(i, i)
		local nxt = current[c]
		if not nxt then
			nxt = {}
			current[c] = nxt
		end

		if i == #op then
			nxt[1] = token
		else
			if not nxt[2] then
				nxt[2] = {}
			end

			current = nxt[2]
		end
	end
end

local function checkargtype(argn, value, argtype)
	if type(value) ~= argtype then error(string.format("bad argument #%d to 'E2Lib.%s' (%s expected, got %s)", argn, debug.getinfo(2, "n").name, argtype, type(value)), 2) end
end

function E2Lib.limitString(text, length)
	checkargtype(1, text, "string")
	checkargtype(2, length, "number")

	if #text <= length then
		return text
	else
		return string.sub(text, 1, length) .. "..."
	end
end
