import data from '../data/data.json' assert { type: 'json' }
import library from '../data/library.json' assert { type: 'json' }

// localStorage.removeItem('BoxAppData')

if (!localStorage.getItem('BoxAppData'))
	localStorage.setItem('BoxAppData', JSON.stringify(data))

let boxAppData = (!localStorage.getItem('BoxAppData')) ? data : JSON.parse(localStorage.getItem('BoxAppData')),
	parentID = null,
	parentBox = null,
	siblingsArray = null,
	currentID = null,
	currentBox = null,
	currentDOM = null,
	currentBoxStyles = null,
	breadcrumb = [],
	history = [],
	clipboard = (!localStorage.getItem('BoxAppDataClipboard')) ? localStorage.getItem('BoxAppDataClipboard') : null,
	modalOpen = false,
	insertBox = null,
	insertIndex = null

/////////////////////////////////
// UTILS
/////////////////////////////////
const px = (val) => Math.round(val)+'px'

const getStyle = (e) => ({
	classes: e.classList,
	style: getComputedStyle(e),
	rect: e.getBoundingClientRect()
})

/////////////////////////////////
// INSPECTOR STUFF
/////////////////////////////////
const inspectors = (currentBox, currentDOM, parentBox, siblingsArray) => ({
	'text': [
		m('.inspector',
			m('.w120',
				m('.label', 'Style'),
				m('.w120',
					m(`button.styleButton[data-style=style2].style2`, { onclick: e => { switchAttribute('style', e.target, '.styleButton', `style$2`) }}, '2')
				),
			),
		),
	],
	'box': [
		m('.inspector',
			m('.w120',
				m('.label', 'Style'),
				m('.w120',
					['1','2','3','4','5','6'].map((item) =>
						m(`button.styleButton[data-style=style${item}].style${item}`, { onclick: e => { switchAttribute('style', e.target, '.styleButton', `style${item}`) }}, item))
				),
			),
		),

		m('.inspectorDivider'),

		m('.inspector',
			m('.w160',
				m('.label', 'Width'),
				m('.w160',
					['auto','fill','pc','px'].map((item) =>
						m(`button.widthButton[data-width=${item}]`, { onclick: e => { switchAttribute('width', e.target, '.widthButton', item) }}, item)),
					(currentBox.width === 'auto' || currentBox.width === 'fill') &&
						m('input[type=text][disabled]'),
					(currentBox.width && (currentBox.width !== 'auto' && currentBox.width !== 'fill')) &&
						m('select.widthValue',
							{
								onchange: e => { selectSizeValue('widthvalue', e.target.options[e.target.selectedIndex].value) }
							},
							currentBox.width === 'px' &&
								[['w100', '100px'],['w150', '150px'],['w200', '200px'],['w250', '250px'],['w300', '300px']].map((el) =>
									m('option', { value: el[0] }, el[1])),
							currentBox.width === 'pc' &&
								[['w20pc', '20%'],['w25pc', '25%'],['w33pc', '33%'],['w50pc', '50%'],['w66pc', '66%'],['w75pc', '75%'],['w80pc', '80%'],['w100pc', '100%']].map((el) =>
									m('option', { value: el[0] }, el[1])),
						)
				),
			),
		),
		m('.inspector',
			m('.w80',
				m('.label', 'Height'),
				m('.w80',
					['auto','px'].map((item) =>
						m(`button.heightButton[data-height=${item}]`, { onclick: e => { switchAttribute('height', e.target, '.heightButton', item) }}, item)),
					(!currentBox.height || currentBox.height === 'auto') &&
						m('input[type=text][disabled]'),
					(currentBox.height && currentBox.height !== 'auto') &&
						m('select.heightValue',
							{
								onchange: e => { selectSizeValue('heightvalue', e.target.options[e.target.selectedIndex].value) }
							},
							currentBox.height === 'px' &&
								[['h60', '60px'],['h100', '100px'],['h400', '400px']].map((el) =>
									m('option', { value: el[0] }, el[1])),
							currentBox.height === 'pc' &&
								[['h50pc', '50%'],['h100pc', '100%']].map((el) =>
									m('option', { value: el[0] }, el[1])),
						)
				),
			),
		),

		m('.inspectorDivider'),

		m('.inspector',
			m('',
				m('.label', 'Arrange'),
				m('.row.top.left',
					m('button.alignButton.big.d[data-alignment=row]', { onclick: e => { switchAttribute('alignment', e.target, '.alignButton', 'row', 'd') }}, '⟷'),
					m('button.alignButton.big.d.rotate90[data-alignment=column]', { onclick: e => { switchAttribute('alignment', e.target, '.alignButton', 'column', 'd') }}, '⟷'),
					m('button.alignButton.big.d[data-alignment=row wrap]', { onclick: e => { switchAttribute('alignment', e.target, '.alignButton', 'row wrap', 'd') }}, '↩'),
				),
			),
		),
		m('.inspector',
			m('',
				m('.label', 'Align / Fill'),
				m('',
					[['left','||&nbsp;&nbsp;&nbsp;&nbsp;'], ['center','||'], ['right','&nbsp;&nbsp;&nbsp;&nbsp;||'], ['spreadX','|&nbsp;&nbsp;&nbsp;&nbsp;|']].map((item) =>
						m(`button.alignButton.h[data-alignment=${item[0]}]`, { onclick: e => { switchAttribute('alignment', e.target, '.alignButton', item[0], 'h') }}, m.trust(item[1])))
				),
				m('',
					[['top','||&nbsp;&nbsp;&nbsp;&nbsp;'], ['middle','||'], ['bottom','&nbsp;&nbsp;&nbsp;&nbsp;||'], ['spreadY','|&nbsp;&nbsp;&nbsp;&nbsp;|']].map((item) =>
						m(`button.alignButton.v.rotate90[data-alignment=${item[0]}]`, { onclick: e => { switchAttribute('alignment', e.target, '.alignButton', item[0], 'v') }}, m.trust(item[1])))
				),
			),
		),
		m('.inspector',
			m('.w80',
				m('.label', 'Padding'),
				m('',
					['0', '10', '20', '40'].map((item) =>
						m(`button.paddingButton[data-padding=p${item}]`, { onclick: e => { switchAttribute('padding', e.target, '.paddingButton', 'p'+item) }}, item))
				),
			),
		),
		m('.inspector',
			m('.w80',
				m('.label', 'Spacing'),
				m('',
					['0', '10', '20', '40'].map((item) =>
						m(`button.spacingButton[data-spacing=spacing${item}]`, { onclick: e => { switchAttribute('spacing', e.target, '.spacingButton', 'spacing'+item) }}, item))
				),
			),
		),

		m('.inspectorDivider'),

		m('.inspector',
			m('.w40',
				m('.label', 'Select'),
				m('.row.top.left',
					m('button.traverseButton', { onclick: () => { traverse('up') } }, '↑'),
					m('button.traverseButton', { onclick: () => { traverse('down') } }, '↓'),
				),
			),
		),
		m('.inspector',
			m('.w40',
				m('.label', 'Move'),
				m('.row.top.left',
					m('button.traverseButton[title=⌥ ⇧ Tab]', {
						onclick: () => { move(true) },
						class: getStyle(currentDOM.parentNode).style.flexDirection === 'column' ? 'rotate90': '',
					}, '← |'),
					m('button.traverseButton[title=⌥ Tab]', {
						onclick: () => { move() },
						class: (getStyle(currentDOM.parentNode).style.flexDirection === 'column' ? 'rotate90': ''),
					}, '| →'),
				),
			),
		),
		m('.inspector',
			m('.w40',
				m('.label', 'Insert'),
				m('.row.top.left',
					m('button.traverseButton', {
						onclick: () => { openLibrary(parentBox, siblingsArray.indexOf(currentBox)) },
						class: getStyle(currentDOM.parentNode).style.flexDirection === 'column' ? 'rotate90': '',
					}, '+ |'),
					m('button.traverseButton', {
						onclick: () => { openLibrary(parentBox, siblingsArray.indexOf(currentBox)+1) },
						class: (getStyle(currentDOM.parentNode).style.flexDirection === 'column' ? 'rotate90': ''),
					}, '| +'),
				),
			),
		),
	]
})

