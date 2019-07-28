/**
* @class
* jquery.yakuModal.js ������Ʈ Ŭ���� ���̾ �ٿ�
*
* @example
*
*
* @name layerPopup
* @author JsYang <yakuyaku@gmail.com>
* @since 2009-10-16
* @version 2.0
*/

(function($) {
	var status = {};

	$.fn.yakuModal = function(options)
	{
		var opts = options;
		return $(this).bind('click.yakuModal', function(){
			return new $modal(opts);
		});
	};

	$.yakuModal = function(options) {
		return new $modal(options);
	};

	$.yakuModal.defaults = {
		name  : '#popupLayer' ,
		closeButton : '#close' ,
		backgroundDisplay  : true ,
		backgroundOpacity  : "0.5" ,
		backgroundColor  : "#000" ,
		center : true ,
		fade   : true ,
		speed  : 'fast' ,
		zIndex : '100'  ,
		left  : '100px' ,
		top   : '200px' ,
		scroll : 'no'
	};

	var ie6   = $.browser.msie && parseInt($.browser.version) == 6 && typeof window['XMLHttpRequest'] != "object";

	$.yakuModal.impl = function(options)
	{
		var s   = this;
		s.opts  = $.extend({}, $.yakuModal.defaults, options);
		s.popup = $(s.opts.name);
		s.closeButton = $(s.opts.closeButton);
		s.init();
		s.bindEvents();
	};

	var $modal;

	$modal = $.yakuModal.impl;

    $modal.fn = $modal.prototype = {
        version : '2.0'
    }

    $modal.fn.extend =  $modal.extend = $.extend;

	$modal.fn.extend({
		init : function(){
			var s =this;

			s.popup.css({
				"position": "absolute",
				"zIndex" :  this.opts.zIndex ,
				"top"    :  this.opts.top    ,
				"left"   :  this.opts.left
			});


			if(s.popup.css('display') == 'none'){
				s.status = 0;
			} else {
				s.status = 1;
			}

			if(s.opts.center) {
				$modal.moveCenter(s.popup);
			}

			if(s.opts.backgroundDisplay){
				s.makeOverlay();
				if(ie6) $modal.fixIE(this.overlay);
			}

			if(ie6) s.makeIFrame();

			this.show();

		},
		show : function(){
			var s=this;
			if(s.status == 0)  {
				if(s.opts.fade) {
					s.popup.fadeIn(s.opts.speed);
					if(s.opts.backgroundDisplay)  s.overlay.fadeIn(s.opts.speed);
				} else {
					s.popup.css('display', 'block');
					if(s.opts.backgroundDisplay)  s.overlay.css('display', 'block');
				}
				if(ie6 && s.ifrm) {
					s.ifrm.css({
						top :  s.popup.offset().top ,
						left : s.popup.offset().left
					})
				}

				if(jQuery.ui) {
					s.popup.draggable({
						drag: function(event, ui) {
							if(ie6) {
								s.ifrm.css({
									top  : $(this).offset().top ,
									left : $(this).offset().left
								});
							}
						}
					});
				}
				s.status = 1;
			}
		},
		close : function() {
			var s=this;
			if(s.status == 1 ) {
				if(s.opts.fade) {
					s.popup.fadeOut(this.opts.speed);
					if(s.opts.backgroundDisplay)  s.overlay.fadeOut(this.opts.speed);
				} else {
					s.popup.css('display', 'none');
					if(s.opts.backgroundDisplay)  s.overlay.css('display', 'none');
				}
				if(ie6 && s.ifrm) {
					s.ifrm.hide().remove();
				}
				s.status = 0;
			}
		},
		makeOverlay: function() {
			if(!this.overlay)
			{
				this.overlay = $("<div id='h_overlay' class='overlay'></div>");
				this.overlay.css({
						"display" : "none" ,
						"position" : "fixed" ,
						"height" : "100%" ,
						"width"  : "100%" ,
						"left" : "0",
						"top"  : "0",
						"background" : this.opts.backgroundColor ,
						"zIndex" : "200" ,
						"opacity": this.opts.backgroundOpacity
				});
				
				
				
				if($("body").has("#h_overlay").html() != null){
					$("#h_overlay").remove();
					$('body').prepend(this.overlay);
					$("#h_overlay").show();
				}else{
					$('body').prepend(this.overlay);
				}
			}
		},
		makeIFrame : function() {
			var s = this;
			if(!s.ifrm) {
				s.ifrm =  $("<iframe src='about:blank' id='iframe_bg' src='about:blank' scrolling='no' frameborder='0' ></iframe>")
				.css({
					'position' : 'absolute',
					'width'    : s.popup.width() ,
					'height'   : s.popup.height(),
					'opacity'  : '0',
					'border'   : 'none'
				}).insertBefore(s.popup);
			}
		},
		bindEvents : function(){
			var s = this;

			s.closeButton.bind("click.closeButton", function(e){
				e.preventDefault();
				s.close();
			});

			$(document).bind('keydown.layerPopup', function (e) {
				//if ( s.status == 1 && e.keyCode == 27) { // ESC
				//	e.preventDefault();
				//	s.close();
				//};
			});

			$(s.overlay).bind("click.overlay",function(e){
				//if ( s.status == 1 ) {
				//	e.preventDefault();
				//	s.close();
				//};
			});

		},
		unbindEvents : function(){
			$(this.opts.closeButton).unbind('click.closeButton');
			$(document).unbind('keydown.layerPopup');
			$(this.opts.overlay).unbind('click.overlay');
		}
	});

	$modal.extend({
		moveCenter : function(modal) {
			modal.css('top',  $(window).scrollTop() + $(window).height()/2-modal.height()/2);
			modal.css('left', $(window).width()/2-modal.width()/2);
		},
		fixIE: function (objs) {
			$.each([objs], function (i, el) {
				if (el) {
					var bch = 'document.body.clientHeight', bcw = 'document.body.clientWidth',
						bsh = 'document.body.scrollHeight', bsl = 'document.body.scrollLeft',
						bst = 'document.body.scrollTop', bsw = 'document.body.scrollWidth',
						ch = 'document.documentElement.clientHeight', cw = 'document.documentElement.clientWidth',
						sl = 'document.documentElement.scrollLeft', st = 'document.documentElement.scrollTop',
						s = el[0].style;

					s.position = 'absolute';
					if (i < 2) {
						s.removeExpression('height');
						s.removeExpression('width');
						s.setExpression('height','' + bsh + ' > ' + bch + ' ? ' + bsh + ' : ' + bch + ' + "px"');
						s.setExpression('width','' + bsw + ' > ' + bcw + ' ? ' + bsw + ' : ' + bcw + ' + "px"');
					}
					else {
						var te, le;
						if (p && p.constructor == Array) {
							var top = p[0]
								? typeof p[0] == 'number' ? p[0].toString() : p[0].replace(/px/, '')
								: el.css('top').replace(/px/, '');
							te = top.indexOf('%') == -1
								? top + ' + (t = ' + st + ' ? ' + st + ' : ' + bst + ') + "px"'
								: parseInt(top.replace(/%/, '')) + ' * ((' + ch + ' || ' + bch + ') / 100) + (t = ' + st + ' ? ' + st + ' : ' + bst + ') + "px"';

							if (p[1]) {
								var left = typeof p[1] == 'number' ? p[1].toString() : p[1].replace(/px/, '');
								le = left.indexOf('%') == -1
									? left + ' + (t = ' + sl + ' ? ' + sl + ' : ' + bsl + ') + "px"'
									: parseInt(left.replace(/%/, '')) + ' * ((' + cw + ' || ' + bcw + ') / 100) + (t = ' + sl + ' ? ' + sl + ' : ' + bsl + ') + "px"';
							}
						}
						else {
							te = '(' + ch + ' || ' + bch + ') / 2 - (this.offsetHeight / 2) + (t = ' + st + ' ? ' + st + ' : ' + bst + ') + "px"';
							le = '(' + cw + ' || ' + bcw + ') / 2 - (this.offsetWidth / 2) + (t = ' + sl + ' ? ' + sl + ' : ' + bsl + ') + "px"';
						}
						s.removeExpression('top');
						s.removeExpression('left');
						s.setExpression('top', te);
						s.setExpression('left', le);
					}
				}
			});
		}

	});

})(jQuery);