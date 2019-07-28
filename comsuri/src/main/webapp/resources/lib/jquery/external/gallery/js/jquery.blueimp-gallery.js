/*
 * blueimp Gallery jQuery plugin 1.1.0
 * https://github.com/blueimp/Gallery
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*global define, window, document */
(function($, Gallery){
	'use strict';
	
    $.fn.extend({ 
         
        //pass the options variable to the function
        //함수로 옵션 값을 넘겨준다. 
        naonGallery : function(options) {
 
            //Set the default values, use comma to separate the settings, example:
            //기본값을 설정한다. 각 구분은 '콤마' 로 한다.
            var defaults = {
                    // The Id, element or querySelector of the gallery widget:
                    container: '#blueimp-gallery',
                    // The tag name, Id, element or querySelector of the title element:
                    titleElement: '.title',
                    // The list object property (or data attribute) with the object type:
                    typeProperty: 'type',
                    // The list object property (or data attribute) with the object title:
                    titleProperty: 'title',
                    // The list object property (or data attribute) with the object URL:
                    urlProperty: 'href',
                    // Close the gallery when clicking on an empty slide area:
                    closeOnSlideClick: false,
                    // Allow continuous navigation, moving from last to first
                    // and from first to last slide:
                    continuous: false,
                    // Hide the page scrollbars:
                    hidePageScrollbars: false,
                    // Toggle the controls on pressing the Return key:
                    toggleControlsOnReturn: false,
                    // Toggle the automatic slideshow interval on pressing the Space key:
                    toggleSlideshowOnSpace: false,
                    // Navigate the gallery by pressing left and right on the keyboard:
                    enableKeyboardNavigation: false,
                    // Close the gallery on pressing the Esc key:
                    closeOnEscape: false,
                    // Close the gallery by swiping up or down:
                    closeOnSwipeUpOrDown: false,
                    // Stops any touches on the container from scrolling the page:
                    disableScroll: false,
                    // Start with the automatic slideshow:
                    startSlideshow: false,
                    // Remove elements outside of the preload range from the DOM:                    
                    slideshowInterval: 5000,                    
                    // The transition speed between slide changes in milliseconds:
                    transitionSpeed: 400,
                    // 비동기 방식일 경우 호출 할 url
                    loadUrl : undefined,
                    // 비동기 방식일 경우 서버에 넘겨 줄 parameter
                    param : {},
                    //몇번째 슬라이드 전에 서버에 요청 할 것인지를 결정 하는 카운트 1 ~ 전체 목록 개수
                    loadStartCount : 2,
                    // 네비게이션 표시 개수
                    indicatorViewCnt : 10,
                    
                    pageNo : 1,
                    // 비동기 방식일 경우 서버로 넘길 때 data type.
                    sendDataType: 'string',
                    // Callback function executed when the Gallery is initialized.
                    // Is called with the gallery instance as "this" object:
                    onopen: function(){
                    	var controlsClass = this.options.controlsClass;
                    	if (!this.container.hasClass(controlsClass)) {
                    		this.toggleControls();
                    	}
    	            },
                    // Callback function executed after the slide change transition.
                    // Is called with the gallery instance as "this" object and the
                    // current index and slide as arguments:
                    onslideend: function(){
                    	if(!this.options.loadUrl){
                    		return;
                    	}
                    	
                    	var self = this;
						if(this.num-self.options.loadStartCount <= this.index && this.existNextImages){
							self.options.pageNo += 1;
							
							naon.http.ajax({
									url : self.options.loadUrl, 
							        type : "post",
							        data : $.extend(self.options.param,{pageNo : self.options.pageNo}),
							        sendDataType: self.options.sendDataType,
							        success : function(resData, statusText) {
							        	if(statusText == "success") {
							        		var carouselLinks = [];
							    	        // Add the demo images as links with thumbnails to the page:
							    	        $.each(resData.data, function (index, photo) {
							    	            carouselLinks.push(self.options.dataFormat(photo));
							    	        });
							        		
							        		if(carouselLinks.length > 0){
							        			self.add(carouselLinks);
							        			//self.existNextImages = false;
							        		}else{
							        			self.existNextImages = false;
							        			self.options.pageNo--;
							        		}
							        	}
							        }// success
							});
						}else if(self.options.loadStartCount > this.index && this.existPrevImages && self.options.pageNo > 1){
							self.options.pageNo -= 1;
							
							naon.http.ajax({
									url : self.options.loadUrl, 
							        type : "post",
							        data : $.extend(self.options.param,{pageNo : self.options.pageNo}),
									sendDataType: self.options.sendDataType,
							        success : function(resData, statusText) {
							        	if(statusText == "success") {
							        		var carouselLinks = [];
							    	        // Add the demo images as links with thumbnails to the page:
							    	        $.each(resData.data, function (index, photo) {
							    	            carouselLinks.push(self.options.dataFormat(photo));
							    	        });
							        		
							        		if(carouselLinks.length > 0){
							        			self.addBefore(carouselLinks);
							        			//self.existPrevImages = false;
							        		}else{
							        			self.existPrevImages = false;
							        			self.options.pageNo++;
							        		}
							        	}
							        }// success
							});
						}		    	            	
    	            },
    	            //데이터 변환 함수
    	            dataFormat : function(obj){
    	            	var link = {};
    	            	link[this.urlProperty] = $(obj).attr('href'); 
    	            	link[this.titleProperty] = $(obj).attr('title');
    	            	return link;
    	            }
                };
                 
            var options =  $.extend(defaults, options);
 
            return this.each(function() {
                var o = options;
                var element = this; 
                var links = $(element).find('.gallery');                
                $(links).click(function(event){
                	var target = this;
                	var carouselLinks = [];
                	$.each(links, function(index, val){
                		if($(val).is(target)){
                			o.index = index;
                		}
                		
                		if($.hasData(val) && !$.isEmptyObject($(val).data())){
                			carouselLinks.push(o.dataFormat($(val).data()));
                		}else{
                			carouselLinks.push(o.dataFormat(val));
                		}
                		
                	});
                	
                	blueimp.Gallery(carouselLinks, o);
                	
                	return false;
                });
             
            });
        }
    });
     
})(jQuery);