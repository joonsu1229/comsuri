/*
 * blueimp Gallery Indicator JS 1.0.0
 * https://github.com/blueimp/Gallery
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*global define, window, document */

(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define([
            './blueimp-helper',
            './blueimp-gallery'
        ], factory);
    } else {
        // Browser globals:
        factory(
            window.blueimp.helper || window.jQuery,
            window.blueimp.Gallery
        );
    }
}(function ($, Gallery) {
    'use strict';

    $.extend(Gallery.prototype.options, {
        // The tag name, Id, element or querySelector of the indicator container:
        indicatorContainer: 'ol',
        // The class for the active indicator:
        activeIndicatorClass: 'active',
        // The list object property (or data attribute) with the thumbnail URL,
        // used as alternative to a thumbnail child element:
        thumbnailProperty: 'thumbnail',
        // Defines if the gallery indicators should display a thumbnail:
        thumbnailIndicators: true,
        
        indicatorViewCnt : 10
    });

    var initSlides = Gallery.prototype.initSlides,
        addSlide = Gallery.prototype.addSlide,
        resetSlides = Gallery.prototype.resetSlides,
        handleClick = Gallery.prototype.handleClick,
        handleSlide = Gallery.prototype.handleSlide,
        close = Gallery.prototype.close;

    $.extend(Gallery.prototype, {

        createIndicator: function (obj) {
            var indicator = this.indicatorPrototype.cloneNode(false),
                title = this.getItemProperty(obj, this.options.titleProperty),
                thumbnailProperty = this.options.thumbnailProperty,
                thumbnailUrl,
                thumbnail;
            if (this.options.thumbnailIndicators) {
                thumbnail = obj.getElementsByTagName && $(obj).find('img')[0];
                if (thumbnail) {
                    thumbnailUrl = thumbnail.src;
                } else if (thumbnailProperty) {
                    thumbnailUrl = this.getItemProperty(obj, thumbnailProperty);
                }
                if (thumbnailUrl) {
                    indicator.style.backgroundImage = 'url("' + thumbnailUrl + '")';
                }
            }
            if (title) {
                indicator.title = title;
            }
            return indicator;
        },

        addIndicator: function (index) {
            if (this.indicatorContainer.length) {
            	//기존 코드
            	/*var indicator = this.createIndicator(this.list[index]);
                indicator.setAttribute('data-index', index);
                this.indicatorContainer[0].appendChild(indicator);
                this.indicators.push(indicator);*/
            	
            	// 네비게이션 바에 일정 개수만 표시하도록 수정 @author jgs135
            	if(this.indicators.length < this.options.indicatorViewCnt){
            		var indicator = this.createIndicator(this.list[index]);
                    indicator.setAttribute('data-index', index);
                    this.indicatorContainer[0].appendChild(indicator);
                    this.indicators.push(indicator);
            	}
            }
        },

        setActiveIndicator: function (index) {
        	//기존 코드
        	/*if (this.activeIndicator) {
                this.activeIndicator
                    .removeClass(this.options.activeIndicatorClass);
            }
    		
            this.activeIndicator = $(this.indicators[index]);
            this.activeIndicator
                .addClass(this.options.activeIndicatorClass);*/
        	
        	// 네비게이션 바에 일정 개수만 표시하도록 수정 @author jgs135
            if (this.indicators) {
            	if(parseInt(this.indicators[this.indicators.length-1].getAttribute('data-index')) < index){
            		this.resetIndicator();
            		
            		for(var i=index; i < this.list.length; i++){
            			this.addIndicator(i);
            		}
            		
            		this.activeIndicator = $(this.indicators[0]);
                    this.activeIndicator
                        .addClass(this.options.activeIndicatorClass);
            	}else if(parseInt(this.indicators[0].getAttribute('data-index')) > index){
            		this.resetIndicator();
            		var startIndex;
            		
            		if(index > this.options.indicatorViewCnt-1){
            			startIndex = this.options.indicatorViewCnt - index;
            		}else if(index < this.options.indicatorViewCnt){
            			startIndex = 0;
            		}
            		
            		for(var i=startIndex; i < index+1; i++){
            			this.addIndicator(i);
            		}
            		
            		this.activeIndicator = $(this.indicators[this.indicators.length-1]);
                    this.activeIndicator
                        .addClass(this.options.activeIndicatorClass);
            	}else{
            		if (this.activeIndicator) {
                        this.activeIndicator
                            .removeClass(this.options.activeIndicatorClass);
                    }
            		
            		var fixIndex;            		
            		for(var i=0; i < this.indicators.length; i++){
            			if(parseInt(this.indicators[i].getAttribute('data-index')) == index){
            				fixIndex = i;
            				break;
            			}
            		}
            		
                    this.activeIndicator = $(this.indicators[fixIndex]);
                    this.activeIndicator
                        .addClass(this.options.activeIndicatorClass);
            	}
            }
        },
        /**
         * 네이게이션바 리셋하는 함수
         * @author JUNG(jgs135@naonsoft.com)
         */ 
        resetIndicator: function () {
            this.indicatorContainer.empty();
            this.indicators = [];
        },

        initSlides: function (reload) {
            if (!reload) {
                this.indicatorContainer = this.container.find(
                    this.options.indicatorContainer
                );
                if (this.indicatorContainer.length) {
                    this.indicatorPrototype = document.createElement('li');
                    this.indicators = this.indicatorContainer[0].children;
                }
            }
            initSlides.call(this, reload);
        },

        addSlide: function (index) {
            addSlide.call(this, index);
            this.addIndicator(index);
        },

        resetSlides: function () {
            resetSlides.call(this);
            this.indicatorContainer.empty();
            this.indicators = [];
        },

        handleClick: function (event) {
            var target = event.target || event.srcElement,
                parent = target.parentNode;
            if (parent === this.indicatorContainer[0]) {
                // Click on indicator element
                this.preventDefault(event);
                this.slide(this.getNodeIndex(target));
            } else if (parent.parentNode === this.indicatorContainer[0]) {
                // Click on indicator child element
                this.preventDefault(event);
                this.slide(this.getNodeIndex(parent));
            } else {
                return handleClick.call(this, event);
            }
        },

        handleSlide: function (index) {
            handleSlide.call(this, index);
            this.setActiveIndicator(index);
        },

        close: function () {
            if (this.activeIndicator) {
                this.activeIndicator
                    .removeClass(this.options.activeIndicatorClass);
            }
            close.call(this);
        }

    });

    return Gallery;
}));
