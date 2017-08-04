/*
  TODO LIST :
    1. DESELECT PENCIL STATE on click outside canvas
    2. This is a JS Dump. TODO structure the code
*/



(function () {
  'use strict';
  var socket = io.connect("https://canvas.tew-staging.com");
  var objArray = [];
  var lineId = {};
  var roomIdentifier;
  var roomNameIdentifier;
  var selectedObject;
  /* Creating Instance of Fabric */

  var whiteBoard = new fabric.Canvas('whiteboard', {
    backgroundColor: 'rgba(191, 34, 151, 0.31)',
    selection: false,
    //width: 1920,
    //height: 1000,
    width: window.innerWidth - 110,
    height: window.innerHeight - 135,
    preserveObjectStacking: true
  });

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

  var textObject = '';

var mousePosition ={
  left:0,
    top:0
};

  var startedCreatingTextObj = false;

  //TEXT Tool
  var createTextBox = function () {
    var textId = guid();
    var textOption = {
      fontFamily: 'Helvetica',
      fontSize: 20,
      fill: '#ff00ff',
      hasBorder: false,
      editable: true,
      id: textId,
      top: mousePosition.top,
      left: mousePosition.left
    };

    textObject = new fabric.IText('', textOption);
    console.info("created but not added to board", textObject);
    whiteBoard.add(textObject);

    console.info("added to board", textObject);
    //whiteBoard.centerObject(textObject);
    objArray.push({
      id: textId,
      value: textObject,
      type: "i-text"
    });

    console.info("added to array", textObject, objArray);

    whiteBoard.setActiveObject(textObject);
    textObject.selectAll();
    textObject.enterEditing();
    startedCreatingTextObj = true;
    textObject.hiddenTextarea.focus();

  };

  $("#CreateRoom").on("click", function (e) {
    var roomName = $('#roomName').val();
    roomNameIdentifier = roomName;
    socket.emit("create room", roomName);
  });

  $("#JoinRoom").on("click", function (e) {
    var roomName = $('#roomName').val();
    roomNameIdentifier = roomName;
    socket.emit("join room", roomName);
  });

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

      });
    }

    /* Text Tool */
    if ($('#text').is(':checked')) {
      $('.upper-canvas').addClass('text');

      $(document).on('mousemove', function (e) {
        ///console.info('CreateTextBox', e);
        mousePosition.left = e.pageX - 70;
        mousePosition.top = e.pageY;
      });

      $('.canvas-container').on('click', function (e) {
        e.preventDefault();

        if (startedCreatingTextObj == false) {
          createTextBox();
        }
      });

    } else {
      $('.canvas-container').unbind('click');
      if (textObject !== undefined) {
        textObject.exitEditing();
        textObject = undefined;
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
  var deleteSelectedObj = function (activeObject) {
    var deleteObj = activeObject;
    if (deleteObj !== undefined) {
      var deleteObjId = deleteObj.id;
      objArray.splice(1, deleteObj);
      whiteBoard.remove(deleteObj);
      socket.emit('delete object', {
        roomId: roomIdentifier,
        id: deleteObjId,
        roomName: roomNameIdentifier
      });
    }
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
        id: guidId,
        roomId: roomIdentifier,
        roomName: roomNameIdentifier
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
  whiteBoard.on('selection:cleared', function (event) {
    selectedObject = undefined;
    console.info("selection cleared", selectedObject);
  });

  whiteBoard.on('object:selected', function (event) {

    console.info('object Selected ', event);
    selectedObject = event.target;

    //Delete Obj
    $(document).on('keyup', function (e) {

      if (e.keyCode === 46) {
        if (selectedObject !== undefined) {
          deleteSelectedObj(selectedObject);
        }
      }

    });

  });
  var sendSelectedObjectBack = function () {
    whiteBoard.sendToBack(selectedObject);
  };
  var sendSelectObjectToFront = function () {
    whiteBoard.bringToFront(selectedObject);
  };

  /* Realtime Collaboration */
  var pathInProgress = false;

  whiteBoard.on('mouse:down', function (e) {
    var mouseBtnClicked = e.button;
    if (whiteBoard.isDrawingMode == true && mouseBtnClicked === 1) {
      lineId = guid();
      pathInProgress = true;
    }
  });

  whiteBoard.on('mouse:up', function (e) {

    if (whiteBoard.isDrawingMode == true) {
      lineId = {};
    }
  });

  whiteBoard.on('object:added', function (e) {
    if (pathInProgress == true) {
      e.target.id = lineId;
      objArray.push({
        id: lineId,
        value: e.target,
        type: "line"
      });

      pathInProgress = false;
      socket.emit("draw finished", e.target, {
        id: lineId,
        roomId: roomIdentifier,
        roomName: roomNameIdentifier
      });
    }

  });

  socket.on('draw finished', function (data) {

    var pathShape = data.shape;

    var path = new fabric.Path(pathShape.path, {
      fill: pathShape.fill,
      stroke: pathShape.stroke,
      strokeWidth: pathShape.strokeWidth,
      strokeLineCap: pathShape.strokeLineCap,
      strokeLineJoin: pathShape.strokeLineJoin,
      strokeDashArray: pathShape.strokeDashArray,
      originX: 'center',
      originY: 'center',
      id: data.id
    });

    objArray.push({
      id: data.id,
      value: path,
      type: "line"
    });

    whiteBoard.add(path);
    path.setCoords();
    whiteBoard.renderAll();
  });

  whiteBoard.on('object:modified', function (event) {
    console.info("modified ", event.target);

    console.info("modifying text ", startedCreatingTextObj, selectedObject, textObject);

    if (startedCreatingTextObj == true && ((selectedObject == undefined) || (selectedObject == textObject)) && (textObject !== undefined && textObject.text !== '')) {
      var textObjectToBeEmitted = objArray.find(x => x.id === event.target.id);
      console.info("we should emit updated text on creation textObjectToBeEmitted ", textObjectToBeEmitted);

      if (textObjectToBeEmitted !== undefined){
        startedCreatingTextObj = false;
        textObject.exitEditing();

        socket.emit('text add', textObject, {
          id: textObject.id,
          roomId: roomIdentifier,
          roomName: roomNameIdentifier
        });
        }
    }
    else if(textObject !== undefined && textObject.text === ''){
      whiteBoard.remove(textObject);
      objArray.splice(1, textObject);
    }
    else{
      var originalArrayObjectModified = objArray.find(x => x.id === event.target.id);

      if (originalArrayObjectModified !== undefined) {
        var objModified = event.target;
        console.info("objModified", objModified);
        var objId = objModified.id;
        socket.emit('shape modified', objModified, {
          id: objId,
          roomId: roomIdentifier,
          roomName: roomNameIdentifier
        });
      } else {
        console.info("objModified not found in array", objModified, objArray);
      }
    }

  });

  socket.on('shape modified', function (data) {

    var originalArrayObjectModified = objArray.find(x => x.id === data.id);

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

  socket.on('delete object', function (data) {
    var deletedId = data.id;
    var objToDelete = objArray.find(x => x.id === data.id);
    whiteBoard.remove(objToDelete.value);
    objArray.splice(1, objToDelete);
  });

  socket.on('text add', function (data) {
    var newTextObj = data.shape;
    var newITextOption = {
      fontFamily: newTextObj.fontFamily,
      fontSize: newTextObj.fontSize,
      fill: newTextObj.fill,
      hasBorder: newTextObj.hasBorder,
      editable: newTextObj.editable,
      id: data.id
    }
    var newIText = new fabric.IText(newTextObj.text, newITextOption);
    newIText.top = newTextObj.top;
    newIText.left = newTextObj.left;
    whiteBoard.add(newIText);
    newIText.setCoords();

    objArray.push({
      id: data.id,
      value: newIText,
      type: 'i-text'
    });
  });



  socket.on("room created", function (recordset) {
    roomIdentifier = recordset.recordset[0].roomId;
    roomNameIdentifier = recordset.recordset[0].roomName;
  });

  socket.on("room joined", function (recordset) {
    roomIdentifier = recordset.recordset[0].roomId;
    roomNameIdentifier = recordset.recordset[0].roomName;
    var firstObject = recordset.recordset[0].Object;

    if (firstObject !== undefined) {
      for (var i = 0; i < recordset.recordset.length; i++) {

        var record = recordset.recordset[i];
        var objId = record.objectId;
        var obj = JSON.parse(record.Object);
        var objType = obj.type;
        var objectToAdd;
        if (objType == "image") {
          var imageDom = document.createElement("img");
          imageDom.setAttribute("width", obj.width);
          imageDom.setAttribute("height", obj.height);
          imageDom.setAttribute("src", obj.src);

          objectToAdd = new fabric.Image(imageDom, {
            width: obj.width,
            height: obj.height,
            left: obj.left,
            top: obj.top,
            id: record.objectId
          });
        } else if (objType == "path") {
          objectToAdd = new fabric.Path(obj.path, {
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            strokeLineCap: obj.strokeLineCap,
            strokeLineJoin: obj.strokeLineJoin,
            strokeDashArray: obj.strokeDashArray,
            originX: 'center',
            originY: 'center',
            id: record.objectId,
            left: obj.left,
            top: obj.top
          });

        } else if (objType === 'i-text') {
          var newITextOption = {
            fontFamily: obj.fontFamily,
            fontSize: obj.fontSize,
            fill: obj.fill,
            hasBorder: obj.hasBorder,
            editable: obj.editable,
            id: record.objectId
          }
          objectToAdd = new fabric.IText(obj.text, newITextOption);
          objectToAdd.top = obj.top;
          objectToAdd.left = obj.left;
        }

        if (objectToAdd !== undefined) {

          // Position
          objectToAdd.setTop(obj.top);
          objectToAdd.setLeft(obj.left);

          // Scaling
          objectToAdd.setScaleX(obj.scaleX);
          objectToAdd.setScaleY(obj.scaleY);

          // Rotation
          // NB!!!! do not use SetAngle Method as is has some weird output
          objectToAdd.set('angle', obj.angle);
          objectToAdd.setOriginX(obj.originX);
          objectToAdd.setOriginY(obj.originY);

          objArray.push({
            id: record.objectId,
            value: objectToAdd,
            type: objType
          });
          whiteBoard.add(objectToAdd);
          objectToAdd.setCoords();
        }
      }
    }
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
