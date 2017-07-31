/*
  TODO LIST :
    1. DESELECT PENCIL STATE on click outside canvas




*/


(function () {
  'use strict';

  /* Creating Instance of Fabric */
  var whiteBoard = new fabric.Canvas('whiteboard', {
    backgroundColor: 'rgba(191, 34, 151, 0.31)',
    selection: false,
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
    console.info(obj);

    objInView(objBottom, objRight, obj);

  });

  whiteBoard.on('mouse:up', function (e) {
    panning = false;
    console.info('mouse up');
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

    console.info('obj right position ', obj.right);
    console.info('window width ', window.innerWidth);

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


  /* SAMPLE SHAPES */

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
      var newImage = new fabric.Image(img, {
        width: img.width,
        height: img.height,
        left: event.layerX,
        top: event.layerY,
        originX: 'center'
      });

      whiteBoard.add(newImage);
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


  $('#uploader').on('click', function () {
    $(this).prop('type', 'file');
    $('input[type="file"]').hide();
    $('label[for="uploader"]').addClass('active');
  });

  // File Uploader
  document.getElementById('uploader').onchange = function handleImage(e) {
    var reader = new FileReader();
    console.info(e);
    reader.onload = function (event) {
      console.log('fdsf');
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
        //image.scale(getRandomNum(0.1, 0.25)).setCoords();
        whiteBoard.add(image);

        // end fabricJS stuff
      }

    }
    reader.readAsDataURL(e.target.files[0]);
  }

  // Stacking the objects
  var selectedObject;

  whiteBoard.on('object:selected', function (event) {
    selectedObject = event.target;
  });

  var sendSelectedObjectBack = function () {
    whiteBoard.sendToBack(selectedObject);
  };

  var sendSelectObjectToFront = function () {
    whiteBoard.bringToFront(selectedObject);
  }

}());
