var utils = utils || {};

utils.general = (function(){
	'use strict';

	function init(){
		changeBakground();
		showFakeButtonReturn();
	}

	function changeBakground(){
		$('.links-fake li').click(function($this){
			var productType = $this.currentTarget.className;

			$('body').attr("id", productType);
			showFakeButtonReturn();
		});
	}

	function showFakeButtonReturn(){
		if ($('body').attr('id') !== "central-do-cliente") {
			$('.dc-button-back').show();
		}
	}

	return {
		init: init
	}

}());

utils.general.init();