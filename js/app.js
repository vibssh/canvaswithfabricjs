/*
  TODO LIST :
    1. DESELECT PENCIL STATE on click outside canvas
    2. This is a JS Dump. TODO structure the code
*/

var whiteBoard = new fabric.Canvas('whiteboard', {
    backgroundColor: 'rgba(191, 34, 151, 0.31)',
    selection: false,
    width: window.innerWidth - 110,
    height: window.innerHeight - 135,
    preserveObjectStacking: true
  });



var somefunction = (function () {
  var someobj = {
    canvas: this.whiteBoard,
    _points: [],
    color: '',
    width: 1,
    fill: false,
    currentLineId: -1,

    _prepareForDrawing: function (pointer) {
      var p = new fabric.Point(pointer.x, pointer.y);
      this._reset();
      this._addPoint(p);

      whiteBoard.contextTop.moveTo(p.x, p.y);
    },

    /**
     * @private
     * @param {fabric.Point} point Point to be added to points array
     */
    _addPoint: function (point) {
      this._points.push(point);
    },

    /**
     * Clear points array and set contextTop canvas style.
     * @private
     */
    _reset: function () {
      this._points.length = 0;

      this._setBrushStyles();
      this._setShadow();
    },

    /**
     * @private
     * @param {Object} pointer Actual mouse position related to the canvas.
     */
    _captureDrawingPath: function (pointer) {
      var pointerPoint = new fabric.Point(pointer.x, pointer.y);
      this._addPoint(pointerPoint);
    },

    /**
     * Draw a smooth path on the topCanvas using quadraticCurveTo
     * @private
     */
    _render: function () {

      var ctx = whiteBoard.contextTop,
        v = whiteBoard.viewportTransform,
        p1 = this._points[0],
        p2 = this._points[1];


      ctx.save();
      ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
      ctx.beginPath();

      //if we only have 2 points in the path and they are the same
      //it means that the user only clicked the canvas without moving the mouse
      //then we should be drawing a dot. A path isn't drawn between two identical dots
      //that's why we set them apart a bit
      if (this._points.length === 2 && p1.x === p2.x && p1.y === p2.y) {
        p1.x -= 0.5;
        p2.x += 0.5;
      }
      ctx.moveTo(p1.x, p1.y);

      for (var i = 1, len = this._points.length; i < len; i++) {
        // we pick the point between pi + 1 & pi + 2 as the
        // end point and p1 as our control point.
        var midPoint = p1.midPointFrom(p2);
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);

        p1 = this._points[i];
        p2 = this._points[i + 1];
      }
      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.restore();
    },

    /**
     * Converts points to SVG path
     * @param {Array} points Array of points
     * @return {String} SVG path
     */
    convertPointsToSVGPath: function (points) {
      var path = [],
        p1 = new fabric.Point(points[0].x, points[0].y),
        p2 = new fabric.Point(points[1].x, points[1].y);

      path.push('M ', points[0].x, ' ', points[0].y, ' ');
      for (var i = 1, len = points.length; i < len; i++) {
        var midPoint = p1.midPointFrom(p2);
        // p1 is our bezier control point
        // midpoint is our endpoint
        // start point is p(i-1) value.
        path.push('Q ', p1.x, ' ', p1.y, ' ', midPoint.x, ' ', midPoint.y, ' ');
        p1 = new fabric.Point(points[i].x, points[i].y);
        if ((i + 1) < points.length) {
          p2 = new fabric.Point(points[i + 1].x, points[i + 1].y);
        }
      }
      path.push('L ', p1.x, ' ', p1.y, ' ');
      return path;
    },

    /**
     * Creates fabric.Path object to add on canvas
     * @param {String} pathData Path data
     * @return {fabric.Path} Path to add on canvas
     */
    createPath: function (pathData) {

      var path = new fabric.Path(pathData, {
        fill: null,
        stroke: this.color,
        strokeWidth: this.width,
        strokeLineCap: this.strokeLineCap,
        strokeLineJoin: this.strokeLineJoin,
        strokeDashArray: this.strokeDashArray,
        originX: 'center',
        originY: 'center',
        id: this.currentLineId
      });

      if (this.shadow) {
        this.shadow.affectStroke = true;
        path.setShadow(this.shadow);
      }

      return path;
    },

    _setBrushStyles: function() {
    var ctx = whiteBoard.contextTop;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.lineCap = this.strokeLineCap;
    ctx.lineJoin = this.strokeLineJoin;
    if (this.strokeDashArray && fabric.StaticCanvas.supports('setLineDash')) {
      ctx.setLineDash(this.strokeDashArray);
    }
  },

    _resetShadow: function() {
    var ctx = whiteBoard.contextTop;

        ctx.shadowColor = '';

    ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  },

  /**
   * Sets brush shadow styles
   * @private
   */
  _setShadow: function() {
    if (!this.shadow) {
      return;
    }

    var ctx = whiteBoard.contextTop,
        zoom = whiteBoard.getZoom();

    ctx.shadowColor = this.shadow.color;
    ctx.shadowBlur = this.shadow.blur * zoom;
    ctx.shadowOffsetX = this.shadow.offsetX * zoom;
    ctx.shadowOffsetY = this.shadow.offsetY * zoom;
  },

    /**
     * On mouseup after drawing the path on contextTop canvas
     * we use the points captured to create an new fabric path object
     * and add it to the fabric canvas.
     */
    _finalizeAndAddPath: function () {
      var ctx = whiteBoard.contextTop;
      ctx.closePath();

      var pathData = this.convertPointsToSVGPath(this._points).join('');
      if (pathData === 'M 0 0 Q 0 0 0 0 L 0 0') {
        // do not create 0 width/height paths, as they are
        // rendered inconsistently across browsers
        // Firefox 4, for example, renders a dot,
        // whereas Chrome 10 renders nothing
        whiteBoard.renderAll();
        return;
      }

      var path = this.createPath(pathData);

      whiteBoard.add(path);
      path.setCoords();

      whiteBoard.clearContext(whiteBoard.contextTop);
      this._resetShadow();
      whiteBoard.renderAll();

      // fire event 'path' created
      whiteBoard.fire('path:created', {
        path: path
      });

      return path;
    }
  };

  return someobj;
}());


