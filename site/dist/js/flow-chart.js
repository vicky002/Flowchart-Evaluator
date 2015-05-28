/**flow.chart.js - licensed under the MIT license. - Copyright (c) Bruno Roberto Burigo (brunorb8@hotmail.com) - https://github.com/BrunoRB/flow-chart.js - 2014-09-20*/
/**
 * Util Submodule
 */
var flow = (function(flow, doc, jsPlumbUtil) {
	'use strict';

	flow.Util = {};


	var Util = flow.Util,
		mottle = new Mottle();

	Util.count = 1;

	Util.getUniqueID = function(str) {
		str = str.replace(/\s/g, '');
		return str + '-' + (Util.count++);
	};

	Util.isEmptyObject = function(obj) {
		return Object.keys(obj).length === 0;
	};

	/**
	 * @deprecated use trigger instead
	 */
	Util.triggerEvent = function(eventType, element) {
		var event = new Event(eventType, {
			view: window,
			bubbles: true,
			cancelable: true
		});

		return element.dispatchEvent(event);
	};

	Util.trigger = function(eventType, element, extra) {
		mottle.trigger(element, eventType, undefined, extra);
		return this;
	};

	Util.on = function() {
		if (arguments.length === 3) {
			mottle.on(arguments[0], arguments[1], arguments[2]);
		}
		else if (arguments.length === 4) {
			this.elementAddDelegatedEvent(arguments[0], arguments[1], arguments[2], arguments[3]);
			//mottle.on(arguments[0], arguments[1], arguments[2], arguments[3]);
		}
		else {
			console.log('called On method with wrong number of arguments');
		}
		return this;
	};

	Util.extend = function(child, parent) {
		return jsPlumbUtil.extend(child, parent);
	};

	/**
	 * @deprecated use "on" instead
	 */
	Util.elementAddDelegatedEvent = function(element, event, selector, callback) {
		var that = this;

		element.addEventListener(event, function(event) {
			var target = event.target,
				isTrueTarget = true;
			while (!that.elementMatches(target, selector)) {
				if (!target || target.isEqualNode(element)) {
					isTrueTarget = false;
					break;
				}
				target = target.parentNode;
			}

			if (isTrueTarget) {
				callback.call(target, event);
			}
		}, false);
	};

	Util.remove = function(element) {
		mottle.remove(element);
		return this;
	};

	Util.isFunction = function(element) {
		return jsPlumbUtil.isFunction(element);
	};

	 /**
     * Call all functions of a given object (just parameter-less funcs)
     */
    Util.invokeAllFunctions = function(obj) {
        Object.getOwnPropertyNames(obj).forEach(function(propertieName) {
            if (typeof obj[propertieName] === "function") {
                obj[propertieName]();
            }
        });
    };

	Util.elementMatches = function(element, selector) {
		var matches = doc.body.matchesSelector || doc.body.webkitMatchesSelector
			|| doc.body.mozMatchesSelector || doc.body.msMatchesSelector
			|| doc.body.webkitMatchesSelector || doc.body.matchesSelector;
		return element && matches.call(element, selector);
	};

	Util.isNumber = function(el) {
		return !window.isNaN(el);
	};

	Util.clone = function(obj) {
		return jsPlumbUtil.clone(obj);
	};

	return flow;
})(flow || {}, document, jsPlumbUtil);

var flow = (function(flow, jsPlumb) {
	'use strict';

	flow.State = {};

	var State = flow.State,
		_revert = [],
		_undoRevert = [];

	State.cleanState = function() {
		_revert = [];
		_undoRevert = [];
	};

	State.cleanRedoState = function() {
		_undoRevert = [];
	};

	State.pushShapeAlteration = function(shape, extraData) {
		var shapeData = flow.getShapeData(shape);
		shapeData.isNew = extraData === 'created';
		_revert.push(shapeData);
	};

	State.undo = function() {
		var last = _revert.pop();
		if (last !== undefined) {
			var shape = flow.findShapeById(last.id),
				data = null;

			if (shape) {
				data = flow.getShapeData(shape);
			}
			else {
				data = flow.Util.clone(last);
				data.isNew = true;
			}

			_undoRevert.push(data);

			_revertShapeState(last);
		}
	};

	State.redo = function() {
		var last = _undoRevert.pop();
		if (last !== undefined) {
			_revertShapeState(last);
		}
	};

	var _revertShapeState = function(shapeData) {
		var shape = flow.findShapeById(shapeData.id),
			flowchart = null;

		if (shapeData.isNew === true) { // shape created, this undo action is going to delete it
			flowchart = shape.parentNode;
			_revertShapeCreation(shape);
			flowchart.focus(); // focus so we cant continue to revert
		}
		else if (shape !== null) {
			_revertShapeAlteration(shape, shapeData);
			_remakeConnections(shape, shapeData.sourceConnections, shapeData.targetConnections);
		}
		else {
			shape = _revertShapeDeletion(shapeData);
			_remakeConnections(shape, shapeData.sourceConnections, shapeData.targetConnections);
		}
	};

	var _revertShapeCreation = function(shape) {
		if (shape.classList.contains('selected')) { // if this shape is selected right now
			flow.Selection.unselectShapes(); // then unselect before delete
		}
		jsPlumb.detachAllConnections(shape);
		flow.Util.remove(shape);
	};

	var _revertShapeAlteration = function(shape, shapeData) {
		_setShapeProperties(shape, shapeData);
		jsPlumb.repaint(shape);
	};

	var _revertShapeDeletion = function(shapeData) {
		var shape = flow.getShapeCloneByType(shapeData.type),
			flowchart = flow.getCurrentDiagram();

		flowchart.appendChild(shape);

		_setShapeProperties(shape, shapeData);

		flow.makeShapeDraggable(shape, shapeData);

		return shape;
	};

	var _remakeConnections = function(shape, sourceConnections, targetConnections) {
		var flowchart = shape.parentNode;

		// detach connections
		var currentSourceConns = jsPlumb.getConnections({source: shape});
		for (var i=currentSourceConns.length; i--; ) {
			var conn = currentSourceConns[i],
				connFlowId = conn.source.getAttribute('data-flow-id');
			if (!(connFlowId in sourceConnections)) {
				jsPlumb.detach(conn);
			}
		}
		// end detach

		// remake connections
		for (var id in sourceConnections) {
			var label = sourceConnections[id].label,
				source = flowchart.querySelector('div.shape[data-flow-shape-id="' + id + '"]'),
				connExists = jsPlumb.getConnections({source: source, target: shape}).length > 0;
			if (!connExists) {
				jsPlumb.connect({source: source, target: shape, label: label});
			}
		}

		for (var id in targetConnections) {
			var label = targetConnections[id].label,
				target = flowchart.querySelector('div.shape[data-flow-shape-id="' + id + '"]');
				connExists = jsPlumb.getConnections({source: shape, target: target}).length > 0;
			if (!connExists) {
				jsPlumb.connect({source: shape, target: target, label: label});
			}
		}
		//end remake
	};

	var _setShapeProperties = function(shape, shapeData) {
		if (shapeData.width || shapeData.height) {
			var innerImage = shape.querySelector('.shape.image');
			innerImage.style.width = shapeData.width;
			innerImage.style.height = shapeData.height;
		}

		if (shapeData.code) {
			shape.querySelector('code').textContent = shapeData.code;
		}

		shape.style.top = shapeData.top;
		shape.style.left = shapeData.left;
		shape.setAttribute('data-flow-shape-id', shapeData.id);

		shape.focus();
	};

	return flow;
})(flow || {}, jsPlumb);

var flow = (function(flow, doc) {
	'use strict';

	flow.Cache = {

		setCache: function() {
			var Cache = flow.Cache;

			Cache.shapeMenu = doc.getElementById('shape-menu');

			Cache.diagramContainer = doc.getElementById('right-area');

			Cache.toolbarContainer = doc.getElementById('toolbar-container');

			Cache.tabMenuList = Cache.diagramContainer.querySelector('.flow.tab.list');

			Cache.consoleArea = doc.getElementById('console-area');

			Cache.consoleToggle = Cache.consoleArea.querySelector('.console.toggle.button');

			Cache.consoleExecute = Cache.consoleArea.querySelector('.console.execution.buttons .execute');

			Cache.consoleDebugStart = Cache.consoleArea.querySelector('.console.execution.buttons .debug.start');

			Cache.consoleDebugStop = Cache.consoleArea.querySelector('.console.execution.buttons .debug.stop');

			Cache.consoleDebugNext = Cache.consoleArea.querySelector('.console.execution.buttons .debug.next');

			Cache.consoleExhibition = Cache.consoleArea.querySelector('.console.exhibition');

			Cache.consoleExhibitionClean = Cache.consoleArea.querySelector('.clean');

			Cache.consoleExhibitionContent = Cache.consoleExhibition.querySelector('.content');
		}

	};

	return flow;
})(flow || {}, document);
/**
 * Alerts Submodule
 */
var flow = (function(flow, doc) {
	'use strict';

	flow.Alerts = {};

	var Alerts = flow.Alerts,
		_messageBox = null,
		_timer = null;

	Alerts.showInfoMessage = function(message) {
		_showMessage(message, 'info');
	};

	Alerts.showWarningMessage = function(message) {
		_showMessage(message, 'warning');
	};

	Alerts.showErrorMessage = function(message) {
		_showMessage(message, 'error');
	};

	Alerts.showSuccessMessage = function(message) {
		_showMessage(message, 'success');
	};

	Alerts.confirm = function(message) {
		return window.confirm(message);
	};

	var _showMessage = function(message, type) {
		var fractions = [0, 0.80, 0.82, 0.84, 0.86, 0.88, 0.9];

		window.clearInterval(_timer); // clear previous timers

		if (_messageBox === null || _messageBox.parentNode === null) {
			_messageBox = doc.getElementById('alert-messages');
		}
		_messageBox.setAttribute('data-flow-message-type', type);
		_messageBox.innerHTML = '<span>' + message + '</span>';
		_messageBox.style.opacity = 1;

		_timer = setInterval(function() {
			if (_messageBox.style.opacity > 0) {
				_messageBox.style.opacity = fractions.pop();
			}
			else {
				window.clearTimeout(_timer);
			}
		}, 500);
	};

	return flow;
})(flow || {}, document);