const switchAttribute = (attr, button, buttonClass, value, direction) => {

	// recordHistory()

	if (attr === 'alignment')
		currentBox[attr][direction] = value
	else
		currentBox[attr] = value

	if (attr === 'width') {
		if (value === 'fill' || value === 'auto')
			currentBox.widthvalue = (value === 'auto') ? 'wa' : 'f1'
		else {
			setTimeout(() => {
				const widthValueSelector = document.querySelector('select.widthValue')
				if(attr === 'width' && widthValueSelector)
					currentBox.widthvalue = widthValueSelector.options[widthValueSelector.selectedIndex].value
				m.redraw()
			}, 5)
		}
	}
	else if (attr === 'height') {
		if (value === 'fill' || value === 'auto')
			currentBox.heightvalue = (value === 'auto') ? 'ha' : 'f1'
		else {
			setTimeout(() => {
				const heightValueSelector = document.querySelector('select.heightValue')
				if (attr === 'height' && heightValueSelector)
					currentBox.heightvalue = heightValueSelector.options[heightValueSelector.selectedIndex].value
				m.redraw()
			}, 5)
		}
	}
	document.querySelectorAll(buttonClass).forEach(el => { el.classList.remove('active') })
	button.classList.add('active')
	save()
}

const selectSizeValue = (property, value) => {
	currentBox[property] = value
	save()
}