(function () {
  'use strict';

  var socket = io.connect("http://localhost:3000");


  var objArray = [];

  /* Creating Instance of Fabric */
  /*
  var whiteBoard = new fabric.Canvas('whiteboard', {
    backgroundColor: 'rgba(191, 34, 151, 0.31)',
    selection: false,
    width: window.innerWidth - 110,
    height: window.innerHeight - 135,
    preserveObjectStacking: true
  });
*/

  /* Settings Background image of the canvas*/
  //  whiteBoard.setBackgroundColor({
  //    source: '/images/icons/check.png'
  //  }, whiteBoard.renderAll.bind(whiteBoard));


  whiteBoard.renderAll.bind(whiteBoard);

  fabric.Object.prototype.set({
    transparentCorners: false,
    cornerColor: 'blue',
    cornerStrokeColor: 'red',
    borderColor: 'blue',
    cornerStyle: 'circle',
    borderDashArray: [3, 3],
    left: 0,
    right: 100
  });

  var panning = false;
  var panChecked = false;

  /* Setting Dimensions of the Canvas when object is moved */
  whiteBoard.on('object:moving', function (e) {
    var obj = e.target;
    //console.info(obj);
    var objCanvasWidth = obj.canvas.width;
    var objCanvasHeight = obj.canvas.height;
    var objTopHeight = objCanvasHeight / 2;
    var objLeft = obj.left;
    var objTop = obj.top;
    obj.canvas.selection = true;
    var objRight = obj.width + obj.left;
    var objBottom = obj.height + obj.top;

    var obj = e.target;

    objInView(objBottom, objRight, obj);

  });

  whiteBoard.on('mouse:up', function (e) {
    panning = false;
  });
  whiteBoard.on('mouse:out', function (e) {
    panning = false;
  });
  whiteBoard.on('mouse:down', function (e) {
    panning = true;
  });
  /* Checking the Path created */
  whiteBoard.on('mouse:move', function (e) {

    //var obj = e.e;
    var pageX = e.e.pageX;
    var canvasRight = whiteBoard._offset.left + 100;

    var objRightPos = pageX - canvasRight;

    var pageY = e.e.pageY;
    var canvasBottom = whiteBoard._offset.top;
    var objBottomPos = pageY - canvasBottom;

    var canvasWidth = whiteBoard.width;
    var canvasHeight = whiteBoard.height;



    /* Width of canvas */
    if (objRightPos >= canvasWidth) {

      whiteBoard.setWidth(objRightPos);
    }

    /* Height of canvas */
    if (objBottomPos >= canvasHeight) {
      whiteBoard.setHeight(objBottomPos);
    }

    //allowing pan only if the image is zoomed.
    if (panning && panChecked) {
      var delta = new fabric.Point(e.e.movementX, e.e.movementY);
      whiteBoard.relativePan(delta);
      whiteBoard.set({
        selection: false
      })
    }

  });

  /* Checking if the object is in view of the canvas while moving the object */
  var objInView = function (objBottom, objRight, obj) {
    var objCanvasWidth = whiteBoard.width;
    var objHeight = whiteBoard.height;

    //This checks the width of the canvas
    if (objRight >= objCanvasWidth) {
      //console.info('about to touch sides of the bounding box');
      whiteBoard.setWidth(objRight);
    }

    //This checks the height of the canvas
    if (objBottom >= objHeight) {
      //console.info('about to touch on bottom of the bounding box');
      whiteBoard.setHeight(objBottom);
    };

    //This to prevent the obj from going outside left area and outside top area
    if (obj !== undefined) {
      if (obj.left <= 100) {
        obj.left = 0;
      }
      if (obj.top < 1) {
        obj.top = 0;
      }
    };
  };

  /* Creating Instance of Rectangle */
  var rect = new fabric.Rect({
    width: 100,
    height: 100,
    fill: '#ff0000'
  });

  /* Modifying Rectangle */
  rect.set({
    fill: '#00ffff',
    opacity: 0.5,
    top: 50,
    bottom: 10
  });

  var circle = new fabric.Circle({
    width: 200,
    height: 200,
    radius: 50,
    fill: '#00ff00'
  });

  /* Modifying Circle */
  circle.set({
    fill: 'red',
    top: 0,
    right: 0
  });

  /* Adding To whiteBoard to get it rendered*/
  whiteBoard.add(rect, circle);

  /* Adding Text Area and Text Box */
  var textOption = {
    fontFamily: 'Helvetica',
    fontSize: 20,
    fill: '#ff00ff',
    hasBorder: false,
    editable: true

  };
  var textObject = '';

  //TEXT Tool
  var createTextBox = function () {
    textObject = new fabric.IText('', textOption);
    whiteBoard.add(textObject);
    //whiteBoard.centerObject(textObject);
    whiteBoard.setActiveObject(textObject);
    textObject.selectAll();
    textObject.enterEditing();
    textObject.hiddenTextarea.focus();


  };

  /* getObjects method to see what is rendered */
  $('input[type="radio"]').on('change', function (event) {
    /* TO DO MAKE IT CONFIGURABLE WHICH ITEM IS CLICKED IN TOOLBAR */
    whiteBoard.isDrawingMode = false;
    $('canvas').unbind('click');
    $('body').unbind('click');
    $('label[for="uploader"]').removeClass('active');
    //     textObject.exitEditing();

    /* ERASER */
    if ($('#eraser').is(':checked')) {
      $('.upper-canvas').addClass('eraser');
      $('body').on('click', function (ev) {
        //console.info(ev);
        whiteBoard.remove(whiteBoard.getActiveObject());
      });
    } else {
      $('.upper-canvas').removeClass('eraser');
    }

    /* PENCIL */
    if ($('#pencil').is(':checked')) {
      whiteBoard.isDrawingMode = true;
      whiteBoard.freeDrawingBrush.color = '#ff0000';
      whiteBoard.freeDrawingBrush.width = 5;
      whiteBoard.freeDrawingCursor = 'url(images/icons/pencil.png) 0 16, auto';
    }


    /* ZOOM IN */
    if ($('#zoomIn').is(':checked')) {
      $('.upper-canvas').addClass('zoomIn');
      $('canvas').on('click', function () {
        whiteBoard.setZoom(whiteBoard.getZoom() * 1.1);
      });
    } else {
      $('.upper-canvas').removeClass('zoomIn');
    }

    /* ZOOM OUT */
    if ($('#zoomOut').is(':checked')) {
      $('.upper-canvas').addClass('zoomOut');
      $('canvas').on('click', function (e) {
        whiteBoard.setZoom(whiteBoard.getZoom() / 1.1);
      });
    } else {
      $('.upper-canvas').removeClass('zoomOut');
    }

    /* Panning */
    if ($('#pan').is(':checked')) {
      panChecked = true;
      $('.upper-canvas').addClass('pan');

    } else {
      panning = false;
      panChecked = false;
      $('.upper-canvas').removeClass('pan');
    }

    if ($('#select').is(':checked')) {
      $(document).on('keyup', function (e) {
        if ((e.keyCode === 46) || (e.keyCode === 8)) {
          deleteSelectedObj();
        }
      });
    }

    /* Text Tool */
    if ($('#text').is(':checked')) {
      $('.upper-canvas').addClass('text');

      $(document).on('mousemove', function (e) {
        ///console.info('CreateTextBox', e);
        textOption.left = e.pageX - 70;
        textOption.top = e.pageY;
      });

      $('.canvas-container').on('click', function (e) {
        e.preventDefault();
        createTextBox();
        textObject.hiddenTextarea.focus();
      });

    } else {
      $('.canvas-container').unbind('click');
      if (textObject) {
        textObject.exitEditing();
      }
      $('.upper-canvas').removeClass('text');
    }

    /* Send To Back Object */
    if ($('#sendBack').is(':checked')) {
      sendSelectedObjectBack();
      $(this).removeAttr('checked');
    }

    /* Bring To Front Object */
    if ($('#bringFront').is(':checked')) {
      sendSelectObjectToFront();
      $(this).removeAttr('checked');
    }
  });

  //Delete Selected Object by pressing delete key
  var deleteSelectedObj = function () {
    whiteBoard.remove(whiteBoard.getActiveObject());
  };

  //Drag Drop Events
  var canvasLeft = whiteBoard._offset.left;
  var canvasTop = whiteBoard._offset.top;
  var images = document.querySelectorAll('img');
  //Dragging Started here
  var handleDragStart = function (event) {
    [].forEach.call(images, function (img) {
      img.classList.remove('img_dragging');
    });
    this.classList.add('img_dragging');
  }

  //Dragging End
  var handleDragEnd = function (event) {
    event.target.style.opacity = "";

    /* Remove the Class Dragging from all the images */
    [].forEach.call(images, function (img) {
      img.classList.remove('img_dragging');
    });
  }

  //Item over the dragged ground
  var handleDragOver = function (event) {
    event.preventDefault();
    //event.dataTransfer.dropEffect = 'move';
  }

  var handleDragEnter = function (event) {
    var droppableGround = event.target;
    droppableGround.style.backgroundColor = 'rgba(191, 34, 151, 0.31)';
    this.classList.add('over');
  }

  var handleDragLeave = function (event) {
    var droppableGround = event.target;
    droppableGround.style.backgroundColor = '';
    this.classList.remove('over');
  }

  var handleDrop = function (event) {

    var droppedGround = event.target;
    event.stopPropagation();
    event.preventDefault();

    /* Dragging image from within the file */
    var img = document.querySelector('.img_dragging');
    droppedGround.style.backgroundColor = '';

    if (img) {
      var guidId = guid();
      var newImage = new fabric.Image(img, {
        width: img.width,
        height: img.height,
        left: event.offsetX,
        top: event.offsetY,
        originX: 'center',
        id: guidId
      });

      /* Pushing new object into the array of objArray */

      objArray.push({
        id: guidId,
        value: newImage,
        type: "image"
      });

      whiteBoard.add(newImage);

      socket.emit('added shape', newImage, {
        id: guidId
      });

      return false;
    } // End of dragging the image from the page

    /* Dragging Image from computer on the canvas */
    var draggedFiles = event.dataTransfer.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
      var imgObj = new Image();
      imgObj.src = event.target.result;
      imgObj.onload = function () {
        var image = new fabric.Image(imgObj);
        image.set({
          left: 250,
          top: 250,
          cornersize: 10
        });
        //image.scale(getRandomNum(0.1, 0.25)).setCoords();
        whiteBoard.add(image);
      }
    }
    reader.readAsDataURL(draggedFiles);
  };

  // Event Listener to draggable items
  [].forEach.call(images, function (img) {
    img.addEventListener('dragstart', handleDragStart, false);
    img.addEventListener('dragend', handleDragEnd, false);
  });

  //Event Listerner to the droppable ground
  var canvasContainer = document.querySelector('.upper-canvas');
  canvasContainer.addEventListener('dragover', handleDragOver, false);
  canvasContainer.addEventListener('dragenter', handleDragEnter, false);
  canvasContainer.addEventListener('dragleave', handleDragLeave, false);
  canvasContainer.addEventListener('drop', handleDrop, false);

  // File Uploader
  $('#uploader').on('click', function () {
    $(this).prop('type', 'file');
    $('input[type="file"]').hide();
    $('label[for="uploader"]').addClass('active');
  });

  // File Uploader
  document.getElementById('uploader').onchange = function handleImage(e) {
    var reader = new FileReader();

    reader.onload = function (event) {
      var imgObj = new Image();
      imgObj.src = event.target.result;
      imgObj.onload = function () {

        // start fabricJS stuff
        var image = new fabric.Image(imgObj);
        image.set({
          left: 250,
          top: 250,
          cornersize: 10
        });

        whiteBoard.add(image);
      }

    }
    reader.readAsDataURL(e.target.files[0]);
  };

  /* Stacking the objects */
  var selectedObject;
  whiteBoard.on('object:selected', function (event) {

    console.info('object Selected ', event);
    selectedObject = event.target;
  });
  var sendSelectedObjectBack = function () {
    whiteBoard.sendToBack(selectedObject);
  };
  var sendSelectObjectToFront = function () {
    whiteBoard.bringToFront(selectedObject);
  };

  /* Realtime Collaboration */

  whiteBoard.on('mouse:down', function (e) {
    var mouseBtnClicked = e.button;
    if (whiteBoard.isDrawingMode == true && mouseBtnClicked === 1) {

      var pathDrawn = e;
      console.info('PathDrawn ', pathDrawn);
      var guidId = guid();
      lineId = guidId;
      somefunction.currentLineId = guidId;
      socket.emit('draw started', {x: pathDrawn.e.layerX,y: pathDrawn.e.layerY}, {id: guidId});

    }
  });

  var mouseDown = false;
  whiteBoard.on('mouse:up', function (e) {
    mouseDown = false;
    if (whiteBoard.isDrawingMode == true) {
      var pathDrawn = e;
      var currentLine = lineId;
      lineId = {};

      socket.emit("draw finished", {x: e.e.clientX, y: e.e.clientY}, {
        id: currentLine
      });

    }
  });

  whiteBoard.on('mouse:down', function (e) {
    mouseDown = true;

  });

  whiteBoard.on('mouse:move', function (ev) {
    var mouseBtnClicked = ev.button;
    if (whiteBoard.isDrawingMode == true && mouseDown) {
      var pathDrawn = ev;
      socket.emit('draw move', {
        x: ev.e.offsetX,
        y: ev.e.offsetY
      }, {
        id: lineId
      });
    }
  });

  whiteBoard.on("path:created", function(opt){
    opt.path.id = lineId;
    objArray.push({
      id: lineId,
      value: opt.path,
      type: "line"
    })
});


  var ctx = whiteBoard.getContext('2d');
  var lineId = {};

  socket.on('draw started', function (data) {
    somefunction.currentLineId = data.id;

    var point = {
        x: data.coords.x,
        y: data.coords.y
      }
      somefunction._prepareForDrawing(point);

      whiteBoard.isDrawingMode = true;
      whiteBoard.freeDrawingBrush.color = '#ff0000';
      whiteBoard.freeDrawingBrush.width = 5;

      somefunction.color = '#ff0000';
      somefunction.width = 5;
      // somefunction.fill = true;

      whiteBoard.freeDrawingCursor = 'url(images/icons/pencil.png) 0 16, auto';

      somefunction._captureDrawingPath(point);
      somefunction._render();
  });

  socket.on('draw move', function (data) {
      somefunction._captureDrawingPath(data.coords);
      //somefunction.canvas.clearContext(somefunction.canvas.contextTop);
      somefunction._render();
  });

  socket.on('draw finished', function (data) {

    var pathObj = somefunction._finalizeAndAddPath();

    objArray.push({
      id: data.id,
      value: pathObj,
      type: "line"});

    console.info("line finished array", objArray);
    whiteBoard.isDrawingMode = false;
  });

  whiteBoard.on('object:modified', function (event) {
    console.info("event type", event)

    var originalArrayObjectModified = objArray.find(x => x.id === event.target.id);
    console.info("get object ", event.target.id, originalArrayObjectModified);
    if (originalArrayObjectModified !== undefined) {
      var objModified = event.target;
      var objId = objModified.id;

      console.info("modified ", objModified)
      socket.emit('shape modified', objModified, {
        id: objId
      });
      }
  });

  socket.on('shape modified', function (data) {
    var originalArrayObjectModified = objArray.find(x => x.id === data.id);
    console.info("originalArrayObjectModified", originalArrayObjectModified);
    if (originalArrayObjectModified !== undefined) {
      var originalObjectModified = originalArrayObjectModified.value;

      // Position
      originalObjectModified.setTop(data.shape.top);
      originalObjectModified.setLeft(data.shape.left);

      // Scaling
      originalObjectModified.setScaleX(data.shape.scaleX);
      originalObjectModified.setScaleY(data.shape.scaleY);

      // Rotation
      // NB!!!! do not use SetAngle Method as is has some weird output
      originalObjectModified.set('angle', data.shape.angle);
      originalObjectModified.setOriginX(data.shape.originX);
      originalObjectModified.setOriginY(data.shape.originY);

      originalObjectModified.setCoords();
      whiteBoard.renderAll();

    } else {
      console.info("cannot find element in obj array: ", objArray, data)
    }

  });

  socket.on('added shape', function (data) {
    var newImageObject = data.shape;
    var imageDom = document.createElement("img");
    imageDom.setAttribute("width", newImageObject.width);
    imageDom.setAttribute("height", newImageObject.height);
    imageDom.setAttribute("src", newImageObject.src);

    var newImage = new fabric.Image(imageDom, {
      width: newImageObject.width,
      height: newImageObject.height,
      left: newImageObject.left,
      top: newImageObject.top,
      id: data.id
    });

    objArray.push({
      id: data.id,
      value: newImage,
      type: "image"
    });

    whiteBoard.add(newImage);
  });

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  };

}());
