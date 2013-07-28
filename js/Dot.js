/*!
 * TophemanSquares
 * http://squares.topheman.com/
 *
 * Copyright 2012, Christophe Rosset (Topheman)
 * http://blog.topheman.com/
 * http://twitter.com/topheman
 *
 * Dot.js
 * Simple Dot function used everywhere in TophemanSquares
 */

/**
 * @param x int
 * @param y int
 */
function Dot(x,y){
    this.x = x;
    this.y = y;
}

/**
 * Return true if Dot is at the same place of dot
 * @param dot Dot
 * @return boolean
 */
Dot.prototype.equals = function(dot){
    if(this.x == dot.x && this.y == dot.y)
        return true;
    else
        return false;
}

/**
 * Processes the range between Dot and dot
 * @param dot Dot
 * @return number
 */
Dot.prototype.range = function(dot){
    return Math.sqrt( (this.x - dot.x)*(this.x - dot.x) + (this.y - dot.y)*(this.y - dot.y) );
}

/**
 * Drawing function
 * @param ctx CanvasRenderingContext2D
 */
Dot.prototype.draw = function(ctx){
    ctx.fillStyle 	= 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth	= 1;
    ctx.beginPath();
    ctx.arc(this.x,this.y,2,0,Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
}