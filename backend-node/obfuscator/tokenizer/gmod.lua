local math = math

--[[---------------------------------------------------------
	Name: Inherit( t, base )
	Desc: Copies any missing data from base to t
-----------------------------------------------------------]]
function table.Inherit( t, base )

	for k, v in pairs( base ) do
		if ( t[ k ] == nil ) then t[ k ] = v end
	end

	t[ "BaseClass" ] = base

	return t

end

--[[---------------------------------------------------------
	Name: Copy(t, lookup_table)
	Desc: Taken straight from http://lua-users.org/wiki/PitLibTablestuff
		and modified to the new Lua 5.1 code by me.
		Original function by PeterPradenot 
-----------------------------------------------------------]]
function table.Copy( t, lookup_table )
	if ( t == nil ) then return nil end

	local copy = {}
	setmetatable( copy, debug.getmetatable( t ) )
	for i, v in pairs( t ) do
		if ( not istable( v ) ) then
			copy[ i ] = v
		else
			lookup_table = lookup_table or {}
			lookup_table[ t ] = copy
			if ( lookup_table[ v ] ) then
				copy[ i ] = lookup_table[ v ] -- we already copied this table. reuse the copy.
			else
				copy[ i ] = table.Copy( v, lookup_table ) -- not yet copied. copy it.
			end
		end
	end
	return copy
end

--[[---------------------------------------------------------
	Name: Empty( tab )
	Desc: Empty a table
-----------------------------------------------------------]]
function table.Empty( tab )
	for k, v in pairs( tab ) do
		tab[ k ] = nil
	end
end

--[[---------------------------------------------------------
	Name: IsEmpty( tab )
	Desc: Returns whether a table has iterable items in it, useful for non-sequential tables
-----------------------------------------------------------]]
function table.IsEmpty( tab )
	return next( tab ) == nil
end

--[[---------------------------------------------------------
	Name: CopyFromTo( FROM, TO )
	Desc: Make TO exactly the same as FROM - but still the same table.
-----------------------------------------------------------]]
function table.CopyFromTo( from, to )

	-- Erase values from table TO
	table.Empty( to )

	-- Copy values over
	table.Merge( to, from )

end

--[[---------------------------------------------------------
	Name: Merge
	Desc: xx
-----------------------------------------------------------]]
function table.Merge( dest, source )

	for k, v in pairs( source ) do
		if ( istable( v ) and istable( dest[ k ] ) ) then
			-- don't overwrite one table with another
			-- instead merge them recurisvely
			table.Merge( dest[ k ], v )
		else
			dest[ k ] = v
		end
	end

	return dest

end

--[[---------------------------------------------------------
	Name: HasValue
	Desc: Returns whether the value is in given table
-----------------------------------------------------------]]
function table.HasValue( t, val )
	for k, v in pairs( t ) do
		if ( v == val ) then return true end
	end
	return false
end

--[[---------------------------------------------------------
	Name: table.Add( dest, source )
	Desc: Unlike merge this adds the two tables together and discards keys.
-----------------------------------------------------------]]
function table.Add( dest, source )

	-- At least one of them needs to be a table or this whole thing will fall on its ass
	if ( not istable( source ) ) then return dest end
	if ( not istable( dest ) ) then dest = {} end

	for k, v in pairs( source ) do
		table.insert( dest, v )
	end

	return dest
end

--[[---------------------------------------------------------
	Name: table.SortDesc( table )
	Desc: Like Lua's default sort, but descending
-----------------------------------------------------------]]
function table.SortDesc( t )
	return table.sort( t, function( a, b ) return a > b end )
end

--[[---------------------------------------------------------
	Name: table.SortByKey( table )
	Desc: Returns a table sorted numerically by Key value
-----------------------------------------------------------]]
function table.SortByKey( t, desc )

	local temp = {}

	for key, _ in pairs( t ) do table.insert( temp, key ) end
	if ( desc ) then
		table.sort( temp, function( a, b ) return t[ a ] < t[ b ] end )
	else
		table.sort( temp, function( a, b ) return t[ a ] > t[ b ] end )
	end

	return temp