var flow = (function(flow, jsPlumb) {

	flow.setDefaults = function() {
		_setJsPlumbDefaults();

		_uiDefaults();

		_examples();
	};

	var _uiDefaults = function() {
		// diagram height
		var containerStyle = flow.Cache.diagramContainer.style,
			tabMenuHeight = window.getComputedStyle(
				flow.Cache.diagramContainer.querySelector('.flow.tab.menu')
			).getPropertyValue('height'),
			windowHeight = window.innerHeight;

		containerStyle.height = windowHeight - parseInt(tabMenuHeight, 10) + 'px';

		window.onresize = function(event) {
			windowHeight = window.innerHeight;
			containerStyle.height =
				windowHeight - parseInt(tabMenuHeight, 10) + 'px';
		};

		//TODO manual_input and display drawings
		var shapeMenu = flow.Cache.shapeMenu,
			displaySpan = shapeMenu.querySelector('div.shape.display .shape.image'),
			displayNewImg = document.createElement('img'),
			manualInputSpan = shapeMenu.querySelector('div.shape.manual_input .shape.image'),
			manualInputNewImg = document.createElement('img');

		displayNewImg.src = '../src/img/display.gif';
		displayNewImg.className = 'shape image';
		displaySpan.parentNode.replaceChild(displayNewImg, displaySpan);

		manualInputNewImg.src = '../src/img/manual_input.png';
		manualInputNewImg.className = 'shape image';
		manualInputSpan.parentNode.replaceChild(manualInputNewImg, manualInputSpan);
	};

	var _setJsPlumbDefaults = function() {
		var jsPlumbDefaults = jsPlumb.Defaults;

		var endPointStyles = {fillStyle: 'transparent'};
		jsPlumbDefaults.EndpointStyles = [endPointStyles, endPointStyles];

		jsPlumbDefaults.Endpoints = [
			['Rectangle', {cssClass: 'source-anchor', radius: 15}],
			['Rectangle', {radius: 15}]
		];

		jsPlumbDefaults.Anchor = 'Continuous';

		jsPlumbDefaults.Connector = 'Bezier';
		//jsPlumbDefaults.Connector = 'StateMachine';
		//jsPlumbDefaults.Connector = 'Flowchart';
		//jsPlumbDefaults.Connector = 'Straight';

		//jsPlumbDefaults.ConnectionOverlays = [ ['Arrow', {width: 25, length: 25, location: 1}] ];

		jsPlumbDefaults.PaintStyle = {
			gradient: {
				stops: [
					[0, 'midnightblue'], [1, 'black']
				]
			},
			strokeStyle: 'black',
			lineWidth: 1
		};

		jsPlumb.Defaults.ConnectionOverlays = [
			['Arrow', {width: 25, length: 25, location: 1}]
		];

		jsPlumbDefaults.ReattachConnections = true;
	};

	var _examples = function() {
		var examples = JSON.stringify({"diagrams":{"Newdiagram-1-1-1-4-4-4-1-1-2-3-2-1-1-1-1-1-1-1":{"id":"Newdiagram-1-1-1-4-4-4-1-1-2-3-2-1-1-1-1-1-1-1-1","name":"Example 3: decision","shapes":[{"id":"process-8","type":"process","top":"57px","left":"186px","code":"x = 10","sourceConnections":{"begin-2":{"label":null}},"targetConnections":{"decision-3":{"label":null}},"width":null,"height":null},{"id":"end-7","type":"end","top":"227px","left":"1087px","code":"","sourceConnections":{"connector-6":{"label":null}},"targetConnections":{},"width":null,"height":null},{"id":"connector-6","type":"connector","top":"318px","left":"816px","code":"","sourceConnections":{"display-5":{"label":null},"display-4":{"label":null}},"targetConnections":{"end-7":{"label":null}},"width":null,"height":null},{"id":"display-5","type":"display","top":"337px","left":"400px","code":"\"not\"","sourceConnections":{"decision-3":{"label":"<p id='jsPlumb_1_9_jsPlumb_1_11' class='connection label overlay' style='top:;left:;' >false</p>"}},"targetConnections":{"connector-6":{"label":null}},"width":null,"height":null},{"id":"display-4","type":"display","top":"66px","left":"791px","code":"\"x is 10\"","sourceConnections":{"decision-3":{"label":"<p id='jsPlumb_1_9_jsPlumb_1_10' class='connection label overlay' style='top:;left:;' >true</p>"}},"targetConnections":{"connector-6":{"label":null}},"width":null,"height":null},{"id":"decision-3","type":"decision","top":"104px","left":"467px","code":"x == 10","sourceConnections":{"process-8":{"label":null}},"targetConnections":{"display-5":{"label":"<p id='jsPlumb_1_9_jsPlumb_1_11' class='connection label overlay' style='top:;left:;' >false</p>"},"display-4":{"label":"<p id='jsPlumb_1_9_jsPlumb_1_10' class='connection label overlay' style='top:;left:;' >true</p>"}},"width":null,"height":null},{"id":"begin-2","type":"begin","top":"225px","left":"69px","code":"","sourceConnections":{},"targetConnections":{"process-8":{"label":null}},"width":null,"height":null}]},"Newdiagram-36-4-3-2-2":{"id":"Newdiagram-36-4-3-2-2-2","name":"Example 4: While","shapes":[{"id":"process-42","type":"process","top":"846px","left":"1560px","code":"i <- i - 1","sourceConnections":{"display-40":{"label":null}},"targetConnections":{"decision-39":{"label":null}},"width":null,"height":null},{"id":"end-41","type":"end","top":"577px","left":"2165px","code":"","sourceConnections":{"decision-39":{"label":"<p id='jsPlumb_1_200_jsPlumb_1_202' class='connection label overlay' style='top:; left:;' >false</p>"}},"targetConnections":{},"width":null,"height":null},{"id":"display-40","type":"display","top":"846px","left":"1848px","code":"i","sourceConnections":{"decision-39":{"label":"<p id='jsPlumb_1_200_jsPlumb_1_201' class='connection label overlay' style='top:; left:;' >true</p>"}},"targetConnections":{"process-42":{"label":null}},"width":null,"height":null},{"id":"decision-39","type":"decision","top":"579px","left":"1708px","code":"i > 0","sourceConnections":{"process-42":{"label":null},"process-38":{"label":null}},"targetConnections":{"end-41":{"label":"<p id='jsPlumb_1_200_jsPlumb_1_202' class='connection label overlay' style='top:; left:;' >false</p>"},"display-40":{"label":"<p id='jsPlumb_1_200_jsPlumb_1_201' class='connection label overlay' style='top:; left:;' >true</p>"}},"width":null,"height":null},{"id":"process-38","type":"process","top":"576px","left":"1465px","code":"i <- 5","sourceConnections":{"begin-37":{"label":null}},"targetConnections":{"decision-39":{"label":null}},"width":null,"height":null},{"id":"begin-37","type":"begin","top":"572px","left":"1255px","code":"","sourceConnections":{},"targetConnections":{"process-38":{"label":null}},"width":null,"height":null}]},"Newdiagram-43-4-3-3":{"id":"Newdiagram-43-4-3-3-3","name":"Example 5: Do While","shapes":[{"id":"end-49","type":"end","top":"811px","left":"1345px","code":"","sourceConnections":{"decision-48":{"label":"<p id='jsPlumb_1_981_jsPlumb_1_1712' class='connection label overlay' style='top:; left:;' >false</p>"}},"targetConnections":{},"width":null,"height":null},{"id":"decision-48","type":"decision","top":"823px","left":"1832px","code":"i > 0","sourceConnections":{"process-47":{"label":"<p id='jsPlumb_1_878_jsPlumb_1_981' class='connection label overlay' style='top:; left:;' ></p>"}},"targetConnections":{"display-46":{"label":"<p id='jsPlumb_1_981_jsPlumb_1_868' class='connection label overlay' style='top:; left:;' >true</p>"},"end-49":{"label":"<p id='jsPlumb_1_981_jsPlumb_1_1712' class='connection label overlay' style='top:; left:;' >false</p>"}},"width":null,"height":null},{"id":"process-47","type":"process","top":"597px","left":"2211px","code":"i <- i - 1","sourceConnections":{"display-46":{"label":null}},"targetConnections":{"decision-48":{"label":"<p id='jsPlumb_1_878_jsPlumb_1_981' class='connection label overlay' style='top:; left:;' ></p>"}},"width":null,"height":null},{"id":"display-46","type":"display","top":"566px","left":"1809px","code":"i","sourceConnections":{"decision-48":{"label":"<p id='jsPlumb_1_981_jsPlumb_1_868' class='connection label overlay' style='top:; left:;' >true</p>"},"process-45":{"label":null}},"targetConnections":{"process-47":{"label":null}},"width":null,"height":null},{"id":"process-45","type":"process","top":"557px","left":"1498px","code":"i <- 5","sourceConnections":{"begin-44":{"label":null}},"targetConnections":{"display-46":{"label":null}},"width":null,"height":null},{"id":"begin-44","type":"begin","top":"566px","left":"1281px","code":"","sourceConnections":{},"targetConnections":{"process-45":{"label":null}},"width":null,"height":null}]},"Newdiagram-27-2-3-2-2-2-2-2-5-4":{"id":"Newdiagram-27-2-3-2-2-2-2-2-5-4-4","name":"Example 2: User input","shapes":[{"id":"end-31","type":"end","top":"684px","left":"1914px","code":"","sourceConnections":{"display-30":{"label":null}},"targetConnections":{},"width":null,"height":null},{"id":"display-30","type":"display","top":"695px","left":"1701px","code":"someVar","sourceConnections":{"manual_input-29":{"label":null}},"targetConnections":{"end-31":{"label":null}},"width":null,"height":null},{"id":"manual_input-29","type":"manual_input","top":"680px","left":"1419px","code":"someVar","sourceConnections":{"begin-28":{"label":null}},"targetConnections":{"display-30":{"label":null}},"width":null,"height":null},{"id":"begin-28","type":"begin","top":"542px","left":"1293px","code":"","sourceConnections":{},"targetConnections":{"manual_input-29":{"label":null}},"width":null,"height":null}]},"Newdiagram-20-2-1-1-1-3-3-5-4-5":{"id":"Newdiagram-20-2-1-1-1-3-3-5-4-5-5","name":"Example 1: Hello World","shapes":[{"id":"end-26","type":"end","top":"714px","left":"1860px","code":"","sourceConnections":{"display-25":{"label":null}},"targetConnections":{},"width":null,"height":null},{"id":"display-25","type":"display","top":"756px","left":"1467px","code":"x + \"World\"","sourceConnections":{"process-24":{"label":null}},"targetConnections":{"end-26":{"label":null}},"width":null,"height":null},{"id":"process-24","type":"process","top":"597px","left":"1439px","code":"x <- \"Hello \"","sourceConnections":{"begin-23":{"label":null}},"targetConnections":{"display-25":{"label":null}},"width":"126px","height":"48px"},{"id":"begin-23","type":"begin","top":"543px","left":"1189px","code":"","sourceConnections":{},"targetConnections":{"process-24":{"label":null}},"width":null,"height":null}]}},"data":{"count":53}});

		if (localStorage.getItem('flow') === null) {
			localStorage.setItem('flow', examples);
		}

		flow.examples = examples;
	};

	return flow;
})(flow || {}, jsPlumb);

