
(function(global){

$(function(){


var RelevantRally = global.RelevantRally = (function(){
	var currentUser;
	var rallySettings = {
		baseURL : "https://rally1.rallydev.com/slm/webservice/1.29/",
		jsonParam : "jsonp=?",
		defaultWorkspace : '76779221', //Intermark
		defectLink : "https://rally1.rallydev.com/slm/rally.sp#/82098953/detail/defect/", //SET specific
		userStoryLink : "https://rally1.rallydev.com/slm/rally.sp#/82098953/detail/userstory/" //SET specific
	}
	
	var init = function(){
		bindEvents();
		$(global.document).trigger("startLoading");
		getCurrentUser(function(user){
			if (!user){
				openLogin();
			} else {
				currentUser = user;
				setHeader(user);
				loadRallyData(user);
			}
		});
	};
	
	var bindEvents = function(){
		$(global.document).bind({
			"startLoading" : startLoading,
			"endLoading" : endLoading
		});
		
		$("#settingsLink").click(function(){
			$("#settings").slideToggle("slow");
		});
		
		$("#backlog").click(function(){
			$("#US,#DE").empty();
			$(global.document).trigger("startLoading");
			if ($(this).is(":checked")){
				genericLoadData("((Owner.EmailAddress%20%3D%20"+encodeURI(currentUser.User.EmailAddress)+")%20and%20(((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze))%20or%20(ScheduleState%20=%20Backlog)))");
			} else {
				genericLoadData("((Owner.EmailAddress%20%3D%20"+encodeURI(currentUser.User.EmailAddress)+")%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))");
			}
		});
	};

	var startLoading = function(){
		$("header").addClass("loading");
	};
	
	var endLoading = function(){
		$("header").removeClass("loading");
	};
	
	var setHeader = function(user){
		$("#userName").text(user.User._refObjectName);
	};
	
	var loadRallyData = function(user){
		genericLoadData("((Owner.EmailAddress%20%3D%20"+encodeURI(user.User.EmailAddress)+")%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))");
		/*
		var loaded = 0;
		getUserStories("((Owner.EmailAddress%20%3D%20"+encodeURI(user.User.EmailAddress)+")%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))&start=1&pagesize=999",function(stories){
				fillItemData(stories,function(storyArr){
					_.each(storyArr,function(story){
						$("#US").append("<p><a target='_blank' href='"+rallySettings.userStoryLink+story.HierarchicalRequirement.ObjectID+"'>"+story.HierarchicalRequirement.Name+"</a></p>");
					});
					loaded++;
					if (loaded === 2){
						$(global.document).trigger("endLoading");
					}
				});
		});
				
		getDefects("((Owner.EmailAddress%20%3D%20"+encodeURI(user.User.EmailAddress)+")%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))&start=1&pagesize=999",function(defects){
			fillItemData(defects,function(defectArr){
				_.each(defectArr,function(defect){
					$("#DE").append("<p><a target='_blank' href='"+rallySettings.defectLink+defect.Defect.ObjectID+"'>"+defect.Defect.Name+"</a></p>");
				});
				loaded++;
				if (loaded === 2){
					$(global.document).trigger("endLoading");
				}
			});
		});
		*/
	};
	
	var genericLoadData = function(query){
		var loaded = 0;
		getUserStories(query+"&start=1&pagesize=999",function(stories){
				fillItemData(stories,function(storyArr){
					_.each(storyArr,function(story){
						$("#US").append("<p><a target='_blank' href='"+rallySettings.userStoryLink+story.HierarchicalRequirement.ObjectID+"'>"+story.HierarchicalRequirement.Name+"</a></p>");
					});
					loaded++;
					if (loaded === 2){
						$(global.document).trigger("endLoading");
					}
				});
		});
				
		getDefects(query+"&start=1&pagesize=999",function(defects){
			fillItemData(defects,function(defectArr){
				_.each(defectArr,function(defect){
					$("#DE").append("<p><a target='_blank' href='"+rallySettings.defectLink+defect.Defect.ObjectID+"'>"+defect.Defect.Name+"</a></p>");
				});
				loaded++;
				if (loaded === 2){
					$(global.document).trigger("endLoading");
				}
			});
		});
	}
	
	var openLogin = function(){
		global.open("https://rally1.rallydev.com/slm/login.op");
	};
	
	
	var getRallyObj = function(reqPath,query,callback){
		$.getJSON(rallySettings.baseURL+reqPath+"&query="+query+"&"+rallySettings.jsonParam,callback);
	};
	
	var fillItemData = function(items,callback){
		var itemsLen = items.QueryResult.Results.length,
			itemCount = 0,
			itemArr = [];
			
		_.each(items.QueryResult.Results,function(result,i){
			$.getJSON(items.QueryResult.Results[i]._ref+"?jsonp=?",function(item){
				itemArr.push(item);
				itemCount++;
				console.log("count:"+itemCount,"itemsLen:"+itemsLen);
				if (itemCount === itemsLen){
					callback(itemArr);
				}
			});
		});
	};
	
	var getCurrentUser = function(callback){
			$.jsonp({
				callbackParameter: "jsonp",
				url : rallySettings.baseURL+"user.js?fetch=emailaddress&jsonp=?",
				success : callback,
				error : function(){callback(false);}
			});
	};
	
	var getUserStories = function(query,callback){
		console.log("called user story get");
		getRallyObj("hierarchicalrequirement.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+rallySettings.defaultWorkspace,query,callback);
	};
	
	var getDefects = function(query,callback){
		getRallyObj("defect.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+rallySettings.defaultWorkspace,query,callback);
	};
	
	var buildDefectLink = function(objectID){
		return rallySettings.defectLink+objectID;
	};
	
	var buildDefectLink = function(objectID){
		return rallySettings.userStoryLink+objectID;
	};
	
	return {
		init : init
	}
})();


RelevantRally.init();
	
});

})(window);



