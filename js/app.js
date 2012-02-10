
(function(global){

$(function(){


var RelevantRally = global.RelevantRally = (function(){
	var currentUser;
	var appSettings = {
		localStorageNamespace : "RelevantRally"
	};
	
	var rallySettings = {
		loginLink : "https://rally1.rallydev.com/slm/login.op",
		baseURL : "https://rally1.rallydev.com/slm/webservice/1.29/",
		jsonParam : "jsonp=?",
		defectLink : "https://rally1.rallydev.com/slm/rally.sp#/%PROJECTID%/detail/defect/", 
		userStoryLink : "https://rally1.rallydev.com/slm/rally.sp#/%PROJECTID%/detail/userstory/"
	};
	
	var userSettings = (function(){
		var localSettings = {};
		
		//generic methods
		var storeSetting = function(settingName,value){
			localStorage.setItem(appSettings.localStorageNamespace + ":" + settingName,value);
		};
		
		var setSetting = function(settingName,settingValue){
			localSettings[settingName] = settingValue;
			storeSetting(settingName,settingValue);
		};
		
		var getSetting = function(settingName){
			return localSettings[settingName] || getSetting(settingName) || false;
		};
		
		
		//specific methods
		var setWorkspace = function(workspace){
			console.log(workspace);
			setSetting("workspace",workspace);
		};
		
		var getWorkspace = function(){
			return getSetting("workspace");
		};
		
		var setTopProject = function(topProject){
			setSetting("topProject",topProject);
		};
		
		var getTopProject = function(){
			return getSetting("topProject");
		};
		
		var setShowChildren = function(showChildren){
			setSetting("showChildren",showChildren);
		};
		
		var getShowChildren = function(){
			return getSetting("showChildren") === "false" ? false : true;
		};
		
		return {
			setWorkspace : setWorkspace,
			getWorkspace : getWorkspace,
			setTopProject : setTopProject,
			getTopProject : getTopProject,
			setShowChildren : setShowChildren,
			getShowChildren : getShowChildren
		};
	})();
	
	var init = function(){
		bindEvents();
		$(global.document).trigger("startLoading");
		getCurrentUser(function(user){
			if (!user){
				openLogin();
			} else {
				console.log(user);
				loadUserSettings(user);
				setHeader(user);
				loadRallyData(user);
				getProjectsForCurrentWorkspace();
			}
		});
	};
	
	var loadUserSettings = function(user){
		currentUser = user;
		userSettings.setWorkspace(user.User.UserProfile.DefaultWorkspace._ref.match(/\/([0-9]*)\.js/)[1]);
		userSettings.setTopProject(user.User.UserProfile.DefaultProject._ref.match(/\/([0-9]*)\.js/)[1]);
	};
	
	var findProjects = function(){
		getRallyObj("defect.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+getWorkspace(),query,callback);
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
	};
	
	var genericLoadData = function(query){
		var loaded = 0;
		getUserStories(query+"&start=1&pagesize=999",function(stories){
				fillItemData(stories,function(storyArr){
					_.each(storyArr,function(story){
						$("#US").append("<p><a target='_blank' href='"+buildUserStoryLink(story.HierarchicalRequirement.ObjectID)+"'>"+story.HierarchicalRequirement.Name+"</a></p>");
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
					$("#DE").append("<p><a target='_blank' href='"+buildDefectLink(defect.Defect.ObjectID)+"'>"+defect.Defect.Name+"</a></p>");
				});
				loaded++;
				if (loaded === 2){
					$(global.document).trigger("endLoading");
				}
			});
		});
	};
	
	var openLogin = function(){
		global.open(rallySettings.loginLink);
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
				url : rallySettings.baseURL+"user.js?fetch=UserProfile,emailaddress,true&jsonp=?",
				success : function(user){
					console.log(user.User.UserProfile._ref);
					
					$.jsonp({
						callbackParameter: "jsonp",
						url : user.User.UserProfile._ref,
						success : function(userProfile){
							user.User.UserProfile = userProfile.UserProfile;
							callback(user);
						},
						error : function(){callback(false);}
					});
					
				},
				error : function(){callback(false);}
			});
	};
	
	var getWorkspace = function(){
		return userSettings.getWorkspace();
	};
	
	var getProjectsForCurrentWorkspace = function(callback){
		$.jsonp({
			callbackParameter: "jsonp",
			url : "https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+getWorkspace()+".js",
			success : function(workspace){
				var projects = [];
				_.each(workspace.Workspace.Projects,function(project){
					projects.push({name:project._refObjectName,id:project._ref.match(/\/([0-9]*)\.js/)[1]});
				});
				callback(projects);
			},
			error : function(){callback(false);}
		});
	
	};
	
	var getUserStories = function(query,callback){
		getRallyObj("hierarchicalrequirement.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+getWorkspace(),query,callback);
	};
	
	var getDefects = function(query,callback){
		getRallyObj("defect.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+getWorkspace(),query,callback);
	};
	
	var buildUserStoryLink = function(objectID){
		return buildLink(rallySettings.userStoryLink,objectID);
	};
	
	var buildDefectLink = function(objectID){
		return buildLink(rallySettings.defectLink,objectID);
	};
	
	var buildLink = function(link,objectID){
		return (link.replace("%PROJECTID%",userSettings.getTopProject()))+objectID;
	};
	
	return {
		init : init,
		userSettings : userSettings
	}
})();


RelevantRally.init();
	
});

})(window);