const updateButtons = () => {
	document.querySelectorAll('.inspector button').forEach(el => {
		el.classList.remove('active')
		el.removeAttribute('disabled')
		if (el.classList.contains('alignButton')) {
			['h','v','d'].forEach((attr) => {
				if (el.classList.contains(attr) && currentBox.alignment[attr] === el.dataset.alignment)
					el.classList.add('active')
			})
			if ((el.classList.contains('v') || el.classList.contains('h')) && currentBox.alignment.d.search('wrap') !== -1) {
				el.classList.remove('active')
				el.setAttribute('disabled', 'disabled')
			}
		}
		['padding', 'spacing', 'width', 'height', 'style', 'overflow'].forEach((attr) => {
			if (el.classList.contains(attr+'Button') && currentBox[attr] === el.dataset[attr])
				el.classList.add('active')
		})
	})
	if (document.querySelector('select.widthValue'))
		Array.from(document.querySelector('select.widthValue').options).forEach((opt) => {
			if (opt.value === currentBox.widthvalue)
				opt.selected = 'selected'
		})
	if (document.querySelector('select.heightValue'))
		Array.from(document.querySelector('select.heightValue').options).forEach((opt) => {
			if (opt.value === currentBox.heightvalue)
				opt.selected = 'selected'
		})
}






/////////////////////////////////
// MAKE BOXES
/////////////////////////////////
const makeBoxes = (box, parent, useGutter=false) => {

	// THE DATA
	const id = box.id
	const chosen = currentID === id
	const children = (box.children && box.children.length > 0) ? box.children : null
	const content = box.content
	let stuff = []

	if (chosen && parent) {
		currentBox = box
		parentBox = parent
		parentID = parent.id
		siblingsArray = parent.children
			? parent.children
			: null
	}

	const isWrapped = box.alignment.d.search('wrap') !== -1

	const boxClasses = [
		currentID === id ? 'selected' : '',
		Object.values(box.alignment).join(' '),
		box.spacing,
		box.padding,
		box.style,
		box.overflow,
		!useGutter ? box.widthvalue+' '+box.heightvalue : '',
	].join(' ')

	const attrs = {
		oncreate: ({ dom }) => {
			if (chosen)
				currentDOM = dom
		},
		onupdate: ({ dom }) => {
			if (chosen)
				currentDOM = dom
		},
		onmousedown: e => {
			e.stopPropagation()
			chooseBox(id)
			breadcrumb = []
			breadcrumb.push(id)
		},
		id: id,
		class: boxClasses,
	}

	// TERMINUS W/CONTENT
	if (content) {
		stuff.push(
			isWrapped
				? m('.gutter', m.trust(content))
				: m.trust(content)
		)
	}
	// LIST OF CHILDREN
	else if (children) {
		children.map((item) => {
			stuff.push(isWrapped
				? m('.gutter', { class: item.widthvalue+' '+item.heightvalue }, makeBoxes(item, box, true))
				: makeBoxes(item, box)
			)
		})
	}
	// EMPTY BOX
	else if (!children) {
		stuff.push(m('.emptyBox',
			m('.insertButton', {
			onclick: () => {
				openLibrary(box, 0, children)
			}
		}, '+')
		))
	}

	return isWrapped
		? m('.box', attrs, m('.gutterBox', stuff))
		: m('.box', attrs, stuff)
}