var flow = (function(flow, doc, jsPlumb) {
	'use strict';

	var _userStoredDiagrams = {
		diagrams: {}, // diagrams data
		data: {} // global data
	}; // data structure with all the user diagrams (ecxcept the open one)

	/**
	 * @param {DOM Object} shapeDOM
	 * @returns {Object} the Shape Data (id, classes, top, targetsIds...)
	 */
	flow.getShapeData = function(shapeDOM) {
		var sourceConnections = jsPlumb.getConnections({target: shapeDOM}),
			targetConnections = jsPlumb.getConnections({source: shapeDOM}),
			shapeSourceConnections = {},
			shapeTargetConnections = {},
			shapeImage = shapeDOM.querySelector('.shape.image'),
			shapeCodeDOM = shapeDOM.querySelector('code'),
			shapeText = '';

		//TODO move to method
		for (var i=sourceConnections.length; i--; ) {
			var conn = sourceConnections[i],
				id = conn.source.getAttribute('data-flow-shape-id');
			shapeSourceConnections[id]  = {
				label: conn.getLabel()
			};
		}

		for (var i=targetConnections.length; i--; ) {
			var conn = targetConnections[i],
				// when you move a conn, target is a invalid el so we need t use the .suspendedElement
				target = conn.suspendedElement || conn.target,
				id = target.getAttribute('data-flow-shape-id');

			shapeTargetConnections[id]  = {
				label: conn.getLabel()
			};
		}
		//\\

		shapeText = shapeCodeDOM !== null ? shapeCodeDOM.textContent : shapeDOM.querySelector('input').value;

		return {
			id: shapeDOM.getAttribute('data-flow-shape-id'),
			type: shapeDOM.getAttribute('data-flow-shape-type'),
			top: shapeDOM.style.top,
			left: shapeDOM.style.left,
			code: shapeText,
			sourceConnections: shapeSourceConnections,
			targetConnections: shapeTargetConnections,
			width: shapeImage.style.width || null,
			height: shapeImage.style.height || null
		};
	};

	flow.getDiagramData = function(diagramDOM) {
		var shapesArray = [],
			shapes = diagramDOM.querySelectorAll('div.flow.shape');

		for (var i=shapes.length; i--; ) {
			var shapeData = flow.getShapeData(shapes[i]);
			shapesArray.push(shapeData);
		}

		return {
			id: diagramDOM.id,
			name: diagramDOM.getAttribute('data-flow-name'),
			shapes: shapesArray
		};
	};

	flow.storeDiagramData = function(diagramData) {
		_userStoredDiagrams.diagrams[diagramData.id] = {
			id: diagramData.id,
			name: diagramData.name,
			shapes: diagramData.shapes
		};
	};

	flow.getStoredDiagramData = function(idDiagram) {
		if (idDiagram in _userStoredDiagrams.diagrams) {
			return _userStoredDiagrams.diagrams[idDiagram];
		}
		else {
			throw 'Diagram ' + idDiagram + ' data not found';
		}
	};

	/**
	 * Including current diagram (if exists)
	 */
	flow.getStoredDataFromAllDiagrams = function() {
		var current = flow.getCurrentDiagram();
		if (current !== null) {
			_userStoredDiagrams.diagrams[current.id] = flow.getDiagramData(current); // add currentDiagram data
		}

		_userStoredDiagrams.data.count = flow.Util.count; // last counter is stored in order to prevent id duplication !

		return _userStoredDiagrams;
	};

	flow.cleanStoredDiagramData = function(idDiagram) {
		if (idDiagram in _userStoredDiagrams.diagrams) {
			delete _userStoredDiagrams.diagrams[idDiagram];
		}
		else {
			throw 'Diagram ' + idDiagram + ' data not found';
		}
	};

	flow.cleanAllDiagramsStoredData = function() {
		_userStoredDiagrams = {
			diagrams: {}, // diagrams data
			data: {} // global data
		};
	};

	return flow;

})(flow || {}, document, jsPlumb);
/**
 * Listeners Submodule
 */
var flow = (function(flow, doc, jsPlumb) {
	'use strict';

	flow.Listeners = {};

	var Listeners = flow.Listeners,
		Cache = flow.Cache,
		Util = flow.Util;

	Listeners.setupDiagramEvents = function(diagram) {
		_shapeResizeListeners(diagram);
	};

	var _shapeResizeListeners = function(diagram) {
		// TODO gamb. This HAS to be changed
		Util.on(diagram, 'mouseover', function(event) {
			var target = event.target;
			if (!(target instanceof SVGElement) && target.className.indexOf('resize anchor') !== -1) {
				jsPlumb.setDraggable(target.parentNode, false);
			};
		});
		Util.on(diagram, 'mouseout', function(event) {
			var target = event.target;
			if (!(target instanceof SVGElement) && target.className.indexOf('resize anchor') !== -1) {
				jsPlumb.setDraggable(target.parentNode, true);
			};
		});
		// END gamb

		_shapeResize(diagram);
	};

	var _shapeResize = function(diagram) {
		var mouseDownTarget,
			initiated = false,
			lastX,
			lastY;
		diagram.addEventListener('mousedown', function(event) {
			var target = event.target;
			if (!(target instanceof SVGElement) && target.className.indexOf('resize anchor') !== -1) {
				mouseDownTarget = target;
				diagram.addEventListener('mousemove', _onMouseMove);
			}
		});

		var _onMouseMove = function(event) {
			var layerX = event.screenX,
				layerY = event.screenY;

			if (initiated === true) {
				var diff,
					shape = mouseDownTarget.parentNode,
					img =  mouseDownTarget.parentNode.querySelector('.shape.image'),
					shapeLeftDistance = parseInt(shape.style.left, 10),
					shapeTopDistance = parseInt(shape.style.top, 10);

				if (!img.style.width) {
					img.style.width = window.getComputedStyle(img).getPropertyValue('width');
				}
				if (!img.style.height) {
					img.style.height = window.getComputedStyle(img).getPropertyValue('height');
				}

				var imgWidth = parseInt(img.style.width, 10),
					imgHeight = parseInt(img.style.height, 10),
					targetClassList = mouseDownTarget.classList;

				if (lastX > layerX) {
					diff = lastX - layerX;
					if (targetClassList.contains('left')) {
						shape.style.left = shapeLeftDistance - diff + 'px';
						img.style.width = imgWidth + diff + 'px';
					}
					else {
						img.style.width = imgWidth - diff + 'px';
					}
				}
				else if (lastX < layerX) {
					diff = layerX - lastX;
					if (targetClassList.contains('left')) {
						shape.style.left = shapeLeftDistance + diff + 'px';
						img.style.width = imgWidth - diff + 'px';
					}
					else {
						img.style.width = imgWidth + diff + 'px';
					}
				}

				if (layerY > lastY) {
					diff = layerY - lastY;

					if (targetClassList.contains('bottom')) {
						img.style.height = imgHeight + diff + 'px';
					}
					else {
						shape.style.top = shapeTopDistance + diff + 'px';
						img.style.height = imgHeight - diff + 'px';
					}
				}
				else if (layerY < lastY) {
					diff = lastY - layerY;

					if (targetClassList.contains('bottom')) {
						img.style.height = imgHeight - diff + 'px';
					}
					else {
						shape.style.top = shapeTopDistance - diff + 'px';
						img.style.height = imgHeight + diff + 'px';
					}
				}

				jsPlumb.repaint(mouseDownTarget.parentNode);
			}
			initiated = true;
			lastX = layerX;
			lastY = layerY;
		};

		Util.on(diagram, 'mouseup', function(event) {
			this.removeEventListener('mousemove', _onMouseMove, false);
			initiated = false;
		});
	};

	return flow;
})(flow || {}, document, jsPlumb);

/**
 * Static listeners, called just once
 */
