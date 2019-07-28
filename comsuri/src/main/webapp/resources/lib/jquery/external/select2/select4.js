/*
 Copyright 2012 Igor Vaynberg

 Version: 3.2 Timestamp: Mon Sep 10 10:38:04 PDT 2012

 Licensed under the Apache License, Version 2.0 (the "License"); you may not use this work except in
 compliance with the License. You may obtain a copy of the License in the LICENSE file, or at:

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software distributed under the License is
 distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 */
 (function ($) {
 	if(typeof $.fn.each2 == "undefined"){
 		$.fn.extend({
 			/*
			* 4-10 times faster .each replacement
			* use it carefully, as it overrides jQuery context of element on each iteration
			*/
			each2 : function (c) {
				var j = $([0]), i = -1, l = this.length;
				while (
					++i < l
					&& (j.context = j[0] = this[i])
					&& c.call(j[0], i, j) !== false //"this"=DOM, i=index, j=jQuery object
				);
				return this;
			}
 		});
 	}
})(jQuery);

(function ($, undefined) {
    "use strict";
    /*global document, window, jQuery, console */

    if (window.Select2 !== undefined) {
        return;
    }

    var KEY, AbstractSelect2, SingleSelect2, MultiSelect2, nextUid, sizer;

    KEY = {
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        BACKSPACE: 8,
        DELETE: 46,
        SEMICOLON: 186,
        COLON: 188,
        isArrow: function (k) {
            k = k.which ? k.which : k;
            switch (k) {
            case KEY.LEFT:
            case KEY.RIGHT:
            case KEY.UP:
            case KEY.DOWN:
                return true;
            }
            return false;
        },
        isControl: function (e) {
            var k = e.which;
            switch (k) {
            case KEY.SHIFT:
            case KEY.CTRL:
            case KEY.ALT:
                return true;
            }

            if (e.metaKey) return true;

            return false;
        },
        isFunctionKey: function (k) {
            k = k.which ? k.which : k;
            return k >= 112 && k <= 123;
        }
    };

    nextUid=(function() { var counter=1; return function() { return counter++; }; }());

    function indexOf(value, array) {
        var i = 0, l = array.length, v;

        if (typeof value === "undefined") {
          return -1;
        }

        if (value.constructor === String) {
            for (; i < l; i = i + 1) if (value.localeCompare(array[i]) === 0) return i;
        } else {
            for (; i < l; i = i + 1) {
                v = array[i];
                if (v.constructor === String) {
                    if (v.localeCompare(value) === 0) return i;
                } else {
                    if (v === value) return i;
                }
            }
        }
        return -1;
    }

    /**
     * Compares equality of a and b taking into account that a and b may be strings, in which case localeCompare is used
     * @param a
     * @param b
     */
    function equal(a, b) {
        if (a === b) return true;
        if (a === undefined || b === undefined) return false;
        if (a === null || b === null) return false;
        if (a.constructor === String) return a.localeCompare(b) === 0;
        if (b.constructor === String) return b.localeCompare(a) === 0;
        return false;
    }

    /**
     * Splits the string into an array of values, trimming each value. An empty array is returned for nulls or empty
     * strings
     * @param string
     * @param separator
     */
    function splitVal(string, separator) {
        var val, i, l;
        if (string === null || string.length < 1) return [];
        val = string.split(separator);
        for (i = 0, l = val.length; i < l; i = i + 1) val[i] = $.trim(val[i]);
        return val;
    }

    function getSideBorderPadding(element) {
        return element.outerWidth() - element.width();
    }

    function installKeyUpChangeEvent(element) {
    	var key="keyup-change-value";
        element.bind("keydown", function (e) {
        	//메일에서 (",')쿼테이션을 사용하면 안되기 때문에 입력되지 않도록 처리
        	if(e.keyCode == 222){
        		e.stopImmediatePropagation();
            	e.stopPropagation();
            	return false;
        	}
        	if(e.keyCode == KEY.COLON && e.shiftKey == false){
        		e.stopImmediatePropagation();
            	e.stopPropagation();
            	return false;
        	}
        	if(e.keyCode == KEY.SEMICOLON){
        		e.stopImmediatePropagation();
            	e.stopPropagation();
            	return false;
        	}
        	/*console.log("keydown ::   "+element.val());
            if ($.data(element, key) === undefined) {
                $.data(element, key, element.val());
            }*/
        });
        //element.bind("keyup", function () {
        //firefox,오페라,모바일에서 한글 onkeyup이벤트가 발생안해서 수정처리(choidoyoung)
        var eventName = "change keyup input";
        var userAgent = navigator.userAgent.toLowerCase();
        if(userAgent.indexOf("chrome")>-1){
        	eventName = "keyup";
        }
        element.bind(eventName, function () { 
            var val= $.data(element, key);
            /** jgs135 키워드를 비교하여 검색하는 부분을 제거 한글의 경우 검색이 제대로 이루어 지지 않아 삭제합니다.*/
            if (val === undefined || element.val() !== val) {
                $.data(element, key, element.val());
                element.trigger("keyup-change");
            }
        });
    }

    $(document).delegate("body", "mousemove", function (e) {
        $.data(document, "select2-lastpos", {x: e.pageX, y: e.pageY});
    });

    /**
     * filters mouse events so an event is fired only if the mouse moved.
     *
     * filters out mouse events that occur when mouse is stationary but
     * the elements under the pointer are scrolled.
     */
    function installFilteredMouseMove(element) {
	    element.bind("mousemove", function (e) {
            var lastpos = $.data(document, "select2-lastpos");
            if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
                $(e.target).trigger("mousemove-filtered", e);
            }
        });
    }

    /**
     * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
     * within the last quietMillis milliseconds.
     *
     * @param quietMillis number of milliseconds to wait before invoking fn
     * @param fn function to be debounced
     * @param ctx object to be used as this reference within fn
     * @return debounced version of fn
     */
    function debounce(quietMillis, fn, ctx) {
        ctx = ctx || undefined;
        var timeout;
        return function () {
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function() {
                fn.apply(ctx, args);
            }, quietMillis);
        };
    }

    /**
     * A simple implementation of a thunk
     * @param formula function used to lazily initialize the thunk
     * @return {Function}
     */
    function thunk(formula) {
        var evaluated = false,
            value;
        return function() {
            if (evaluated === false) { value = formula(); evaluated = true; }
            return value;
        };
    };

    function installDebouncedScroll(threshold, element) {
        var notify = debounce(threshold, function (e) { element.trigger("scroll-debounced", e);});
        element.bind("scroll", function (e) {
            if (indexOf(e.target, element.get()) >= 0) notify(e);
        });
    }

    function killEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function measureTextWidth(e) {
        if (!sizer){
        	var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
        	sizer = $("<div></div>").css({
	            position: "absolute",
	            left: "-10000px",
	            top: "-10000px",
	            display: "none",
	            fontSize: style.fontSize,
	            fontFamily: style.fontFamily,
	            fontStyle: style.fontStyle,
	            fontWeight: style.fontWeight,
	            letterSpacing: style.letterSpacing,
	            textTransform: style.textTransform,
	            whiteSpace: "nowrap"
	        });
        	$("body").append(sizer);
        }
        sizer.text(e.val());
        return sizer.width();
    }

    function markMatch(text, term, markup) {
        var match=text.toUpperCase().indexOf(term.toUpperCase()),
            tl=term.length;

        if (match<0) {
            markup.push(text);
            return;
        }

        markup.push(text.substring(0, match));
        markup.push("<span class='select2-match'>");
        markup.push(text.substring(match, match + tl));
        markup.push("</span>");
        markup.push(text.substring(match + tl, text.length));
    }

    function escapeMarkup(markup) { // text escape markup
		if (markup && typeof(markup) === "string") {
			markup = markup.replace(/&/g, "&amp;");
			markup = markup.replace(/</g, "&lt;");
			markup = markup.replace(/>/g, "&gt;");
        	return markup;
        }
        return markup;
	}

    /**
     * Produces an ajax-based query function
     *
     * @param options object containing configuration paramters
     * @param options.transport function that will be used to execute the ajax request. must be compatible with parameters supported by $.ajax
     * @param options.url url for the data
     * @param options.data a function(searchTerm, pageNumber, context) that should return an object containing query string parameters for the above url.
     * @param options.dataType request data type: ajax, jsonp, other datatatypes supported by jQuery's $.ajax function or the transport function if specified
     * @param options.traditional a boolean flag that should be true if you wish to use the traditional style of param serialization for the ajax request
     * @param options.quietMillis (optional) milliseconds to wait before making the ajaxRequest, helps debounce the ajax function if invoked too often
     * @param options.results a function(remoteData, pageNumber) that converts data returned form the remote request to the format expected by Select2.
     *      The expected format is an object containing the following keys:
     *      results array of objects that will be used as choices
     *      more (optional) boolean indicating whether there are more results available
     *      Example: {results:[{id:1, text:'Red'},{id:2, text:'Blue'}], more:true}
     */
    function ajax(options) {
        var timeout, // current scheduled but not yet executed request
            requestSequence = 0, // sequence used to drop out-of-order responses
            handler = null,
            quietMillis = options.quietMillis || 100;
        return function (query) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                requestSequence += 1; // increment the sequence
                var requestNumber = requestSequence, // this request's sequence number
                    data = options.data, // ajax data function
                    transport = options.transport || $.ajax,
                    traditional = options.traditional || false,
                    type = options.type || 'GET'; // set type of request (GET or POST)

                data = data.call(this, query.term, query.page, query.context);

                if( null !== handler) { handler.abort(); }

                handler = transport.call(null, {
                    url: options.url,
                    dataType: options.dataType,
                    data: data,
                    type: type,
                    cache : false,
                    traditional: traditional,
                    success: function (data) {
                        if (requestNumber < requestSequence) {
                            return;
                        }
                        // TODO 3.0 - replace query.page with query so users have access to term, page, etc.
                        var results = options.results(data, query.page);
                        
                        // 부서 검색시 계열사의 경우 text가 {기획팀:1234}와 같은 형식으로 넘어 오는데 이럴 경우 result 값에 text가 object로 넘어오게 된다
                        // 이를 수정 하기 위해 아래 코드를 추가함
                        if(results.results){
                        	$.each(results.results, function(){
                        		if(typeof this.text == 'object'){
                        			this.text = JSON.stringify(this.text).replace(/\"/gi, "");
                        		}
                        	});
                        }
                        query.callback(results);
                    }
                });
            }, quietMillis);
        };
    }

    /**
     * Produces a query function that works with a local array
     *
     * @param options object containing configuration parameters. The options parameter can either be an array or an
     * object.
     *
     * If the array form is used it is assumed that it contains objects with 'id' and 'text' keys.
     *
     * If the object form is used ti is assumed that it contains 'data' and 'text' keys. The 'data' key should contain
     * an array of objects that will be used as choices. These objects must contain at least an 'id' key. The 'text'
     * key can either be a String in which case it is expected that each element in the 'data' array has a key with the
     * value of 'text' which will be used to match choices. Alternatively, text can be a function(item) that can extract
     * the text.
     */
    function local(options) {
        var data = options, // data elements
            dataText,
            text = function (item) { return ""+item.text; }; // function used to retrieve the text portion of a data item that is matched against the search

        if (!$.isArray(data)) {
            text = data.text;
            // if text is not a function we assume it to be a key name
            if (!$.isFunction(text)) {
              dataText = data.text; // we need to store this in a separate variable because in the next step data gets reset and data.text is no longer available
              text = function (item) { return item[dataText]; };
            }
            data = data.results;
        }

        return function (query) {
            var t = query.term, filtered = { results: [] }, process;
            if (t === "") {
                query.callback({results: data});
                return;
            }

            process = function(datum, collection) {
                var group, attr;
                datum = datum[0];
                if (datum.children) {
                    group = {};
                    for (attr in datum) {
                        if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                    }
                    group.children=[];
                    $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                    if (group.children.length) {
                        collection.push(group);
                    }
                } else {
                    if (query.matcher(escapeMarkup(t), text(datum))) {
                        collection.push(datum);
                    }
                }
            };

            $(data).each2(function(i, datum) { process(datum, filtered.results); });
            query.callback(filtered);
        };
    }

    // TODO javadoc
    function tags(data) {
        // TODO even for a function we should probably return a wrapper that does the same object/string check as
        // the function for arrays. otherwise only functions that return objects are supported.
        if ($.isFunction(data)) {
            return data;
        }

        // if not a function we assume it to be an array

        return function (query) {
            var t = query.term, filtered = {results: []};
            $(data).each(function () {
                var isObject = this.text !== undefined,
                    text = isObject ? this.text : this;
                if (t === "" || query.matcher(t, text)) {
                    filtered.results.push(isObject ? this : {id: this, text: this});
                }
            });
            query.callback(filtered);
        };
    }

    /**
     * Checks if the formatter function should be used.
     *
     * Throws an error if it is not a function. Returns true if it should be used,
     * false if no formatting should be performed.
     *
     * @param formatter
     */
    function checkFormatter(formatter, formatterName) {
        if ($.isFunction(formatter)) return true;
        if (!formatter) return false;
        throw new Error("formatterName must be a function or a falsy value");
    }

    function evaluate(val) {
        return $.isFunction(val) ? val() : val;
    }

    function countResults(results) {
        var count = 0;
        $.each(results, function(i, item) {
            if (item.children) {
                count += countResults(item.children);
            } else {
                count++;
            }
        });
        return count;
    }

    /**
     * Default tokenizer. This function uses breaks the input on substring match of any string from the
     * opts.tokenSeparators array and uses opts.createSearchChoice to create the choice object. Both of those
     * two options have to be defined in order for the tokenizer to work.
     *
     * @param input text user has typed so far or pasted into the search field
     * @param selection currently selected choices
     * @param selectCallback function(choice) callback tho add the choice to selection
     * @param opts select2's opts
     * @return undefined/null to leave the current input unchanged, or a string to change the input to the returned value
     */
    function defaultTokenizer(input, selection, selectCallback, opts) {
        var original = input, // store the original so we can compare and know if we need to tell the search to update its text
            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
            token, // token
            index, // position at which the separator was found
            i, l, // looping variables
            separator; // the matched separator

        if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

        while (true) {
            index = -1;

            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
                separator = opts.tokenSeparators[i];
                index = input.indexOf(separator);
                if (index >= 0) break;
            }

            if (index < 0) break; // did not find any token separator in the input string, bail

            token = input.substring(0, index);
            input = input.substring(index + separator.length);

            if (token.length > 0) {
                token = opts.createSearchChoice(token, selection);
                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
                    dupe = false;
                    for (i = 0, l = selection.length; i < l; i++) {
                        if (equal(opts.id(token), opts.id(selection[i]))) {
                            dupe = true; break;
                        }
                    }

                    if (!dupe) selectCallback(token);
                }
            }
        }

        if (original.localeCompare(input) != 0) return input;
    }
    // wonSeok : 커스터마이징 시작
	/**
	 * 메일 정규식에 맞는지 체크한다.
	 */
	function isMail(text) {
		//회사, 부서, 직위, 직책, 사용자그룹 모두 대표 메일이 있으므로 메일형식 체크를 하도록 한다.
		/*if(reservedWorkCheck(text)) {
			return true;
		}*/

		//var mailPattern = /^[0-9a-zA-Z][-._0-9a-zA-Z]*@([-0-9a-zA-Z]+[.])+[a-zA-Z]{2,6}/g; 
		// 2015.07.30. 네이버 회원가입 시에 허용되는 특수 문자는 _(underscore) -(dash)만 허용하고 있음.
		
		// 2016.07.15 'aaa@bbb.com' 체크 하기 위한 유효성 변경
		//var mailPattern = /^([\w-\+]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$/;
				
		// 2017.08.02 도메인생성조건에서 언더바(_)를 사용하지 않기 때문에 유효성 변경
		var mailPattern = /^([\w-\+]+(?:\.[\w-]+)*)@([\da-zA-Z\.-]+)\.([a-zA-Z]{1,6}(?:\.[a-zA-Z]{2})?)$/;
		if(text.indexOf("@") == -1) return false;
		if(text.indexOf("&lt;") != -1) {
			if(text.indexOf("&gt;") == -1) return false;
			var info1 = text.split("&lt;");
			var info2 = info1[1].split("&gt;");
			if(info2[1] && info2[1].trim() != "") return false;
			if(!mailPattern.test(info2[0])) return false;
		} else {
			if(!mailPattern.test(text)) return false;
		}
		return true;
	}

	function reservedWorkCheck(text) {
		var pattern = /^\%.*\%$|^\#.*\#$|^\$.*\$$|^\{.*\}$|^\(.*\)$|^\[.*\]$/;  // 회사명이거나 부서명, 주소록 그룹인 경우 패턴 검사 //직위#, 직책$ 도 추가, yjpark , 2012-03-16
		
		if(text.indexOf("<") != -1) {
			text = text.split("<")[0].trim();	
		}
		
		if(pattern.test(text)) {
			return true;
		}else{
			return false;
		}
	}
	// wonSeok : 커스터마이징 끝

    /**
     * blurs any Select2 container that has focus when an element outside them was clicked or received focus
     *
     * also takes care of clicks on label tags that point to the source element
     */
    $(document).ready(function () {
        $(document).delegate("body", "mousedown"/*touchEnd 이벤트 제거*/, function (e) {
            var target = $(e.target).closest("div.select2-container").get(0), attr;
            if (target) {
                $(document).find("div.select2-container").each(function () {
                    if (this !== target) $(this).data("select2").blur();
                });
            } else {
                target = $(e.target).closest("div.select2-drop").get(0);
                $(document).find("div.select2-drop-active").each(function () {
                    if (target && this !== target){
                    	var select2 = $(this).data("select2");                    	

                    	if(select2.opts.forcedInsert){
                    		select2.selectHighlighted();
                    		select2.blur();
                    	}else{	//일반
                    		select2.blur();
                    	}
                    }else{
                    	//검색결과로 나온 사람을 클릭하지 않고 다른 요소 클릭시 포커스된 사람이 들어간경우 return 처리
                    	$(this).data("select2").blur();
                    }
                });
            }

            target=$(e.target);
            attr = target.attr("for");
            if ("LABEL" === e.target.tagName && attr && attr.length > 0) {
                target = $("#"+attr);
                if(target.data("select2") != null){
                	target = target.data("select2");
                }
                if (target !== undefined) { target.focus(); e.preventDefault();}
            }
        });
        /**
         * 에디터에 포커스가 갔을 경우 결과 패널을 닫아준다.
         */
        $(document).delegate("body", "blur", function (e) {
        	setTimeout(function(){
        		if(document.activeElement && document.activeElement.nodeName && document.activeElement.nodeName.toLowerCase() === 'iframe'){
        			$(document).find("div.select2-drop-active").each(function () {
        				var select2 = $(this).data("select2");
        				//메일과 같이 자동완성에서 선택하는 것이 아니라 없는 것을 강제로
        				//입력하는 경우에 사용
                    	if(select2.opts.forcedInsert){
                    		select2.selectHighlighted();
                    	}else{	//일반 자동완성에서 선택하는 경우.
                    		select2.blur();
                    	}
                    });
        		}else if(document.activeElement && $(document.activeElement).hasClass('select2-input')){//검색 input에 포커스가 갔을경우
        			//검색창을 닫는다
        			$(document).find("div.select2-drop-active").each(function () {
        				var select2 = $(this).data("select2");
        				if(select2.containerId != $(document.activeElement).closest('.select2-container').attr('id')){
        					if(select2.opts.forcedInsert){
                        		select2.selectHighlighted();
                        	}else{	//일반 자동완성에서 선택하는 경우.
                        		select2.blur();
                        	}
        				}
                    });
        		}
        	}, '200');
        });
    });

    /**
     * Creates a new class
     *
     * @param superClass
     * @param methods
     */
    function clazz(SuperClass, methods) {
        var constructor = function () {};
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    }

    AbstractSelect2 = clazz(Object, {

        // abstract
        bind: function (func) {
            var self = this;
            return function () {
                func.apply(self, arguments);
            };
        },

        // abstract
        init: function (opts) {
            var results, search, resultsSelector = ".select2-results";

            // prepare options
            this.opts = opts = this.prepareOpts(opts);

            this.id=opts.id;

            // destroy if called on an existing component
            if (opts.element.data("select2") !== undefined &&
                opts.element.data("select2") !== null) {
                this.destroy();
            }

            this.enabled=true;
            this.container = this.createContainer();

            this.containerId="s2id_"+(opts.element.attr("id") || "autogen"+nextUid());
            this.containerSelector="#"+this.containerId.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
            this.container.attr("id", this.containerId);

            // cache the body so future lookups are cheap
            this.body = thunk(function() { return opts.element.closest("body"); });

            if (opts.element.attr("class") !== undefined) {
                this.container.addClass(opts.element.attr("class").replace(/validate\[[\S ]+] ?/, ''));
            }

            this.container.css(evaluate(opts.containerCss));
            this.container.addClass(evaluate(opts.containerCssClass));

            // swap container for the element
            this.opts.element
                .data("select2", this)
                .hide()
                .before(this.container);
            this.container.data("select2", this);

            this.dropdown = this.container.find(".select2-drop");
            this.dropdown.addClass(evaluate(opts.dropdownCssClass));
            this.dropdown.data("select2", this);

            this.results = results = this.container.find(resultsSelector);
            this.search = search = this.container.find("input.select2-input");

            search.attr("tabIndex", this.opts.element.attr("tabIndex"));

            this.resultsPage = 0;
            this.context = null;

            // initialize the container
            this.initContainer();
            this.initContainerWidth();

            installFilteredMouseMove(this.results);
            this.dropdown.delegate(resultsSelector, "mousemove-filtered", this.bind(this.highlightUnderEvent));

            installDebouncedScroll(80, this.results);
            this.dropdown.delegate(resultsSelector, "scroll-debounced", this.bind(this.loadMoreIfNeeded));

            // if jquery.mousewheel plugin is installed we can prevent out-of-bounds scrolling of results via mousewheel
            if ($.fn.mousewheel) {
                results.mousewheel(function (e, delta, deltaX, deltaY) {
                    var top = results.scrollTop(), height;
                    if (deltaY > 0 && top - deltaY <= 0) {
                        results.scrollTop(0);
                        killEvent(e);
                    } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
                        results.scrollTop(results.get(0).scrollHeight - results.height());
                        killEvent(e);
                    }
                });
            }

            installKeyUpChangeEvent(search);
            search.bind("keyup-change", this.bind(this.updateResults));
            search.bind("focus", function () {
            	search.addClass("select2-focused"); 
            	if (search.val() === " ") {
            		search.val("");
            	}
            });
            search.bind("blur", function () { search.removeClass("select2-focused");});

            this.dropdown.delegate(resultsSelector, "mouseup", this.bind(function (e) {
                if ($(e.target).closest(".select2-result-selectable:not(.select2-disabled)").length > 0) {
                    this.highlightUnderEvent(e);
                    this.selectHighlighted(e);
                } else {
                    this.focusSearch();
                }
                killEvent(e);
            }));

            // trap all mouse events from leaving the dropdown. sometimes there may be a modal that is listening
            // for mouse events outside of itself so it can close itself. since the dropdown is now outside the select2's
            // dom it will trigger the popup close, which is not what we want
            this.dropdown.bind("click mouseup mousedown", function (e) { e.stopPropagation(); });

            if ($.isFunction(this.opts.initSelection)) {
                // initialize selection based on the current value of the source element
                this.initSelection();

                // if the user has provided a function that can set selection based on the value of the source element
                // we monitor the change event on the element and trigger it, allowing for two way synchronization
                this.monitorSource();
            }

            if (opts.element.is(":disabled") || opts.element.is("[readonly='readonly']")) this.disable();
        },

        // abstract
        destroy: function () {
            var select2 = this.opts.element.data("select2");
            if (select2 !== undefined) {
                select2.container.remove();
                select2.dropdown.remove();
                select2.opts.element
                    .removeData("select2")
                    .unbind(".select2")
                    .show();
            }
        },

        // abstract
        prepareOpts: function (opts) {
            var element, select, idKey, ajaxUrl;

            element = opts.element;

            if (element.get(0).tagName.toLowerCase() === "select") {
                this.select = select = opts.element;
            }

            if (select) {
                // these options are not allowed when attached to a select because they are picked up off the element itself
                $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                    if (this in opts) {
                        throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
                    }
                });
            }

            opts = $.extend({}, {
                populateResults: function(container, results, query) {
                    var populate,  data, result, children, id=this.opts.id, self=this;
                    
                    populate=function(results, container, depth) {

                        var i, l, result, selectable, compound, node, label, innerContainer, formatted;
                        for (i = 0, l = results.length; i < l; i = i + 1) {

                            result=results[i];
                            selectable=id(result) !== undefined;
                            compound=result.children && result.children.length > 0;

                            node=$("<li></li>");
                            node.addClass("select2-results-dept-"+depth);
                            node.addClass("select2-result");
                            node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                            if (compound) { node.addClass("select2-result-with-children"); }
                            node.addClass(self.opts.formatResultCssClass(result));

                            label=$("<div></div>");
                            label.addClass("select2-result-label");

                            formatted=opts.formatResult(result, label, query);
                            if (formatted!==undefined) {
                            	label.html(self.opts.escapeMarkup(formatted));
                            }

                            node.append(label);

                            if (compound) {

                                innerContainer=$("<ul></ul>");
                                innerContainer.addClass("select2-result-sub");
                                populate(result.children, innerContainer, depth+1);
                                node.append(innerContainer);
                            }

                            node.data("select2-data", result);
                            container.append(node);
                        }
                    };

                    populate(results, container, 0);
                }
            }, $.fn.select2.defaults, opts);

            if (typeof(opts.id) !== "function") {
                idKey = opts.id;
                opts.id = function (e) { return e[idKey]; };
            }

            if (select) {
                opts.query = this.bind(function (query) {
                    var data = { results: [], more: false },
                        term = query.term,
                        children, firstChild, process;

                    process=function(element, collection) {
                        var group;
                        if (element.is("option")) {
                            if (query.matcher(term, element.text(), element)) {
                                collection.push({id:element.attr("value"), text:element.text(), element: element.get(), css: element.attr("class")});
                            }
                        } else if (element.is("optgroup")) {
                            group={text:element.attr("label"), children:[], element: element.get(), css: element.attr("class")};
                            element.children().each2(function(i, elm) { process(elm, group.children); });
                            if (group.children.length>0) {
                                collection.push(group);
                            }
                        }
                    };

                    children=element.children();

                    // ignore the placeholder option if there is one
                    if (this.getPlaceholder() !== undefined && children.length > 0) {
                        firstChild = children[0];
                        if ($(firstChild).text() === "") {
                            children=children.not(firstChild);
                        }
                    }

                    children.each2(function(i, elm) { process(elm, data.results); });

                    query.callback(data);
                });
                // this is needed because inside val() we construct choices from options and there id is hardcoded
                opts.id=function(e) { return e.id; };
                opts.formatResultCssClass = function(data) { return data.css; }
            } else {
                if (!("query" in opts)) {
                    if ("ajax" in opts) {
                        ajaxUrl = opts.element.data("ajax-url");
                        if (ajaxUrl && ajaxUrl.length > 0) {
                            opts.ajax.url = ajaxUrl;
                        }
                        opts.query = ajax(opts.ajax);
                    } else if ("data" in opts) {
                        opts.query = local(opts.data);
                    } else if ("tags" in opts) {
                        opts.query = tags(opts.tags);
                        opts.createSearchChoice = function (term) { return {id: term, text: term}; };
                        opts.initSelection = function (element, callback) {
                            var data = [];
                            $(splitVal(element.val(), opts.separator)).each(function () {
                                var id = this, text = this, tags=opts.tags;
                                if ($.isFunction(tags)) tags=tags();
                                $(tags).each(function() { if (equal(this.id, id)) { text = this.text; return false; } });
                                data.push({id: id, text: text});
                            });

                            callback(data);
                        };
                    }
                }
            }
            if (typeof(opts.query) !== "function") {
                throw "query function not defined for Select2 " + opts.element.attr("id");
            }

            return opts;
        },

        /**
         * Monitor the original element for changes and update select2 accordingly
         */
        // abstract
        monitorSource: function () {
            this.opts.element.bind("change.select2", this.bind(function (e) {
                if (this.opts.element.data("select2-change-triggered") !== true) {
                    this.initSelection();
                }
            }));
        },

        /**
         * Triggers the change event on the source element
         */
        // abstract
        triggerChange: function (details) {
        	
            details = details || {};
            details= $.extend({}, details, { type: "change", val: this.val() });
            // prevents recursive triggering
            this.opts.element.data("select2-change-triggered", true);
            this.opts.element.trigger(details);
            this.opts.element.data("select2-change-triggered", false);
            
            // some validation frameworks ignore the change event and listen instead to keyup, click for selects
            // so here we trigger the click event manually
            // combobox 이벤트 바인드 오류로 인하여 조건 처리 ui.js
            this.opts.element.click();

            // ValidationEngine ignorea the change event and listens instead to blur
            // so here we trigger the blur event manually if so desired
            if (this.opts.blurOnChange)
                this.opts.element.blur();

            /* 변경시 옵션 이벤트 호출 (by bks). */
            if (this.opts.onChangedSelect) {
            	this.opts.onChangedSelect(details, this.container);
            }
        },


        // abstract
        enable: function() {
            if (this.enabled) return;

            this.enabled=true;
            this.container.removeClass("select2-container-disabled");
        },

        // abstract
        disable: function() {
            if (!this.enabled) return;

            this.close();

            this.enabled=false;
            this.container.addClass("select2-container-disabled");
        },

        // abstract
        opened: function () {
            return this.container.hasClass("select2-dropdown-open");
        },

        // abstract
        positionDropdown: function() {
            var offset = this.container.offset(),
                height = this.container.outerHeight(),
                width = this.container.outerWidth(),
                dropHeight = this.dropdown.outerHeight(),
                viewportBottom = $(window).scrollTop() + document.documentElement.clientHeight,
                dropTop = offset.top + height,
                dropLeft = offset.left,
                enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
                enoughRoomAbove = (offset.top - dropHeight) >= this.body().scrollTop(),
                aboveNow = this.dropdown.hasClass("select2-drop-above"),
                bodyOffset,
                above,
                css;

            // console.log("below/ droptop:", dropTop, "dropHeight", dropHeight, "sum", (dropTop+dropHeight)+" viewport bottom", viewportBottom, "enough?", enoughRoomBelow);
            // console.log("above/ offset.top", offset.top, "dropHeight", dropHeight, "top", (offset.top-dropHeight), "scrollTop", this.body().scrollTop(), "enough?", enoughRoomAbove);

            // fix positioning when body has an offset and is not position: static

            if (this.body().css('position') !== 'static') {
                bodyOffset = this.body().offset();
                dropTop -= bodyOffset.top;
                dropLeft -= bodyOffset.left;
            }

            // always prefer the current above/below alignment, unless there is not enough room

            if (aboveNow) {
                above = true;
                if (!enoughRoomAbove && enoughRoomBelow) above = false;
            } else {
                above = false;
                if (!enoughRoomBelow && enoughRoomAbove) above = true;
            }

            if (above) {
                dropTop = offset.top - dropHeight;
                this.container.addClass("select2-drop-above");
                this.dropdown.addClass("select2-drop-above");
            }
            else {
                this.container.removeClass("select2-drop-above");
                this.dropdown.removeClass("select2-drop-above");
            }

            css = $.extend({
                top: dropTop,
                left: dropLeft,
                width: width
            }, evaluate(this.opts.dropdownCss));

            this.dropdown.css(css);
            
            $(".select4_dropdown_fixed").remove();
            
            //IE인경우 tagfreeActivex 에 의해 달력 레이어가 가려지는 오류 수정
            var agent = navigator.userAgent.toLowerCase();            
            if ((navigator.appName == 'Netscape' && navigator.userAgent.search('Trident') != -1) || (agent.indexOf("msie") != -1) ) {            	
    			var underIframe = $('<iframe frameborder="0" scrolling="no" class="select4_dropdown_fixed" title=""></iframe>');
    			underIframe.css({position:"absolute", 
    							left: dropLeft + "px", 
    							top: dropTop + "px", 
    							width : width+"px",
    							height : dropHeight + 3 +"px", 
    							opacity : 0, "z-index":1});
    			this.body().append(underIframe);
            } 

           
        },

        // abstract
        shouldOpen: function() {
            var event;

            if (this.opened()) return false;

            event = $.Event("open");
            this.opts.element.trigger(event);
            return !event.isDefaultPrevented();
        },

        // abstract
        clearDropdownAlignmentPreference: function() {
            // clear the classes used to figure out the preference of where the dropdown should be opened
            this.container.removeClass("select2-drop-above");
            this.dropdown.removeClass("select2-drop-above");
        },

        /**
         * Opens the dropdown
         *
         * @return {Boolean} whether or not dropdown was opened. This method will return false if, for example,
         * the dropdown is already open, or if the 'open' event listener on the element called preventDefault().
         */
        // abstract
        open: function () {

            if (!this.shouldOpen()) return false;

            window.setTimeout(this.bind(this.opening), 1);

            return true;
        },

        /**
         * Performs the opening of the dropdown
         */
        // abstract
        opening: function() {
            var cid = this.containerId, selector = this.containerSelector,
                scroll = "scroll." + cid, resize = "resize." + cid;

            this.container.parents().each(function() {
                $(this).bind(scroll, function() {
                    var s2 = $(selector);
                    if (s2.length == 0) {
                        $(this).unbind(scroll);
                    }
                    s2.select2("close");
                });
            });

            $(window).bind(resize, function() {
                var s2 = $(selector);
                if (s2.length == 0) {
                    $(window).unbind(resize);
                }
                s2.select2("close");
            });

            this.clearDropdownAlignmentPreference();

            if (this.search.val() === " ") { this.search.val(""); }

            this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

            this.updateResults(true);

            if(this.dropdown[0] !== this.body().children().last()[0]) {
                this.dropdown.detach().appendTo(this.body());
            }

            this.dropdown.show();

            this.positionDropdown();
            this.dropdown.addClass("select2-drop-active");

            this.ensureHighlightVisible();
            
            //ie11에서 결과 레이어 열릴 때 초성,중성 분리되서 입력되는 현상 방지(choidoyoung)
            if (this.search.val() === "") { this.focusSearch(); } 
            
        },

        // abstract
        close: function () {
            if (!this.opened()) return;

            var self = this;

            this.container.parents().each(function() {
                $(this).unbind("scroll." + self.containerId);
            });
            $(window).unbind("resize." + this.containerId);

            this.clearDropdownAlignmentPreference();

            this.dropdown.hide();
            this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
            $(".select4_dropdown_fixed").remove();
            this.results.empty();
            this.clearSearch();

            this.opts.element.trigger($.Event("close"));
        },

        // abstract
        clearSearch: function () {
        	
        },

        // abstract
        ensureHighlightVisible: function () {
            var results = this.results, children, index, child, hb, rb, y, more;

            index = this.highlight();

            if (index < 0) return;

            if (index == 0) {

                // if the first element is highlighted scroll all the way to the top,
                // that way any unselectable headers above it will also be scrolled
                // into view

                results.scrollTop(0);
                return;
            }

            children = results.find(".select2-result-selectable");

            child = $(children[index]);

            hb = child.offset().top + child.outerHeight();

            // if this is the last child lets also make sure select2-more-results is visible
            if (index === children.length - 1) {
                more = results.find("li.select2-more-results");
                if (more.length > 0) {
                    hb = more.offset().top + more.outerHeight();
                }
            }

            rb = results.offset().top + results.outerHeight();
            if (hb > rb) {
                results.scrollTop(results.scrollTop() + (hb - rb));
            }
            y = child.offset().top - results.offset().top;

            // make sure the top of the element is visible
            if (y < 0) {
                results.scrollTop(results.scrollTop() + y); // y is negative
            }
        },

        // abstract
        moveHighlight: function (delta) {
            var choices = this.results.find(".select2-result-selectable"),
                index = this.highlight();

            while (index > -1 && index < choices.length) {
                index += delta;
                var choice = $(choices[index]);
                if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled")) {
                    this.highlight(index);
                    break;
                }
            }
        },

        // abstract
        highlight: function (index) {
            var choices = this.results.find(".select2-result-selectable").not(".select2-disabled");

            if (arguments.length === 0) {
                return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
            }

            if (index >= choices.length) index = choices.length - 1;
            if (index < 0) index = 0;

            choices.removeClass("select2-highlighted");

            $(choices[index]).addClass("select2-highlighted");
            this.ensureHighlightVisible();

        },

        // abstract
        countSelectableResults: function() {
            return this.results.find(".select2-result-selectable").not(".select2-disabled").length;
        },

        // abstract
        highlightUnderEvent: function (event) {
            var el = $(event.target).closest(".select2-result-selectable");
            if (el.length > 0 && !el.is(".select2-highlighted")) {
        		var choices = this.results.find('.select2-result-selectable');
                this.highlight(choices.index(el));
            } else if (el.length == 0) {
                // if we are over an unselectable item remove al highlights
                this.results.find(".select2-highlighted").removeClass("select2-highlighted");
            }
        },

        // abstract
        loadMoreIfNeeded: function () {
            var results = this.results,
                more = results.find("li.select2-more-results"),
                below, // pixels the element is below the scroll fold, below==0 is when the element is starting to be visible
                offset = -1, // index of first element without data
                page = this.resultsPage + 1,
                self=this,
                term=this.search.val(),
                context=this.context;

            if (more.length === 0) return;
            below = more.offset().top - results.offset().top - results.height();

            if (below <= 0) {
                more.addClass("select2-active");
                this.opts.query({
                        term: term,
                        page: page,
                        context: context,
                        matcher: this.opts.matcher,
                        callback: this.bind(function (data) {

                    // ignore a response if the select2 has been closed before it was received
                    if (!self.opened()) return;


                    self.opts.populateResults.call(this, results, data.results, {term: term, page: page, context:context});

                    if (data.more===true) {
                        more.detach().appendTo(results).text(self.opts.formatLoadMore(page+1));
                        window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                    } else {
                        more.remove();
                    }
                    self.positionDropdown();
                    self.resultsPage = page;
                })});
            }
        },

        /**
         * Default tokenizer function which does nothing
         */
        tokenize: function() {

        },

        /**
         * @param initial whether or not this is the call to this method right after the dropdown has been opened
         */
        // abstract
        updateResults: function (initial) {
            var search = this.search, results = this.results, opts = this.opts, data, self=this, input;

            // if the search is currently hidden we do not alter the results
            if (initial !== true && (this.showSearchInput === false || !this.opened())) {
                return;
            }

            search.addClass("select2-active");

            function postRender() {
                results.scrollTop(0);
                search.removeClass("select2-active");
                self.positionDropdown();
            }

            function render(html) {
            	// wonSeok : 사용자가 작성한&gt;&lt;태그가 나오지 않는 형상땜 eacape제거
                //results.html(self.opts.escapeMarkup(html));
            	results.html(html);
                postRender();
            }

            if(search.val().length < opts.minimumInputLength){
            	opts.data = undefined;
            	opts.isLoaded = false;
            }

            if (opts.maximumSelectionSize >=1) {
                data = this.data();
                if ($.isArray(data) && data.length >= opts.maximumSelectionSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
            	    render("<li class='select2-selection-limit'>" + opts.formatSelectionTooBig(opts.maximumSelectionSize) + "</li>");
            	    return;
                }
            }

            if (search.val().length < opts.minimumInputLength && checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                render("<li class='select2-no-results'>" + opts.formatInputTooShort(search.val(), opts.minimumInputLength) + "</li>");
                return;
            }
            else {
                render("<li class='select2-searching'>" + opts.formatSearching() + "</li>");
            }
            

            // give the tokenizer a chance to pre-process the input
            // jgs135 IE에서 검색어가 지워지는 문제가 있어서 삭제함
            /*input = this.tokenize();
            if (input != undefined && input != null) {
                search.val(input);
            }*/
            

            var searchWord = search.val();
            var agent = navigator.userAgent.toLowerCase();            
            if ((navigator.appName == 'Netscape' && navigator.userAgent.search('Trident') != -1) || (agent.indexOf("msie") != -1) ) {
            	/*if(opts.isLoaded){
                	if(opts.data){
                		opts.query = local(opts.data);
                	}else{
                		if (checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
    	                    render("<li class='select2-no-results'>" + opts.formatNoMatches(search.val()) + "</li>");
    	                }
                		return;
                	}
                }else{            
                	opts.query = ajax(opts.ajax);
                	searchWord = searchWord.substring(0,opts.minimumInputLength-1);
                	opts.isLoaded = true;
                }*/
            	
            	// 검색 시 요청을 두번 하게 되는데  두번째 요청은 opts.isLoaded가 true가 되서 local(opts.data) 함수를 타게 되는데
            	// local 함수에서는 서버에서 가져온 데이터에서 입력한 검색어와 text가 매칭되는 결과만 표시하도록 되어 있다
            	// 아이디 검색의 경우는 text에 아이디를  표시 하지 않기 때문에 매칭된 결과가 없다
            	// 이 오류를 수정 하기 위해 위에 소스를 주석처리하고 아래 처럼 변경 하였다.
            	opts.query = ajax(opts.ajax);
            	//searchWord = searchWord.substring(0,opts.minimumInputLength-1);
            	opts.isLoaded = true;
            }
            
            this.resultsPage = 1;
            opts.query({
                term: searchWord,
                page: this.resultsPage,
                context: null,
                matcher: opts.matcher,
                callback: this.bind(function (data) {
	                var def; // default choice

	                // ignore a response if the select2 has been closed before it was received
	                if (!this.opened()) return;

	                // save context, if any
	                this.context = (data.context===undefined) ? null : data.context;

	                // create a default choice and prepend it to the list
	                if (this.opts.createSearchChoice && search.val() !== "") {
	                    def = this.opts.createSearchChoice.call(null, search.val(), data.results);
	                    if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
	                        if ($(data.results).filter(
	                            function () {
	                                return equal(self.id(this), self.id(def));
	                            }).length === 0) {
	                            data.results.unshift(def);
	                        }
	                    }
	                }

	                if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
	                    render("<li class='select2-no-results'>" + opts.formatNoMatches(search.val()) + "</li>");
	                    return;
	                }

	                if(!this.opts.data){
	                	this.opts.data = {results : data.results, text : 'text'};
	                	this.updateResults();
	                }else{
	                	results.empty();
		                self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

		                if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
		                    results.append("<li class='select2-more-results'>" + self.opts.escapeMarkup(opts.formatLoadMore(this.resultsPage)) + "</li>");
		                    window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
		                }

		                this.postprocessResults(data, initial);

		                postRender();
	                }
	            })});
        },

        /**
         * 위에 updateResults를 수정하여 만들었습니다. 이 함수는 수정 시 결과를 갱신하는 함수입니다.
         * @author jgs135
         * @param initial whether or not this is the call to this method right after the dropdown has been opened
         */
        // abstract
        updateResultsByModify: function (choice) {
        	var search = choice, results = this.results, opts = this.opts, data, self=this;

            function postRender() {
                results.scrollTop(0);
                search.removeClass("select2-active");
                self.positionDropdown();
            }

            function render(html) {
            	// wonSeok : 사용자가 작성한&gt;&lt;태그가 나오지 않는 형상땜 eacape제거
                //results.html(self.opts.escapeMarkup(html));
            	results.html(html);
                postRender();
            }

            if(search.val().length < opts.minimumInputLength){
            	opts.data = undefined;
            	opts.isLoaded = false;
            }

            if (opts.maximumSelectionSize >=1) {
                data = this.data();
                if ($.isArray(data) && data.length >= opts.maximumSelectionSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
            	    render("<li class='select2-selection-limit'>" + opts.formatSelectionTooBig(opts.maximumSelectionSize) + "</li>");
            	    return;
                }
            }

            if (search.val().length < opts.minimumInputLength && checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                render("<li class='select2-no-results'>" + opts.formatInputTooShort(search.val(), opts.minimumInputLength) + "</li>");
                return;
            }
            else {
                render("<li class='select2-searching'>" + opts.formatSearching() + "</li>");
            }

            var searchWord = search.val();
            if(opts.isLoaded){
            	if(opts.data){
            		opts.query = local(opts.data);
            	}else{
            		if (checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
	                    render("<li class='select2-no-results'>" + opts.formatNoMatches(search.val()) + "</li>");
	                }
            		return;
            	}
            }else{
            	opts.query = ajax(opts.ajax);
            	searchWord = searchWord.substring(0,opts.minimumInputLength-1);
            	opts.isLoaded = true;
            }

        	opts.query({
                term: searchWord,
                page: 1,
                context: null,
                matcher: opts.matcher,
                callback: this.bind(function (data) {
	                var def; // default choice

	                // ignore a response if the select2 has been closed before it was received
	                if (!this.opened()) return;

	                // save context, if any
	                this.context = (data.context===undefined) ? null : data.context;

	                // create a default choice and prepend it to the list
	                if (this.opts.createSearchChoice && search.val() !== "") {
	                    def = this.opts.createSearchChoice.call(null, search.val(), data.results);
	                    if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
	                        if ($(data.results).filter(
	                            function () {
	                                return equal(self.id(this), self.id(def));
	                            }).length === 0) {
	                            data.results.unshift(def);
	                        }
	                    }
	                }

	                if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
	                    render("<li class='select2-no-results'>" + opts.formatNoMatches(search.val()) + "</li>");
	                    return;
	                }

	                if(!this.opts.data){
	                	this.opts.data = {results : data.results, text : 'text'};
	                	this.updateResultsByModify(search);
	                }else{
	                	results.empty();
		                self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

		                if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
		                    results.append("<li class='select2-more-results'>" + self.opts.escapeMarkup(opts.formatLoadMore(this.resultsPage)) + "</li>");
		                    window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
		                }

		                this.postprocessResults(data, false);

		                postRender();
	                }
	            })});
        },

        // abstract
        cancel: function () {
            this.close();
        },

        // abstract
        blur: function () {
        	/*
        	onblur이벤트가 발생했을 때 기존에는 입력된 값을 초기화했지만 앞으로는 인풋박스에 입력되도록 주석처리함 (choidoyoung)
            this.close();
            */
        	this.close();
            this.container.removeClass("select2-container-active");
            this.dropdown.removeClass("select2-drop-active");
            // synonymous to .is(':focus'), which is available in jquery >= 1.6
            //ie 11에서는 blur상태가 되면 다른 input type="text" 값에 한글이 입력이 안되는 버그가 있음
            //if (this.search[0] === document.activeElement) { this.search.blur(); }
            /* (choidoyoung)
            this.clearSearch();
            */
            this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
            
           //tagfreeActivex 에 의해 달력 레이어가 가려지는 오류로 iframe 생성한것을 삭제한다. 
            $(".select4_dropdown_fixed").remove();
            
        },
        
        // abstract
        focusSearch: function () {
            // need to do it here as well as in timeout so it works in IE
            this.search.show();
            this.search.focus();

            /* we do this in a timeout so that current event processing can complete before this code is executed.
             this makes sure the search field is focussed even if the current event would blur it */
            window.setTimeout(this.bind(function () {
                // reset the value so IE places the cursor at the end of the input box
                this.search.show();
                this.search.focus();
                this.search.val(this.search.val());
            }), 10);
        },

        // abstract
        selectHighlighted: function () {
            var index=this.highlight(),
                highlighted=this.results.find(".select2-highlighted").not(".select2-disabled"),
                data = highlighted.closest('.select2-result-selectable').data("select2-data");

            /*if (data) {
                highlighted.addClass("select2-disabled");
                this.highlight(index);
                this.onSelect(data);
            }*/
         // jgs135 엔터키 입력 시 검색 결과가 없을 경우에도 추가 되도록 수정
            if (data) {
                highlighted.addClass("select2-disabled");
                this.highlight(index);
                this.onSelect(data);
            }else{
            	if(this.opts.ajax && this.opts.ajax.data().typeSearch == 'E'){
            		var input = this.opts.tokenizer($(this.search[0]).val(), this.data(), this.bind(this.onSelect), this.opts);
            		if(!input){
            			input = $(this.search[0]).val();
            		}            	
                	data = {
                			id : input.replace(/</g, "").replace(/>/g, ""),
                			text : input.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                			target : input.replace(/</g, "").replace(/>/g, ""),
                			isCustom : true
                	};

            		if(!reservedWorkCheck(input) && input != '') {
            			this.onSelect(data);
            		}else{
            			this.close();
            		}
            	}else{
            		if(this.opts.forcedInsert){
            			var input = $(this.search[0]).val();
            			if(input != ''){
            				data = {
                        			id : input,
                        			text : input,
                        			isCustom : true
                        	};
                			
                			this.onSelect(data);
            			}else{
            				this.close();
            			}
            		}else{
            			this.close();
            		}
            	}
            }
         // jgs135 엔터키 입력 시 검색 결과가 없을 경우에도 추가 되도록 수정 끝
        },

        // abstract
        getPlaceholder: function () {
            return this.opts.element.attr("placeholder") ||
                this.opts.element.attr("data-placeholder") || // jquery 1.4 compat
                this.opts.element.data("placeholder") ||
                this.opts.placeholder;
        },
        
        /**
         * 모듈 정보를 가져 온다.
         */
        getModule: function () {
            return this.opts.element.attr("module") ||
            this.opts.element.attr("data-module") || 
            this.opts.element.data("module") ||
            this.opts.module;
        },

        /**
         * Get the desired width for the container element.  This is
         * derived first from option `width` passed to select2, then
         * the inline 'style' on the original element, and finally
         * falls back to the jQuery calculated element width.
         */
        // abstract
        initContainerWidth: function () {
            function resolveContainerWidth() {
                var style, attrs, matches, i, l;

                if (this.opts.width === "off") {
                    return null;
                } else if (this.opts.width === "element"){
                    return this.opts.element.outerWidth() === 0 ? 'auto' : this.opts.element.outerWidth() + 'px';
                } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
                    // check if there is inline style on the element that contains width
                    style = this.opts.element.attr('style');
                    if (style !== undefined) {
                        attrs = style.split(';');
                        for (i = 0, l = attrs.length; i < l; i = i + 1) {
                            matches = attrs[i].replace(/\s/g, '')
                                .match(/width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/);
                            if (matches !== null && matches.length >= 1)
                                return matches[1];
                        }
                    }

                    if (this.opts.width === "resolve") {
                        // next check if css('width') can resolve a width that is percent based, this is sometimes possible
                        // when attached to input type=hidden or elements hidden via css
                        style = this.opts.element.css('width');
                        if (style.indexOf("%") > 0) return style;

                        // finally, fallback on the calculated width of the element
                        return (this.opts.element.outerWidth() === 0 ? 'auto' : this.opts.element.outerWidth() + 'px');
                    }

                    return null;
                } else if ($.isFunction(this.opts.width)) {
                    return this.opts.width();
                } else {
                    return this.opts.width;
               }
            };

            var width = resolveContainerWidth.call(this);
            if (width !== null) {
                this.container.attr("style", "width: "+width);
            }
        }
    });

    SingleSelect2 = clazz(AbstractSelect2, {

        // single

		createContainer: function () {
            var container = $("<div></div>", {
                "class": "select2-container"
            }).html([
                "    <a href='#' onclick='return false;' class='select2-choice'>",
                "   <span></span><abbr class='select2-search-choice-close' style='display:none;'></abbr>",
                "   <div><b></b></div>" ,
                "</a>",
                "    <div class='select2-drop select2-offscreen'>" ,
                "   <div class='select2-search'>" ,
                "       <input type='text' autocomplete='off' class='select2-input'/>" ,
                "   </div>" ,
                "   <ul class='select2-results'>" ,
                "   </ul>" ,
                "</div>"].join(""));
            return container;
        },

        // single
        opening: function () {
            this.search.show();
            this.parent.opening.apply(this, arguments);
            this.dropdown.removeClass("select2-offscreen");
        },

        // single
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);
            this.dropdown.removeAttr("style").addClass("select2-offscreen").insertAfter(this.selection).show();
        },

        // single        
        focus: function (isTimeOut) {
            this.close();
            this.selection.focus();
            
            if(isTimeOut){
            	/* we do this in a timeout so that current event processing can complete before this code is executed.
                this makes sure the search field is focussed even if the current event would blur it */
                window.setTimeout(this.bind(function () {
                   // reset the value so IE places the cursor at the end of the input box
            	   this.close();
                   this.selection.focus();
                }), 300);
            }
        },

        // single
        isFocused: function () {
            return this.selection[0] === document.activeElement;
        },

        // single
        cancel: function () {
            this.parent.cancel.apply(this, arguments);
            this.selection.focus();
        },

        // single
        initContainer: function () {

            var selection,
                container = this.container,
                dropdown = this.dropdown,
                clickingInside = false;

            this.selection = selection = container.find(".select2-choice");

            this.search.bind("keydown", this.bind(function (e) {
                if (!this.enabled) return;

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                    return;
                }

                if (this.opened()) {
                    switch (e.which) {
                        case KEY.UP:
                        case KEY.DOWN:
                            this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                            killEvent(e);
                            return;
                        case KEY.TAB:
                        case KEY.ENTER:
                            this.selectHighlighted();
                            killEvent(e);
                            return;
                        case KEY.ESC:
                            this.cancel(e);
                            killEvent(e);
                            return;
                    }
                } else {

                    if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
                        return;
                    }

                    if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                        return;
                    }

                    this.open();

                    if (e.which === KEY.ENTER) {
                        // do not propagate the event otherwise we open, and propagate enter which closes
                        return;
                    }
                }
            }));

            this.search.bind("focus", this.bind(function() {
                this.selection.attr("tabIndex", "-1");
            }));
            this.search.bind("blur", this.bind(function() {
                if (!this.opened()) {
                	this.container.removeClass("select2-container-active");
                	$(".select4_dropdown_fixed").remove();                	
                }
                window.setTimeout(this.bind(function() { this.selection.attr("tabIndex", this.opts.element.attr("tabIndex")); }), 10);
            }));

            selection.bind("mousedown", this.bind(function (e) {
                clickingInside = true;

                if (this.opened()) {
                    this.close();
                    this.selection.focus();
                } else if (this.enabled) {
                    this.open();
                }

                clickingInside = false;
            }));

            dropdown.bind("mousedown", this.bind(function() { this.search.focus(); }));

            selection.bind("focus", this.bind(function() {
                this.container.addClass("select2-container-active");
                // hide the search so the tab key does not focus on it
                this.search.attr("tabIndex", "-1");
            }));

            selection.bind("blur", this.bind(function() {
                if (!this.opened()) {
                    this.container.removeClass("select2-container-active");
                    $(".select4_dropdown_fixed").remove();
                }
                window.setTimeout(this.bind(function() { this.search.attr("tabIndex", this.opts.element.attr("tabIndex")); }), 10);
            }));

            selection.bind("keydown", this.bind(function(e) {
                if (!this.enabled) return;

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                    return;
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                    return;
                }

                if (e.which == KEY.DELETE) {
                    if (this.opts.allowClear) {
                        this.clear();
                    }
                    return;
                }

                this.open();

                if (e.which === KEY.ENTER) {
                    // do not propagate the event otherwise we open, and propagate enter which closes
                    killEvent(e);
                    return;
                }

                // do not set the search input value for non-alpha-numeric keys
                // otherwise pressing down results in a '(' being set in the search field
                if (e.which < 48 ) { // '0' == 48
                    killEvent(e);
                    return;
                }

                var keyWritten = String.fromCharCode(e.which).toLowerCase();

                if (e.shiftKey) {
                    keyWritten = keyWritten.toUpperCase();
                }

                // focus the field before calling val so the cursor ends up after the value instead of before
                this.search.focus();
                this.search.val(keyWritten);

                // prevent event propagation so it doesnt replay on the now focussed search field and result in double key entry
                killEvent(e);
            }));

            selection.delegate("abbr", "mousedown", this.bind(function (e) {
                if (!this.enabled) return;
                this.clear();
                killEvent(e);
                this.close();
                this.triggerChange();
                this.selection.focus();
            }));

            this.setPlaceholder();

            this.search.bind("focus", this.bind(function() {
                this.container.addClass("select2-container-active");
            }));
        },

        // single
        clear: function() {
            this.opts.element.val("");
            this.selection.find("span").empty();
            this.selection.removeData("select2-data");
            this.setPlaceholder();
        },

        /**
         * Sets selection based on source element's value
         */
        // single
        initSelection: function () {
            var selected;
            if (this.opts.element.val() === "") {
                this.close();
                this.setPlaceholder();
            } else {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(selected){
                    if (selected !== undefined && selected !== null) {
                        self.updateSelection(selected);
                        self.close();
                        self.setPlaceholder();
                    }
                });
            }
        },

        // single
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments);

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {
                    var selected = element.find(":selected");
                    // a single select box always has a value, no need to null check 'selected'
                    if ($.isFunction(callback))
                        callback({id: selected.attr("value"), text: selected.text()});
                };
            }

            return opts;
        },

        // single
        setPlaceholder: function () {
            var placeholder = this.getPlaceholder();

            if (this.opts.element.val() === "" && placeholder !== undefined) {

                // check for a first blank option if attached to a select
                if (this.select && this.select.find("option:first").text() !== "") return;

                this.selection.find("span").html(this.opts.escapeMarkup(placeholder));

                this.selection.addClass("select2-default");

                this.selection.find("abbr").hide();
            }
        },

        // single
        postprocessResults: function (data, initial) {
            var selected = 0, self = this, showSearchInput = true;

            // find the selected element in the result list

            this.results.find(".select2-result-selectable").each2(function (i, elm) {
                if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
                    selected = i;
                    return false;
                }
            });

            // and highlight it

            this.highlight(selected);

            // hide the search box if this is the first we got the results and there are a few of them

            if (initial === true) {
                showSearchInput = this.showSearchInput = countResults(data.results) >= this.opts.minimumResultsForSearch;
                this.dropdown.find(".select2-search")[showSearchInput ? "removeClass" : "addClass"]("select2-search-hidden");

                //add "select2-with-searchbox" to the container if search box is shown
                $(this.dropdown, this.container)[showSearchInput ? "addClass" : "removeClass"]("select2-with-searchbox");
            }

        },

        // single
        onSelect: function (data) {
            var old = this.opts.element.val();

            this.opts.element.val(this.id(data));
            this.updateSelection(data);
            this.close();
            this.selection.focus();

            if (!equal(old, this.id(data))) { this.triggerChange(); }
        },

        // single
        updateSelection: function (data) {

            var container=this.selection.find("span"), formatted;

            this.selection.data("select2-data", data);

            container.empty();
            formatted=this.opts.formatSelection(data, container);
            if (formatted !== undefined) {
                container.append(this.opts.escapeMarkup(formatted));
            }

            this.selection.removeClass("select2-default");

            if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
                this.selection.find("abbr").show();
            }
        },

        // single
        val: function () {
            var val, data = null, self = this;

            if (arguments.length === 0) {
                return this.opts.element.val();
            }

            val = arguments[0];

            if (this.select) {
                this.select
                    .val(val)
                    .find(":selected").each2(function (i, elm) {
                        data = {id: elm.attr("value"), text: elm.text()};
                        return false;
                    });
                this.updateSelection(data);
                this.setPlaceholder();
            } else {
                if (this.opts.initSelection === undefined) {
                    throw new Error("cannot call val() if initSelection() is not defined");
                }
                // val is an id. !val is true for [undefined,null,'']
                if (!val) {
                    this.clear();
                    return;
                }
                this.opts.element.val(val);
                this.opts.initSelection(this.opts.element, function(data){
                    self.opts.element.val(!data ? "" : self.id(data));
                    self.updateSelection(data);
                    self.setPlaceholder();
                });
            }
        },

        // single
        clearSearch: function () {
            this.search.val("");
        },

        // single
        data: function(value) {
            var data;

            if (arguments.length === 0) {
                data = this.selection.data("select2-data");
                if (data == undefined) data = null;
                return data;
            } else {
                if (!value || value === "") {
                    this.clear();
                } else {
                    this.opts.element.val(!value ? "" : this.id(value));
                    this.updateSelection(value);
                }
            }
        }
    });

    MultiSelect2 = clazz(AbstractSelect2, {

        // multi
        createContainer: function () {
            var container = $("<div></div>", {
                "class": "select2-container select2-container-multi"
            }).html([
                "    <ul class='select2-choices'>",
                //"<li class='select2-search-choice'><span>California</span><a href="javascript:void(0)" class="select2-search-choice-close"></a></li>" ,
                "  <li class='select2-search-field'>" ,
                "    <input type='text' autocomplete='off' class='select2-input'>" ,
                "  </li>" ,
                "</ul>" ,
                "<div class='select2-drop select2-drop-multi' style='display:none;'>" ,
                "   <ul class='select2-results'>" ,
                "   </ul>" ,
                "</div>"].join(""));
			return container;
        },

        // multi
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments);

            // TODO validate placeholder is a string if specified

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install sthe selection initializer
                opts.initSelection = function (element,callback) {

                    var data = [];
                    element.find(":selected").each2(function (i, elm) {
                        data.push({id: elm.attr("value"), text: elm.text()});
                    });

                    if ($.isFunction(callback))
                        callback(data);
                };
            }

            return opts;
        },

        // multi
        initContainer: function () {

            var selector = ".select2-choices", selection;

            this.searchContainer = this.container.find(".select2-search-field");
            this.selection = selection = this.container.find(selector);

            this.search.bind("keydown", this.bind(function (e) {
                if (!this.enabled) return;

                if (e.which === KEY.BACKSPACE && this.search.val() === "") {
                	
                    this.close();

                    var choices,
                        selected = selection.find(".select2-search-choice-focus");
                    if (selected.length > 0) {
                        this.unselect(selected.first());
                        this.search.width(10);
                        killEvent(e);
                        return;
                    }

                    choices = selection.find(".select2-search-choice");
                    if (choices.length > 0) {
                        choices.last().addClass("select2-search-choice-focus");
                    }
                    
                } else {
                    selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                }

                if (this.opened()) {
                    switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.SEMICOLON:
                    	if(!e.shiftKey){
                    		this.selectHighlighted();
                            killEvent(e);
                    	}
                    	return;
                    case KEY.COLON:
                    	if(!e.shiftKey){
                    		this.selectHighlighted();
                            killEvent(e);
                    	}
                    	return;
                    case KEY.ENTER:
                    case KEY.TAB:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                    }
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {                    	
                    return;
                }

                this.open();
 
                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                }
            }));

            this.search.bind("keyup", this.bind(this.resizeSearch));

            var self = this;
            this.search.bind("blur", this.bind(function(e) {
                this.container.removeClass("select2-container-active");
                $(".select4_dropdown_fixed").remove();
                this.search.removeClass("select2-focused");
                
              //onblur시에도 입력되게 하기 위해 추가(choidoyoung)
                /*if(this.opts.forcedInsert){
                	this.selectHighlighted(); 
                    //killEvent(e);
                }*/
                
                setTimeout(function(){
                	self.clearSearch();
                }, 0);
                e.stopImmediatePropagation();
            }));

            this.container.delegate(selector, "mousedown", this.bind(function (e) {
                if (!this.enabled) return;
                if ($(e.target).closest(".select2-search-choice").length > 0) {
                    // clicked inside a select2 search choice, do not open
                    return;
                }
                this.clearPlaceholder();
                this.open();
                this.focusSearch();
                //e.preventDefault();
                e.stopImmediatePropagation();
            }));

            this.container.delegate(selector, "focus", this.bind(function () {
                if (!this.enabled) return;
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
                this.clearPlaceholder();
            }));

            // set the placeholder if necessary
            this.clearSearch();
        },

        // multi
        enable: function() {
            if (this.enabled) return;

            this.parent.enable.apply(this, arguments);

            this.search.removeAttr("disabled");
        },

        // multi
        disable: function() {
            if (!this.enabled) return;

            this.parent.disable.apply(this, arguments);

            this.search.attr("disabled", true);
        },

        // multi
        initSelection: function () {
            var data;
            if (this.opts.element.val() === "") {
                this.updateSelection([]);
                this.close();
                // set the placeholder if necessary
                this.clearSearch();
            }
            if (this.select || this.opts.element.val() !== "") {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(data){
                    if (data !== undefined && data !== null) {
                        self.updateSelection(data);
                        self.close();
                        // set the placeholder if necessary
                        self.clearSearch();
                    }
                });
            }
        },

        // multi
        clearSearch: function () {
            var placeholder = this.getPlaceholder();
            var resize = true;

            if (placeholder !== undefined  && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
            	// Placeholder width가 정상적으로 보여지지 않아 추가
                this.search.val(placeholder).addClass("select2-default");
                // stretch the search box to full width of the container so as much of the placeholder is visible as possible
                this.resizeSearch(false);
            }else if(this.getVal().length === 0){
            	this.search.val("").width(10);
            }else {
                // we set this to " " instead of "" and later clear it on focus() because there is a firefox bug
                // that does not properly render the caret when the field starts out blank
            	this.search.val(" ").width(10);

            	//안드로이드에서 input 박스에 공백이 들어가서 자동완성이 안되기 때문에 공백을 지운다.
            	if (navigator.userAgent.toLowerCase().search("android") > -1){
            		
            		this.search.val("").width(10);
            	}
            }
        },

        // multi
        clearPlaceholder: function () {
            if (this.search.hasClass("select2-default")) {
                this.search.val("").removeClass("select2-default");
            } else {
                // work around for the space character we set to avoid firefox caret bug
                if (this.search.val() === " ") this.search.val("");
            }
        },

        // multi
        opening: function () {
            this.parent.opening.apply(this, arguments);

            this.clearPlaceholder();
			this.resizeSearch();
			//ie11에서 결과 레이어 열릴 때 재포커싱되면서 초성,중성 분리되서 입력되는 현상 방지(choidoyoung)
			if (this.search.val() === "") { this.focusSearch(); } 
        },

        // multi
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);
        },

        // multi
        focus: function (isTimeOut) {
            this.close();
            this.search.focus();
            
              
            if(isTimeOut){
            	/* we do this in a timeout so that current event processing can complete before this code is executed.
                this makes sure the search field is focussed even if the current event would blur it */
                window.setTimeout(this.bind(function () {
                   // reset the value so IE places the cursor at the end of the input box
            	   this.close();
                   this.search.focus();
                }), 500);
            }
        },

        // multi
        isFocused: function () {
            return this.search.hasClass("select2-focused");
        },

        // multi
        updateSelection: function (data) {
            var ids = [], filtered = [], self = this;

            // filter out duplicates
            $(data).each(function () {
                if (indexOf(self.id(this), ids) < 0) {
                    ids.push(self.id(this));
                    filtered.push(this);
                }
            });
            data = filtered;

            this.selection.find(".select2-search-choice").remove();
            $(data).each(function () {
                self.addSelectedChoice(this);
            });
            self.postprocessResults();
        },

        tokenize: function() {
            var input = this.search.val();
            //input = this.opts.tokenizer(input, this.data(), this.bind(this.onSelect), this.opts);
            if (input != null && input != undefined) {
                this.search.val(input);
                if (input.length > 0) {
                    this.open();
                }
            }

        },

        // multi
        onSelect: function (data) {
        	if(!this.opts.excludeSelectedChoice) {
        		this.addSelectedChoice(data);
            }
            
            if (this.select) { this.postprocessResults(); }

            if (this.opts.closeOnSelect) {
                this.close();
                this.clearSearch();
            } else {
                if (this.countSelectableResults()>0) {
                    this.search.width(10);
                    this.resizeSearch();
                    this.positionDropdown();
                } else {
                    // if nothing left to select close
                    this.close();
                }
            }

            // since its not possible to select an element that has already been
            // added we do not need to check if this is a new element before firing change
            this.triggerChange({ added: data });
            
            //onblur시에도 입력되게 수정하면서 다른 인풋박스로 포커스를 이동못시키는 현상이 발생했기 때문에 최초입력시,자동완성직후에만 포커스 유지하게(choidoyoung)
            if(!data.isCustom){ 
            	this.focusSearch();
            }else{ //아무것도 입력안하고 엔터입력시 빈칸이 자동으로 삽입되므로 초기화시킴
            	if(this.search.val() === " "){this.search.val("");}
            }           
        },

        // multi
        cancel: function () {
            this.close();
            this.focusSearch();
        },

        // multi
        addSelectedChoice: function (data) {
        	if(!this.opts.isDuplAble){ //중복허용
        		/** jgs135 중복된 데이터가 추가 되지 않도록 추가. */
            	var isDuple = false;
            	$.each(this.data(), function(){
            		if(this.id === data.id){
            			isDuple = true;
            			return false;
            		}
            	});

            	if(isDuple){
            		return;
            	}
            	/** jgs135 중복된 데이터가 추가 되지 않도록 추가 end. */
        	}
        	if(this.opts.checkValid) { //외부 유효성체크(by Bae)
        		if(!this.opts.checkValid(data)) {
        			return;
        		}
        	}

        	data.text = $.trim(data.text);
        	
        	var tmpchoice = "<li class='select2-search-choice select2-no-edit'>" +
            "    <div></div>" +
            "    <input type='text' style='display:none;' value='" + data.text +"' />";// wonSeok : 수정 기능을 위한 input 추가

        	if(this.opts.editable) {
        		tmpchoice += "    <a href='#' onclick='return false;' class='select2-search-choice-edit' tabindex='-1'></a>";
        	}
        	if(!data.indelible) {
            	tmpchoice += "    <a href='#' onclick='return false;' class='select2-search-choice-close' tabindex='-1'></a>";
         	}
        	tmpchoice += "</li>";

            var choice=$(tmpchoice),
                id = this.id(data),
                val = this.getVal(),
                formatted;

            formatted=this.opts.formatSelection(data, choice);
            choice.find("div").replaceWith("<div>"+this.opts.escapeMarkup(formatted)+"</div>");
            choice.find(".select2-search-choice-close")
                .bind("mousedown", killEvent)
                .bind("click dblclick", this.bind(function (e) {
                if (!this.enabled) return;

                $(e.target).closest(".select2-search-choice").fadeOut('fast', this.bind(function(){
                    this.unselect($(e.target));
                    this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                    this.close();
                    this.focusSearch();
                })).dequeue();
                killEvent(e);
            })).bind("focus", this.bind(function () {
                if (!this.enabled) return;
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
            }));
            // wonSeok : 수정을 위한 커스터마이징 시작
            if(this.opts.mailCheck && data.mailboxType != 'ContactGroup') { //익스체인지 주소록 그룹일 경우 메일체크를 하지않음.
            	//TODO : 메일형식에 맞추어서 작성된 코드인지 확인. 만일 아니면 제대로된 메일주소와 다른 화면으로 보이게 해야함            	
            	if (!isMail(formatted)) {
            		return;
            	}
            }

            /*if(data.isCustom){
            	choice.addClass('user-costum');
            }*/
            // wonSeok : 수정을 위한 커스터마이징 끝

            choice.data("select2-data", data);
            choice.insertBefore(this.searchContainer);
          
            // wonSeok : 수정을 위한 커스터마이징 (버튼형식으로 갈지 이 방식으로 갈지 고민중) 시작
            if(this.opts.editable) {
            	choice.removeClass('select2-no-edit'); //수정 아이콘 부분 여백 없애주는 클래스 제거
            	var self = this;
            	// 클릭하면 수정 모드로 변경 된다.
            	choice.find('.select2-search-choice-edit').bind("click", function(){
            		//console.info(data);
            		var width = choice.find("div").width() + 15;
            		choice.find("div").hide();
            		choice.find('.select2-search-choice-edit').hide();
            		choice.css('padding-right','18px');
            		choice.find("input").val(choice.find("div").text());
            		choice.find("input").show().width(width).focus();
            		self.opts.data = undefined;
            		self.opts.isLoaded = false;
            	});
            	// 자동완성 기능이 동작 하도록 처리하는 함수를 호출
            	self.initModifyInput(choice.find("input")); 

            	// 엔터를 누르면 수정을 끝낸다. esc 나 포커스가 빠졌을 때는 취소 처리 된다.
            	choice.find("input").bind("focusout keydown", function(evt){
            		if(evt.which == KEY.ENTER) {
            			var editValue = choice.find("input").val();
            			if(self.invalidIsMail(editValue)) {
                			choice.find("input").val(choice.data('select2-data').text).hide(); // 취소일 경우 이전으로 돌린다.
            			} else {
                			choice.find("div").html(editValue.replace("<","&lt;").replace(">","&gt;")); //회사,직위,부서 대표메일 수정시 주소가 사리지는 현상 수정(choidoyoung)
                			choice.find("input").hide();
                			
                			var mailInfo = choice.data("select2-data");
                			var emailRegex = editValue.match(/([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+/ig);
                			mailInfo.id = emailRegex[emailRegex.length-1];
                			mailInfo.target = emailRegex[emailRegex.length-1];
                			mailInfo.text= editValue.replace("<","&lt;").replace(">","&gt;");
                			choice.data("select2-data", mailInfo); 
            			}
            			choice.find("div").show();
            			choice.find('.select2-search-choice-edit').show();
            			choice.css('padding-right','36px');
            			self.focusSearch();	// 포커를 검색 필드로 옮긴다.
            		} else if (evt.type =="focusout" || evt.which == KEY.ESC) {
            			choice.find("input").val(choice.data('select2-data').text).hide(); // 취소일 경우 이전으로 돌린다.
            			choice.find("div").show();
            			choice.find('.select2-search-choice-edit').show();
            			choice.css('padding-right','36px');
            			self.focusSearch();// 포커를 검색 필드로 옮긴다
            		}
            	});
            }
            // wonSeok : 수정을 위한 커스터마이징 (버튼형식으로 갈지 이 방식으로 갈지 고민중) 끝
            val.push(id);
            this.setVal(val);
        },

        // multi
        unselect: function (selected) {
            var val = this.getVal(),
                data,
                index;

            selected = selected.closest(".select2-search-choice");

            if (selected.length === 0) {
                throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
            }

            data = selected.data("select2-data");

            index = indexOf(this.id(data), val);

            if (index >= 0) {
                val.splice(index, 1);
                this.setVal(val);
                if (this.select) this.postprocessResults();
            }
            selected.remove();
            this.triggerChange({ removed: data });
        },

        // multi
        postprocessResults: function () {
            var val = this.getVal(),
                choices = this.results.find(".select2-result-selectable"),
                compound = this.results.find(".select2-result-with-children"),
                self = this;

            choices.each2(function (i, choice) {
                var id = self.id(choice.data("select2-data"));
                /** jgs135 추가되어 있는 항목도 목록에 표시되도록 수정.*/
                choice.removeClass("select2-disabled").addClass("select2-result-selectable");
                /*if (indexOf(id, val) >= 0) {
                    choice.addClass("select2-disabled").removeClass("select2-result-selectable");
                } else {
                    choice.removeClass("select2-disabled").addClass("select2-result-selectable");
                }*/
                /** jgs135 추가되어 있는 항목도 목록에 표시되도록 수정. end */
            });

            compound.each2(function(i, e) {
                if (e.find(".select2-result-selectable").length==0) {
                    e.addClass("select2-disabled");
                } else {
                    e.removeClass("select2-disabled");
                }
            });

            choices.each2(function (i, choice) {
                if (!choice.hasClass("select2-disabled") && choice.hasClass("select2-result-selectable")) {
                    self.highlight(0);
                    return false;
                }
            });

        },

        // multi
        resizeSearch: function (resize) {
        	if (resize != undefined && !resize) {
        		if(this.opts.width){
    				if(this.opts.width.indexOf('%') > -1){
    					var width = this.container.parent().width() * parseInt(this.opts.width) / 100 - 100;
    					this.search.width(width);
    				}else{
    					var width = parseInt(this.opts.width)  - 100;
    					this.search.width(width);
    				}
    			}else{
    				this.search.width(this.container.width()-50);
    			}
        		return;
        	}

            var minimumWidth, left, maxWidth, containerLeft, searchWidth,
            	sideBorderPadding = getSideBorderPadding(this.search);

            minimumWidth = measureTextWidth(this.search) + 10;

            left = this.search.offset().left;

            maxWidth = this.selection.width();
            containerLeft = this.selection.offset().left;

            searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;
            if (searchWidth < minimumWidth) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth < 40) {
                searchWidth = maxWidth - sideBorderPadding;
            }
            this.search.width(searchWidth);
        },

        // multi
        getVal: function () {
            var val;
            if (this.select) {
                val = this.select.val();
                return val === null ? [] : val;
            } else {
                val = this.opts.element.val();
                return splitVal(val, this.opts.separator);
            }
        },

        // multi
        setVal: function (val) {
            var unique;
            if (this.select) {
                this.select.val(val);
            } else {
                unique = [];
                // filter out duplicates
                $(val).each(function () {
                    if (indexOf(this, unique) < 0) unique.push(this);
                });
                this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
            }
        },

        // multi
        val: function () {
            var val, data = [], self=this;

            if (arguments.length === 0) {
                return this.getVal();
            }

            val = arguments[0];

            if (!val) {
                this.opts.element.val("");
                this.updateSelection([]);
                this.clearSearch();
                return;
            }

            // val is a list of ids
            this.setVal(val);

            if (this.select) {
                this.select.find(":selected").each(function () {
                    data.push({id: $(this).attr("value"), text: $(this).text()});
                });
                this.updateSelection(data);
            } else {
                if (this.opts.initSelection === undefined) {
                    throw new Error("val() cannot be called if initSelection() is not defined")
                }

                this.opts.initSelection(this.opts.element, function(data){
                    var ids=$(data).map(self.id);
                    self.setVal(ids);
                    self.updateSelection(data);
                    self.clearSearch();
                });
            }
            this.clearSearch();
        },

        // multi
        onSortStart: function() {
            if (this.select) {
                throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
            }

            // collapse search field into 0 width so its container can be collapsed as well
            this.search.width(0);
            // hide the container
            this.searchContainer.hide();
        },

        // multi
        onSortEnd:function() {

            var val=[], self=this;

            // make sure the search container is the last item in the list
            this.searchContainer.appendTo(this.searchContainer.parent());

            // update selection

            this.selection.find(".select2-search-choice").each(function() {
                val.push(self.opts.id($(this).data("select2-data")));
            });
            this.setVal(val);
            this.triggerChange();
        },

        onSortStop:function() {
            // show search and move it to the end of the list
            this.searchContainer.show();
            // since we collapsed the width in dragStarted, we resize it here
            this.resizeSearch();
            this.focusSearch();
        },

        // multi
        data: function(values) {
            var self=this, ids;
            if (arguments.length === 0) {
                 return this.selection
                     .find(".select2-search-choice")
                     .map(function() { return $(this).data("select2-data"); })
                     .get();
            } else {
                if (!values) { values = []; }
                ids = $.map(values, function(e) { return self.opts.id(e)});
                this.setVal(ids);
                this.updateSelection(values);
                this.clearSearch();
            }
        },

        /**
         * 수정 시에 자동 완성 기능이 동작 되도록 이벤트를 등록 해주는 함수이다.
         * @author JUNG(jgs135@naonsoft.com)
         * @param choice
         */
        initModifyInput: function (choice) {

        	choice.bind("keydown", this.bind(function (e) {
                if (this.search.val() === "") {
                    this.close();
                }

                if (this.opened()) {
                    switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.SEMICOLON:
                    case KEY.COLON:
                    case KEY.ENTER:
                    case KEY.TAB:
                    	if(!e.shiftKey){
                    		var index=this.highlight(),
                            highlighted=this.results.find(".select2-highlighted").not(".select2-disabled"),
                            data = highlighted.closest('.select2-result-selectable').data("select2-data");

                        	if (data) {
    	                        highlighted.addClass("select2-disabled");
    	                        this.highlight(index);
    	                    }else{
    	                    	if(this.opts.ajax && this.opts.ajax.data().typeSearch == 'E'){
    	                    		var value = choice.val().replace(/</g, "&lt;").replace(/>/g, "&gt;");
    	                    		if(this.opts.mailCheck){    	                    			
    	                    			if (!isMail(value)) {
    	                    				data = choice.parent().data("select2-data");
    	                    			}else{
    	                    				data = {id : value.replace(/&lt;/g, "").replace(/&gt;/g, ""), text : value, target : value.replace(/&lt;/g, "").replace(/&gt;/g, ""), isCustom : true};
    	                    			}
    		                    	}else{
    		                    		data = {id : value.replace(/&lt;/g, "").replace(/&gt;/g, ""), text : value, target : value.replace(/&lt;/g, "").replace(/&gt;/g, ""), isCustom : true};
    		                    	}
    	                    	}else{
    	                    		data = choice.parent().data("select2-data");
    	                    	}
    	                    }
    	                    this.close();
    	                    if (!this.invalidIsMail(data.text)) {
        	                    choice.val(data.text);
            	                choice.parent().data("select2-data", data);
    	                    }
                            killEvent(e);
                    	}
                        return;
                    case KEY.ESC:
                    	this.close();
                        killEvent(e);
                        return;
                    }
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                    return;
                }

                //opening
                var cid = this.containerId, selector = this.containerSelector,
                scroll = "scroll." + cid, resize = "resize." + cid;

	            this.container.parents().each(function() {
	                $(this).bind(scroll, function() {
	                    var s2 = $(selector);
	                    if (s2.length == 0) {
	                        $(this).unbind(scroll);
	                    }
	                    s2.select2("close");
	                });
	            });

	            $(window).bind(resize, function() {
	                var s2 = $(selector);
	                if (s2.length == 0) {
	                    $(window).unbind(resize);
	                }
	                s2.select2("close");
	            });

	            this.clearDropdownAlignmentPreference();

	            this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

	            
	            if(this.dropdown[0] !== this.body().children().last()[0]) {
	                this.dropdown.detach().appendTo(this.body());
	            }

	            this.dropdown.show();

	            this.positionDropdown();
	            this.dropdown.addClass("select2-drop-active");

	            this.ensureHighlightVisible();
                //opening end

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                }
            }));

        	installKeyUpChangeEvent(choice);
        	choice.bind("keyup", this.bind(this.resizeSearch));
        	choice.bind("keyup-change", this.bind(function () {
        		this.updateResultsByModify(choice);
        	}));
        },
        
        /**
         * 잘못된 메일인지 체크 한다.
         */
        invalidIsMail : function (value) {
        	return reservedWorkCheck(value.replace("&lt;", "<").replace("&gt;",">")) || !isMail(value.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
        }
    });

    $.fn.select2 = function () {

        var args = Array.prototype.slice.call(arguments, 0),
            opts,
            select2,
            value, multiple, allowedMethods = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "onSortStart", "onSortEnd", "onSortStop", "enable", "disable", "positionDropdown", "data","clearSearch","blur"];
        this.each(function () {
            if (args.length === 0 || typeof(args[0]) === "object") {
                opts = args.length === 0 ? {} : $.extend({}, args[0]);
                opts.element = $(this);

                if (opts.element.get(0).tagName.toLowerCase() === "select") {
                    multiple = opts.element.attr("multiple");
                } else {
                    multiple = opts.multiple || false;
                    if ("tags" in opts) {opts.multiple = multiple = true;}
                }

                select2 = multiple ? new MultiSelect2() : new SingleSelect2();
                select2.init(opts);
            } else if (typeof(args[0]) === "string") {

                if (indexOf(args[0], allowedMethods) < 0) {
                    throw "Unknown method: " + args[0];
                }

                value = undefined;
                select2 = $(this).data("select2");
                if (select2 === undefined) return;
                if (args[0] === "container") {
                    value=select2.container;
                } else {
                    value = select2[args[0]].apply(select2, args.slice(1));
                }
                if (value !== undefined) {return false;}
            } else {
                throw "Invalid arguments to select2 plugin: " + args;
            }
        });
        return (value === undefined) ? this : value;
    };

    // plugin defaults, accessible to users
    $.fn.select2.defaults = {
        width: "copy",
        closeOnSelect: true,
        openOnEnter: true,
        containerCss: {},
        dropdownCss: {},
        containerCssClass: "",
        dropdownCssClass: "",
        formatResult: function(result, container, query) {
            var markup=[];
            markMatch(result.text, query.term, markup);
            return markup.join("");
        },
        formatSelection: function (data, container) {
            return data ? data.text : undefined;
        },
        isDuplAble: false,
        formatResultCssClass: function(data) {return undefined;},
        formatNoMatches: function () { return "No matches found"; },
        formatInputTooShort: function (input, min) { return "Please enter " + (min - input.length) + " more characters"; },
        formatSelectionTooBig: function (limit) { return "You can only select " + limit + " item" + (limit == 1 ? "" : "s"); },
        formatLoadMore: function (pageNumber) { return "Loading more results..."; },
        formatSearching: function () { return "Searching..."; },
        minimumResultsForSearch: 0,
        minimumInputLength: 0,
        maximumSelectionSize: 0,
        id: function (e) { return e.id; },
        matcher: function(term, text) {
            return text.toUpperCase().indexOf(term.toUpperCase()) >= 0;
        },
        separator: ",",
        tokenSeparators: [],
        tokenizer: defaultTokenizer,
        escapeMarkup: function (markup) {
            if (markup && typeof(markup) === "string") {
                return markup.replace(/&/g, "&amp;");
            }
            return markup;
        },
        blurOnChange: false
    };

    // exports
    window.Select2 = {
        query: {
            ajax: ajax,
            local: local,
            tags: tags
        }, util: {
            debounce: debounce,
            markMatch: markMatch
        }, "class": {
            "abstract": AbstractSelect2,
            "single": SingleSelect2,
            "multi": MultiSelect2
        }
    };

}(jQuery));
// wonSeok : 커스터마이징 추가. 예약어 처리
(function ($, undefined) {


	   $.fn.mailList = function () {
		   var args;
		   if(typeof(arguments[0]) === "object") {
			   args = $.extend({}, $.fn.mailList.defaults, arguments[0]);
		   } else if(typeof(arguments[0]) === "string") {
			   args = arguments[0];
		   } else {
			   args = $.fn.mailList.defaults;
		   }

		   if(arguments[1]) {
			   return this.select2(args, arguments[1]);
		   } else {
			   return this.select2(args);
		   }
	    };

	    /**
	     * 이메일 기본 설정
	     */
	    $.fn.mailList.defaults = {
    		allowClear : true,
    		forcedInsert : true,
			editable : true, // 추가 파라미터
			tokenSeparators : [",",";"],
			mailCheck : true,
			matcher: function(term, text) {
				if(term.length > 0 && "(;{;#;$;%".indexOf(term.substring(0,1)) > -1){
					return text.toUpperCase().indexOf(term.substring(1,term.length).toUpperCase()) >= 0;
				}else{
					return text.toUpperCase().indexOf(term.toUpperCase()) >= 0;
				}
	        },
	        formatResult: function(result, container, query) {
	            var markup=[];
	            var term = $.trim(query.term.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
	            window.Select2.util.markMatch(result.text, term, markup);
	            return markup.join("");
	        },
	        tokenizer : function(input, selection, selectCallback, opts) {
	        	input = input
				var original = input, // store the original so we can compare and know if we need to tell the search to update its text
	            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
	            token, // token
	            index, // position at which the separator was found
	            i, l, // looping variables
	            separator; // the matched separator

		        if (!opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

		        while (true) {
		            index = -1;

		            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
		                separator = opts.tokenSeparators[i];
		                index = input.indexOf(separator);
		                if (index >= 0) break;
		            }
		            if (index < 0 ) break; // did not find any token separator in the input string, bail

		            token = input.substring(0, index);
		            input = input.substring(index + separator.length);

		            if (token.length > 0) {
		            	token = $.trim(token);
		            	token = {id:token.replace(/</g, "").replace(/>/g, ""), text:token.replace(/</g, "&lt;").replace(/>/g, "&gt;"), target : token.replace(/</g, "").replace(/>/g, ""), isCustom : true}; // 해당 select2에서 사용하는 데이터 방식으로 변경
		            	
		                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
		                    dupe = false;
		                    for (i = 0, l = selection.length; i < l; i++) {
		                    	// 중복된 것이 존재하는지 판단함
		                        if (opts.id(token) === opts.id(selection[i])) {
		                            dupe = true; break;
		                        }
		                    }

		                    if (!dupe) selectCallback(token);
		                }
		            }
		        }

		        if (original.localeCompare(input) != 0) return $.trim(input);
			},
			escapeMarkup : function(markup) { // text escape markup
				if (markup && typeof(markup) === "string") {
					//markup = markup.replace(/&/g, "&amp;");
					//markup = markup.replace(/</g, "&lt;");
					//markup = markup.replace(/>/g, "&gt;");
	            	return markup;
	            }
	            return markup;
			},
			formatNoMatches : function() {
				return common_desc_searchResultDesc; // 다국어 처리 필요
			},
			minimumInputLength : 2,
	        formatNoMatches: function () { return common_desc_searchResultDesc; },
	        formatInputTooShort: function (input, min) { return min + common_desc_autoSearch1; },
	        formatSelectionTooBig: function (limit) { return limit + common_desc_autoSearch2; },
	        formatLoadMore: function (pageNumber) { return common_desc_autoSearch3; },
	        formatSearching: function () { return common_desc_autoSearch3; },
	    };
	    
	    $.fn.asyncList = function () {
			   var args;
			   if(typeof(arguments[0]) === "object") {
				   args = $.extend({},$.fn.asyncList.defaults, arguments[0]);
			   } else if(typeof(arguments[0]) === "string") {
				   args = arguments[0];
			   } else {
				   args = $.fn.asyncList.defaults;
			   }
			   if(arguments[1] || arguments[1] == "") {
				   return this.select2(args, arguments[1]);
			   } else {
				   return this.select2(args);
			   }

		    };
		 /**
		  * 비동기 기능 기본 옵션(현재 추가 계획중)
		  */
		 $.fn.asyncList.defaults = {
			editable : true, // 추가 파라미터
			formatNoMatches : function() {
				return common_desc_searchResultDesc;
			},
			minimumInputLength : 2,
			mailCheck : false,
			isDuplAble: false,
	        formatNoMatches: function () { return common_desc_searchResultDesc; },
	        formatInputTooShort: function (input, min) { return min + common_desc_autoSearch1; },
	        formatSelectionTooBig: function (limit) { return limit + common_desc_autoSearch2; },
	        formatLoadMore: function (pageNumber) { return common_desc_autoSearch3; },
	        formatSearching: function () { return common_desc_autoSearch3; },
	        matcher: function(term, text) {
				if(term.length > 0 && "(;{;#;$;%".indexOf(term.substring(0,1)) > -1){
					return text.toUpperCase().indexOf(term.substring(1,term.length).toUpperCase()) >= 0;
				}else{
					return text.toUpperCase().indexOf(term.toUpperCase()) >= 0;
				}
	        },
	        escapeMarkup : function(markup) { // text escape markup
				if (markup && typeof(markup) === "string") {
					//markup = markup.replace(/&/g, "&amp;");
					//markup = markup.replace(/</g, "&lt;");
					//markup = markup.replace(/>/g, "&gt;");
	            	return markup;
	            }
	            return markup;
			},
			formatResult: function(result, container, query) {
	            var markup=[];
	            window.Select2.util.markMatch(result.text, query.term.replace(/</g, "&lt;").replace(/>/g, "&gt;"), markup);
	            return markup.join("");
	        },
	        tokenSeparators : [",", ";"],
	        tokenizer : function(input, selection, selectCallback, opts) {
	        	if(opts.ajax.data().typeSearch == 'I' || opts.ajax.data().typeSearch == 'M') return input;
	        	
	        	input = input
				var original = input, // store the original so we can compare and know if we need to tell the search to update its text
	            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
	            token, // token
	            index, // position at which the separator was found
	            i, l, // looping variables
	            separator; // the matched separator

		        if (!opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

		        while (true) {
		            index = -1;

		            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
		                separator = opts.tokenSeparators[i];
		                index = input.indexOf(separator);
		                if (index >= 0) break;
		            }
		            if (index < 0 ) break; // did not find any token separator in the input string, bail

		            token = input.substring(0, index);
		            input = input.substring(index + separator.length);

		            if (token.length > 0) {
		            	token = $.trim(token);
		            	if(opts.ajax && opts.ajax.data().typeSearch == 'E'){
			                token = {id:token.replace(/</g, "").replace(/>/g, ""), text:token.replace(/</g, "&lt;").replace(/>/g, "&gt;"), target : token.replace(/</g, "").replace(/>/g, ""), isCustom : true}; // 해당 select2에서 사용하는 데이터 방식으로 변경
		            	}else{
		            		token = {id:token, text:token, target : token, isCustom : true}; // 해당 select2에서 사용하는 데이터 방식으로 변경
		            	}
		            	
		                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
		                    dupe = false;
		                    for (i = 0, l = selection.length; i < l; i++) {
		                    	// 중복된 것이 존재하는지 판단함
		                        if (opts.id(token) === opts.id(selection[i])) {
		                            dupe = true; break;
		                        }
		                    }

		                    if (!dupe) selectCallback(token);
		                }
		            }
		        }

		        if (original.localeCompare(input) != 0) return $.trim(input);
			}
		 };
})(jQuery);