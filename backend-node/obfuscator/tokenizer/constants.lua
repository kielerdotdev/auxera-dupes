wire_expression2_constants = {}

function E2Lib.registerConstant(name, value, literal)
	if name:sub(1, 1) ~= "_" then name = "_" .. name end
	if not value and not literal then value = _G[name] end

	wire_expression2_constants[name] = value 
end

E2Lib.registerConstant( "_FILE_UNKNOWN", 0 )
E2Lib.registerConstant( "_FILE_OK", 1 )
E2Lib.registerConstant( "_FILE_TIMEOUT", 2 )
E2Lib.registerConstant( "_FILE_404", 3 )
E2Lib.registerConstant( "_FILE_TRANSFER_ERROR", 4 )

E2Lib.registerConstant("_PI", math.pi)
E2Lib.registerConstant("_E", math.exp(1))
E2Lib.registerConstant("_PHI", (1+math.sqrt(5))/2)

E2Lib.registerConstant("_HUD_PRINTNOTIFY", 1)
E2Lib.registerConstant("_HUD_PRINTCONSOLE", 2)
E2Lib.registerConstant("_HUD_PRINTTALK", 3)
E2Lib.registerConstant("_HUD_PRINTCENTER", 4)

E2Lib.registerConstant("_TEXFILTER_NONE", 0)
E2Lib.registerConstant("_TEXFILTER_POINT", 1)
E2Lib.registerConstant("_TEXFILTER_LINEAR", 2)
E2Lib.registerConstant("_TEXFILTER_ANISOTROPIC", 3)