var flow = (function(flow, doc, jsPlumb) {
	'use strict';

	flow.StaticListeners = {};

	var StaticListeners = flow.StaticListeners,
		Cache = flow.Cache,
		Util = flow.Util;

	StaticListeners._createDiagramClick = function() {
		Util.on(Cache.toolbarContainer, 'click', '#create-new-flowchart', function(event) {
			event.preventDefault();

			// target.href comes with domain url
			var diagramName = 'New diagram';

			flow.createDiagram(diagramName);

			flow.appendTabItemToDiagramArea(diagramName);

		});
	};

	StaticListeners._openDiagramsClick = function() {
		var uploadInput = doc.getElementById('temp-upload');

		Util.on(Cache.toolbarContainer, 'click', 'ul.flow.toolbar.list.open.diagram li a', function(event) {
				event.preventDefault();
				var result = flow.Alerts.confirm(
					'This will close all your diagrams WITHOUT saving. Want to proceed?'
				);

				if (result) {
					_routeOpen.call(this);
				}
		});

		uploadInput.addEventListener('change', function(event) {
			var selectedFile = uploadInput.files[0],
				reader = new FileReader();

			reader.onload = function() {
				var text = reader.result;
				flow.openDiagrams(text);
			};

			reader.readAsText(selectedFile);
		}, false);

		var _routeOpen = function() {
			flow.closeAllDiagrams();

			var openAs = this.getAttribute('href'); // this.href comes with domain url

			switch (openAs) {
				case 'json-file':
					Util.trigger('click', uploadInput);
					break;
				case 'local-storage':
					var opened = flow.openLocallyStoredDiagrams();
					if (!opened) {
						flow.Alerts.showErrorMessage('No diagrams found in the browser');
					}
					break;
				case 'examples':
					flow.openDiagrams(flow.examples);
					flow.Alerts.showSuccessMessage('Examples open');
					break;
				default:
					var message = 'Open ' + openAs + ' option doesn\'t exist';
					flow.Alerts.showErrorMessage(message);
					throw message;
			};
		};
	};

	StaticListeners._saveDiagramsClick = function() {
		var selector = 'ul.flow.toolbar.list.save.diagram li a:not(.ignore):not(.click)';
		// TODO: the files or data being saed with te name 'flow', wich generate conflicts between diferent
		// sets of diagrams
		Util.on(Cache.toolbarContainer, 'click', selector, function(event) {
			event.preventDefault();

			var storedDataFromAllDiagrams = flow.getStoredDataFromAllDiagrams(),
				count = 1,
				diagrams = storedDataFromAllDiagrams.diagrams;
			for (var index in diagrams) {
				diagrams[index].id = diagrams[index].id + '-' + count++;
			}

			var saveAs = this.getAttribute('href'), // this.href comes with domain url
				stringifiedDiagramsData = JSON.stringify(storedDataFromAllDiagrams);

			switch (saveAs) {
				case 'json-file':
					// TODO refactor: move to a specific func (where?)
					// TODO maybe improve the code? not sure if create a temp <a> and delete it is the best option
					var parent = this.parentNode,
						str = window.btoa(unescape(encodeURIComponent(stringifiedDiagramsData))),
						jsonHREF = 'data:text/octet-stream;base64,' + str;

					parent.insertAdjacentHTML(
						'beforeEnd',
						'<a id="temp-link" class="ignore click" href="' + jsonHREF + '" download="flow.json"></a>'
					);

					var tempLinkDOM = parent.querySelector('#temp-link');

					tempLinkDOM.click();

					parent.removeChild(tempLinkDOM);

					break;
				case 'local-storage':
					window.localStorage.setItem('flow', stringifiedDiagramsData);
					break;
				default:
					var message = 'Save ' + saveAs + ' option doesn\'t exist';
					flow.Alerts.showErrorMessage(message);
					throw message;
			}

			flow.Alerts.showSuccessMessage('Successfully saved');
		});
	};

	StaticListeners._tabCloseDiagramClick = function() {
		Util.on(Cache.diagramContainer, 'click', '.flow.tab.close', function() {
			if (flow.Alerts.confirm('You really want to delete this flowchart?')) {
				var idTarget = this.getAttribute('data-flow-target'),
					diagram = doc.getElementById(idTarget);
				if (diagram !== null) {
					flow.closeDiagram(diagram);
				}

				flow.cleanStoredDiagramData(idTarget);

				Util.remove(this.parentNode);
			}
		});
	};

	StaticListeners._tabOpenDiagramClick = function() {
		Util.on(Cache.diagramContainer, 'click', 'a.flow.tab.link', function() {
			var idTarget = this.getAttribute('data-flow-target');
			if (doc.getElementById(idTarget) === null) {
				var diagram = flow.getCurrentDiagram();

				if (diagram !== null) {
					flow.closeDiagram(diagram);
				}

				flow.recreateDiagramFromStoredData(idTarget);
			}
		});
	};

	StaticListeners._tabOpenDiagramDoubleClick = function() {
		Util.on(Cache.diagramContainer, 'dblclick', 'a.flow.tab.link', function() {
			var parent = this.parentNode,
				oldName = this.textContent,
				linkClone = this.cloneNode(), // @TODO this may not work on IE (even on 10)
				alreadyTriggered = false, // flag to avoid keyup and blur simultaneous trigger
				newInput = null;

			parent.removeChild(this);

			parent.insertAdjacentHTML(
				'beforeEnd', '<input id="flow-temp-change-name" type="text" value="' + oldName + '" />'
			);
			newInput = parent.querySelector('#flow-temp-change-name');
			newInput.focus();

			newInput.addEventListener('keyup', function(event) {
				if (alreadyTriggered === false && event.keyCode === 13) {
					alreadyTriggered = true;
					_changeDiagramName(newInput, linkClone, oldName);
				}
			});

			newInput.addEventListener('blur', function(event) {
				if (alreadyTriggered === false) {
					alreadyTriggered = true;
					_changeDiagramName(newInput, linkClone, oldName);
				}
			});
		});

		var _changeDiagramName = function(inputField, linkClone, oldName) {
			var newName = inputField.value,
				parent = inputField.parentNode,
				field = null;

			parent.removeChild(inputField);
			field = parent.appendChild(linkClone);

			if (newName.length > 3) {
				field.textContent = newName;

				if (parent.classList.contains('active')) { // parent == .flow.tab.item
					var diagram = flow.getCurrentDiagram();
					diagram.setAttribute('data-flow-name', newName);
					diagram.setAttribute('title', newName);
				}
			}
			else {
				field.textContent = oldName;
				flow.Alerts.showWarningMessage('Diagram names must contain at least 4 characters');
			}

			(function refreshSpan() {
				var span = parent.querySelector('span');
				span.style.display = 'none';
				span.offsetHeight;
				span.style.display = 'block';
			})();
		};
	};

	StaticListeners._consoleToggleButtonClick = function() {
		var interval = null;
		Cache.consoleToggle.addEventListener('click', function(event) {
			var consoleArea = Cache.consoleArea;

			window.clearInterval(interval);

			if (!consoleArea.style.height) {
				consoleArea.style.height = window.getComputedStyle(consoleArea).getPropertyValue('height');
			}

			if (consoleArea.classList.contains('hidden')) {
				interval = setInterval(function() {
					var height = parseInt(consoleArea.style.height, 10);
					if (height > 0) {
						consoleArea.style.height = height - 15 + 'px';
					}
					else {
						window.clearInterval(interval);
					}
				}, 20);
			}
			else {
				interval = setInterval(function() {
					var height = parseInt(consoleArea.style.height, 10);
					if (height < 200) {
						consoleArea.style.height = height + 15 + 'px';
					}
					else {
						window.clearInterval(interval);
					}
				}, 20);
			}

			consoleArea.classList.toggle('hidden');
		});
	};

	StaticListeners._activeFlowchartClick = function() {
		Util.on(Cache.diagramContainer, 'click', '.diagram.active', function(event) {
			flow.UI.unmarkAllShapes();
			if (event.target.classList.contains('diagram')) {
				flow.Selection.unselectElements();
			}
        });
    };

	StaticListeners._activeFlowchartKeyUp = function() {
        var that = this;
        Util.on(Cache.diagramContainer, 'keyup', '.diagram.active', function(event) {
            var flowchart = this,
				targetNodeName = event.target.nodeName.toLowerCase(),
				isDel = event.keyCode === 46;

            if (isDel && targetNodeName !== 'input') { // ignore "del" when in a shape input
                flow.Selection.deleteSelectedItems();
				flowchart.focus(); // after a deletion the flowchart lose it's focus
            }
			else if (event.keyCode === 90 && event.ctrlKey && event.shiftKey) {
                flow.State.redo();
            }
            else if (event.keyCode === 90 && event.ctrlKey) {
				flow.State.undo();
            }

        });
    };

	StaticListeners._shapeClick = function() {
		Util.on(Cache.diagramContainer, 'click', '.diagram.active div.shape', function(event) {
			// the drag event is triggering with a click, but this can change flow.Selection.addSelectedShape(this);
		});
	};

	StaticListeners._shapeDoubleClicked = function() {
		Util.on(Cache.diagramContainer, 'dblclick', '.active.diagram div.shape', function(event) {
            if (this.getAttribute('data-flow-has-user-text') === 'true') {
                flow.UI.openShapeInput(this);
            }
            else {
                flow.Alerts.showErrorMessage('This shape cannnot contain user input');
            }
        });
    };

	StaticListeners._executionButtonsClick = function() {
		Util.on(Cache.consoleExecute, 'click', function(event) {
			flow.ExecutionHandler.triggertExecution();
		});

		Util.on(Cache.consoleDebugStart, 'click', function(event) {
			flow.UI.enableDebugNextButton();
			flow.UI.enableDebugStopButton();
			flow.ExecutionHandler.triggerDebug();
		});

		Util.on(Cache.consoleDebugNext, 'click', function(event) {
			flow.ExecutionHandler.executeNext();
		});

		Util.on(Cache.consoleDebugStop, 'click', function(event) {
			flow.ExecutionHandler.stopDebug();
		});
	};

	StaticListeners._refreshConsoleClick = function() {
		Util.on(Cache.consoleExhibitionClean, 'click', function(event) {
			flow.UI.cleanConsoleContent();
		});
	};

	StaticListeners._shapeAltered = function() {
		var ev = flow.Const.SHAPE_EVENT.ALTERATED;
		Util.on(Cache.diagramContainer, ev, 'div.shape', function(event) {
			var shape = event.target,
				extraData = event.payload;

			flow.State.pushShapeAlteration(shape, extraData);

			flow.State.cleanRedoState();  // after an element change we have a redo invalidation
		});
	};

	(function _beforeDropConnection() {
        jsPlumb.bind('beforeDrop', function(info) {
            var source = doc.getElementById(info.sourceId),
				target = doc.getElementById(info.targetId),
				targetType = target.getAttribute('data-flow-shape-type');

            var reverseConn = jsPlumb.getConnections({source: target, target: source}), // conns provenient from target
				conn = jsPlumb.getConnections({source: source, target: target}); // conns provenient from source

			if (source === target) { // recursive conn, prohibited. TODO this CAN happen on some elements, how to allow?
                flow.Alerts.showWarningMessage('Recursive connections aren\'t allowed');
                return false;
            }
            else if (reverseConn.length > 0 && targetType !== flow.Const.SHAPE_TYPE.DECISION) {
                flow.Alerts.showWarningMessage('Elements already connected');
                return false;
            }
            else if (conn.length > 0) {
                flow.Alerts.showWarningMessage('Duplicate connections aren\'t allowed');
                return false;
            }
            else {
				flow.Util.trigger(flow.Const.SHAPE_EVENT.ALTERATED, source);
                return true;
            }
        });
    })();

    (function _connectionClick() {
        var clickedConnectionStyle = {
            gradient: {stops: [[0, "#D95C5C"], [1, "white"]]}, strokeStyle: "#D95C5C"
        };

        jsPlumb.bind('click', function(connection) {
			var previouslySelected = flow.Selection.getSelectedItem(),
				isAlreadySelected = previouslySelected && previouslySelected.type === 'connection' &&
					(previouslySelected.from === connection.sourceId && previouslySelected.to === connection.targetId);

			if (!isAlreadySelected) {
				connection.setPaintStyle(clickedConnectionStyle);
				flow.Selection.addSelectedConnection(connection.sourceId, connection.targetId);
			}
        });
    })();

	(function _connectionDblClick() {
        jsPlumb.bind('dblclick', function(connection) {
			var connectionType = connection.source.getAttribute('data-flow-connection-type');
            if (connectionType === flow.Const.CONNECTION_TYPE.BOOLEAN) {
                flow.UI.openBooleanConnection(connection);
            }
            else {
                flow.UI.openTextConnection(connection);
            }
        });
    })();

	return flow;
})(flow || {}, document, jsPlumb);

