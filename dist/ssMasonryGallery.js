/*
SSMasonryGallery: https://github.com/VeeK727/ssMasonryGallery
Version: 0.1
Author: Vipul Kapoor (@MrVipulKapoor)
Licenced under: MIT License

Copyright (c) 2018 Vipul Kapoor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

;(function ($, window, doucment, undefined) {
	var pluginName = 'ssMasonryGallery',
	defaults = {
		mode: 'rows', // columns, rows
		responsive: [
			{
				breakpoint: 0, //must be defined
				rowHeight: 400, // needed in case of row mode
				columns: 1 // needed in case of column mode
			},
			{
				breakpoint: 480,
				rowHeight: 250,
				columns: 2
			},
			{
				breakpoint: 720,
				rowHeight: 250,
				columns: 2
			},
			{
				breakpoint: 1024,
				rowHeight: 300,
				columns: 4
			},
			{
				breakpoint: 1440,
				rowHeight: 300,
				columns: 6
			},
			{
				breakpoint: 1920,
				rowHeight: 300,
				columns: 8
			}
		],
		margin: 5,
		gallery: true,
		onLoad: function() {}
	};

	function Plugin( element, options ) {
		this.element = element;
		this.options = $.extend( {}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	function calculateBreakpoint(self, windowWidth){
		//calculate applicable breakpoint
		var breakpoint;
		$.each(self.options.responsive, function(index, value){
			if(value.breakpoint < windowWidth)
				breakpoint = index;
		});
		return breakpoint;
	}


	function alignByRows(self, images, maxRowHeight, elementWidth){
		var imagesInRow = [],
			top = self.top,
			margin = self.options.margin,
			left = row = rowWidth = rowHeight = 0;

		$(images).each(function(i){
			imagesInRow.push(i);
			var nextRow = false;
			var imgWidth = this.naturalWidth,
				imgHeight = this.naturalHeight,
				aspectRatio = imgWidth/imgHeight,
				desiredWidth = Math.floor(maxRowHeight*aspectRatio);

			if(rowHeight == 0)
				rowHeight = maxRowHeight;

			if(desiredWidth > elementWidth && i == 0){
				//image is too wide. This will take up the entire row
				desiredWidth = elementWidth-margin;
				rowHeight = desiredWidth/aspectRatio;
				nextRow = true;
			}

			rowWidth += desiredWidth+margin;
			var position = {
				top: top,
				left: left,
				width: desiredWidth,
				height: rowHeight
			};
			$(this).data('position', position);

			left = left+desiredWidth+margin;
			if(rowWidth > elementWidth){
				//rowWidth has exceeded elementWidth, we fit these images in the row and move to next row
				var numImagesinThisRow = imagesInRow.length,
					marginToSubtract = numImagesinThisRow*margin;

				var rowAspectRatio = (rowWidth-marginToSubtract)/rowHeight,
					desiredHeight = Math.floor((elementWidth-marginToSubtract)/rowAspectRatio);
				imagesInThisRow = $(images).slice(imagesInRow[0], imagesInRow.slice(-1)[0]+1);

				alignByRows(self, imagesInThisRow, desiredHeight, elementWidth);
				nextRow = true;
			}

			if(nextRow){
				top = top+rowHeight+margin;
				self.top = top;
				rowWidth = rowHeight = left = 0;
				imagesInRow = [];
			}
		});
		self.elemHeight = top+rowHeight;

		$(images).each(function(){
			var imagePosition = $(this).data().position;
			$(this).css(imagePosition);
		});
	}

	function alignByColumns(self, images, columns, elementWidth){
		var colHeights = [],
			top = self.top,
			left = 0,
			margin = self.options.margin,
			columnWidth = (elementWidth-(margin*columns))/columns;

		for (var i = 0; i < columns; i++) {
			colHeights.push(0);
		}
		console.log(colHeights);

		$(images).each(function(){
			var lowestColumn = Math.min.apply(Math, colHeights),
				lowestColumnIndex = colHeights.indexOf(lowestColumn),
				imgWidth = this.naturalWidth,
				imgHeight = this.naturalHeight,
				aspectRatio = imgWidth/imgHeight;

			var left = lowestColumnIndex*columnWidth+lowestColumnIndex*margin,
				top = colHeights[lowestColumnIndex],
				newHeight = Math.floor(columnWidth/aspectRatio);
			var position = {
				left: left,
				top: top,
				width: columnWidth,
				height: newHeight
			}
			$(this).css(position);

			colHeights[lowestColumnIndex] += newHeight+margin;
		});

		var highestColumn = Math.max.apply(Math, colHeights);
		self.elemHeight = highestColumn;
	}

	function draw(el, images, self){
		var windowWidth = $(window).outerWidth();
		var elementWidth = Math.ceil(el.width());
		var breakpointIndex = calculateBreakpoint(self, windowWidth);

		self.elemHeight = 0;
		self.top = 0;

		if(self.options.mode == 'rows'){
			if(!('rowHeight' in self.options.responsive[breakpointIndex])){
				throw Error('You have selected "row" mode but haven\'t specified "rowHeight" option. Please check documentation for details');
			}

			var breakpoint = self.options.responsive[breakpointIndex].breakpoint;
			var maxRowHeight = self.options.responsive[breakpointIndex].rowHeight;

			alignByRows(self, images, maxRowHeight, elementWidth);
			el.height(self.elemHeight);

		} else if(self.options.mode == 'columns'){
			if(!('columns' in self.options.responsive[breakpointIndex])){
				throw Error('You have selected "column" mode but haven\'t specified "columns" option. Please check documentation for details');
			}

			var columns = self.options.responsive[breakpointIndex].columns;

			alignByColumns(self, images, columns, elementWidth);
			el.height(self.elemHeight);
		}
	}

	$.extend( Plugin.prototype, {
		init: function() {
			if(this.options.responsive[0].breakpoint != 0){
				throw Error('First breakpoint must be 0 (Zero)');
			}

			var self, el, images;
			self = this;
			el = $(this.element);
			images = el.children('img');
			el.addClass('ssMasonryGallery-cont');

			//draw layout of masonry
			draw(el, images, this);

			//create gallery
			if(this.options.gallery){
				el.addClass('ssMasonryGallery-gallery');

				var galleryHtml = '<div id="ssMasonryGallery-projector"><button type="button" class="ssMasonryGallery-close">x</button><img src=""><p class="ssMasonryGallery-caption"></p></div>';
				$('body').append(galleryHtml);

				var projector = $('#ssMasonryGallery-projector');
				images.on('click', function(){
					if($(this).data('highres'))
						var link = $(this).data('highres');
					else
						var link = $(this).attr('src');

					projector.find('img').attr('src', link);

					if($(this).data('caption')){
						projector.find('.ssMasonryGallery-caption').html($(this).data('caption')).addClass('show');
					}

					projector.addClass('active');
				});

				$('#ssMasonryGallery-projector .ssMasonryGallery-close').on('click', function(){
					$(this).closest('#ssMasonryGallery-projector').removeClass('active');
					$(this).siblings('.ssMasonryGallery-caption').removeClass('show');
				});

				$(document).on('keyup', function(e){
					if(e.keyCode == 27){
						projector.removeClass('active');
						projector.find('.ssMasonryGallery-caption').removeClass('show');
					}
				});
			}

			var resize;
			$(window).on('resize orientationchange', function(){
				clearTimeout(resize);
				resize = setTimeout(function() {
					draw(el, images, self)
				}, 500);
			});

			this.options.onLoad.call(el);
		}
	});

	$.fn[pluginName] = function ( options ) {
		var plugin;
		this.each(function () {
			plugin = $.data(this, 'plugin_' + pluginName);
			if (!plugin) {
				plugin = new Plugin(this, options);
				$.data(this, 'plugin_' + pluginName, plugin);
			}
		});

		return plugin;
	}
}(jQuery, window, document));