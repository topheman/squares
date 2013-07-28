/*!
 * TophemanSquares
 * http://squares.topheman.com/
 *
 * Copyright 2012, Christophe Rosset (Topheman)
 * http://blog.topheman.com/
 * http://twitter.com/topheman
 *
 * Prop.js
 * Manages player and enemy
 */

/**
 * @param x int
 * @param y int
 * @param nextDotId int
 * @param previousDotId int
 * @param speed int
 * @param edgeSpeed int
 * @param color string
 * @param width int
 * @param trail Shape
 */
function Prop(x, y, nextDotId, previousDotId, speed, edgeSpeed, color, width, trail){

    this.x              = x;
    this.y              = y;
    this.previousX      = x;
    this.previousY      = y;
    this.speed          = speed;
    this.edgeSpeed      = edgeSpeed;
    this.color          = color;
    this.width          = width;
    this.onTrail        = true;//to know if you are following the trail or tracing an edge through the level
    this.onTrailStay    = false;//to know if you're on the trail moving
    this.nextDotId      = nextDotId;
    this.previousDotId  = previousDotId;
    
    this.previousDot    = new Dot(trail.dots[previousDotId].x,trail.dots[previousDotId].y);
    this.nextDot        = new Dot(trail.dots[nextDotId].x,trail.dots[nextDotId].y);
    
    this.direction;

}

/**
 * @param trail Shape
 */
Prop.prototype.toggleTrailDirection = function(trail){
    //update previous and next dots ids
    var previousDotId = this.previousDotId;
    this.previousDotId = this.nextDotId;
    this.nextDotId = previousDotId;
    //update previous and next dots coords
    this.updatePreviousAndNextDotsCoords(trail);
}

Prop.prototype.updatePreviousCoords = function(){
    this.previousX = this.x;
    this.previousY = this.y;
}

/**
 * Updates previous and next dot coordinates according to trail and previousDotId/nextDotId
 * Return false if fails
 * @param trail Shape
 * @return boolean
 */
Prop.prototype.updatePreviousAndNextDotsCoords = function(trail){
    if(trail.dots[this.previousDotId] && trail.dots[this.nextDotId]){
        this.previousDot.x  = trail.dots[this.previousDotId].x;
        this.previousDot.y  = trail.dots[this.previousDotId].y;
        this.nextDot.x      = trail.dots[this.nextDotId].x;
        this.nextDot.y      = trail.dots[this.nextDotId].y;
        return true;
    }
    else
        return false;
}

/**
 * @param trail Shape
 */
Prop.prototype.followTrail = function(trail){
    this.updatePreviousCoords();
    var newX = this.x,newY = this.y, newPreviousDotId, newNextDotId;
    if(this.sameLineAsDot(trail.dots[this.nextDotId])){
        if(this.x <= trail.dots[this.nextDotId].x && this.x >= trail.dots[this.previousDotId].x){
            newX = this.x + this.speed;
        }
        else if(this.x >= trail.dots[this.nextDotId].x && this.x <= trail.dots[this.previousDotId].x){
            newX = this.x - this.speed;
        }
        if((newX >= trail.dots[this.nextDotId].x && newX >= trail.dots[this.previousDotId].x)
            || (newX <= trail.dots[this.nextDotId].x && newX <= trail.dots[this.previousDotId].x)){
            newX = trail.dots[this.nextDotId].x;
        }
    }
    else if(this.sameColumnAsDot(trail.dots[this.nextDotId])){
        if(this.y <= trail.dots[this.nextDotId].y && this.y >= trail.dots[this.previousDotId].y){
            newY = this.y + this.speed;
        }
        else if(this.y >= trail.dots[this.nextDotId].y && this.y <= trail.dots[this.previousDotId].y){
            newY = this.y - this.speed;
        }
        if((newY >= trail.dots[this.nextDotId].y && newY >= trail.dots[this.previousDotId].y)
            || (newY <= trail.dots[this.nextDotId].y && newY <= trail.dots[this.previousDotId].y)){
            newY = trail.dots[this.nextDotId].y;
        }
    }
    if( 
        (this.sameLineAsDot(trail.dots[this.nextDotId]) && ((newX >= trail.dots[this.nextDotId].x && newX >= trail.dots[this.previousDotId].x) || (newX <= trail.dots[this.nextDotId].x && newX <= trail.dots[this.previousDotId].x)) )
     || (this.sameColumnAsDot(trail.dots[this.nextDotId]) && ((newY >= trail.dots[this.nextDotId].y && newY >= trail.dots[this.previousDotId].y) || (newY <= trail.dots[this.nextDotId].y && newY <= trail.dots[this.previousDotId].y)) )
        )
    {
        if(this.nextDotId+1 == trail.dots.length && this.previousDotId == 0){
            newNextDotId = trail.dots.length - 2;
        }
        else if(this.nextDotId+1 == trail.dots.length && this.previousDotId != 0){
            newNextDotId = 0;
        }
        else if(this.nextDotId == 0 && this.previousDotId == trail.dots.length - 1){
            newNextDotId = 1;
        }
        else if(this.nextDotId == 0 && this.previousDotId != trail.dots.length - 1){
            newNextDotId = trail.dots.length - 1;
        }
        else{
            if(this.previousDotId < this.nextDotId)
                newNextDotId = this.nextDotId+1;
            else
                newNextDotId = this.nextDotId-1;
        }
        this.previousDotId = this.nextDotId;
        this.nextDotId = newNextDotId;
        //update previous and next dots coords
        this.updatePreviousAndNextDotsCoords(trail);
    }
    this.x = newX;
    this.y = newY;
}

