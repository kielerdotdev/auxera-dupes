wire_expression_types = {}
wire_expression_types2 = {}
local function isValidTypeId(id)
	return #id == (string.sub(id, 1, 1) == "x" and 3 or 1)
end

function registerType(name, id, def, ...)
	if not isValidTypeId(id) then
		-- this type ID format is relied on in various places including
		-- E2Lib.splitType, and malformed type IDs cause confusing and subtle
		-- errors. Catch this early and blame the caller.
		error(string.format("malformed type ID '%s' - type IDs must be one " ..
		"character long, or three characters long starting with an x", id), 2)
	end

	wire_expression_types[string.upper(name)] = { id, def, ... }
	wire_expression_types2[id] = { string.upper(name), def, ... }
	-- if not WireLib.DT[string.upper(name)] then
	-- 	WireLib.DT[string.upper(name)] = { Zero = def }
	-- end
end

registerType("wirelink", "a", { 0, 0, 0 },
	function(self, input) return { input.p or input[1], input.y or input[2], input.r or input[3] } end,
	function(self, output) return Angle(output[1], output[2], output[3]) end,
	function(retval)
		if not istable(retval) then error("Return value is not a table, but a "..type(retval).."!",0) end
		if #retval ~= 3 then error("Return value does not have exactly 3 entries!",0) end
	end,
	function(v)
		return not istable(v) or #v ~= 3
	end
)

registerType("angle", "a", { 0, 0, 0 },
	function(self, input) return { input.p or input[1], input.y or input[2], input.r or input[3] } end,
	function(self, output) return Angle(output[1], output[2], output[3]) end,
	function(retval)
		if not istable(retval) then error("Return value is not a table, but a "..type(retval).."!",0) end
		if #retval ~= 3 then error("Return value does not have exactly 3 entries!",0) end
	end,
	function(v)
		return not istable(v) or #v ~= 3
	end
)

registerType("vector2", "xv2", { 0, 0 },
	function(self, input) return { input[1], input[2] } end,
	nil,
	function(retval)
		if not istable(retval) then error("Return value is not a table, but a "..type(retval).."!",0) end
		if #retval ~= 2 then error("Return value does not have exactly 2 entries!",0) end
	end,
	function(v)
		return not istable(v) or #v ~= 2
	end
)

registerType("vector4", "xv4", { 0, 0, 0, 0 },
	function(self, input) return { input[1], input[2], input[3], input[4] } end,
	nil,
	function(retval)
		if not istable(retval) then error("Return value is not a table, but a "..type(retval).."!",0) end
		if #retval ~= 4 then error("Return value does not have exactly 4 entries!",0) end
	end,
	function(v)
		return not istable(v) or #v ~= 4
	end
)

registerType( "gtable", "xgt", {},
	function(self) self.entity:Error("You may not input a gtable.") end,
	function(self) self.entity:Error("You may not output a gtable.") end,
	function(retval)
		if not istable(retval) then error("Return value is not a gtable, but a "..type(retval).."!",0) end
	end,
	function(v)
		return not istable(v)
	end
)

registerType("normal", "n", 0,
	nil,
	nil,
	function(retval)
		if not isnumber(retval) then error("Return value is not a number, but a "..type(retval).."!",0) end
	end,
	function(v)
		return not isnumber(v)
	end
)

registerType("array", "r", {},
	function(self, input)
		local ret = {}
		self.prf = self.prf + #input / 3
		for k,v in pairs(input) do ret[k] = v end
		return ret
	end,
	nil,
	function(retval)
		if not istable(retval) then error("Return value is not a table, but a "..type(retval).."!",0) end
	end,
	function(v)
		return not istable(v)
	end
)

registerType("string", "s", "",
	nil,
	nil,
	function(retval)
		if not isstring(retval) then error("Return value is not a string, but a "..type(retval).."!",0) end
	end,
	function(v)
		return not isstring(v)
	end
)

registerType("vector", "v", { 0, 0, 0 },
	nil,
	function(self, output) return Vector(output[1], output[2], output[3]) end,
	function(retval)
		if isvector(retval) then return end
		if not istable(retval) then error("Return value is neither a Vector nor a table, but a "..type(retval).."!",0) end
		if #retval ~= 3 then error("Return value does not have exactly 3 entries!",0) end
	end,
	function(v)
		return not isvector(v) and (not istable(v) or #v ~= 3)
	end
)

registerType("entity", "e", nil,
	nil,
	function(self,output) return output or NULL end,
	function(retval)
		if IsValid(retval) then return end
		if retval == nil then return end
		if not retval.EntIndex then error("Return value is neither nil nor an Entity, but a "..type(retval).."!",0) end
	end,
	function(v)
		return not isentity(v)
	end
)


registerType("table", "t", nil,
	function(self, input)
		if input.size == 0 then
			return true
		end
		return input
	end,
	nil,
	function(retval)
		if not istable(retval) then error("Return value is not a table, but a "..type(retval).."!", 0) end
	end,
	function(v)
		return not istable(v)
	end
)
