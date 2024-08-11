import Select from 'react-select'

const customStyles = {
	control: styles => ({ ...styles, backgroundColor: 'black' }),
	menu: styles => ({ ...styles, backgroundColor: 'black' }),
	option: (styles, { data, isDisabled, isFocused, isSelected }) => ({ 
		...styles, 
		backgroundColor: isFocused ? 'grey' : 'red'
	}),
};

function ReactSelect(props) {
	return (
		<Select {...props} styles={customStyles}/>
	)
}

export default ReactSelect