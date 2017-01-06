/* 
 * Copyright 2017 Dominic Masters <dominic@domsplace.com>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function isUndefined($var) {
    return typeof $var === typeof undefined;
}

function is_string($var) {
    return typeof $var === 'string' || $var instanceof String
}

function getUndefined() {
    return typeof undefined;
}

if (isUndefined(Array.prototype.contains)) {
    Array.prototype.contains = function (obj) {
        return this.indexOf(obj) !== -1;
    };
}
if (isUndefined(Array.prototype.isKeySet)) {
    Array.prototype.isKeySet = function (obj) {
        return obj in this;
    };
}

if (isUndefined(String.prototype.replaceAll)) {
    if (typeof String.prototype.replaceAll === typeof undefined) {
        String.prototype.replaceAll = function (search, replacement) {
            var target = this;
            return target.replace(new RegExp(search, 'g'), replacement);
        };
    }
}
if (isUndefined(String.prototype.startsWith)) {
    if (typeof String.prototype.startsWith === typeof undefined) {
        String.prototype.startsWith = function (prefix) {
            return this.slice(0, prefix.length) == prefix;
        }
    }
}


function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return(false);
}

HTMLElement.prototype.removeClass = function(remove) {
    var newClassName = "";
    var i;
    var classes = this.className.split(" ");
    for(i = 0; i < classes.length; i++) {
        if(classes[i] !== remove) {
            newClassName += classes[i] + " ";
        }
    }
    this.className = newClassName;
}

HTMLElement.prototype.hasClass = function(cls) {
    return (' ' + this.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

HTMLElement.prototype.addClass = function(add) {
    if(this.hasClass(add)) return;
    this.className += ' ' + add;
}