const makeHalo = (e) => {
	currentBoxStyles = getStyle(currentDOM)
	m.redraw()
}




/////////////////////////////////
// SELECT BOXES & TRAVERSE STUFF
/////////////////////////////////
const chooseBox = (id) => {
	currentID = id
	findBox(boxAppData, id)
	currentDOM = document.querySelector('#'+currentID)
	makeHalo()
}

const traverse = (dir) => {

	let idx = null

	// UP
	if (dir === 'up' && parentID) {
		chooseBox(parentID)
		if (breadcrumb.indexOf(parentID) === -1)
			breadcrumb.push(parentID)
	}

	// DOWN
	else if (dir === 'down') {
		idx = breadcrumb.indexOf(currentID)-1
		if (idx > -1)
			chooseBox(breadcrumb[idx])
		else {
			if (currentBox.children && currentBox.children.length > 0) {
				const newID = currentBox.children[0].id
				chooseBox(newID)
				breadcrumbClean(newID)
			}
		}
	}

	// PREVIOUS
	else if (dir === 'prev' && siblingsArray.length > 0) {
		const thisIdx = siblingsArray.indexOf(currentBox)
		const newID = (thisIdx - 1 >= 0) ? siblingsArray[thisIdx-1].id : siblingsArray[siblingsArray.length-1].id
		chooseBox(newID)
		breadcrumbClean(newID)
	}

	// NEXT
	else if (dir === 'next' && siblingsArray.length > 0) {
		const thisIdx = siblingsArray.indexOf(currentBox)
		const newID = (thisIdx + 1 <= siblingsArray.length-1) ? siblingsArray[thisIdx+1].id : siblingsArray[0].id
		chooseBox(newID)
		breadcrumbClean(newID)
	}
}

const breadcrumbClean = (id) => {
	breadcrumb = []
	if (id)
		breadcrumb.push(id)
}

const findBox = (box, id) => {
	if(box.id === id)
		currentBox = box
	else if(box.children) {
		box.children.map(child => {
			findBox(child, id)
		})
	}
}





/////////////////////////////////
// EDIT STUFF
/////////////////////////////////
const copy = () => {
	clipboard = JSON.parse(JSON.stringify(currentBox))
	localStorage.setItem('BoxAppDataClipboard', JSON.stringify(clipboard))
}

const cut = () => {
	copy()
	remove()
}

const paste = (before=false) => {

	if (clipboard) {
		const clipCopy = JSON.parse(JSON.stringify(clipboard))
		const oldIndex = siblingsArray.findIndex(child => child.id === currentID)
		const newIndex = before
			? oldIndex
			: oldIndex+1
		const nextID = 'box'+Math.floor(Date.now() / 100)

		cloneBoxes(clipCopy, nextID, 0, 0)
		siblingsArray.splice(newIndex, 0, clipCopy)
		save()

		requestAnimationFrame(() => {
			chooseBox(nextID+'00')
			m.redraw()
		})
	}
}

const remove = () => {

	const maxIndex = siblingsArray.length-1
	const oldIndex = siblingsArray.findIndex(child => child.id === currentID)
	const nextID = siblingsArray.length > 1
		? oldIndex === maxIndex
			? siblingsArray[oldIndex-1].id
			: siblingsArray[oldIndex+1].id
		: parentID

	siblingsArray.splice(oldIndex, 1)
	save()

	requestAnimationFrame(() => {
		chooseBox(nextID)
		m.redraw()
	})
}



let isMoving = false
const move = (before=false) => {
	if(!isMoving) {

		const transitionPosition = (currStyle, newStyle) => {
			const reverse = currStyle < newStyle
			let result = currStyle >= newStyle
				? currStyle - newStyle
				: newStyle - currStyle
			return reverse ? -result: result
		}

		isMoving = true

		clipboard = JSON.parse(JSON.stringify(currentBox))
		const maxIndex = siblingsArray.length - 1
		const oldIndex = siblingsArray.findIndex(child => child.id === currentID)
		const newIndex = before
			? oldIndex - 1 < 0
				? maxIndex
				: oldIndex - 1
			: oldIndex + 1 > maxIndex
				? 0
				: oldIndex + 1
		const nextID = clipboard.id
		const currentStyle = getStyle(currentDOM)

		siblingsArray.splice(oldIndex, 1) // REMOVE
		cloneBoxes(clipboard, null, 0, 0, true) // COPY
		siblingsArray.splice(newIndex, 0, clipboard) // PASTE
		save()

		requestAnimationFrame(() => {

			chooseBox(nextID)

			const newStyle = getStyle(currentDOM)
			currentDOM.style.transform = `translate(${transitionPosition(currentStyle.rect.left, newStyle.rect.left)}px, ${transitionPosition(currentStyle.rect.top, newStyle.rect.top)}px)`

			requestAnimationFrame(() => {
				currentDOM.style.transition = '0.1s'
				currentDOM.style.transform = `translate(0, 0)`
				setTimeout(() => {
					currentDOM.style = ''
					m.redraw()
					isMoving = false
				}, 100)
			})
		})
	}
}