Prop.prototype.pause = function(){
    this.onTrailStay = true;
}

Prop.prototype.resume = function(){
    this.onTrailStay = false;
}

/**
 * @param dot Dot
 * @return boolean
 */
Prop.prototype.sameColumnAsDot = function(dot){
    if(this.x == dot.x)
        return true;
    else
        return false;
}

/**
 * @param dot Dot
 * @return boolean
 */
Prop.prototype.sameLineAsDot = function(dot){
    if(this.y == dot.y)
        return true;
    else
        return false;
}

/**
 * Drawing function
 * @param ctx CanvasRenderingContext2D
 * @param flash boolean|int     @optional
 * @param overloadColor string  @optional
 */
Prop.prototype.draw = function(ctx,flash,overloadColor){
    overloadColor = overloadColor || this.color;
    var width = this.width + (flash === true ? 0 : (flash === false) ? 4 : flash);
    ctx.fillStyle = overloadColor;
    ctx.fillRect(this.x-width/2, this.y-width/2, width, width);
}

/**
 * @param direction string
 * @param game GameManager
 */
Prop.prototype.startEdge = function(direction,game){
    console.info('startEdge');
    this.onTrail = false;
    this.onTrailStay = false;
    this.direction = direction;
    game.edge = new Shape(game.EDGE_COLOR,game.EDGE_BORDER_WIDTH);
    game.edge.addDot(new Dot(this.x, this.y));//firstDot
    game.edge.addDot(new Dot(this.x, this.y));//movingDot
    game.edge.dotsFromIds = [this.previousDotId,this.nextDotId];//specify between which dots we come
    game.edge.dotsToIds = [];//flush
}

/**
 * @param direction string
 * @param game GameManager
 */
Prop.prototype.move = function(direction,game){
    //if no direction, means that stays still
    if(direction == '')
        return false;
    //if going backwards, won't move
    if((direction == 'U' && this.direction == 'D')
    || (direction == 'D' && this.direction == 'U')
    || (direction == 'L' && this.direction == 'R')
    || (direction == 'R' && this.direction == 'L'))
        return false;

    //check for collision ?

    //updating the position of the last dot
    if(direction == this.direction){
//        console.info('move - same direction','direction',direction,'this.direction',this.direction,'game.edge.dots.length',game.edge.dots.length);
        this.moveThroughEdge();
        game.edge.updateLastDot(new Dot(this.x, this.y));
    }
    else{
//        console.info('move - change direction','direction',direction,'this.direction',this.direction,'game.edge.dots.length',game.edge.dots.length);
        game.edge.addDot(new Dot(this.x, this.y));
        this.direction = direction;
        this.moveThroughEdge();
        game.edge.updateLastDot(new Dot(this.x, this.y));
    }

}

