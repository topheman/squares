/*!
 * TophemanSquares
 * http://squares.topheman.com/
 *
 * Copyright 2012, Christophe Rosset (Topheman)
 * http://blog.topheman.com/
 * http://twitter.com/topheman
 *
 * GameManager.js
 * Bootstrap of TophemanSquares game that manages
 * - player inputs
 * - loops
 * - collisions
 * - screen refresh
 * - ...
 */
var GameManager = function(canvas){

    //privates vars
    var _intervalId         = false;
    var _isPaused           = false;
    var _canvas             = canvas;
    var _iterator           = 0;//private to stop the loop in debug mode
    var _level              = 0;
    var _score              = 0;
    var _scoreRatio         = 0;
    var _highScoresManager  = null;
    var _flashMessages      = [];
    var _directionKeyBuffer;
    var _canvasHeight,_canvasWidth,_ctx,_enemies,_player,_originalTrailArea,_flagGoToNextLevel,_rings,_lives;
    
    //privates constantes
    var PLAYER_SPEED        = 4;
    var PLAYER_EDGE_SPEED   = 2;
    var PLAYER_SIZE         = 3;
    var PLAYER_COLOR        = 'blue';
    var PLAYER_CATCHING_COLOR = '#c400ad'
    var ENEMY_SPEED         = 4;
    var ENEMY_SIZE          = 3;
    var ENEMY_COLOR         = 'red';
    var ENEMY_NUMBER_STEP   = 4;//add an enemy each ENEMY_NUMBER_STEP level
    var RING_SIZE           = 3;
    var RING_COLOR          = '#d17300';
    var RING_APPEARS_CYCLE  = 50;//a ring appears each RING_CYCLE seconds
    var PLAYER_CATCHING_ABILITY_DURATION = 7;//each time player gets a ring he has the catchingAbility for PLAYER_CATCHING_ABILITY_DURATION more seconds
    var EDGE_COLOR          = PLAYER_COLOR;
    var EDGE_BORDER_WIDTH   = 2;
    var TRAIL_COLOR         = 'black';//'red';
    var TRAIL_BORDER_WIDTH  = 2;
    var TRAIL_BACKGROUND_COLOR = 'white';
    var INTERVAL_REFRESH    = 30;//ms
    var FLASH_MESSAGE_DURATION = 75;//number of loops a flash message will stay displayed
    var SHAPE_BORDER_COLOR  = 'black';//'orange';
    var SHAPE_BORDER_WIDTH  = 2;
    var DEBUG               = false;
    var RATIO_TO_REACH      = 80;
    var ENEMY_CAUGHT_BONUS  = 2000;
    var GLOBAL_COLOR        = '#900000';
    var HIGH_SCORES_NUMBER_TO_SAVE = 15;
    var LIVES_AT_START      = 3;
    var VERSION             = '1.0.1';
    
    //public attributes
    this.EDGE_COLOR         = EDGE_COLOR;
    this.EDGE_BORDER_WIDTH  = EDGE_BORDER_WIDTH;
    this.shapes,this.trail,this.edge;

    /**
     * Called by TophemanSquares
     */
    this.init = function(){
        this.initCanvas();
        this.initScoreManager();
        this.initWelcomeSreens();
    }
    
    this.initCanvas = function(){
        console.info('GameManager.init');
        if (_canvas.getContext) {
            _ctx = _canvas.getContext("2d");
        }
        else{
            alert("Sorry, your browser doesn't support canvas. Topheman Squares only works with recent browsers.");
        }
        _canvasHeight   = _canvas.height;
        _canvasWidth    = _canvas.width;
        $(_canvas).css('background-color', '#EFEFEF');
    }
    
    this.initScoreManager = function(){
        _highScoresManager = new HighScoresManager(HIGH_SCORES_NUMBER_TO_SAVE);
    }
    
    /**
     * Manages the Welcome screens (only appears once)
     */
    this.initWelcomeSreens = function(){
        this.initWelcomeScreen();
    }    
    
    /**
     * Reinitialize score, level ... from previous games
     */
    this.startGame = function(){
        //removes previous event listeners left from the welcome screens
        removeAllWelcomeScreensEventListeners();
        _lives = LIVES_AT_START;
        _iterator = 0;
        _level  = 0;
        _score  = 0;
        this.nextLevel();
    }

    /**
     * Launches a whole new level
     */
    this.nextLevel = function(){
        //remove controls / stopLoop before flashing message
        this.removeKeyboardControls();
        if(_intervalId != false)
            this.stopLoop();
        
        //update level
        _level++;
        
        //flash message
        var that = this;
        displayScreenMessage(drawLevelMessage, 1500, function(){
            that.prepareAndStartLevel();
        })
    }
    
    this.prepareAndStartLevel = function(){
        this.resetLevel();
        updateLivesDisplay();
        updateLevelDisplay();
        updateScoreDisplay();
        this.resume();
        addFlashMessage(drawLiveNumber);
    }

    this.resetLevel = function(){
        _directionKeyBuffer = '';//flush the directionKeyBuffer
        _flagGoToNextLevel = false;
        _scoreRatio     = 0;
        _rings          = [];
        _flashMessages  = [];
        this.shapes 	= [];
        this.trail      = [];
        this.edge	= false;
        this.prepareFirstTrail();
        this.preparePlayer();
        this.prepareEnemies();
    }

    /**
     * Adds the keyboard event listeners + starts the loop
     */
    this.resume = function(){
        this.initPlayingKeyBoardControls();
        this.startLoop();
    }

    /**
     * Manages the pause
     * - If not paused :
     *      - removes the playing keyboard event listeners
     *      - adds the pause keyboard event listeners
     *      - stops the loop
     * - If paused
     *      - restores the playing keyboard event listeners
     *      - resumes the loop
     */
    this.pause = function(){
        if(_isPaused == true){
            this.removeKeyboardControls();
            _isPaused = false;
            this.resume();
        }
        else{
            this.removeKeyboardControls();
            this.initPauseKeyBoardControls();
            _isPaused = true;
            this.stopLoop();
            //afficher un message pause
            drawPauseMessage();
        }
    }
    
    function retrieveKeyboardCode(event){
        return event.metaKey ? 'meta' : (event.keyCode ? event.keyCode : event.which ? event.which : event.charCode);
    }

    /**
     * Manages the keyDown event listener passed by argument and fills the _directionKeyBuffer which will be processed inside this.loop
     */
    this.manageKeyDown = function(event){
        var key = retrieveKeyboardCode(event);
        if(event.ctrlKey && key == '17'){
            _player.pause();
        }
        else if(event.ctrlKey && key != '17'){
            _player.resume();
        }
        switch(key) {
            case HotKeys.U:
                _directionKeyBuffer = 'U';
                break;
            case HotKeys.D:
                _directionKeyBuffer = 'D';
                break;
            case HotKeys.L:
                _directionKeyBuffer = 'L';
                break;
            case HotKeys.R:
                _directionKeyBuffer = 'R';
                break;
        }
    }
    /**
     * Manages the keyPress event listener passed by argument
     * Only for :
     * - spacebar -> toggles player direction
     * - s -> pauses
     */
    this.manageKeyPress = function(event){
        var key = retrieveKeyboardCode(event);
//        console.info('keyPress');
        switch(key) {
            // User pressed space bar
            case HotKeys.spaceBar:
                _player.toggleTrailDirection(this.trail);
                break;
            // User pressed "P"
            case HotKeys.Pause:
                this.pause();
                break;
            break;
        }
    }


    /**
     * Manages the keyUp event listener passed by argument
     * If thats a direction key, flushes the _directionKeyBuffer (you stop moving when you don't press on the keyboard anymore)
     * If thats a ctrl key, resumes the player
     */
    this.manageKeyUp = function(event){
        var key = retrieveKeyboardCode(event);
        if(key == 17 || key == 224)
            _player.resume();
        if(key == HotKeys.U && _directionKeyBuffer == 'U' || 
                key == HotKeys.L && _directionKeyBuffer == 'L' || 
                key == HotKeys.D && _directionKeyBuffer == 'D' || 
                key == HotKeys.R && _directionKeyBuffer == 'R')
            _directionKeyBuffer = '';
    }

    /**
     * Adds the keyboard event listeners (playing mode)
     */
    this.initPlayingKeyBoardControls = function(){
        var that = this;
        $(document).keydown(function(e){
            that.manageKeyDown(e);
        });
        $(document).keypress(function(e){
            that.manageKeyPress(e);
        });
        $(document).keyup(function(e){
            that.manageKeyUp(e);
        });
    }

    /**
     * Adds the keyboard event listeners (pause mode)
     */
    this.initPauseKeyBoardControls = function(){
        var that = this;
        $(document).keypress(function(event){
            var key = retrieveKeyboardCode(event);
            switch(key) {
                // User pressed "S"
                case HotKeys.Pause:
                    that.pause();
                break;
            }
        });

    }

    /**
     * Removes all keyboard event listeners
     */
    this.removeKeyboardControls = function(){
        $(document).unbind('keypress');
        $(document).unbind('keydown');
        $(document).unbind('keyup');
    }

    this.startLoop = function(){
        _intervalId = setInterval(TophemanSquares.loop, INTERVAL_REFRESH);
    }

    this.stopLoop = function(){
        clearInterval(_intervalId);
        _intervalId = false;
    }
    
    /**
     * loop method (called by TophemanSquares function)
     */
    this.loop = function(){
        var i;//iterators declaration
        _iterator++;
        //check collisions/edge (finishing the edge or cutting the edge)
        if(_player.onTrail == false){
            var propOnTrailBorder = this.trail.isPropOnBorder(_player, true, this.edge);
            if(propOnTrailBorder != false){
                _player.x = propOnTrailBorder.x;
                _player.y = propOnTrailBorder.y;
                this.splitTrail();
//                console.info('previousDotId',_enemies[0].previousDotId,_enemies[0].previousDotId,'nextDotId',_enemies[0].nextDotId,_enemies[0].nextDotId,'x',_enemies[0].x,'y',_enemies[0].y);
            }
            if(this.edge){
                var propOnEdgeBorder = this.edge.isPropOnBorder(_player, false);
                if(propOnEdgeBorder != false){
                    _player.x = propOnEdgeBorder.x;
                    _player.y = propOnEdgeBorder.y;
                    //an edge collision is game over (even if you have all your lives)
                    this.gameOver();
                    return false;
                }
            }
        }

        
        //check if the level has changed in splitTrail or if ratio has been reach
        if(_flagGoToNextLevel === true){
            this.nextLevel();
            return false;
        }
        
        //check collision with rings
        if(_rings.length > 0)  
            for(i=_rings.length-1;i>=0;i--){
                if(_rings[i].checkCollision(_player)){
//                    console.info('>RING COLLISION',i,'_player.catchingAbility',_player.catchingAbility);
                    //add number of cycles of loop the player will have the catchingAbility
                    _player.catchingAbility = (PLAYER_CATCHING_ABILITY_DURATION*1000)/INTERVAL_REFRESH;
                    addFlashMessage(drawCatchingAbility);
                    //remove the ring
                    _rings.splice(i, 1);
//                    console.info('<RING COLLISION',i,'_player.catchingAbility',_player.catchingAbility);
                }
            }

        //manage player catching ability
        if(_player.catchingAbility > 0){
            _player.catchingAbility--;
        }
        
        //add rings if it's time to
        this.addRing();
        
        //check collision/ennemies vs player
        if(_player.onTrail == true){
            for(i=0;i<_enemies.length;i++){
                if(_enemies[i].checkCollision(_player)){
                    console.info('COLLISION !!!');
                    if(this.removeLive() === false){
                        this.gameOver();
                        return false;
                    }
                }
            }
        }
        //check collision/ennemies vs startEdge
        else{
            var edgeDotTest;
            for(i=0;i<_enemies.length;i++){
                edgeDotTest = this.edge.dots[0];
                edgeDotTest.previousX = edgeDotTest.x;
                edgeDotTest.previousY = edgeDotTest.y;
                if(_enemies[i].checkCollision(edgeDotTest)){
                    console.info('START EDGE COLLISION !!!');
                    if(this.removeLive() === false){
                        this.gameOver();
                        return false;
                    }
                }
            }
        }

        //moving player
        if(_player.onTrail == true && _player.onTrailStay == false)
            _player.followTrail(this.trail);
        if(typeof(_directionKeyBuffer) != 'undefined' && _directionKeyBuffer != ''){
            _player.go(_directionKeyBuffer,this);
        }
        
        //moving enemies
        for(i=0;i<_enemies.length;i++){
            if(_enemies[i].caught != true)
                _enemies[i].followTrail(this.trail);
        }

        //drawing/clear
//        if(_iterator%4 == 0) 
            clearGameContext();

        //drawing/trail
        this.trail.draw(_ctx,DEBUG);
        //drawing/shapes
        for(i=0;i<this.shapes.length;i++){
            this.shapes[i].draw(_ctx);
        }
        //drawing/edge
        if(_player.onTrail == false)
            this.edge.drawLine(_ctx,_iterator%20 > 10);

        //drawing/player
        if(_player.catchingAbility > 0)
            _player.draw(_ctx,_iterator%8 > 4, PLAYER_CATCHING_COLOR);
        else
            _player.draw(_ctx,_iterator%20 > 10);
            

        //drawing/enemies
        if(_enemies.length > 0)
            for(i=0;i<_enemies.length;i++){
                _enemies[i].draw(_ctx,_iterator%20 > 10);
            }
        
        //drawing rings
        if(_rings.length > 0)
            for(i=0;i<_rings.length;i++){
                //if a ring just been added, we flash it
                if(_rings[i].freshNess > 0){
                    _rings[i].draw(_ctx,_rings[i].freshNess*12);
                    _rings[i].freshNess--;
                    //if the ring is on the bottom part, we have to clear the drawings it did out of the game context
                    clearInfosContext();
                    updateLivesDisplay();
                    updateLevelDisplay();
                    updateScoreDisplay();
                }
                else{
                    _rings[i].draw(_ctx,_iterator%20 > 10);
                }
            }
        
        //drawing flash messages if exist
        drawFlashMessages();
        
        //manage the duration of the flashMessages
        if(_flashMessages.length > 0)
            for(i=0;i<_flashMessages.length;i++){
                _flashMessages[i].display--;
            }
        
        //remove the expired flashMessages
        if(_flashMessages.length > 0)
            for(i=_flashMessages.length-1;i>=0;i--){
                if(_flashMessages[i].display < 0)
                    _flashMessages.splice(i,1);
            }
    }
    
    this.splitTrail = function(){
        console.info('spliTrail');
        var i;//iterators
        //const - types of split
        var SAME_EDGE_TYPE_SPLIT        = 2;
        var ADJACENT_EDGE_TYPE_SPLIT    = 3;
        var DIFFERENT_EDGE_TYPE_SPLIT   = 4;
        
        var shape1 = new Shape(SHAPE_BORDER_COLOR,SHAPE_BORDER_WIDTH);
        var shape2 = new Shape(SHAPE_BORDER_COLOR,SHAPE_BORDER_WIDTH);
        var newTrail, newShape, shape1Area, shape2Area, newShapeArea, newTrailArea;
        //shape on the same edge of the trail
        if(this.getSplitTrailType() === SAME_EDGE_TYPE_SPLIT){
            this.createNewShapesSame(shape1, shape2);
        }
        //shape on adjacent edges of the trail
        else if(this.getSplitTrailType() === ADJACENT_EDGE_TYPE_SPLIT){
            this.createNewShapesAdjacent(shape1, shape2);
        }
        else{
            this.createNewShapeDifferent(shape1, shape2);
        }
        
        //dispatch between shapes and trail
        shape1Area = shape1.computeArea();
        shape2Area = shape2.computeArea();
        if(shape1Area > shape2Area){
            newTrail = shape1;
            newShape = shape2;
        }
        else{
            newTrail = shape2;
            newShape = shape1;
        }
        
        //add score
        newShapeArea = newShape.computeArea();
        newTrailArea = newTrail.computeArea();
        var newScore = Math.ceil(Math.pow(newShapeArea/50,1.2));
        _score = newScore + _score;
        _scoreRatio = 100*((_originalTrailArea-newTrailArea)/_originalTrailArea);
        
        //next level if area reached
        if(_scoreRatio > RATIO_TO_REACH){
            _flagGoToNextLevel = true;
            return false;
        }
        
        //add Shape / add Trail / place the player on the new trail
        this.manageNewTrailAndShape(newTrail,newShape);
        
        //add score bonus if check if enemeny is inside newShape
        var enemiesClone = $.extend(true,[],_enemies);
//        console.info('BEFORE TEST ENEMY CAUGHT BONUS','_enemies',enemiesClone);
        for(i=enemiesClone.length-1;i>=0;i--){
            if(enemiesClone[i].caught == true){
//                console.info('>ENEMY CAUGHT BONUS',i,'_enemies',_enemies);
                _enemies.splice(i, 1);
                _score = _score + ENEMY_CAUGHT_BONUS*_level;
//                console.info('>>ENEMY CAUGHT BONUS',i,'_enemies',_enemies);
            }
        }
//        console.info('AFTER TEST ENEMY CAUGHT BONUS','_enemies',_enemies,'_player',_player);
        
        //stop game if no more enemies
        if(_enemies.length == 0){
            _flagGoToNextLevel = true;
            return false;
        }
        
        //rings management
        if(_rings.length > 0)
            for(i=_rings.length-1;i>=0;i--){
                //if the ring was wasted by drawing a shape around it, we remove it
                if(_rings[i].wasted == true){
                    _rings.splice(i, 1);
                }
            }
        
        //update score display
        updateScoreDisplay();
            
        if(shape1 && shape2){
            shape1.dumpDots(1);
            shape2.dumpDots(2);
        }
        
    }

    /**
     * To know which type of splitTrail your on
     * Compare with : SAME_EDGE_TYPE_SPLIT, ADJACENT_EDGE_TYPE_SPLIT, DIFFERENT_EDGE_TYPE_SPLIT from this.splitTrail
     * @return int
     */
    this.getSplitTrailType = function(){
        var o = {};
        o['r'+this.edge.dotsFromIds[0]] = true;
        o['r'+this.edge.dotsToIds[0]] = true;
        o['r'+this.edge.dotsFromIds[1]] = true;
        o['r'+this.edge.dotsToIds[1]] = true;
        var j=0;
        for(var a in o) j++;
        return j;
    }

    this.createNewShapesSame = function (shape1, shape2){
        var reverse, dotIdFrom, dotIdTo;
        if(this.edge.dotsFromIds[0] == this.edge.dotsToIds[0] && this.edge.dotsFromIds[1] == this.edge.dotsToIds[1]){
            dotIdFrom = this.edge.dotsFromIds[1];
            dotIdTo = this.edge.dotsToIds[0];
        }
        else{
            dotIdFrom = this.edge.dotsFromIds[0];
            dotIdTo = this.edge.dotsToIds[0];
        }
        var rangeStartEdgeDotIdFrom = this.edge.dots[0].range(this.trail.dots[dotIdFrom]);
        var rangeStopEdgeDotIdFrom = this.edge.dots[this.edge.dots.length-1].range(this.trail.dots[dotIdFrom]);
        var rangeStartEdgeDotIdTo = this.edge.dots[0].range(this.trail.dots[dotIdTo]);
        var rangeStopEdgeDotIdTo = this.edge.dots[this.edge.dots.length-1].range(this.trail.dots[dotIdTo]);

        if(rangeStartEdgeDotIdFrom > rangeStopEdgeDotIdFrom){
            reverse = false;
        }
        else{
            reverse = true;
        }
        //internal shape
        this.edge.dots.foreachLoopBack(function(dot,index){
            shape1.addDot(dot);
        });
        //external shape
        this.trail.dots.foreachLoopBack(function(dot,index){
            shape2.addDot(dot);
        },reverse,dotIdFrom,dotIdTo);
        this.edge.dots.foreachLoopBack(function(dot,index){
            shape2.addDot(dot);
        });
    }

    this.createNewShapesAdjacent = function (shape1, shape2){
        var dotIdFromShapeExternal, dotIdToShapeExternal, dotIdShapeInternal;
        var tmpDotIdFromShapeExternal, tmpDotIdToShapeExternal;
        var reverse;
        //specify the dots on the middle of the adjacent edges and the dots on the outside
        if(this.edge.dotsFromIds[0] == this.edge.dotsToIds[0]){
            dotIdFromShapeExternal = this.edge.dotsFromIds[1];
            dotIdToShapeExternal = this.edge.dotsToIds[1];
            dotIdShapeInternal = this.edge.dotsFromIds[0];
            reverse = false;
        }
        else if(this.edge.dotsFromIds[1] == this.edge.dotsToIds[1]){
            dotIdFromShapeExternal = this.edge.dotsFromIds[0];
            dotIdToShapeExternal = this.edge.dotsToIds[0];
            dotIdShapeInternal = this.edge.dotsFromIds[1];
            reverse = true;
        }
        else if(this.edge.dotsFromIds[0] == this.edge.dotsToIds[1]){
            dotIdFromShapeExternal = this.edge.dotsFromIds[1];
            dotIdToShapeExternal = this.edge.dotsToIds[0];
            dotIdShapeInternal = this.edge.dotsFromIds[0];
            reverse = true;
        }
        else if(this.edge.dotsFromIds[1] == this.edge.dotsToIds[0]){
            dotIdFromShapeExternal = this.edge.dotsFromIds[0];
            dotIdToShapeExternal = this.edge.dotsToIds[1];
            dotIdShapeInternal = this.edge.dotsFromIds[1];
            reverse = false;
        }
        //sort the dots before loop
        if(dotIdShapeInternal == 0 || dotIdShapeInternal == this.trail.dots.length - 1){
            tmpDotIdFromShapeExternal   = (dotIdFromShapeExternal < dotIdToShapeExternal ? dotIdFromShapeExternal : dotIdToShapeExternal);
            tmpDotIdToShapeExternal     = (dotIdFromShapeExternal > dotIdToShapeExternal ? dotIdFromShapeExternal : dotIdToShapeExternal);
            dotIdFromShapeExternal = tmpDotIdFromShapeExternal;
            dotIdToShapeExternal = tmpDotIdToShapeExternal;
        }
        else{
            tmpDotIdFromShapeExternal   = (dotIdFromShapeExternal > dotIdToShapeExternal ? dotIdFromShapeExternal : dotIdToShapeExternal);
            tmpDotIdToShapeExternal     = (dotIdFromShapeExternal < dotIdToShapeExternal ? dotIdFromShapeExternal : dotIdToShapeExternal);
            dotIdFromShapeExternal = tmpDotIdFromShapeExternal;
            dotIdToShapeExternal = tmpDotIdToShapeExternal;
        }
        //internal shape
        this.edge.dots.foreachLoopBack(function(dot,index){
            shape1.addDot(dot);
        });
        shape1.addDot(this.trail.dots[dotIdShapeInternal]);
        //external shape
        this.trail.dots.foreachLoopBack(function(dot,index){
            shape2.addDot(dot);
        },false,dotIdFromShapeExternal,dotIdToShapeExternal);
        this.edge.dots.foreachLoopBack(function(dot,index){
            shape2.addDot(dot);
        },reverse);
    }
    
    this.createNewShapeDifferent = function(shape1,shape2){
        var shapesDotsConf = {
            shape1:{
                dotIdFrom   :null,
                dotIdTo     :null,
                reverse     :null
            },
            shape2:{
                dotIdFrom   :null,
                dotIdTo     :null,
                reverse     :null
            }
        };
        var dotFromIds = this.edge.dotsFromIds;
        var dotToIds = this.edge.dotsToIds;
        dotFromIds.sort(function(a,b){return a-b;});//numerical sort
        dotToIds.sort(function(a,b){return a-b;});//numerical sort
        //if we start on the last edge of the trail, specific treatment
        if(jQuery.inArray(0, this.edge.dotsFromIds) != -1 && jQuery.inArray(this.trail.dots.length-1, this.edge.dotsFromIds) != -1){
            shapesDotsConf.shape1.dotIdFrom = 0;
            shapesDotsConf.shape1.dotIdTo = dotToIds[0];
            shapesDotsConf.shape1.reverse = true;
            shapesDotsConf.shape2.dotIdFrom = dotToIds[1];
            shapesDotsConf.shape2.dotIdTo = this.trail.dots.length-1;
            shapesDotsConf.shape2.reverse = false;
        }
        //if we stop on the last edge of the trail, specific traetment
        else if(jQuery.inArray(0, this.edge.dotsToIds) != -1 && jQuery.inArray(this.trail.dots.length-1, this.edge.dotsToIds) != -1){
            shapesDotsConf.shape1.dotIdFrom = 0;
            shapesDotsConf.shape1.dotIdTo = dotFromIds[0];
            shapesDotsConf.shape1.reverse = false;
            shapesDotsConf.shape2.dotIdFrom = dotFromIds[1];
            shapesDotsConf.shape2.dotIdTo = this.trail.dots.length-1;
            shapesDotsConf.shape2.reverse = true;
        }
        //if we start on the first edge of the trail, specific treatment
        else if(jQuery.inArray(0, this.edge.dotsFromIds) != -1 && jQuery.inArray(1, this.edge.dotsFromIds) != -1){
            shapesDotsConf.shape1.dotIdFrom = 1;
            shapesDotsConf.shape1.dotIdTo = dotToIds[0];
            shapesDotsConf.shape1.reverse = true;
            shapesDotsConf.shape2.dotIdFrom = dotToIds[1];
            shapesDotsConf.shape2.dotIdTo = 0;
            shapesDotsConf.shape2.reverse = false;
        }
        //if we stop on the first edge of the trail, specific traetment
        else if(jQuery.inArray(0, this.edge.dotsToIds) != -1 && jQuery.inArray(1, this.edge.dotsToIds) != -1){
            shapesDotsConf.shape1.dotIdFrom = 1;
            shapesDotsConf.shape1.dotIdTo = dotFromIds[0];
            shapesDotsConf.shape1.reverse = false;
            shapesDotsConf.shape2.dotIdFrom = dotFromIds[1];
            shapesDotsConf.shape2.dotIdTo = 0;
            shapesDotsConf.shape2.reverse = true;
            
        }
        //default
        else{
            shapesDotsConf.shape1.dotIdFrom = dotToIds[1];
            shapesDotsConf.shape1.dotIdTo = dotFromIds[0];
            shapesDotsConf.shape1.reverse = false;
            shapesDotsConf.shape2.dotIdFrom = dotFromIds[1];
            shapesDotsConf.shape2.dotIdTo = dotToIds[0];
            shapesDotsConf.shape2.reverse = true;
        }
        this.createNewShapeDifferent_makeShape(shape1,shapesDotsConf.shape1);
        this.createNewShapeDifferent_makeShape(shape2,shapesDotsConf.shape2);
    }
    
    /**
     * Only called inside this.createNewShapeDifferent()
     * @param shape Shape
     * @param dotsConf Object
     */
    this.createNewShapeDifferent_makeShape = function(shape,dotsConf){
        this.trail.dots.foreachLoopBack(function(dot,index){
            shape.addDot(dot);
        }, false, dotsConf.dotIdFrom, dotsConf.dotIdTo);
        this.edge.dots.foreachLoopBack(function(dot,index){
            shape.addDot(dot);
        }, dotsConf.reverse);
        
    }

    /**
     * Performs multiple tasks 
     * - pushing the newTrail and newShape on the right place
     * - resetting previous and next dotIds of the player and enemies on the newTrail
     */
    this.manageNewTrailAndShape = function (newTrail,newShape){
//        console.info('manageNewTrailAndShape');
        var i,j,k;//iterators declaration
        var playerPreviousDotId, playerNextDotId,enemyPreviousDotId,enemyNextDotId,reverse, enemyInside;
        //push the new shapes with the others
        this.shapes.push(newShape);

        //manage the previousDotId / nextDotId of _player
        newTrail.dots.foreachLoopBack(function(dot,index){
            if(dot.x == _player.x && dot.y == _player.y){
                playerPreviousDotId = index;
                return false;
            }
        })
        i=0;
        newTrail.dots.foreachLoopBack(function(dot,index){
            if(i > 0){
                playerNextDotId = index;
                return false;
            }
            i++;
        },false,playerPreviousDotId)
        
        //to ensure the player continues the right way after finishing the shape (not so sure about this algo)
        if(playerNextDotId > playerPreviousDotId && newTrail.dots[playerNextDotId-2])
            playerNextDotId = playerNextDotId-2;
                
        //manage the previousDotId / nextDotId of _enemies
//        console.info('FOR LOOP','newTrail',newTrail,newTrail.dots.length);
        for(i=0;i<_enemies.length;i++){
            enemyPreviousDotId = null;
            enemyNextDotId = null;
            enemyInside = false;
            //check if enemy is inside
            enemyInside = newShape.isDotInside(_enemies[i]);
            //the enemy has been caught
            if(enemyInside === true && _player.catchingAbility > 0){
                console.info('ENEMY CAUGHT !!! (splitTrail)',i,'_enemies',_enemies);
                _enemies[i].caught = true;
                addFlashMessage(drawEnemyCaught);
            }
            //the enemy is inside but we don(t have teh ability of catchung it
            else if(enemyInside === true && _player.catchingAbility <= 0){
                _enemies[i].caught = false;
                console.info('>ENEMY INSIDE CAN\'T CATCH IT !!!',i,'_enemies',_enemies);
                randomlyPositionPropOnTrail(_enemies[i], newTrail, [playerPreviousDotId,playerNextDotId]);
                console.info('<ENEMY INSIDE CAN\'T CATCH IT !!! (splitTrail)',i,'_enemies',_enemies,'enemyPreviousDotId',enemyPreviousDotId,'enemyNextDotId',enemyNextDotId);
                addFlashMessage(drawEnemyStillOut);
            }
            //the enemy is still out
            else{
                _enemies[i].caught = false;
//                console.info('ENEMY STILL OUT !!!',i,'_enemies['+i+'].previousDotId',_enemies[i].previousDotId,'_enemies['+i+'].nextDotId',_enemies[i].nextDotId,'_enemies['+i+'].previousDot',_enemies[i].previousDot,'_enemies['+i+'].nextDot',_enemies[i].nextDot);
                //if they are on different edge
                for(j=0;j<newTrail.dots.length;j++){
                    if(newTrail.dots[j].equals(_enemies[i].previousDot)){
                        enemyPreviousDotId = j;
                    }
                    if(newTrail.dots[j].equals(_enemies[i].nextDot)){
                        enemyNextDotId = j;
                    }
//                    console.info('enemyPreviousDotId',enemyPreviousDotId,'enemyNextDotId',enemyNextDotId);
                }
//                console.info('first try','enemyPreviousDotId',enemyPreviousDotId,'enemyNextDotId',enemyNextDotId);
                //if the enemy and the player are on the same edge (the player cuts the enemy edge)
//                console.info('test same edge','enemydots',_enemies[i].previousDotId,_enemies[i].nextDotId,'player cut dotids',this.edge.dotsFromIds,this.edge.dotsToIds);
                if( 
                ($.inArray(_enemies[i].previousDotId, this.edge.dotsToIds) != -1 && $.inArray(_enemies[i].nextDotId, this.edge.dotsToIds) != -1) 
                || ($.inArray(_enemies[i].previousDotId, this.edge.dotsFromIds) != -1 && $.inArray(_enemies[i].nextDotId, this.edge.dotsFromIds) != -1)
                ){
                    console.info('CUTTING !!!','enemyPreviousDotId',enemyPreviousDotId,'enemyNextDotId',enemyNextDotId);
                    if(_enemies[i].previousDotId < _enemies[i].nextDotId || (_enemies[i].previousDotId == this.trail.dots.length -1 && _enemies[i].nextDotId == 0) ){
                        reverse = false;
                    }
                    else{
                        reverse = true;
                    }
                    if(enemyNextDotId == null && enemyPreviousDotId != null){
//                        console.info('IF 1','i',i);
                        k=0;
                        newTrail.dots.foreachLoopBack(function(dot,index){
                            if(k>0){
                                enemyNextDotId = index;
                                return false;
                            }
//                            console.info('index',index);
                            k++;
                        }, reverse, enemyPreviousDotId);
                    }
                    else if(enemyPreviousDotId == null && enemyNextDotId != null){
//                        console.info('IF 2','i',i);
                        k=0;
                        newTrail.dots.foreachLoopBack(function(dot,index){
                            if(k>0){
                                enemyPreviousDotId = index;
                                return false;
                            }
//                            console.info('index',index);
                            k++;
                        }, reverse, enemyNextDotId);
                    }
                    else{
//                        console.info('IF 3','i',i);
                        var dotIdBase,dotIdTarget;
                        if(reverse == false)
                            dotIdBase = enemyPreviousDotId;
                        else
                            dotIdBase = enemyNextDotId;
                        k=0;
                        newTrail.dots.foreachLoopBack(function(dot,index){
                            if(k>0){
                                dotIdTarget = index;
                                return false;
                            }
//                            console.info('index',index);
                            k++;
                        }, reverse, dotIdBase);
                        if(reverse == false)
                            enemyNextDotId = dotIdTarget;
                        else
                            enemyPreviousDotId = dotIdTarget;
                    }
                    //fallback if the enemy is not between the previous and next dotIds ... the nextDotId is recalculated ...
                    //this bug occurs very little times ... but it occurs however ...
                    var test = _enemies[i].isBetween(newTrail.dots[enemyPreviousDotId], newTrail.dots[enemyNextDotId]);
//                    console.info('beforeIsBetween',test);
                    if(test === false){
                        var fallBack_break = false;
                        var fallBackDotIdFromLoopSearch, fallbackDotIdToLoopSearch;
                        for(k=0;k<newTrail.dots.length;k++){
                            fallBackDotIdFromLoopSearch = k;
                            fallbackDotIdToLoopSearch = (k+1)%newTrail.dots.length;
//                            console.info('fallBack','fallBackDotIdFromLoopSearch',fallBackDotIdFromLoopSearch,'fallbackDotIdToLoopSearch',fallbackDotIdToLoopSearch);
                            if(fallBack_break === false && _enemies[i].isBetween(newTrail.dots[fallBackDotIdFromLoopSearch],newTrail.dots[fallbackDotIdToLoopSearch]) !== false){
                                if(enemyPreviousDotId == null && enemyNextDotId != null){
                                    enemyPreviousDotId = (fallBackDotIdFromLoopSearch == enemyNextDotId) ? fallbackDotIdToLoopSearch : fallBackDotIdFromLoopSearch;
                                }
                                else if(enemyNextDotId == null && enemyPreviousDotId != null){
                                    enemyNextDotId = (fallBackDotIdFromLoopSearch == enemyPreviousDotId) ? fallbackDotIdToLoopSearch : fallBackDotIdFromLoopSearch;
                                }
                                else{
//                                    console.info('SEARCH fallback');
                                    if(enemyPreviousDotId == fallBackDotIdFromLoopSearch){
//                                        console.info('>1');
                                        enemyNextDotId = fallbackDotIdToLoopSearch;
                                    }
                                    else if(enemyPreviousDotId == fallbackDotIdToLoopSearch){
//                                        console.info('>2');
                                        enemyNextDotId = fallBackDotIdFromLoopSearch;
                                    }
                                    else if(enemyNextDotId == fallBackDotIdFromLoopSearch){
//                                        console.info('>3');
                                        enemyPreviousDotId = fallbackDotIdToLoopSearch;
                                    }
                                    else if(enemyNextDotId == fallbackDotIdToLoopSearch){
//                                        console.info('>4');
                                        enemyPreviousDotId = fallBackDotIdFromLoopSearch;
                                    }
                                    else if(this.trail.dots[_enemies[i].previousDotId].equals(newTrail.dots[fallBackDotIdFromLoopSearch])){
//                                        console.info('>5');
                                        enemyPreviousDotId  = fallBackDotIdFromLoopSearch;
                                        enemyNextDotId      = fallbackDotIdToLoopSearch;
                                    }
                                    else if(this.trail.dots[_enemies[i].previousDotId].equals(newTrail.dots[fallbackDotIdToLoopSearch])){
//                                        console.info('>6');
                                        enemyPreviousDotId  = fallbackDotIdToLoopSearch;
                                        enemyNextDotId      = fallBackDotIdFromLoopSearch;
                                    }
                                    else if(this.trail.dots[_enemies[i].nextDotId].equals(newTrail.dots[fallBackDotIdFromLoopSearch])){
//                                        console.info('>7');
                                        enemyPreviousDotId  = fallbackDotIdToLoopSearch;
                                        enemyNextDotId      = fallBackDotIdFromLoopSearch;
                                    }
                                    else if(this.trail.dots[_enemies[i].nextDotId].equals(newTrail.dots[fallbackDotIdToLoopSearch])){
//                                        console.info('>8');
                                        enemyPreviousDotId  = fallBackDotIdFromLoopSearch;
                                        enemyNextDotId      = fallbackDotIdToLoopSearch;
                                    }
                                    else{
                                        console.info('NOT FOUND !!!','enemyPreviousDotId',enemyPreviousDotId,'enemyNextDotId',enemyNextDotId,'fallBackDotIdFromLoopSearch',fallBackDotIdFromLoopSearch,'fallbackDotIdToLoopSearch',fallbackDotIdToLoopSearch);
                                    }
                                }
                                fallBack_break = true;
                            }
                        }
                    }
//                    console.info('afterIsBetween',_enemies[i].isBetween(newTrail.dots[enemyPreviousDotId], newTrail.dots[enemyNextDotId]));
                }
//                console.info('enemyPreviousDotId',enemyPreviousDotId,'enemyNextDotId',enemyNextDotId,'reverse',reverse,'_enemies['+i+'].previousDotId',_enemies[i].previousDotId,'_enemies['+i+'].nextDotId',_enemies[i].nextDotId);
                _enemies[i].previousDotId = enemyPreviousDotId;
                _enemies[i].nextDotId = enemyNextDotId;
                //fallback if the update of coordinates fails, that means the ennemy was catched but he allready had moved once, so he's not passed in the DotInside method
                if(_enemies[i].updatePreviousAndNextDotsCoords(newTrail) === false){
                    if(_player.catchingAbility > 0){
                        console.warn('/!\ !!!CAUGHT');
                        _enemies[i].caught = true;
                        addFlashMessage(drawEnemyCaughtInACorner);
                    }
                    else{
                        console.warn('/!\ !!STILL OUT');
                        randomlyPositionPropOnTrail(_enemies[i], newTrail, [playerPreviousDotId,playerNextDotId]);
                        addFlashMessage(drawEnemyStillOut);
                    }
                }
//                console.info('enemyPreviousDotId',enemyPreviousDotId,_enemies[i].previousDotId,'nextDotId',enemyNextDotId,_enemies[i].nextDotId,'x',_enemies[i].x,'y',_enemies[i].y,'trailPreviousX',newTrail.dots[_enemies[i].previousDotId].x,'trailPreviousY',newTrail.dots[_enemies[i].previousDotId].y,'trailNextX',newTrail.dots[_enemies[i].nextDotId].x,'trailNextY',newTrail.dots[_enemies[i].nextDotId].y);
            }
        }
//        console.info('END FOR LOOP');
        
        //manage the previous/next dot ids of rings
        if(_rings.length > 0){
            for(i=0;i<_rings.length;i++){
                //if a ring is caught inside a shape, it's wasted, we flag it, splitTrail method will remove it from _rings
                if(newShape.isDotInside(_rings[i])){
//                    console.info('>RING INSIDE (wasted) !!!',_rings[i]);
                    _rings[i].wasted = true;
                }
                else{
//                    console.info('>RING OUTSIDE !!!',_rings[i]);
                }
            }
//            console.info('RINGS STILL OUT : ',_rings.length);
        }        
        
        //assign player new next/previous dotIds
        _player.previousDotId = playerPreviousDotId;
        _player.nextDotId = playerNextDotId;
//        console.info('playerNextDotId',playerNextDotId,'playerNextDotId',playerNextDotId);

        //push the new trail
        newTrail.setBackgroundColor(TRAIL_BACKGROUND_COLOR);
        newTrail.setBorderColor(TRAIL_COLOR);
        newTrail.setBorderWidth(TRAIL_BORDER_WIDTH);
        this.trail = newTrail;

        //put player on trail
        _player.onTrail = true;
        
    }
    
    this.addRing = function(){
        if(_iterator%(RING_APPEARS_CYCLE*INTERVAL_REFRESH) == 0){
            var ring = new Prop(0, 0, 0, 1, 0, 0, RING_COLOR, RING_SIZE, this.trail);
            randomlyPositionPropOnTrail(ring, this.trail);
//            console.info('addRing','_iterator',_iterator,'previousDotId',ring.previousDotId,'nextDotId',ring.nextDotId,(new Date()).getSeconds());
            ring.freshNess = 15;
            _rings.push(ring);
            addFlashMessage(drawNewRingToCollect);
        }
    }
    
    /**
     * Randomly positions a prop on trail
     * You can specify unwantedIds of trail dots that you don't want your prop to be placed between
     * @param prop Prop
     * @param trail Shape
     * @param unwantedIds array[int] @optional
     */
    function randomlyPositionPropOnTrail(prop, trail, unwantedIds){
        unwantedIds = unwantedIds || [];
        var i=0;//prevent infinite loop
        var randomDotId     = null;
        var tmpDotIdFrom    = null;
        var tmpDotIdTo      = null;
        while(i<5 && ( randomDotId == null || (!$.inArray(tmpDotIdFrom, unwantedIds) || !$.inArray(tmpDotIdTo, unwantedIds)) ) ){
            randomDotId     = Math.floor(Math.random()*(trail.dots.length));//randomly choose a dot in the trail
            tmpDotIdFrom    = (trail.dots[randomDotId] ? randomDotId : (trail.dots[randomDotId-1] ? randomDotId-1 : randomDotId+1 ) );//check if exists in trail
            tmpDotIdTo      = trail.dots[tmpDotIdFrom+1] ? tmpDotIdFrom+1 : 0;//choose the next dot (existing) in the trail
//            console.info('randomlyPositionPropOnTrail',i,'dotIds',[tmpDotIdFrom,tmpDotIdTo],'unwantedIds',unwantedIds);
            i++;
        }
        //randomly choose a direction
        if(Math.random() > 0.5){
            prop.previousDotId = tmpDotIdFrom;
            prop.nextDotId = tmpDotIdTo;
        }
        else{
            prop.previousDotId = tmpDotIdTo;
            prop.nextDotId = tmpDotIdFrom;
        }
        var coordinates = prepareCoordinates(trail, prop.previousDotId, prop.nextDotId, 1, 1);
        prop.x = coordinates.x;
        prop.y = coordinates.y;
        prop.updatePreviousAndNextDotsCoords(trail);
        prop.updatePreviousCoords();
    }
    
    /**
     * Removes one live
     * Returns true if still alive
     * Returns false if dead
     * @return boolean
     */
    this.removeLive = function(){
//        console.info('removeLive');
        _lives--;
        addFlashMessage(drawLiveNumber,60);
        updateLivesDisplay();
        if(_lives > 0)
            return true;
        else
            return false;
    }
    
    this.gameOver = function(){
//        console.info('GAME OVER !!!');
        //return false;//@todo retirer
        this.stopLoop();
        this.removeKeyboardControls();
        //save score if > 0
        var currentScoreId = null;
        if(_score > 0)
            currentScoreId = _highScoresManager.addHighScore(_score,_level);
//        console.info('this.gameOver','currentScoreId',currentScoreId);
        //show gameOver screen
        this.initGameOverScreen(currentScoreId);
    }

    /**
     * Clears only the game context (not the level / score part)
     */
    function clearGameContext(){
        _ctx.clearRect(0,0,650,615);
    }

    /**
     * Clears only the infos context (the level / score part)
     */
    function clearInfosContext(){
        _ctx.clearRect(0,615,650,35);
    }

    /**
     * Clears all the context
     */
    function clearAllContext(){
//        console.info('clear ALL context',_canvasWidth,_canvasHeight);
        _ctx.clearRect(0,0,_canvasWidth,_canvasHeight);
    }

    this.prepareFirstTrail = function(){
        this.trail = new Shape(TRAIL_COLOR, TRAIL_BORDER_WIDTH, TRAIL_BACKGROUND_COLOR);
        
        //simple big trail
//        this.trail.addDot(new Dot(200,0));
//        this.trail.addDot(new Dot(400,0));
//        this.trail.addDot(new Dot(400,200));
//        this.trail.addDot(new Dot(600,200));
//        this.trail.addDot(new Dot(600,400));
//        this.trail.addDot(new Dot(400,400));
//        this.trail.addDot(new Dot(400,600));
//        this.trail.addDot(new Dot(200,600));
//        this.trail.addDot(new Dot(200,400));
//        this.trail.addDot(new Dot(0,400));
//        this.trail.addDot(new Dot(0,200));
//        this.trail.addDot(new Dot(200,200));
//        console.info('trailArea',this.trail.computeArea());
//        this.trail.dots.reverse();

        //simple 4dots trail
        this.trail.addDot(new Dot(25,5));
        this.trail.addDot(new Dot(625,5));
        this.trail.addDot(new Dot(625,605));
        this.trail.addDot(new Dot(25,605));

        _originalTrailArea = this.trail.computeArea();
    }

    /**
     * Creates player and puts it on the middle of the first edge of the trail
     */
    this.preparePlayer = function(){
        var nextDotId = 0;
        var previousDotId = 1;
        var coordinates = prepareCoordinates(this.trail, previousDotId, nextDotId, 1, 1);
        _player = new Prop(coordinates.x, coordinates.y, nextDotId, previousDotId, PLAYER_SPEED, PLAYER_EDGE_SPEED, PLAYER_COLOR, PLAYER_SIZE, this.trail);
        _player.catchingAbility = 0;
    }
    
    this.prepareEnemiesDebug = function(){
        _enemies = [];//flush previous enemies
        _enemies.push(new Prop(300, 600, 6, 7, ENEMY_SPEED, PLAYER_EDGE_SPEED, ENEMY_COLOR, ENEMY_SIZE, this.trail));
    }
    
    this.prepareEnemies = function(){
//        this.prepareEnemiesDebug();return false;//@todo retirer
        _enemies = [];//flush previous enemies
        var enemyNumber = Math.ceil(_level/ENEMY_NUMBER_STEP);//one more enemy each ENEMY_NUMBER_STEP level
        var enemySpeed = ENEMY_SPEED;
//        var enemyNumber = Math.ceil(_level/LEVEL_STEP_ENEMY);
        var previousDotId,nextDotId,x,y,enemy;
        //array of the edges where there can be enemies
        var edgesDesignation = [
            {
                dotIdFrom   : 0,
                dotIdTo     : 3,
                enemyNumber : 0
            },
            {
                dotIdFrom   : 3,
                dotIdTo     : 2,
                enemyNumber : 0
            },
            {
                dotIdFrom   : 2,
                dotIdTo     : 1,
                enemyNumber : 0
            }
        ];
        var edges = [];
        //each level, the enemy changes edge
        console.info((_level-1)%3,(_level)%3,(_level+1)%3);
        edges.push(edgesDesignation[(_level-1)%3]);
        edges.push(edgesDesignation[(_level)%3]);
        edges.push(edgesDesignation[(_level+1)%3]);
        console.info('enemyNumber',enemyNumber);
        //prepare the number of enemies for each edges
        for(var i=0;i<enemyNumber;i++){
            console.info('edges[i]',i%3,'i',i);
            edges[i%3].enemyNumber++;
        }
        for(var i=0;i<edges.length;i++){
            if(edges[i].enemyNumber > 0){
                for(var j=1;j<=edges[i].enemyNumber;j++){
                    //if more than 2 enemies on the same edge, they won't go the same direction
                    //so previous and next dotId assignments
                    if(j%2 == 1){
                        previousDotId = edges[i].dotIdFrom;
                        nextDotId = edges[i].dotIdTo;
                    }
                    else{
                        previousDotId = edges[i].dotIdTo;
                        nextDotId = edges[i].dotIdFrom;
                    }
                    var coordinates = prepareCoordinates(this.trail, previousDotId, nextDotId, edges[i].enemyNumber, j);
                    console.info('i',i,'j',j,'x',coordinates.x,'y',coordinates.y);
                    //create enemy
                    enemy = new Prop(coordinates.x, coordinates.y, nextDotId, previousDotId, enemySpeed, PLAYER_EDGE_SPEED, ENEMY_COLOR, ENEMY_SIZE, this.trail);
                    //push to enemies
                    _enemies.push(enemy);
                }
            }
        }
    }
    
    /**
     * Prepares the coordinates of an object placing it on the edge of the trail
     */
    function prepareCoordinates(trail, previousDotId, nextDotId, numberOfPropsPerEdge, propNum){
        propNum = propNum || 1;
        numberOfPropsPerEdge = numberOfPropsPerEdge || 1;
        var x,y;
        if(trail.dots[previousDotId].x == trail.dots[nextDotId].x){
            x = trail.dots[previousDotId].x;
            y = Math.min(trail.dots[previousDotId].y, trail.dots[nextDotId].y) + propNum*(Math.abs(trail.dots[previousDotId].y - trail.dots[nextDotId].y)/(numberOfPropsPerEdge+1));
        }
        else{
            y = trail.dots[previousDotId].y;
            x = Math.min(trail.dots[previousDotId].x, trail.dots[nextDotId].x) + propNum*(Math.abs(trail.dots[previousDotId].x - trail.dots[nextDotId].x)/(numberOfPropsPerEdge+1));
        }
        return new Dot(x,y);
    }
    
    function updateLivesDisplay(){
        _ctx.clearRect(20,610,100,30);
        _ctx.font        = 'bold italic 14px Arial,sans-serif italic';
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.fillText('Lives '+_lives.toString(),20,630);
    }
    
    function updateLevelDisplay(){
        _ctx.clearRect(150,610,100,30);
        _ctx.font        = 'bold italic 14px Arial,sans-serif italic';
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.fillText('Level '+_level.toString(),150,630);
    }
    
    function updateScoreDisplay(){
        //format score
        var formattedScore = formatScore(_score);
        
        _ctx.clearRect(300,610,350,30);
        _ctx.font        = 'bold italic 14px Arial,sans-serif italic';
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.fillText('Score : '+formattedScore+' - Ratio : '+_scoreRatio.toFixed(2)+' %',300,630);
    }
    
    /**
     * @param score int|string
     * @return string
     */
    function formatScore(score){
        var tmpScore = score.toString();
        tmpScore = tmpScore.split("").reverse();
        var formattedScore = "";
        for ( var i = 0; i <= tmpScore.length-1; i++ ){
            formattedScore = tmpScore[i] + formattedScore;
            if ((i+1) % 3 == 0 && (tmpScore.length-1) !== i)formattedScore = ' ' + formattedScore;
        }
        return formattedScore;
    }
    
    function addFlashMessage(drawingFunction,duration){
        var flashMessageInfos = {};
        flashMessageInfos.display = duration || FLASH_MESSAGE_DURATION;
        flashMessageInfos.callback = drawingFunction;
        _flashMessages.push(flashMessageInfos);
    }
    
    /**
     * Clears the screen to run your drawingFunction then calls callback function after the delay specified in duration
     * 
     * @param drawingFunction function
     * @param duration int
     * @param callback function
     */
    function displayScreenMessage(drawingFunction,duration,callback){
        clearAllContext();
        drawingFunction.call({});
        setTimeout(function(){
            clearAllContext();
            callback.call({});
        },duration);
    }
    
    /** Static screens management */
    
    function removeAllWelcomeScreensEventListeners(){
        $(_canvas).unbind('mousemove');
        $(_canvas).unbind('click');
        $(document).unbind('keypress');
    }
    
    this.initWelcomeScreen = function(){
        clearAllContext();
        removeAllWelcomeScreensEventListeners();
        drawWelcomeScreen();
        var that = this;
        $(document).keypress(function(event){
            var key = retrieveKeyboardCode(event);
            switch(key) {
                // User pressed space bar
                case HotKeys.spaceBar:
                    that.startGame();
                    break;
                // User pressed "H"
                case HotKeys.Help:
                    that.initHelpScreen();
                    break;
                // User pressed "S"
                case HotKeys.HighScores:
                    that.initHighScoreScreen();
                    break;
                break;
            }
        })
        manageWelcomeScreenMouseEventListeners();
    }
    
    this.initHelpScreen = function(){
        clearAllContext();
        removeAllWelcomeScreensEventListeners();
        drawTophemanSquaresLogo();
        drawHelpScreen(100);
        var that = this;
        $(document).keypress(function(event){
            var key = retrieveKeyboardCode(event);
            switch(key) {
                // User pressed space bar
                case HotKeys.Help:
                    that.initWelcomeScreen();
                    break;
                // User pressed spaceBar
                case HotKeys.spaceBar:
                    that.initWelcomeScreen();
                    break;
                break;
            }
        })
    }
    
    this.initHighScoreScreen = function(){
        clearAllContext();
        removeAllWelcomeScreensEventListeners();
        drawHighScoresScreen();
        var that = this;
        $(document).keypress(function(event){
            var key = retrieveKeyboardCode(event);
            switch(key) {
                // User pressed H
                case HotKeys.HighScores:
                    that.initWelcomeScreen();
                    break;
                // User pressed spaceBar
                case HotKeys.spaceBar:
                    that.initWelcomeScreen();
                    break;
                break;
            }
        })
    }
    
    this.initGameOverScreen = function(currentScoreId){
        clearAllContext();
        removeAllWelcomeScreensEventListeners();
        drawGameOver(currentScoreId);
        var that = this;
        $(document).keypress(function(event){
            var key = retrieveKeyboardCode(event);
            switch(key) {
                // User pressed space bar
                case HotKeys.spaceBar:
                    that.initWelcomeSreens();
                    break;
                break;
            }
        })
    }
    
    /** Drawing / Animating functions */
    
    function drawLevelMessage(){
        drawTophemanSquaresLogo(50);
//        console.info('DISPLAY LEVEL MESSAGE',_ctx);
        _ctx.font        = 'bold italic 60px Arial,sans-serif';
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.fillText('LEVEL '+_level,190,400);
    }
    
    function drawPauseMessage(){
        //@todo decommenter les deux lignes
        if(DEBUG == false){
            clearGameContext();
            drawTophemanSquaresLogo(50);
        }
        _ctx.font        = 'bold italic 60px Arial,sans-serif';
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.fillText('PAUSED',190,400);
    }
    
    /**
     * Executes the drawingFunction callbacks in the _flashMessages array, passing a line each time
     */
    function drawFlashMessages(){
        var marginTop = 300;
        var lineHeight = 80;
        if(_flashMessages.length > 0){
            _ctx.save();
            _ctx.globalAlpha = 0.8;
            for(var i=0;i<_flashMessages.length;i++){
                _flashMessages[i].callback.call({},marginTop+lineHeight*i);
            }
            _ctx.restore();
        }
    }
    
    function drawLiveNumber(marginTop){
        marginTop = marginTop || 400;
        _ctx.font        = 'bold italic 40px Arial,sans-serif';
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.fillText(_lives+' LIVE'+((_lives > 1) ? 'S' : '')+' LEFT',180,marginTop);
    }
    
    function drawEnemyCaught(marginTop){
        marginTop = marginTop || 400;
        _ctx.font        = 'bold italic 35px Arial,sans-serif';
        _ctx.fillStyle 	= ENEMY_COLOR;
        _ctx.fillText('ENEMY CAUGHT !!!',145,marginTop);
    }
    
    function drawEnemyCaughtInACorner(marginTop){
        marginTop = marginTop || 400;
        _ctx.font        = 'bold italic 35px Arial,sans-serif';
        _ctx.fillStyle 	= ENEMY_COLOR;
        _ctx.fillText('ENEMY CAUGHT IN A CORNER !!!',55,marginTop);
    }
    
    function drawCatchingAbility(marginTop){
        marginTop = marginTop || 400;
        _ctx.font        = 'bold italic 35px Arial,sans-serif';
        _ctx.fillStyle 	= PLAYER_CATCHING_COLOR;
        _ctx.fillText('CATCHING ABILITY !!!',130,marginTop);
    }
    
    function drawEnemyStillOut(marginTop){
        marginTop = marginTop || 400;
        _ctx.font        = 'bold italic 35px Arial,sans-serif';
        _ctx.fillStyle 	= PLAYER_COLOR;
        _ctx.fillText('ENEMY STILL OUT !!!',140,marginTop);
    }
    
    function drawNewRingToCollect(marginTop){
        marginTop = marginTop || 400;
        _ctx.font        = 'bold italic 35px Arial,sans-serif';
        _ctx.fillStyle 	= RING_COLOR;
        _ctx.fillText('COLLECT THE ORANGE DOT !!!',60,marginTop);
    }
    
    function drawWelcomeScreen(){
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('by Christophe Rosset',220,260);
        
        _ctx.fillStyle 	= 'blue';
        _ctx.font        = 'bold italic 24px Arial,sans-serif';
        _ctx.fillText('@topheman',200,330);
        _ctx.fillText('blog.topheman.com',200,370);
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 30px Arial,sans-serif';
        _ctx.fillText('NEW GAME : Press Space bar',100,460);
        _ctx.fillText('HELP : Press H',100,520);
        _ctx.fillText('YOUR HIGH SCORES : Press S',100,580);
        drawTophemanSquaresLogo(50);
        drawCopyright(true);
    }
    
    function manageWelcomeScreenMouseEventListeners(){
        
        $(_canvas).mousemove(function(e){
            var mousePosition = getMousePositionInCanvas(e);
            //copyright bottom link
            if(checkMousePositionInCanvas(mousePosition,new Dot(0,630),new Dot(650,648))){
                e.target.style.cursor = 'pointer';
            }
            //twitter link
            else if(checkMousePositionInCanvas(mousePosition,new Dot(197,309),new Dot(343,342))){
                e.target.style.cursor = 'pointer';
            }
            //blog link
            else if(checkMousePositionInCanvas(mousePosition,new Dot(197,350),new Dot(432,378))){
                e.target.style.cursor = 'pointer';
            }
            else{
                e.target.style.cursor = 'default';
            }
        })
        
        $(_canvas).click(function(e){
            var mousePosition = getMousePositionInCanvas(e);
            //copyright bottom link
            if(checkMousePositionInCanvas(mousePosition,new Dot(0,630),new Dot(650,648))){
                window.location.href = 'http://squares.topheman.com';
            }
            //twitter link
            else if(checkMousePositionInCanvas(mousePosition,new Dot(197,309),new Dot(343,342))){
                var newWindow = window.open('http://twitter.com/topheman', '_blank');
                newWindow.focus();
            }
            //blog link
            else if(checkMousePositionInCanvas(mousePosition,new Dot(197,350),new Dot(432,378))){
                var newWindow = window.open('http://blog.topheman.com', '_blank');
                newWindow.focus();
            }
        })
        
    }
    
    function drawHelpScreen(marginTop){
        
        marginTop = marginTop || 0;
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 30px Arial,sans-serif';
        _ctx.fillText('HELP',150,marginTop+40);
        
        _ctx.fillStyle 	= PLAYER_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('The player is the green dot',30,marginTop+80);
        
        _ctx.fillStyle 	= ENEMY_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('The enemies are the red dots',320,marginTop+80);
        
        _ctx.fillStyle 	= RING_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('Grab the orange dots to be able to catch the enemies',60,marginTop+120);
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('The bigger shapes you draw, the higher score you get',55,marginTop+160);
        
        _ctx.fillStyle 	= PLAYER_CATCHING_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('You get a bonus score when you catch an enemy',80,marginTop+200);
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('You get to the next level when you\'ve captured all enemies',50,marginTop+240);
        
        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('or have covered '+RATIO_TO_REACH+'% of the area of the gaming zone',80,marginTop+265);

        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('One more ennemy appears each '+ENEMY_NUMBER_STEP+' levels',140,marginTop+305);
        
        _ctx.font        = 'bold italic 30px Arial,sans-serif';
        _ctx.fillText('KEY SETTINGS',200,marginTop+350);

        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('Use the arrow keys to draw shapes',140,marginTop+390);

        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('[space bar] Toggle direction',140,marginTop+430);

        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('[ctrl key] stop moving',140,marginTop+470);

        _ctx.font        = 'bold italic 20px Arial,sans-serif';
        _ctx.fillText('[P] Pause',140,marginTop+510);
        
        drawCopyright();
    }
    
    function drawHighScoresScreen(scores){
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 30px Arial,sans-serif';
        _ctx.fillText('YOUR HIGH SCORES',160,250);
        
        drawHighScoresList(_highScoresManager.getHighScores(), 12);
        drawTophemanSquaresLogo(50);
        drawCopyright();
        
    }
    
    function drawGameOver(currentScoreId){
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 40px Arial,sans-serif';
        _ctx.fillText('GAME OVER !!!',160,220);
        
        _ctx.fillStyle 	= 'black';
        _ctx.font        = 'bold italic 24px Arial,sans-serif';
        _ctx.fillText(formatScore(_score)+' pts',180,250);

        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 30px Arial,sans-serif';
        _ctx.fillText('Press Space bar to Continue',110,580);
        
        drawHighScoresList(_highScoresManager.getHighScores(), 10, currentScoreId, 300);
        drawTophemanSquaresLogo(50);
        drawCopyright();
        
    }
    
    function drawHighScoresList(highScores, limit, currentScoreId, marginTop){
        limit = limit || 10;
        currentScoreId = currentScoreId || (currentScoreId === 0 ? 0 : null);
        marginTop = marginTop || 280;
        
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 16px Arial,sans-serif';
        
        for(var i=0;i<limit && i<highScores.length;i++){
            if(i == currentScoreId){
                _ctx.fillStyle 	= 'black';
                _ctx.font        = 'bold italic 20px Arial,sans-serif';
            }
            else{
                _ctx.fillStyle 	= GLOBAL_COLOR;
                _ctx.font        = 'bold italic 16px Arial,sans-serif';
            }
            _ctx.fillText('Level '+highScores[i].level,160,marginTop+i*25);
            _ctx.fillText(formatScore(highScores[i].score)+' pts',250,marginTop+i*25);
        }
        
    }
    
    function drawTophemanSquaresLogo(marginTop){
        marginTop = marginTop || 10;
        var img = new Image();
        img.onload = function(){
            _ctx.drawImage(img,25,marginTop);
        }
        img.src = './js/ressources/topheman-squares-bandeau.png';
    }
    
    function drawCopyright(withoutMouseEventListener){
        withoutMouseEventListener = withoutMouseEventListener || false;
        _ctx.fillStyle 	= GLOBAL_COLOR;
        _ctx.font        = 'bold italic 12px Arial,sans-serif';
        _ctx.fillText('© 2012 squares.topheman.com - Christophe Rosset - v'+VERSION,160,640);
        _ctx.strokeStyle = GLOBAL_COLOR;
        _ctx.lineWidth	= 1;
        _ctx.beginPath();
        _ctx.moveTo(203,643);
        _ctx.lineTo(341,643);
        _ctx.stroke();
        if(withoutMouseEventListener === false)
            manageCopyrightMouseEventListeners();
    }
    
    function manageCopyrightMouseEventListeners(){
        
        $(_canvas).mousemove(function(e){
            var mousePosition = getMousePositionInCanvas(e);
            //copyright bottom link
            if(checkMousePositionInCanvas(mousePosition,new Dot(0,630),new Dot(650,648))){
                e.target.style.cursor = 'pointer';
            }
            else{
                e.target.style.cursor = 'default';
            }
        })
        
        $(_canvas).click(function(e){
            var mousePosition = getMousePositionInCanvas(e);
            //copyright bottom link
            if(checkMousePositionInCanvas(mousePosition,new Dot(0,630),new Dot(650,648))){
                window.location.href = 'http://squares.topheman.com';
            }
        })
        
    }
    
    /**
     * Returns the mouse position relative to the canvas
     * @event eventObject
     * @return Dot
     */
    function getMousePositionInCanvas(event){
        var x = event.pageX-$(_canvas).offset().left;
        var y = event.pageY-$(_canvas).offset().top;
        return new Dot(x,y);
    }
    
    /**
     * Checks if the dot mousePosition is inside a square delimited by dot1 (left top corner) and dot2 (right bottom corner)
     * @param mousePosition Dot
     * @param dot1 Dot
     * @param dot2 Dot
     * @return boolean
     */
    function checkMousePositionInCanvas(mousePosition,dot1,dot2){
        if(mousePosition.x>dot1.x && mousePosition.x<dot2.x && mousePosition.y>dot1.y && mousePosition.y<dot2.y)
            return true;
        else
            return false;
    }
    
    /**
     * Debug function not used in production
     */
    function debugCanvasPosition(){
        
        $(_canvas).mousemove(function(e){
            var mousePosition = getMousePositionInCanvas(e);
//            console.info('x',mousePosition.x,'y',mousePosition.y);
        })
        
    }

}