end

--[[---------------------------------------------------------
	Name: table.Count( table )
	Desc: Returns the number of keys in a table
-----------------------------------------------------------]]
function table.Count( t )
	local i = 0
	for k in pairs( t ) do i = i + 1 end
	return i
end

--[[---------------------------------------------------------
	Name: table.Random( table )
	Desc: Return a random key
-----------------------------------------------------------]]
function table.Random( t )
	local rk = math.random( 1, table.Count( t ) )
	local i = 1
	for k, v in pairs( t ) do
		if ( i == rk ) then return v, k end
		i = i + 1
	end
end

--[[----------------------------------------------------------------------
	Name: table.IsSequential( table )
	Desc: Returns true if the tables
		keys are sequential
-------------------------------------------------------------------------]]
function table.IsSequential( t )
	local i = 1
	for key, value in pairs( t ) do
		if ( t[ i ] == nil ) then return false end
		i = i + 1
	end
	return true
end

--[[---------------------------------------------------------
	Name: table.ToString( table,name,nice )
	Desc: Convert a simple table to a string
		table = the table you want to convert (table)
		name  = the name of the table (string)
		nice  = whether to add line breaks and indents (bool)
-----------------------------------------------------------]]
local function MakeTable( t, nice, indent, done )
	local str = ""
	local done = done or {}
	local indent = indent or 0
	local idt = ""
	if nice then idt = string.rep( "\t", indent ) end
	local nl, tab  = "", ""
	if ( nice ) then nl, tab = "\n", "\t" end

	local sequential = table.IsSequential( t )

	for key, value in pairs( t ) do

		str = str .. idt .. tab .. tab

		if not sequential then
			if ( isnumber( key ) or isbool( key ) ) then
				key = "[" .. tostring( key ) .. "]" .. tab .. "="
			else
				key = tostring( key ) .. tab .. "="
			end
		else
			key = ""
		end

		if ( istable( value ) and not done[ value ] ) then

			if ( IsColor( value ) ) then
				done[ value ] = true
				value = "Color(" .. value.r .. "," .. value.g .. "," .. value.b .. "," .. value.a .. ")"
				str = str .. key .. tab .. value .. "," .. nl
			else
				done[ value ] = true
				str = str .. key .. tab .. '{' .. nl .. MakeTable (value, nice, indent + 1, done)
				str = str .. idt .. tab .. tab ..tab .. tab .."},".. nl
			end

		else

			if ( isstring( value ) ) then
				value = '"' .. tostring( value ) .. '"'
			elseif ( isvector( value ) ) then
				value = "Vector(" .. value.x .. "," .. value.y .. "," .. value.z .. ")"
			elseif ( isangle( value ) ) then
				value = "Angle(" .. value.pitch .. "," .. value.yaw .. "," .. value.roll .. ")"
			else
				value = tostring( value )
			end

			str = str .. key .. tab .. value .. "," .. nl

		end

	end
	return str
end

function table.ToString( t, n, nice )
	local nl, tab  = "", ""
	if ( nice ) then nl, tab = "\n", "\t" end

	local str = ""
	if ( n ) then str = n .. tab .. "=" .. tab end
	return str .. "{" .. nl .. MakeTable( t, nice ) .. "}"
end

--[[---------------------------------------------------------
	Name: table.Sanitise( table )
	Desc: Converts a table containing vectors, angles, bools so it can be converted to and from keyvalues
-----------------------------------------------------------]]
function table.Sanitise( t, done )

	local done = done or {}
	local tbl = {}

	for k, v in pairs ( t ) do

		if ( istable( v ) and not done[ v ] ) then

			done[ v ] = true
			tbl[ k ] = table.Sanitise( v, done )

		else

			if ( isvector( v ) ) then

				local x, y, z = v.x, v.y, v.z
				if y == 0 then y = nil end
				if z == 0 then z = nil end
				tbl[ k ] = { __type = "Vector", x = x, y = y, z = z }

			elseif ( isangle( v ) ) then

				local p, y, r = v.pitch, v.yaw, v.roll
				if p == 0 then p = nil end
				if y == 0 then y = nil end
				if r == 0 then r = nil end
				tbl[ k ] = { __type = "Angle", p = p, y = y, r = r }

			elseif ( isbool( v ) ) then

				tbl[ k ] = { __type = "Bool", tostring( v ) }

			else

				tbl[ k ] = tostring( v )

			end

		end

	end

	return tbl