const cloneBoxes = (box, newID, denom, idx, noNewIDs) => {

	box.id = noNewIDs ? box.id: `${newID}${denom}${idx}` // CHANGE THIS CLIPBOARD ITEM'S ID
	idx++

	if (box.children)
		box.children.map((child, i) => {
			denom = idx % 2
				? ((i+1) + 9).toString(36) // USE LETTERS BASED ON LOOP INDEX
				: idx === 0 ? i+1 : denom // MAKE DENOM OR USE ORIGINAL DENOM
			cloneBoxes(child, `${newID}${denom}`, i+1, idx, noNewIDs)
		})
}

const recordHistory = () => {
	history.unshift(currentBox.style)
	if (history.length > 6)
		history.pop()
}

const undo = () => {
	if (history.length) {
		console.log('NOW: '+history[0])
		history.shift()
	}
}


/////////////////////////////////
// LIBRARY THINGS N' STUFF!!!
/////////////////////////////////
const toggleModal = () => {
	modalOpen = !modalOpen
}

const openLibrary = (box, idx) => {
	insertBox = box
	insertIndex = idx
	toggleModal()
}

const checkout = (item) => {

	const theItem = (item || item === 0)
		? library[item]
		: clipboard

	const clipCopy = JSON.parse(JSON.stringify(theItem))
	const nextID = 'box'+Math.floor(Date.now() / 100)

	if(!insertBox.children)
		insertBox.children = []

	cloneBoxes(clipCopy, nextID, 0, 0)
	insertBox.children.splice(insertIndex, 0, clipCopy)
	save()

	requestAnimationFrame(() => {
		chooseBox(nextID+'00')
		toggleModal()
		m.redraw()
	})
}


/////////////////////////////////
// SAVE EVERYTHING!!!
/////////////////////////////////
const save = (skipHistory=false) => {
	localStorage.setItem('BoxAppData', JSON.stringify(boxAppData))
	m.redraw()
}


/////////////////////////////////////////
// EVENTS!! WE HAVE FUCKING EVENTS!!!!!!!
/////////////////////////////////////////
let keyMap = []

const keyPressed = (key) => keyMap.find(v => v === key)

const handleKeydown = (e) => {

	// ADD TO keyMap TO DETECT STUFF
	if(!keyPressed(e.key))
		keyMap.push(e.key)

	const shift = e.shiftKey
	const alt = keyPressed('Alt')
	const tab = keyPressed('Tab')
	const cmd = e.metaKey

	// TRAVERSE...UP / DOWN / NEXT / PREVIOUS
	if (e.key === 'ArrowUp')
		traverse('up')
	if (e.key === 'ArrowDown')
		traverse('down')
	if(!shift && !alt && tab)
		traverse('next')
	if (shift && !alt && tab)
		traverse('prev')

	// EDIT...COPY / CUT / PASTE / REMOVE / UNDO
	if (cmd && e.key === 'c')
		copy()
	if (cmd && e.key === 'x')
		cut()
	if (cmd && !shift && e.key === 'v')
		paste()
	if (cmd && shift && e.key === 'v')
		paste(true)
	if (e.key === 'Backspace')
		remove()
	if (cmd && e.key === 'z')
		undo()

	// MOVE...FORWARD / BACK
	if(!shift && alt && tab)
		move()
	if (shift && alt && tab)
		move(true)

	e.preventDefault()
	m.redraw()
}

const handleKeyup = (e) => {
	keyMap = keyMap.filter(v => v !== e.key)
}

