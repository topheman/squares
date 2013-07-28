/*!
 * Array.foreachLoopBack
 *
 * Copyright 2012, Christophe Rosset (Topheman)
 * http://blog.topheman.com/
 * http://twitter.com/topheman
 *
 * Extends javascript Array to loop from any index to any other with looping from the begining of the array if you got to the end
 * 
 */

/**
 * @param callback function(elem,index){}
 * @param reverse boolean @optional
 * @param indexStart int @optional
 * @param indexStop int @optional
 */
Array.prototype.foreachLoopBack = function(callback, reverse, indexStart, indexStop){
    
    //settings
    reverse = (reverse === undefined) ? false : reverse;
    var breaking = false;
    if(indexStart === undefined && indexStop === undefined){
        indexStart = 0;
        indexStop = this.length - 1
    }
    else if(indexStart !== undefined && indexStop === undefined){
        indexStop = (indexStart === 0 ? this.length : indexStart - 1);
    }
    var i;
    
    //check parameters
    if(typeof callback != 'function')
        throw "Parameter callback only accepts function";
    if(reverse !== true && reverse !== false)
        throw "Parameter reverse only accepts boolean";
    
    if(reverse === false){
        if(indexStart < indexStop){
            for(i = indexStart; i <= indexStop; i++){
                if (callback.call(this[i],this[i],i) === false)
                    break;
            }
        }
        else{
            for(i = indexStart; i < this.length; i++){
                if (callback.call(this[i],this[i],i) === false){
                    breaking = true;
                    break;
                }
            }
            if(breaking !== true)
                for(i = 0; i <= indexStop; i++){
                    if (callback.call(this[i],this[i],i) === false)
                        break;
                }
        }
    }
    else{
        if(indexStop > indexStart){
            for(i = indexStop; i >= indexStart; i--){
                if (callback.call(this[i],this[i],i) === false)
                    break;
            }
        }
        else{
            for(i = indexStop; i >= 0; i--){
                if (callback.call(this[i],this[i],i) === false){
                    breaking = true;
                    break;
                }
            }
            if(breaking !== true)
                for(i = this.length - 1; i >= indexStart; i--){
                    if (callback.call(this[i],this[i],i) === false)
                        break;
                }
        }
    }
    
}