end

--[[---------------------------------------------------------
	Name: table.DeSanitise( table )
	Desc: Converts a Sanitised table back
-----------------------------------------------------------]]
function table.DeSanitise( t, done )

	local done = done or {}
	local tbl = {}

	for k, v in pairs ( t ) do

		if ( istable( v ) and not done[ v ] ) then

			done[ v ] = true

			if ( v.__type ) then

				if ( v.__type == "Vector" ) then

					tbl[ k ] = Vector( v.x, v.y, v.z )

				elseif ( v.__type == "Angle" ) then

					tbl[ k ] = Angle( v.p, v.y, v.r )

				elseif ( v.__type == "Bool" ) then

					tbl[ k ] = ( v[ 1 ] == "true" )

				end

			else

				tbl[ k ] = table.DeSanitise( v, done )

			end

		else

			tbl[ k ] = v

		end

	end

	return tbl

end

function table.ForceInsert( t, v )

	if ( t == nil ) then t = {} end

	table.insert( t, v )

	return t

end

--[[---------------------------------------------------------
	Name: table.SortByMember( table )
	Desc: Sorts table by named member
-----------------------------------------------------------]]
function table.SortByMember( Table, MemberName, bAsc )

	local TableMemberSort = function( a, b, MemberName, bReverse )

		--
		-- All this error checking kind of sucks, but really is needed
		--
		if ( not istable( a ) ) then return not bReverse end
		if ( not istable( b ) ) then return bReverse end
		if ( not a[ MemberName ] ) then return not bReverse end
		if ( not b[ MemberName ] ) then return bReverse end

		if ( isstring( a[ MemberName ] ) ) then

			if ( bReverse ) then
				return a[ MemberName ]:lower() < b[ MemberName ]:lower()
			else
				return a[ MemberName ]:lower() > b[ MemberName ]:lower()
			end

		end

		if ( bReverse ) then
			return a[ MemberName ] < b[ MemberName ]
		else
			return a[ MemberName ] > b[ MemberName ]
		end

	end

	table.sort( Table, function( a, b ) return TableMemberSort( a, b, MemberName, bAsc or false ) end )

end

--[[---------------------------------------------------------
	Name: table.LowerKeyNames( table )
	Desc: Lowercase the keynames of all tables
-----------------------------------------------------------]]
function table.LowerKeyNames( Table )

	local OutTable = {}

	for k, v in pairs( Table ) do

		-- Recurse
		if ( istable( v ) ) then
			v = table.LowerKeyNames( v )
		end

		OutTable[ k ] = v

		if ( isstring( k ) ) then

			OutTable[ k ]  = nil
			OutTable[ string.lower( k ) ] = v

		end

	end

	return OutTable

end

--[[---------------------------------------------------------
	Name: table.LowerKeyNames( table )
	Desc: Lowercase the keynames of all tables
-----------------------------------------------------------]]
function table.CollapseKeyValue( Table )

	local OutTable = {}

	for k, v in pairs( Table ) do

		local Val = v.Value

		if ( istable( Val ) ) then
			Val = table.CollapseKeyValue( Val )
		end

		OutTable[ v.Key ] = Val

	end

	return OutTable

end

--[[---------------------------------------------------------
	Name: table.ClearKeys( table, bSaveKey )
	Desc: Clears the keys, converting to a numbered format
-----------------------------------------------------------]]
function table.ClearKeys( Table, bSaveKey )

	local OutTable = {}

	for k, v in pairs( Table ) do
		if ( bSaveKey ) then
			v.__key = k
		end
		table.insert( OutTable, v )
	end

	return OutTable

end

local function keyValuePairs( state )

	state.Index = state.Index + 1

	local keyValue = state.KeyValues[ state.Index ]
	if ( not keyValue ) then return end

	return keyValue.key, keyValue.val

