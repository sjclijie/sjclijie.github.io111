var App = function(){

	var mapKeySupport = function(){

		$("body").keyup(function(event){

			if(event.which == 37 && $(".paging .left > a").length > 0){

				location.replace($(".paging .left > a").attr("href"));

			}else if (event.which == 39 && $(".paging .right > a").length > 0){

				location.replace($(".paging .right > a").attr("href"));
			}

		});
	};

	var nprogress = function(){

		NProgress.start();

		setTimeout(NProgress.done,600);
	};

	return {
		
		mapKeySupport: function (){
			mapKeySupport();
		},

		initNProgress: function(){
			nprogress();
		}
	};

}();