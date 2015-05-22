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
		var k = jsPlumb._katavorio_main;
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