end

local function toKeyValues( tbl )

	local result = {}

	for k,v in pairs( tbl ) do
		table.insert( result, { key = k, val = v } )
	end

	return result

end

--[[---------------------------------------------------------
	A Pairs function
		Sorted by TABLE KEY
-----------------------------------------------------------]]
function SortedPairs( pTable, Desc )

	local sortedTbl = toKeyValues( pTable )

	if ( Desc ) then
		table.sort( sortedTbl, function( a, b ) return a.key > b.key end )
	else
		table.sort( sortedTbl, function( a, b ) return a.key < b.key end )
	end

	return keyValuePairs, { Index = 0, KeyValues = sortedTbl }

end

--[[---------------------------------------------------------
	A Pairs function
		Sorted by VALUE
-----------------------------------------------------------]]
function SortedPairsByValue( pTable, Desc )

	local sortedTbl = toKeyValues( pTable )

	if ( Desc ) then
		table.sort( sortedTbl, function( a, b ) return a.val > b.val end )
	else
		table.sort( sortedTbl, function( a, b ) return a.val < b.val end )
	end

	return keyValuePairs, { Index = 0, KeyValues = sortedTbl }

end

--[[---------------------------------------------------------
	A Pairs function
		Sorted by Member Value (All table entries must be a tablenot )
-----------------------------------------------------------]]
function SortedPairsByMemberValue( pTable, pValueName, Desc )

	local sortedTbl = toKeyValues( pTable )

	for k,v in pairs( sortedTbl ) do
		v.member = v.val[ pValueName ]
	end

	table.SortByMember( sortedTbl, "member", not Desc )

	return keyValuePairs, { Index = 0, KeyValues = sortedTbl }

end

--[[---------------------------------------------------------
	A Pairs function
-----------------------------------------------------------]]
function RandomPairs( pTable, Desc )

	local sortedTbl = toKeyValues( pTable )

	for k,v in pairs( sortedTbl ) do
		v.rand = math.random( 1, 1000000 )
	end

	-- descending/ascending for a random order, really?
	if ( Desc ) then
		table.sort( sortedTbl, function(a,b) return a.rand > b.rand end )
	else
		table.sort( sortedTbl, function(a,b) return a.rand < b.rand end )
	end

	return keyValuePairs, { Index = 0, KeyValues = sortedTbl }

end

--[[---------------------------------------------------------
	GetFirstKey
-----------------------------------------------------------]]
function table.GetFirstKey( t )
	local k, v = next( t )
	return k
end

function table.GetFirstValue( t )
	local k, v = next( t )
	return v
end

function table.GetLastKey( t )
	local k, v = next( t, table.Count( t ) - 1 )
	return k
end

function table.GetLastValue( t )
	local k, v = next( t, table.Count( t ) - 1 )
	return v
end

function table.FindNext( tab, val )
	local bfound = false
	for k, v in pairs( tab ) do
		if ( bfound ) then return v end
		if ( val == v ) then bfound = true end
	end

	return table.GetFirstValue( tab )
end

function table.FindPrev( tab, val )

	local last = table.GetLastValue( tab )
	for k, v in pairs( tab ) do
		if ( val == v ) then return last end
		last = v
	end

	return last

end

function table.GetWinningKey( tab )

	local highest = -math.huge
	local winner = nil

	for k, v in pairs( tab ) do
		if ( v > highest ) then
			winner = k
			highest = v
		end
	end

	return winner

end

function table.KeyFromValue( tbl, val )
	for key, value in pairs( tbl ) do
		if ( value == val ) then return key end
	end
end

function table.RemoveByValue( tbl, val )

	local key = table.KeyFromValue( tbl, val )
	if ( not key ) then return false end

	table.remove( tbl, key )
	return key

end