const handleMousemove = (e) => {
	const margin = 3
	const halo = document.querySelector('#haloButtonBox')

	if (halo) {
		const boxPos = getStyle(currentDOM).rect
		const minX = boxPos.left - margin
		const maxX = (boxPos.left + boxPos.width) + (margin*2)
		const minY = boxPos.top - margin
		const maxY = (boxPos.top + boxPos.height) + (margin*2)
		const x = e.pageX
		const y = e.pageY
		const isHaloHovering = (x >= minX && x < maxX && y >= minY && y < maxY)

		if (isHaloHovering && !halo.classList.contains('hover'))
			halo.classList.add('hover')
		else if (!isHaloHovering && halo.classList.contains('hover'))
			halo.classList.remove('hover')
	}
}












/////////////////////////////////////////
// ...and...
/////////////////////////////////////////
const app = {
	oncreate: () => {
		if (!currentID) {
			chooseBox('topbox')
			m.redraw()
		}
		document.addEventListener('keydown', handleKeydown)
		document.addEventListener('keyup', handleKeyup)
		window.addEventListener('resize', makeHalo)
		window.addEventListener('mousemove', handleMousemove)
		updateButtons()
	},
	onremove: () => {
		document.removeEventListener('keydown', handleKeydown)
		document.removeEventListener('keyup', handleKeyup)
		window.removeEventListener('resize', makeHalo)
		window.removeEventListener('mousemove', handleMousemove)
	},
	onupdate: () => {
		updateButtons()
		makeHalo()
	},

	view:() => [

		/////////////////////////////////
		// THE STAGE
		/////////////////////////////////
		m('#stage',

			// STAGE CONTENT
			m('#stageScroll',
				{ onscroll: () => { makeHalo() }},
				makeBoxes(boxAppData, boxAppData)
			),

			// OVERLAY
			m('#overlay',
				{ oncreate: () => { makeHalo() }},
				currentBoxStyles && [

					// HALO
					m('#halo',
						{
							style: {
								top: px(currentBoxStyles.rect.top),
								left: px(currentBoxStyles.rect.left),
								width: px(currentBoxStyles.rect.width),
								height: px(currentBoxStyles.rect.height),
							}
						},
					),

					// MOVE FORWARD/BACK BUTTONS
					(currentID !== 'topbox') && m('#haloButtonBox',
						{
							class: getStyle(currentDOM.parentNode).style.flexDirection === 'column'
								? 'vertical'
								: '',
							style: {
								top: getStyle(currentDOM.parentNode).style.flexDirection === 'row' ? px(currentBoxStyles.rect.top + (currentBoxStyles.rect.height/2)) : px(currentBoxStyles.rect.top),
								left: getStyle(currentDOM.parentNode).style.flexDirection === 'row' ? px(currentBoxStyles.rect.left) : px(currentBoxStyles.rect.left + (currentBoxStyles.rect.width/2)),
								width: getStyle(currentDOM.parentNode).style.flexDirection === 'row' ? px(currentBoxStyles.rect.width) : 0,
								height: getStyle(currentDOM.parentNode).style.flexDirection === 'row' ? 0 : px(currentBoxStyles.rect.height),
							}
						},
						m('.buttons.before',
							m('.insertButton', { onclick: () => { openLibrary(parentBox, siblingsArray.indexOf(currentBox)) }}, '+'),
							m('.directionIndicator', '▸'),
						),
						m('.buttons.after',
							m('.insertButton', { onclick: () => { openLibrary(parentBox, siblingsArray.indexOf(currentBox)+1) }}, '+'),
							m('.directionIndicator', '▸'),
						)
					),
				]
			),

			// MODAL
			modalOpen && m('#modal',
				{ onclick: (e) => { toggleModal() }},

				// MODAL CONTENT BOX
				m('.content',
					{ onclick: (e) => { e.stopPropagation() }},

					// LIBRARY
					m('#library',
						clipboard && m('.libraryButton.pasteButton', { onclick: () => { checkout() }}, '↓'),
						m('.libraryButton', { onclick: () => { checkout(0) }}, '1'),
						m('.libraryButton', { onclick: () => { checkout(1) }}, '2'),
					),
					m('.closeButton', { onclick: () => { toggleModal() }}, 'x')
				)
			)
		),

		/////////////////////////////////
		// THE INSPECTORS
		/////////////////////////////////
		m('#inspectors',
			currentID && inspectors(currentBox, currentDOM, parentBox, siblingsArray)['box']
		),
	]
}

m.mount(document.body, app)