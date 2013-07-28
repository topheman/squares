/*!
 * TophemanSquares
 * http://squares.topheman.com/
 *
 * Copyright 2012, Christophe Rosset (Topheman)
 * http://blog.topheman.com/
 * http://twitter.com/topheman
 *
 * Shape.js
 * Manages shapes drawing on canvas, collision detections and area computing used in TophemanSquares game
 */

/**
 * @param borderColor string
 * @param borderWidth string
 * @param backgroundColor string
 */
function Shape(borderColor,borderWidth,backgroundColor){

    this.backgroundColor 	= ((backgroundColor == undefined || backgroundColor == false) ? this.getRandomColor() : backgroundColor);
    this.borderColor 		= borderColor == 'undefined' ? 'black' : borderColor;
    this.borderWidth		= borderWidth == 'undefined' ? 4 : borderWidth;
    this.dots 			= [];
    this.dotsFromIds = [];//only used for edge
    this.dotsToIds = [];//only used for edge

}

/**
 * Return random hexa code color
 * @return string 
 */
Shape.prototype.getRandomColor = function(){
    var color = '#000000';
    while(color == '#000000'){
        color = '#'+Math.floor(Math.random()*16777215).toString(16);
    }
    return color;
}

/**
 * @param color string
 */
Shape.prototype.setBackgroundColor = function(color){
    this.backgroundColor = color;
}

/**
 * @param color string
 */
Shape.prototype.setBorderColor = function(color){
    this.borderColor = color;
}

/**
 * @param width int
 */
Shape.prototype.setBorderWidth = function(width){
    this.borderWidth = width;
}

/**
 * @param dot Dot
 */
Shape.prototype.addDot = function(dot){
    this.dots.push(dot);
}

/**
 * @param dot Dot
 */
Shape.prototype.updateLastDot = function(dot){
    this.dots[this.dots.length - 1] = dot;
}

/**
 * Drawing function
 * If debug is set to true, will display the indexes of the vertices
 * @param ctx CanvasRenderingContext2D
 * @param debug boolean @optional
 */
Shape.prototype.draw = function(ctx,debug){
    //if less than 3 points, no drawing
    if(this.dots.length < 3){
        return false;
    }
    ctx.fillStyle 	= this.backgroundColor;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth	= this.borderWidth;
    ctx.beginPath();
    ctx.moveTo(this.dots[0].x,this.dots[0].y);
    for(var i=1; i < this.dots.length; i++){
        ctx.lineTo(this.dots[i].x,this.dots[i].y);
    }
    ctx.lineTo(this.dots[0].x,this.dots[0].y);
    ctx.fill();
    ctx.stroke();
    
    if(debug === true){
        ctx.font        = '10px Arial sans-serif';
        ctx.fillStyle 	= 'black';
        for(var j=0; j < this.dots.length; j++){
            ctx.fillText(j.toString(),this.dots[j].x+8,this.dots[j].y+8);
        }
    }
}

/**
 * Drawing function (draws non closed shape)
 * If debug is set to true, will display the indexes of the vertices
 * @param ctx CanvasRenderingContext2D
 * @param debug boolean @optional
 */
Shape.prototype.drawLine = function(ctx,flash){
    if(flash){
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.lineWidth	= this.borderWidth*3;
    }
    else{
        ctx.lineWidth	= this.borderWidth;
    }
    
    ctx.strokeStyle     = this.borderColor;
    ctx.lineWidth	= this.borderWidth;
    ctx.beginPath();
    ctx.moveTo(this.dots[0].x,this.dots[0].y);
    for(var i=1; i < this.dots.length; i++){
        ctx.lineTo(this.dots[i].x,this.dots[i].y);
    }
    ctx.stroke();
    
    if(flash){
        ctx.restore();
    }
}

/**
 * @deprecated
 * Calculate and return the size of the area of the current shape
 * @return int
 */