function table.KeysFromValue( tbl, val )
	local res = {}
	for key, value in pairs( tbl ) do
		if ( value == val ) then res[ #res + 1 ] = key end
	end
	return res
end

function table.Reverse( tbl )

	local len = #tbl
	local ret = {}

	for i = len, 1, -1 do
		ret[ len - i + 1 ] = tbl[ i ]
	end

	return ret

end

function table.ForEach( tab, funcname )

	for k, v in pairs( tab ) do
		funcname( k, v )
	end

end

function table.GetKeys( tab )

	local keys = {}
	local id = 1

	for k, v in pairs( tab ) do
		keys[ id ] = k
		id = id + 1
	end

	return keys

end

--[[---------------------------------------------------------
	Name: string.ToTable( string )
-----------------------------------------------------------]]
function string.ToTable( str )
	local tbl = {}

	for i = 1, string.len( str ) do
		tbl[i] = string.sub( str, i, i )
	end

	return tbl
end

--[[---------------------------------------------------------
	Name: string.JavascriptSafe( string )
	Desc: Takes a string and escapes it for insertion in to a JavaScript string
-----------------------------------------------------------]]
local javascript_escape_replacements = {
	["\\"] = "\\\\",
	["\0"] = "\\x00" ,
	["\b"] = "\\b" ,
	["\t"] = "\\t" ,
	["\n"] = "\\n" ,
	["\v"] = "\\v" ,
	["\f"] = "\\f" ,
	["\r"] = "\\r" ,
	["\""] = "\\\"",
	["\'"] = "\\\'"
}

function string.JavascriptSafe( str )

	str = str:gsub( ".", javascript_escape_replacements )

	-- U+2028 and U+2029 are treated as line separators in JavaScript, handle separately as they aren't single-byte
	str = str:gsub( "\226\128\168", "\\\226\128\168" )
	str = str:gsub( "\226\128\169", "\\\226\128\169" )

	return str

end

--[[---------------------------------------------------------
	Name: string.PatternSafe( string )
	Desc: Takes a string and escapes it for insertion in to a Lua pattern
-----------------------------------------------------------]]
local pattern_escape_replacements = {
	["("] = "%(",
	[")"] = "%)",
	["."] = "%.",
	["%"] = "%%",
	["+"] = "%+",
	["-"] = "%-",
	["*"] = "%*",
	["?"] = "%?",
	["["] = "%[",
	["]"] = "%]",
	["^"] = "%^",
	["$"] = "%$",
	["\0"] = "%z"
}

function string.PatternSafe( str )
	return ( str:gsub( ".", pattern_escape_replacements ) )
end

--[[---------------------------------------------------------
	Name: explode(seperator ,string)
	Desc: Takes a string and turns it into a table
	Usage: string.explode( " ", "Seperate this string")
-----------------------------------------------------------]]
local totable = string.ToTable
local string_sub = string.sub
local string_find = string.find
local string_len = string.len
function string.Explode(separator, str, withpattern)
	if ( separator == "" ) then return totable( str ) end
	if ( withpattern == nil ) then withpattern = false end

	local ret = {}
	local current_pos = 1

	for i = 1, string_len( str ) do
		local start_pos, end_pos = string_find( str, separator, current_pos, not withpattern )
		if ( not start_pos ) then break end
		ret[ i ] = string_sub( str, current_pos, start_pos - 1 )
		current_pos = end_pos + 1
	end

	ret[ #ret + 1 ] = string_sub( str, current_pos )

	return ret
end

function string.Split( str, delimiter )
	return string.Explode( delimiter, str )
end

--[[---------------------------------------------------------
	Name: Implode( seperator, Table)
	Desc: Takes a table and turns it into a string
	Usage: string.Implode( " ", { "This", "Is", "A", "Table" } )
-----------------------------------------------------------]]
function string.Implode( seperator, Table ) return
	table.concat( Table, seperator )
end

--[[---------------------------------------------------------
	Name: GetExtensionFromFilename( path )
	Desc: Returns extension from path
	Usage: string.GetExtensionFromFilename("garrysmod/lua/modules/string.lua")
-----------------------------------------------------------]]
function string.GetExtensionFromFilename( path )
	return path:match( "%.([^%.]+)$" )
end

--[[---------------------------------------------------------
	Name: StripExtension( path )
-----------------------------------------------------------]]
function string.StripExtension( path )
	local i = path:match( ".+()%.%w+$" )
	if ( i ) then return path:sub( 1, i - 1 ) end
	return path
end

--[[---------------------------------------------------------
	Name: GetPathFromFilename( path )
	Desc: Returns path from filepath
	Usage: string.GetPathFromFilename("garrysmod/lua/modules/string.lua")
-----------------------------------------------------------]]
function string.GetPathFromFilename( path )
	return path:match( "^(.*[/\\])[^/\\]-$" ) or ""
end

--[[---------------------------------------------------------
	Name: GetFileFromFilename( path )
	Desc: Returns file with extension from path
	Usage: string.GetFileFromFilename("garrysmod/lua/modules/string.lua")
-----------------------------------------------------------]]
function string.GetFileFromFilename( path )
	if ( not path:find( "\\" ) and not path:find( "/" ) ) then return path end 
	return path:match( "[\\/]([^/\\]+)$" ) or ""
end

--[[-----------------------------------------------------------------
	Name: FormattedTime( TimeInSeconds, Format )
	Desc: Given a time in seconds, returns formatted time
			If 'Format' is not specified the function returns a table
			conatining values for hours, mins, secs, ms
	Examples: string.FormattedTime( 123.456, "%02i:%02i:%02i")	==> "02:03:45"
			  string.FormattedTime( 123.456, "%02i:%02i")		==> "02:03"
			  string.FormattedTime( 123.456, "%2i:%02i")		==> " 2:03"
			  string.FormattedTime( 123.456 )					==> { h = 0, m = 2, s = 3, ms = 45 }
-------------------------------------------------------------------]]
function string.FormattedTime( seconds, format )
	if ( not seconds ) then seconds = 0 end
	local hours = math.floor( seconds / 3600 )
	local minutes = math.floor( ( seconds / 60 ) % 60 )
	local millisecs = ( seconds - math.floor( seconds ) ) * 100
	seconds = math.floor( seconds % 60 )

	if ( format ) then
		return string.format( format, minutes, seconds, millisecs )
	else
		return { h = hours, m = minutes, s = seconds, ms = millisecs }
	end
end

--[[---------------------------------------------------------
	Name: Old time functions
-----------------------------------------------------------]]
function string.ToMinutesSecondsMilliseconds( TimeInSeconds ) return string.FormattedTime( TimeInSeconds, "%02i:%02i:%02i" ) end
function string.ToMinutesSeconds( TimeInSeconds ) return string.FormattedTime( TimeInSeconds, "%02i:%02i" ) end

local function pluralizeString( str, quantity )
	return str .. ( ( quantity ~= 1 ) and "s" or "" )
end

function string.NiceTime( seconds )

	if ( seconds == nil ) then return "a few seconds" end

	if ( seconds < 60 ) then
		local t = math.floor( seconds )
		return t .. pluralizeString( " second", t )
	end

	if ( seconds < 60 * 60 ) then
		local t = math.floor( seconds / 60 )
		return t .. pluralizeString( " minute", t )
	end

	if ( seconds < 60 * 60 * 24 ) then
		local t = math.floor( seconds / (60 * 60) )
		return t .. pluralizeString( " hour", t )
	end

	if ( seconds < 60 * 60 * 24 * 7 ) then
		local t = math.floor( seconds / ( 60 * 60 * 24 ) )
		return t .. pluralizeString( " day", t )
	end

	if ( seconds < 60 * 60 * 24 * 365 ) then
		local t = math.floor( seconds / ( 60 * 60 * 24 * 7 ) )
		return t .. pluralizeString( " week", t )
	end

	local t = math.floor( seconds / ( 60 * 60 * 24 * 365 ) )
	return t .. pluralizeString( " year", t )

end

function string.Left( str, num ) return string.sub( str, 1, num ) end
function string.Right( str, num ) return string.sub( str, -num ) end

function string.Replace( str, tofind, toreplace )
	local tbl = string.Explode( tofind, str )
	if ( tbl[ 1 ] ) then return table.concat( tbl, toreplace ) end
	return str
end

--[[---------------------------------------------------------
	Name: Trim( s )
	Desc: Removes leading and trailing spaces from a string.
			Optionally pass char to trim that character from the ends instead of space
-----------------------------------------------------------]]
function string.Trim( s, char )
	if ( char ) then char = char:PatternSafe() else char = "%s" end
	return string.match( s, "^" .. char .. "*(.-)" .. char .. "*$" ) or s
end

--[[---------------------------------------------------------
	Name: TrimRight( s )
	Desc: Removes trailing spaces from a string.
			Optionally pass char to trim that character from the ends instead of space
-----------------------------------------------------------]]
function string.TrimRight( s, char )
	if ( char ) then char = char:PatternSafe() else char = "%s" end
	return string.match( s, "^(.-)" .. char .. "*$" ) or s
end

--[[---------------------------------------------------------
	Name: TrimLeft( s )
	Desc: Removes leading spaces from a string.
			Optionally pass char to trim that character from the ends instead of space
-----------------------------------------------------------]]
function string.TrimLeft( s, char )
	if ( char ) then char = char:PatternSafe() else char = "%s" end
	return string.match( s, "^" .. char .. "*(.+)$" ) or s
end

function string.NiceSize( size )

	size = tonumber( size )

	if ( size <= 0 ) then return "0" end
	if ( size < 1000 ) then return size .. " Bytes" end
	if ( size < 1000 * 1000 ) then return math.Round( size / 1000, 2 ) .. " KB" end
	if ( size < 1000 * 1000 * 1000 ) then return math.Round( size / ( 1000 * 1000 ), 2 ) .. " MB" end

	return math.Round( size / ( 1000 * 1000 * 1000 ), 2 ) .. " GB"

end

-- Note: These use Lua index numbering, not what you'd expect
-- ie they start from 1, not 0.

function string.SetChar( s, k, v )

	local start = s:sub( 0, k - 1 )
	local send = s:sub( k + 1 )

	return start .. v .. send

end

function string.GetChar( s, k )

	return s:sub( k, k )

end

local meta = getmetatable( "" )

function meta:__index( key )
	local val = string[ key ]
	if ( val ) then
		return val
	elseif ( tonumber( key ) ) then
		return self:sub( key, key )
	else
		error( "attempt to index a string value with bad key ('" .. tostring( key ) .. "' is not part of the string library)", 2 )
	end
end

function string.StartWith( String, Start )

	return string.sub( String, 1, string.len( Start ) ) == Start

end

function string.EndsWith( String, End )

	return End == "" or string.sub( String, -string.len( End ) ) == End

end

function string.FromColor( color )

	return Format( "%i %i %i %i", color.r, color.g, color.b, color.a )

end

function string.ToColor( str )

	local col = Color( 255, 255, 255, 255 )

	local r, g, b, a = str:match( "(%d+) (%d+) (%d+) (%d+)" )

	col.r = tonumber( r ) or 255
	col.g = tonumber( g ) or 255
	col.b = tonumber( b ) or 255
	col.a = tonumber( a ) or 255

	return col

end

function string.Comma( number )

	if ( isnumber( number ) ) then
		number = string.format( "%f", number )
		number = string.match( number, "^(.-)%.?0*$" ) -- Remove trailing zeros
	end

	local k

	while true do
		number, k = string.gsub( number, "^(-?%d+)(%d%d%d)", "%1,%2" )
		if ( k == 0 ) then break end
	end

	return number

end

function PrintTable( t, indent, done )
	local Msg = Msg

	done = done or {}
	indent = indent or 0
	local keys = table.GetKeys( t )

	table.sort( keys, function( a, b )
		if ( isnumber( a ) and isnumber( b ) ) then return a < b end
		return tostring( a ) < tostring( b )
	end )

	done[ t ] = true

	for i = 1, #keys do
		local key = keys[ i ]
		local value = t[ key ]
		Msg( string.rep( "\t", indent ) )

		if  ( istable( value ) and not done[ value ] ) then

			done[ value ] = true
			Msg( key, ":\n" )
			PrintTable ( value, indent + 2, done )
			done[ value ] = nil

		else

			Msg( key, "\t=\t", value, "\n" )

		end

	end

end