/**
 * Submodule Templates
 */
var flow = (function(flow) {
	'use strict';

	flow.Templates = {};

	var Templates = flow.Templates;

	Templates.getShapeInnerInput = function(text) {
		return '<input type="text" value="' + text + '" />';
	};

	Templates.getShapeInnerCode = function(text) {
		return '<code>' + text + '</code>';
	};

	Templates.getConnectionLabel = function(content) {
		return '<span class="flow connection label">' + content + '</span>';
	};

	Templates.getNewDiagram = function(diagramName, id) {
		if (id === undefined) {
			id = flow.Util.getUniqueID(diagramName);
		}

		return '<div id="' + id + '" class="flow active diagram" title="' + diagramName + '" ' +
			'data-flow-name="' + diagramName + '" tabindex="-1">' +
			'<span class="hidden-anchor" tabindex="-1">Anchor</span>' +
		'</div>';
	};

	Templates.getTabItem = function(idDiagram, diagramName) {
		return '<li class="flow active tab item" data-flow-target="' + idDiagram + '">' +
			'<a class="flow tab link" href="#" data-flow-target="' + idDiagram + '" title="Open this diagram">'
				+ diagramName +
			'</a>' +
			'<span class="flow tab close" data-flow-target="' + idDiagram + '" title="Close this diagram">' +
				' x' +
			'</span>' +
		'</li>';
	};

	Templates.getPaginatedDiagramItem = function(idDiagram, diagramName) {
		return '<li class="flow pagination item">' +
			'<a class="flow pagination link" href="#" data-flow-target="' + idDiagram + '" >' +
				diagramName +
			'</a>' +
		'</li>';
	};

	Templates.getConnectionEmptyInput = function(id) {
        return '<input id="' + id + '" type="text" class="connector-text" ' +
            ' maxlength="' + flow.Const.MAX_INPUT_LENGTH + '" />';
    };

	Templates.getConnectionFilledInput = function(id, text, top, left) {
        return "<input id='" + id + "' type='text' value='" + text + "' class='connection label overlay' " +
            "style='top:" + top + "; left:" + left + ";' maxlength='" + flow.Const.MAX_INPUT_LENGTH + "' />";
    };

    Templates.getConnectionPlainText = function(id, text, top, left) {
        return "<p id='" + id + "' class='connection label overlay' style='top:" + top + "; left:" + left + ";' >" +
            text +
        "</p>";
    };

    Templates.getConnectionSelect = function(id, top, left) {
        return "<select id='" + id + "' class='connection label overlay' style='top:" + top + "; left:" + left + ";'>" +
            "<option value=''></option>" +
            "<option value='true'>true</option>" +
            "<option value='false'>false</option>" +
        "</select>";
    };

    Templates.getConnectionSelectWithTrueSelected = function(id, top, left) {
        return "<select id='" + id + "' class='connection label overlay' style='top:" + top + "; left:" + left + ";'>" +
            "<option value=''></option>" +
            "<option value='true' selected>true</option>" +
            "<option value='false'>false</option>" +
        "</select>";
    };

    Templates.getConnectionSelectWithFalseSelected = function(id, top, left) {
        return "<select id='" + id + "' class='connection label overlay' style='top:" + top + "; left:" + left + ";'>" +
            "<option value=''></option>" +
            "<option value='true'>true</option>" +
            "<option value='false' selected>false</option>" +
        "</select>";
    };

	return flow;
})(flow || {});

var flow = (function(flow, doc) {
	'use strict';

	var Alerts = flow.Alerts;

	flow.ExecutionHandler = {

		currentNode: null,

		nextNodeDOM: null,

		cachedNodes: {},

		cleanAttributesValues: function() {
			flow.Nodes.cleanVarTable();
			this.cachedNodes = {};
			this.currentNode = null;
			this.nextNodeDOM = null;
		},

		triggertExecution: function() {
			this.cleanAttributesValues();
			flow.Selection.unselectElements();
			flow.UI.unmarkAllShapes();

			var beginShape = this.getBeginShape();
			if (beginShape !== null) {
				this.currentNode = flow.Nodes.factory(beginShape);
				this.nextNodeDOM = this.currentNode.execute();
				this.executeAll();
			}
			else {
				Alerts.showErrorMessage('Element begin not found');
				return false;
			}
		},

		executeAll: function() {
			while(this.nextNodeDOM !== null) {
				this.setCurrentNode();
				this.nextNodeDOM = this.currentNode.execute();
			}
			flow.UI.markShapeAsExecuted(this.currentNode.selector);
			flow.UI.enableExecutionButtons();
			Alerts.showSuccessMessage('Execution complete');
		},

		triggerDebug: function() {
			this.cleanAttributesValues();
			flow.UI.unmarkAllShapes();

			var beginShape = this.getBeginShape();
			if (beginShape !== null) {
				Alerts.showInfoMessage('Debug initiated');
				this.currentNode = flow.Nodes.factory(beginShape);
				this.nextNodeDOM = this.currentNode.execute();
				flow.UI.markShapeAsExecuted(this.currentNode.selector);
				flow.UI.disableExecuteButton();
				return true;
			}
			else {
				Alerts.showErrorMessage('Element begin not found');
				return false;
			}
		},

		executeNext: function() {
			flow.UI.unmarkShapeAsExecuted(this.currentNode.selector);
			this.setCurrentNode();
			this.nextNodeDOM = this.currentNode.execute();
			flow.UI.markShapeAsExecuted(this.currentNode.selector);
			if (this.nextNodeDOM === null) {
				Alerts.showSuccessMessage('Execution complete');
				flow.UI.disableDebugButtons();
				flow.UI.enableExecuteButton();
			}
		},

		stopDebug: function() {
			Alerts.showSuccessMessage('Debug canceled');
			flow.UI.disableDebugButtons();
			flow.UI.enableExecuteButton();
			flow.UI.unmarkAllShapes();
		},

		setCurrentNode: function() {
			if (this.nextNodeDOM === null) {
				return;
			}

			var nextNodeId = this.nextNodeDOM.id;
			if (this.cachedNodes.hasOwnProperty(nextNodeId)) {
				this.currentNode = this.cachedNodes[nextNodeId];
			}
			else {
				this.currentNode = flow.Nodes.factory(this.nextNodeDOM);
				this.cachedNodes[nextNodeId] = this.currentNode;
			}
		},

		getBeginShape: function() {
			return flow.getCurrentDiagram().querySelector('div.shape[data-flow-shape-type="begin"]');
		},

		getDebugNextNode: function() {
			var $next = this.currentNode.getNextNodeSelector$;
			if ($next !== null) {
				return $next;
			}
			Alerts.showErrorMessage('End of the algorithm');
			throw 'End of the algorithm';
		}
	};


	return flow;
})(flow, document);