//Shape.prototype.computeArea = function(){
//    var posDiag = 0
//    var negDiag = 0;
//    var area;
//    var i;
//    for(i=0; i< this.dots.length -1; i++){
//        posDiag += this.dots[i].x*this.dots[i+1].y
//    }
//    for(i=0; i< this.dots.length -1; i++){
//        negDiag += this.dots[i+1].x*this.dots[i].y
//    }
//    area = Math.round(Math.abs(posDiag - negDiag)/2);
//    return area;
//}

/**
 * Calculate and return the size of the area of the current shape
 * 
 * @source http://stackoverflow.com/questions/2553149/area-of-a-irregular-shape
 * @return int
 */
Shape.prototype.computeArea = function(){
    var area = 0;
    var numVertices = this.dots.length;
    var point = this.dots;
    for (var i = 0; i < numVertices - 1; i++)
      area += point[i].x * point[(i+1)%numVertices].y - point[(i+1)%numVertices].x * point[i].y;

    area += point[numVertices-1].x * point[0].y - point[0].x * point[numVertices-1].y;

    area = area/2;
    
    return Math.abs(area);
}

/**
 * Tests if dot is inside the Shape
 * @param dot Dot|Prop
 * @return boolean
 */
Shape.prototype.isDotInside = function(dot){
    //console.info('isDotInside2');
    var verticesNumber = this.dots.length;
    var i = 0;
    var j = verticesNumber - 1;
    var c = false;
    for(i = 0; i < verticesNumber; i++){
        if( (this.dots[i].y > dot.y !== this.dots[j].y > dot.y) &&
          (dot.x < ((this.dots[j].x - this.dots[i].x)*(dot.y-this.dots[i].y)/(this.dots[j].y-this.dots[i].y) + this.dots[i].x)) )
            c = !c;
        j = i;
    }
    //run test on border to be sure with splitTrail tests (only on Prop objects)
    if(c == false && dot instanceof Prop){
        for(i = 0; i < verticesNumber; i++){
            if(dot.isBetween(this.dots[i],this.dots[(i+1)%verticesNumber])){
                console.log('PROP IS INSIDE - ON BORDER ...')
                return true;
            }
        }
    }
    return c;
}

/**
 * Tests if a Prop is on the border of the Shape
 * 
 * @param prop Prop
 * @param trailTestMode boolean (opposed to edgeTestMode)
 * @param edge Shape @optional (only if you're testing if Prop is on Trail border on edge mode)
 * @return Dot|boolean
 */
Shape.prototype.isPropOnBorder = function(prop, trailTestMode, edge){
    var verticesNumber = this.dots.length;
    var dot1Index,dot2Index;
    var testDot = false;
    for(var i=0; i < verticesNumber; i++){
        dot1Index = i;
        dot2Index = i+1;
        //at the end of the dots of the shape, we test between the last and first dot
        if(dot2Index == verticesNumber){
            dot2Index = 0;
        }
        //on the edge, we don't check the last edge of the shape (the player is moving on it)
        if(trailTestMode === false && (i === verticesNumber - 1)){
            return false;
        }
        testDot = prop.isBetween(this.dots[dot1Index],this.dots[dot2Index]);
        if(testDot != false){
            //adds the dots interval when finishing an edge (if not on trail)
            if(trailTestMode)
                edge.dotsToIds = [dot1Index,dot2Index];
            return testDot;
        }
    }
    return false;
    
}

/**
 * @deprecated
 */
Shape.prototype.split = function(edge,trail,lastDotInfos){
    edge.dotsToIds = [lastDotInfos.dot1Index,lastDotInfos.dot2Index];
}

/** debug function */

Shape.prototype.dumpDots = function(n){
    var c = [];
    var t = [];
    for(var i=0; i < this.dots.length; i++){
        c.push('{x:'+this.dots[i].x+',y:'+this.dots[i].y+',i:'+i+'}');
        t.push({x:this.dots[i].x,y:this.dots[i].y,i:i});
    }
//    console.info('dumpDots',c,c.length);
} 