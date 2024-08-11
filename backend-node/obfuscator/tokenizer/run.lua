local file_path_in = arg[1]

if not file_path_in then
	error('Input file path not specified')
end
print("Lua arg #1", file_path_in)
local file_path_out = arg[2]

if not file_path_out then
	error('Output file path not specified')
end
print("Lua arg #2", file_path_out)
function isnumber(i)
	return type(i) == 'number'
end

function isstring(i)
	return type(i) == 'string'
end

local function read_file(path)
	local file = io.open(path, "r") -- r read mode and b binary mode
	if not file then return nil end
	local content = file:read "*a" -- *a or *all reads the whole file
	file:close()
	return content
end

local code = read_file(file_path_in)

dofile('gmod.lua')
dofile('preprocessor.lua')
dofile('util.lua')
dofile('constants.lua')
dofile('tokenizer.lua')
dofile('typeregister.lua')
dofile('parser.lua')

local directives, buffer = E2Lib.PreProcessor.Execute(code)

if not buffer then 
	--error("E2Lib.PreProcessor.Execute failed") 

	return 
end

local tokens = E2Lib.Tokenizer.Execute(buffer)

if not tokens then 
	--error("E2Lib.Tokenizer.Execute failed") 

	return 
end

local tree, dvars, files = E2Lib.Parser.Execute(tokens)

if not tree then 
	--error("E2Lib.Parser.Execute failed") 

	return 
end

local cjson = require "cjson"
local function deClutterTree(tbl)
	local newTbl = {}

	for k, v in pairs(tbl) do
		if type(k) ~= "number" then
			if type(k) == "table" then

				table.insert(newTbl,{deClutterTree(k),deClutterTree(v)})
			end
		else
			if type(v) ~= "table" then
				table.insert(newTbl,v)
			else
				--if not table.IsEmpty(v) then
					if not (#v == 2 and type(v[1]) == "number" and type(v[2]) == "number") then
						table.insert(newTbl,deClutterTree(v))
					end	
				--end
			end
		end
	end

	return newTbl
end

local decluttered_tree = deClutterTree(tree)
local jsonout = cjson.encode({
	directives,
	decluttered_tree
})

file = io.open(file_path_out, "w+")
io.output(file)
io.write(jsonout)
io.close(file)