var flow = (function(flow, doc) {
	"use strict";

flow.UI = {

    appendContentToConsole: function(text) {
        flow.Cache.consoleExhibitionContent.insertAdjacentHTML('beforeEnd', "<code>" + text + "</code><br>");
		flow.Cache.consoleExhibition.scrollTop = flow.Cache.consoleExhibition.scrollHeight;
    },

    cleanConsoleContent: function() {
        flow.Cache.consoleExhibitionContent.textContent = '';
    },

    enableExecutionButtons: function() {
        this.disableExecutionButtons();
        this.enableExecuteButton();
        this.enableDebugButton();
    },

    disableExecutionButtons: function() {
        this.disableExecuteButton();
        this.disableDebugButton();
        this.disableDebugNextButton();
        this.disableDebugStopButton();
    },

    disableDebugButtons: function() {
        this.disableDebugNextButton();
        this.disableDebugStopButton();
        this.enableDebugButton();
    },

    enableDebugNextButton: function() {
        flow.Cache.consoleDebugNext.removeAttribute('disabled');
    },

    disableDebugNextButton: function() {
        flow.Cache.consoleDebugNext.setAttribute('disabled', 'disabled');
    },

    enableExecuteButton: function() {
        flow.Cache.consoleExecute.removeAttribute('disabled');
    },

    disableExecuteButton: function() {
        flow.Cache.consoleExecute.setAttribute('disabled', 'disabled');
    },

    enableDebugStopButton: function() {
        flow.Cache.consoleDebugStop.removeAttribute('disabled');
    },

    disableDebugStopButton: function() {
        flow.Cache.consoleDebugStop.setAttribute('disabled', 'disabled');
    },

    enableDebugButton: function() {
        flow.Cache.consoleDebugStart.removeAttribute('disabled');
    },

    disableDebugButton: function() {
        flow.Cache.consoleDebugStart.setAttribute('disabled', 'disabled');
    },

    openHelp: function() {
        flow.Cache.$helpTab.addClass("active");
        document.getElementById("help-content").style.display = "block";
    },

    closeHelp: function() {
        flow.Cache.$helpTab.removeClass("active");
        document.getElementById("help-content").style.display = "none";
    },

    openTextConnection: function(connection) {
        var idConnLabel = this.getConnectionHtmlId(connection),
			currentLable = connection.getLabel();

        if (currentLable === null || currentLable === '') { // case there's no label yet
            connection.setLabel(
                flow.Templates.getConnectionEmptyInput(idConnLabel)
            );
        }
        else { // here we alredy have a label
            var existantLabel = doc.getElementById(idConnLabel),
				oldText = existantLabel.textContent;

            connection.setLabel(
                flow.Templates.getConnectionFilledInput(
                    idConnLabel, oldText, existantLabel.style.top, existantLabel.style.left
                )
            );
        }

        this.blurOnConnectionInput(connection, oldText);
    },

    blurOnConnectionInput: function(connection) {
        var that = this,
			inputField = doc.getElementById(this.getConnectionHtmlId(connection));

        inputField.select();

        inputField.focus();

        flow.Util.on(inputField, 'blur', function() {
            that.setNewValueOfConnection(connection, this);
        });
    },

    openBooleanConnection: function(connection) {
        var idConnection = this.getConnectionHtmlId(connection),
			labelField = doc.getElementById(idConnection);

        if (labelField !== null && /true/i.test(labelField.textContent)) {
            connection.setLabel(
                flow.Templates.getConnectionSelectWithTrueSelected(
                    idConnection,
                    labelField.style.top,
                    labelField.style.left
                )
            );
        }
        else if (labelField !== null && /false/i.test(labelField.textContent)) {
            connection.setLabel(
                flow.Templates.getConnectionSelectWithFalseSelected(
                    idConnection,
                    labelField.style.top,
                    labelField.style.left
                )
            );
        }
        else if (labelField !== null) {
            connection.setLabel(flow.Templates.getConnectionSelect(idConnection));
        }
        else {
            connection.setLabel(flow.Templates.getConnectionSelect(idConnection));
        }

        this.clickOrBlurOnConnectionSelect(connection);
    },

    clickOrBlurOnConnectionSelect: function(connection) {
        var that = this,
			selectField = doc.getElementById(this.getConnectionHtmlId(connection));

        selectField.focus();

        flow.Util.on(selectField, 'blur', function() { // TODO on change
            that.setNewValueOfConnection(connection, this);
        });
    },

    getConnectionHtmlId: function(connection) {
        return connection.sourceId + "_" + connection.targetId;
    },

    setNewValueOfConnection: function(connection, field) {
        var labelId = field.id,
			newText = field.value,
			labelField = null;

        connection.setLabel(
            flow.Templates.getConnectionPlainText(
                labelId, newText, field.style.top, field.style.left
            )
        );

//      TODO, the element can be dragged, but it moves away from the cursor
//      labelField = doc.getElementById(labelId);
//		jsPlumb.draggable(labelField, {
//            opacity: 0.8
//        });
    },

    openShapeInput: function(shape) {
        var codeEl = null,
			oldText = null,
			inputEl = null;

		codeEl = shape.querySelector('code');
		oldText = codeEl.textContent.replace(/"/g, '&quot;'); // escape quotes

        codeEl.outerHTML = flow.Templates.getShapeInnerInput(oldText);

        inputEl = shape.querySelector('input');

        inputEl.focus(); // set focus here so he can alredy start typing
        inputEl.select();

        // back to "code"
		var triggered = false;
        flow.Util.on(inputEl, 'blur', function(event) {
			if (!triggered) {
				triggered = true;
				_removeInputFocus.call(this, event);
			}
		});
		flow.Util.on(inputEl, 'keyup', function(event) {
			if (event.keyCode === 13 && !triggered) {
				triggered = true;
				_removeInputFocus.call(this, event);
			}
        });

		var _removeInputFocus = function(event) {
			var newText = this.value;

			if (newText !== oldText) {
				flow.Util.trigger(flow.Const.SHAPE_EVENT.ALTERATED, shape);
			}

            this.outerHTML = flow.Templates.getShapeInnerCode(newText); //Hidden again
		};
    },

	markShapeAsSelected: function(shape) {
		shape.classList.add('selected');
        shape.focus();
    },

    unmarkShapeAsSelected: function(shape) {
		shape.classList.remove('selected');
    },

	unmarkAllShapes: function() {
		var shapes = flow.getCurrentDiagram().querySelectorAll('div.shape.executed, div.shape.invalid');
		for (var i=shapes.length; i--; ) {
			var shape = shapes[i];
			shape.classList.remove('invalid');
			shape.classList.remove('executed');
		}
	},

	markShapeAsExecuted: function(shape) {
		shape.classList.add('executed');
        shape.focus();
    },

    unmarkShapeAsExecuted: function(shape) {
		shape.classList.remove('executed');
    },

    markShapeAsInvalid: function(shape) {
		shape.classList.add('invalid');
        shape.focus();
    },

    unmarkShapeAsInvalid: function(shape) {
		shape.classList.remove('invalid');
    },

    markFailure: function(message, shape) {
        if (shape !== undefined) {
            this.markShapeAsInvalid(shape);
        }
        flow.Alerts.showErrorMessage(message);

        this.enableExecutionButtons();

        throw message;
    }
};

	return flow;
})(flow || {}, document);

var flow = (function(flow) {
	'use strict';

	flow.Const = {};

	var Const = flow.Const;

	Const.MAX_INPUT_LENGTH = 30;

	Const.SHAPE_TYPE = {
		PROCESS: 'process',
		DISPLAY: 'display',
		DECISION: 'decision',
		MANUAL_INPUT: 'manual_input',
		CONNECTOR: 'connector',
		BEGIN: 'begin',
		END: 'end'
	};

	Const.DIAGRAM_EVENT = {
		CREATED: 'diagram_created',
		DELETED: 'diagram_deleted',
		LOADED: 'diagram_loaded'
	};

	Const.SHAPE_EVENT = {
		SELECTED: 'shape_selected',
		MOVED: 'shape_moved',
		DELETED: 'shape_deleted',
		ALTERATED: 'shape_altered',
		CREATED: 'shape_created'
	};

	Const.CONNECTION_EVENT = {
		ALTERED: 'connection_altered',
		SELECTED: 'connection_selected'
	};

	Const.CONNECTION_TYPE = {
		BOOLEAN: 'boolean',
		TEXT: 'text'
	};

	return flow;
})(flow || {});
/**
 * Selection Submodule
 */
var flow = (function(flow, doc, jsPlumb) {
	'use strict';

	flow.Selection = {};

	var Selection = flow.Selection,
		_selectedElement = null;

	Selection.addSelectedShape = function(shape) {
		this.unselectElements();

		_selectedElement = {
			type: 'shape',
			id: shape.id
		};

		flow.UI.markShapeAsSelected(shape);
	};

	Selection.addSelectedConnection = function(sourceId, targetId) {
		this.unselectElements();

		_selectedElement = {
			type: 'connection',
			from: sourceId,
			to: targetId
		};
	};

	Selection.deleteSelectedItems = function() {
		if (_selectedElement) {
			if (_selectedElement.type === 'shape') {
				var shape = doc.getElementById(_selectedElement.id);
				flow.Util.trigger(flow.Const.SHAPE_EVENT.ALTERATED, shape);
				jsPlumb.detachAllConnections(shape);
				flow.Util.remove(shape);
			}
			else {
				var shapeSource = doc.getElementById(_selectedElement.from),
					conn = jsPlumb.getConnections({
						source: _selectedElement.from,
						target: _selectedElement.to
					})[0];

				flow.Util.trigger(flow.Const.SHAPE_EVENT.ALTERATED, shapeSource);

				jsPlumb.detach(conn);
			}

			_selectedElement = null;
		}
	};

	Selection.getSelectedItem = function() {
		return _selectedElement;
	};

	Selection.unselectShapes = function() {
		if (_selectedElement && _selectedElement.type === 'shape') {
			flow.UI.unmarkShapeAsSelected(
				doc.getElementById(_selectedElement.id)
			);
			_selectedElement = null;
		}
	};

	Selection.unselectConnections = function() {
		if (_selectedElement && _selectedElement.type === 'connection') {
			var conn = jsPlumb.getConnections({
				source: _selectedElement.from,
				target: _selectedElement.to
			})[0];

			conn.setPaintStyle(jsPlumb.Defaults.PaintStyle);
			_selectedElement = null;
		}
	};

	Selection.unselectElements = function() {
		this.unselectShapes();
		this.unselectConnections();
		_selectedElement = null;
		flow.UI.unmarkAllShapes();
	};

	Selection.cleanSelection = function() {
		_selectedElement = null;
	};

	return flow;
})(flow || {}, document, jsPlumb);

var flow = (function(flow, jsPlumb) {
	"use strict";

	flow.Nodes = {

		varTable: {},

		factory: function(node) {
			var nodeType = node.getAttribute("data-flow-shape-type");
			switch (nodeType) {
				case flow.Const.SHAPE_TYPE.PROCESS:
					return new Process(node);
					break;
				case flow.Const.SHAPE_TYPE.DISPLAY:
					return new Display(node);
					break;
				case flow.Const.SHAPE_TYPE.MANUAL_INPUT:
					return new ManualInput(node);
					break;
				case flow.Const.SHAPE_TYPE.DECISION:
					return new Decision(node);
					break;
				default:
					return new Node(node);
					break;
			}
		},

		cleanVarTable: function() {
			this.varTable = {};
		}
	};

	var Node = function(selector) {
		this.selector = selector;

		this.execute = function() {
			this.validate();

			return this.getNextNodeSelector();
		};

		this.getParsedContent = function() {

		};

		this.getNextNodeSelector = function() {
			var connections = jsPlumb.getConnections({source: this.selector});
			return (connections.length > 0) ? connections[0].target : null;
		};

		this.validate = function() {
			var connections = jsPlumb.getConnections({source: this.selector});
			if (connections.length < 1 && this.selector.getAttribute('data-flow-max-outputs') !== '0') {
				flow.UI.markFailure('Output flow not found', this.selector);
			}
		};

	};

	Node.prototype = {
		getContent: function() {
			return this.selector.querySelector('code').textContent;
		}
	};

	// PROCESS
	var Process = function(selector) {
		Node.call(this, selector);

		this.execute = function() {
			this.validate();

			try {
				eval(this.getParsedContent());
			}
			catch (e) {
				flow.log(e);
				flow.UI.markFailure('Erro de sintaxe', this.selector);
			}

			return this.getNextNodeSelector();
		};

		this.getParsedContent = function() {
			var parsedContent = this.getContent().replace("<-", "=").split(/("[^"]*")/);

			for (var i = 0, length = parsedContent.length; i < length; i++) {
				if (!(/^"[^"]*"$/.test(parsedContent[i]))) {
					parsedContent[i] = parsedContent[i].replace(/([a-zA-Z_$][0-9a-zA-Z_$]*)/g, " flow.Nodes.varTable.$1 ");
				}
				else if (parsedContent[i] === "") {
					delete parsedContent[i];
				}
			}
			return parsedContent.join(" ");
		};
	};
	Process.prototype = Object.create(Node.prototype);

	// DISPLAY
	var Display = function(selector) {
		Node.call(this, selector);

		this.execute = function() {
			this.validate();

			var parsedContent = this.getParsedContent(),
				expression = "<span style='color: teal;'>" + getExpression(parsedContent) + " -> </span>",
				evaluatedValue = getEvaluatedValue(parsedContent);

			flow.UI.appendContentToConsole(expression + evaluatedValue);

			return this.getNextNodeSelector();
		};

		var getExpression = function(content) {
			return content.replace(/flow\.Nodes\.varTable\./g, '');
		};

		var getEvaluatedValue = function(content) {
			try {
				var result = eval(content);
			}
			catch (e) {
				flow.log(e);
				flow.UI.markFailure('Syntax error', this.selector);
			}

			if (
				!Array.isArray(result) && (result === undefined || result === null ||
				(typeof result !== 'string' && isNaN(result)))
			) {
				result = 'Null';
			}

			return result;
		};

		this.getParsedContent = function() {
			var parsedContent = this.getContent().split(/("[^"]*")/);
			for (var i = 0, length = parsedContent.length; i < length; i++) {
				if (!(/^"[^"]*"$/.test(parsedContent[i]))) {
					parsedContent[i] = parsedContent[i].replace(/([a-zA-Z_$][0-9a-zA-Z_$]*)/g, " flow.Nodes.varTable.$1 ");
				}
				else if (parsedContent[i] === "") {
					delete parsedContent[i];
				}
			}
			return parsedContent.join(" ");
		};
	};
	Display.prototype = Object.create(Node.prototype);

	// MANUAL_INPUT
	var ManualInput = function(selector) {
		Node.call(this, selector);

		this.execute = function() {
			this.validate();

			try {
				eval(this.getParsedContent());

				var varName = this.getContent();
				if (flow.Util.isNumber(flow.Nodes.varTable[varName])) {
					flow.Nodes.varTable[varName] = parseFloat(flow.Nodes.varTable[varName]);
				}
			}
			catch (e) {
				flow.log(e);
				flow.UI.markFailure('Syntax error', this.selector);
			}

			return this.getNextNodeSelector();
		};

		this.getParsedContent = function() {
			return this.getContent().
				replace(/([a-zA-Z_$][0-9a-zA-Z_$]*)/, " flow.Nodes.varTable.$1 = prompt('Insira o valor de $1');");
		};
	};
	ManualInput.prototype = Object.create(Node.prototype);

	// DECISION
	var Decision = function(selector) {
		Node.call(this, selector);

		this.execute = function() {
			this.validate();

			try {
				var expressionIsTrue = eval(this.getParsedContent());
			}
			catch (e) {
				flow.log(e);
				flow.UI.markFailure("Erro de sintaxe", this.selector);
			}

			return this.getNextNodeSelector(expressionIsTrue);
		};

		this.getParsedContent = function() {
			var parsedContent = this.getContent().split(/("[^"]*")/);
			for (var i=0, len=parsedContent.length; i<len; i++) {
				if (!(/^"[^"]*"$/.test(parsedContent[i]))) {
					parsedContent[i] = parsedContent[i].replace(/([a-zA-Z_$][0-9a-zA-Z_$]*)/g, " flow.Nodes.varTable.$1 ");
				}
				else if (parsedContent[i] === "") {
					delete parsedContent[i];
				}
			}
			return parsedContent.join(" ");
		};

		this.getNextNodeSelector = function(isTrue) {
			var connections = jsPlumb.getConnections({source: this.selector});

			if (isTrue === true) {
				if (/true/i.test(connections[0].getLabel())) {
					return connections[0].target;
				}
				else {
					return connections[1].target;
				}
			}
			else if(isTrue === false){
				if (/true/i.test(connections[0].getLabel())) {
					return connections[1].target;
				}
				else {
					return connections[0].target;
				}
			}
			else {
				flow.UI.markFailure('Execution error', this.selector);
			}
		};

		this.validate = function() {
			var connections = jsPlumb.getConnections({source: this.selector});

			if (connections.length < 2) {
				flow.UI.markFailure('A decision shape needs two output flows', is.selector);
			}

			var hasTrue = false,
				hasFalse = false;
			for (var i = 0; i < connections.length; i++) {
				if (/true/i.test(connections[i].getLabel())) {
					hasTrue = true;
				}
				else if (/false/i.test(connections[i].getLabel())) {
					hasFalse = true;
				}
			}

			if (!hasTrue || !hasFalse) {
				flow.UI.markFailure(
					'It\'s necessary to have a <b>true</b> and a <b>false</b> output', this.selector
				);
			}
		};
	};
	Decision.prototype = Object.create(Node.prototype);

	return flow;
})(flow || {}, jsPlumb);
var flow = (function(flow, doc, jsPlumb) {
	'use strict';

	var Cache = flow.Cache,
		debug = true;

	flow.log = function() {
		if (debug) {
			if (arguments.length === 1) {
				console.log(arguments[0]);
			}
			else if (arguments.length === 2) {
				console.log(arguments[0], arguments[1]);
			}
		}
	};

	flow.makeMenuShapesDraggable = function() {
		var menuShapes = Cache.shapeMenu.querySelectorAll('div.flow.shape');

		jsPlumb.draggable(menuShapes, {
			scope: 'dragFromMenu',
			clone: true
		});
	};

	flow.getCurrentDiagram = (function() {
		var currentDiagram;

		// avoid unnecessary DOM query with a closure cache
		return function() {
			// undefined == never setted; parentNode === null == removed from DOM
			if (currentDiagram === undefined || currentDiagram === null || currentDiagram.parentNode === null) {
				currentDiagram = Cache.diagramContainer.querySelector('div.flow.active.diagram');
			}
			return currentDiagram;
		};
	})();

	flow.findShapeById = function(idShape) {
		return flow.getCurrentDiagram().querySelector('div.shape[data-flow-shape-id="' + idShape + '"]');
	};

	flow.getShapeCloneByType = function(type) {
		return flow.Cache.shapeMenu.querySelector('div.shape[data-flow-shape-type="' + type + '"]').cloneNode(true);
	};

	/**
	 * Creates a new diagram and append it to DOM.
	 *
	 * @param {string} diagramName
	 * @param {integer} id OPTIONAL use with caution ! you need to ensure that this is UNIQUE
	 * @return {DOM_Object} newDiagram Newly created diagram
	 */
	flow.createDiagram = function(diagramName, id) {
		var currentDiagram = flow.getCurrentDiagram();
		if (currentDiagram !== null) {
			flow.closeDiagram(currentDiagram);
		}

		// then append the new diagram
		Cache.diagramContainer.insertAdjacentHTML(
			'beforeEnd', flow.Templates.getNewDiagram(diagramName, id)
		);

		var newDiagram = flow.getCurrentDiagram();

		newDiagram.scrollTop = newDiagram.scrollHeight / 3.5;
		newDiagram.scrollLeft = newDiagram.scrollWidth / 3.5;

		jsPlumb.setContainer(newDiagram); // set jsplumb container

		_makeDiagramDroppable(newDiagram); // let the user drop the shapes from menu on this new

		flow.Listeners.setupDiagramEvents(newDiagram);

		flow.UI.enableExecutionButtons();

		flow.Util.trigger(flow.Const.DIAGRAM_EVENT.CREATED, newDiagram);

		return newDiagram;

	};

	flow.closeDiagram = function(diagram) {
		var data = flow.getDiagramData(diagram);

		flow.storeDiagramData(data);

		flow.Util.trigger(flow.Const.DIAGRAM_EVENT.DELETED, diagram);

		flow.Util.remove(diagram);

		flow.Selection.cleanSelection();

		// @fix jsPlumb 1.6.2+. Without this the connections remain intact (no idea why)
		jsPlumb.detachEveryConnection();

		flow.State.cleanState(); // clean closed diagram state data
	};

	flow.openLocallyStoredDiagrams = function() {
		var opened = false,
			text = window.localStorage.getItem('flow');
		if (text !== null && text !== '') {
			opened = flow.openDiagrams(text);
		}
		return opened;
	};

	flow.openDiagrams = function(jsonDataAsText) {
		var data = {},
			diagrams = {};

		try {
			data = JSON.parse(jsonDataAsText);
			diagrams = data.diagrams;
		}
		catch(e) {
			flow.Alerts.showErrorMessage('Error, invalid data.');
			flow.log(e);
			return false;
		}

		flow.Util.count = data.data.count + 1; // prevents ID duplication !

		for (var key in diagrams) {
			var diagramData = diagrams[key];
			flow.storeDiagramData(diagramData);
			flow.recreateDiagramFromStoredData(diagramData.id);
		};

		return true;
	};

	flow.recreateDiagramFromStoredData = function(idDiagram) {
		var diagramData = flow.getStoredDiagramData(idDiagram);

		// VERY IMPORTANT clean after retrieve or else we have a huge memory leak
		flow.cleanStoredDiagramData(idDiagram);

		var currentDiagram = flow.createDiagram(diagramData.name, idDiagram);

		var tabItem = Cache.tabMenuList.querySelector('.flow.tab.item[data-flow-target="' + idDiagram + '"]');

		if (tabItem === null) {
			flow.appendTabItemToDiagramArea(diagramData.name);
		}
		else {
			var activeTab = Cache.tabMenuList.querySelector('.flow.tab.item.active');
			if (activeTab !== null) {
				activeTab.classList.remove('active');
			}
			tabItem.classList.add('active');
		}

		this.createDiagramShapesFromArray(currentDiagram, diagramData.shapes);
	};

	flow.createDiagramShapesFromArray = function(diagram, shapesArray) {
		// first create and append the shapes
		var fragment = doc.createDocumentFragment();
		for (var i=shapesArray.length; i--; ) {
			var shapeData = shapesArray[i],
				originalShape =  Cache.shapeMenu.querySelector('div[data-flow-shape-type="' + shapeData.type + '"]'),
				clonedShape = originalShape.cloneNode(true),
				clonedShapeImage = clonedShape.querySelector('.shape.image');

			fragment.appendChild(clonedShape);

			clonedShape.style.top = shapeData.top;
			clonedShape.style.left = shapeData.left;

			clonedShapeImage.style.height = shapeData.height;
			clonedShapeImage.style.width = shapeData.width;

			clonedShape.querySelector('code').textContent = shapeData.code;

			clonedShape.setAttribute('data-flow-shape-id', shapeData.id);

			_setupShape(clonedShape);
		}
		diagram.appendChild(fragment);

		var beginShape = diagram.querySelector('.begin');
		if (beginShape) {
			beginShape.focus(); // always start focusing the begin el
		}

		// then make the connections
		jsPlumb.setSuspendDrawing(true);

		for (var i=shapesArray.length; i--; ) {
			var shapeData = shapesArray[i],
				sShape = diagram.querySelector('[data-flow-shape-id="' + shapeData.id + '"]');

			var targetConnections = shapeData.targetConnections;
			for (var id in targetConnections) {
				var connectionData = targetConnections[id],
					tShape = diagram.querySelector('[data-flow-shape-id="' + id + '"]');
				jsPlumb.connect({
					source: sShape,
					target: tShape,
					label: connectionData.label || ''
				});
			}
		}
		jsPlumb.setSuspendDrawing(false, true);
	};

	flow.appendTabItemToDiagramArea = function(diagramName) {
		var activeTab = Cache.tabMenuList.querySelector('.flow.tab.item.active');
		if (activeTab !== null) {
			activeTab.classList.remove('active');
		}

		Cache.tabMenuList.insertAdjacentHTML(
			'beforeEnd', flow.Templates.getTabItem(flow.getCurrentDiagram().id, diagramName)
		);
	};

	/**
	 * Erase stored data from all diagrams, close the current open diagram and all the open diagram tabs
	 */
	flow.closeAllDiagrams = function() {
		flow.cleanAllDiagramsStoredData = {};

		while (Cache.tabMenuList.hasChildNodes()) {
			Cache.tabMenuList.removeChild(Cache.tabMenuList.lastChild);
		};

		var currentDiagram = flow.getCurrentDiagram();
		if (currentDiagram !== null) {
			flow.closeDiagram(currentDiagram);
		}
	};

	flow.makeShapeDraggable = function(shape, shapeData) {
		shape.removeAttribute('id'); // ENSURE ID is empty. jsPlumb.draggable will create a new one

		jsPlumb.draggable(shape, {
			// containment: true, // block scroll
			//filter: '.resize', // not working
			//consumeFilteredEvents: true
			start: function(params) {
				var shape = params.el;

				flow.Selection.addSelectedShape(shape);

				flow.Util.trigger(flow.Const.SHAPE_EVENT.ALTERATED, shape);
			},
			drag: function(params) {
				return 'TODO';

				var shape = params.el,
					flowchart = shape.parentNode,
					left = parseInt(shape.style.left, 10) + shape.offsetWidth,
					top = parseInt(shape.style.top, 10) + shape.offsetHeight,
					flowchartHeight = flowchart.offsetHeight,
					flowchartWidth = flowchart.offsetWidth,
					flowchartScrollLeft = flowchart.scrollLeft,
					flowchartScrollTop = flowchart.scrollTop,
					flowchartBottomBorder = flowchartHeight + flowchart.scrollTop;


				if (top >= flowchartBottomBorder) {
					flowchart.scrollTop = flowchartScrollTop + (top - flowchartBottomBorder) * 4;
				}

				//TODO
			}
		});

		if (shapeData.maxInputs > 0) {
			jsPlumb.makeTarget(shape, {
				maxConnections: shapeData.maxInputs,
				isTarget: true
			});
		}
		else if (shapeData.maxOutputs === -1) {
			jsPlumb.makeTarget(shape, {
				isTarget: true
			});
		}

		if (shapeData.maxOutputs > 0) {
			jsPlumb.makeSource(shape, {
				maxConnections: shapeData.maxOutputs,
				filter: '.connector',
				isSource: true
			});
		}
		else if (shapeData.maxOutputs === -1) {
			jsPlumb.makeSource(shape, {
				filter: '.connector',
				isSource: true
			});
		}
	};

	var _makeDiagramDroppable = function(diagram) {
		var k = jsPlumb._katavorio;
		k.droppable(diagram, {
			scope: 'dragFromMenu',
			drop:function(params) {
				var flowchart = params.drop.el,
					baseShape = params.drag.el,
					maxAllowedCopies = parseInt(baseShape.getAttribute('data-flow-max-copies'), 10),
					type = baseShape.getAttribute('data-flow-shape-type');

				if (maxAllowedCopies === -1 || _getAmountOfShapesInDiagram(diagram, type) < maxAllowedCopies) {
					var shapeClone = baseShape.cloneNode(true);

					shapeClone.style.left = params.e.layerX + flowchart.scrollLeft + 'px';
					shapeClone.style.top = params.e.layerY + flowchart.scrollTop + 'px';

					diagram.appendChild(shapeClone);

					_setupShape(shapeClone);

					flow.Util.trigger(flow.Const.SHAPE_EVENT.ALTERATED, shapeClone, 'created');
				}
				else {
					flow.Alerts.showWarningMessage('You cannot create more shapes of this type');
				}
			}
		});
	};

	var _getAmountOfShapesInDiagram = function(diagram, shapeType) {
		return diagram.querySelectorAll('div.shape[data-flow-shape-type="' + shapeType + '"]').length;
	};

	var _setupShape = function(shape) {
		var shapeData = _getShapeData(shape);

		flow.makeShapeDraggable(shape, shapeData);

		if (!shapeData.secondId) {
			shape.setAttribute('data-flow-shape-id', flow.Util.getUniqueID(shapeData.type));
		}
	};

	var _getShapeData = function(shape) {
		var codeEl = shape.querySelector('code');
		return {
			secondId: shape.getAttribute('data-flow-shape-id'), // we need a static id
			type: shape.getAttribute('data-flow-shape-type'),
			hasUserText: shape.getAttribute('data-flow-has-user-text') === 'true', // cast to boolean
			maxOutputs: parseInt(shape.getAttribute('data-flow-max-outputs'), 10),
			maxInputs: parseInt(shape.getAttribute('data-flow-max-inputs'), 10),
			maxCopies: parseInt(shape.getAttribute('data-flow-max-copies'), 10),
			value: (codeEl !== null) ? codeEl.textContent : '',
            left: shape.style.left,
            top: shape.style.top
		};
	};

	return flow;

})(flow || {}, document, jsPlumb);

jsPlumb.ready(function() {
	'use strict';

	flow.Cache.setCache();

	flow.setDefaults();

	flow.makeMenuShapesDraggable();

	flow.Util.invokeAllFunctions(flow.StaticListeners);

	var opened = flow.openLocallyStoredDiagrams();
	if (opened) {
		flow.Alerts.showSuccessMessage('Diagrams found in the browser automatically open');
	}
});