Prop.prototype.moveThroughEdge = function(){
//    console.info('moveThroughEdge','this.direction',this.direction);
    switch(this.direction){
        case 'U':
            this.updatePreviousCoords();
            this.y = this.y - this.edgeSpeed;
            break;
        case 'D':
            this.updatePreviousCoords();
            this.y = this.y + this.edgeSpeed;
            break;
        case 'L':
            this.updatePreviousCoords();
            this.x = this.x - this.edgeSpeed;
            break;
        case 'R':
            this.updatePreviousCoords();
            this.x = this.x + this.edgeSpeed;
            break;
        break;
    }
}

/**
 * @param direction string
 * @param game GameManager
 */
Prop.prototype.go = function(direction,game){
    if(this.onTrail){
        if(this.checkIfCanStartEdge(direction, game)){
            this.startEdge(direction, game);
        }
        else{
            return false;
        }
    }
    this.move(direction, game);
}

/**
 * @param direction string
 * @param game GameManager
 */
Prop.prototype.checkIfCanStartEdge = function(direction,game){
    var testDot = false;
//    console.info('checkIfCanStartEdge','direction',direction)
    if(this.sameLineAsDot(game.trail.dots[this.previousDotId]) && this.sameLineAsDot(game.trail.dots[this.nextDotId])){
        if(direction == 'R' || direction == 'L')
            testDot = false;
        else if(direction == 'U')
            testDot = new Dot(this.x, this.y - this.edgeSpeed);
        else if(direction == 'D')
            testDot = new Dot(this.x, this.y + this.edgeSpeed);
    }
    else if(this.sameColumnAsDot(game.trail.dots[this.previousDotId]) && this.sameColumnAsDot(game.trail.dots[this.nextDotId])){
        if(direction == 'U' || direction == 'D')
            testDot = false;
        else if(direction == 'L')
            testDot = new Dot(this.x - this.edgeSpeed, this.y);
        else if(direction == 'R')
            testDot = new Dot(this.x + this.edgeSpeed, this.y);
    }
    if(testDot == false)
        return false;
    else{
        return game.trail.isDotInside(testDot);
    }
}

/**
 * @param Dot dot1
 * @param Dot dot2
 * @return Dot|boolean
 */
Prop.prototype.isBetween = function(dot1,dot2){
    if(this.sameLineAsDot(dot1) && this.sameLineAsDot(dot2) && ((this.x > dot1.x && this.x < dot2.x ) || (this.x > dot2.x && this.x < dot1.x )) ){
        return new Dot(this.x,this.y);
    }
    else if(this.sameColumnAsDot(dot1) && this.sameColumnAsDot(dot2) && ((this.y > dot1.y && this.y < dot2.y ) || (this.y > dot2.y && this.y < dot1.y )) ){
        return new Dot(this.x,this.y);
    }
    else
        return false;
}

/**
 * @deprecated
 * Get next dot at edge speed
 */
Prop.prototype.getNextDot = function(){
    var nextDot = new Dot(this.x,this.y);
    if(this.direction == 'U')
        nextDot.y = nextDot.y - this.edgeSpeed;
    else if(this.direction == 'D')
        nextDot.y = nextDot.y + this.edgeSpeed;
    else if(this.direction == 'L')
        nextDot.x = nextDot.x - this.edgeSpeed;
    else if(this.direction == 'R')
        nextDot.x = nextDot.x + this.edgeSpeed;
    return nextDot;
}

/**
 * @param prop Prop
 * @return boolean
 */
Prop.prototype.checkCollision = function(prop){
    if(prop.x == this.x && prop.y == this.y)
        return true;
    else if(
        this.previousX && 
            (
            (this.y == prop.y && this.previousX < prop.previousX && this.x > prop.x)
            || (this.y == prop.y && this.previousX > prop.previousX && this.x < prop.x)
            || (this.x == prop.x && this.previousY < prop.previousY && this.y > prop.y)
            || (this.x == prop.x && this.previousY > prop.previousY && this.y < prop.y)
            )
        )
        return true;
    else
        return false;
}