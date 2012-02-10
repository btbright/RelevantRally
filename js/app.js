
(function(global){

$(function(){


var RelevantRally = global.RelevantRally = (function(){
	var currentUser,
		currentQuery,
		loadCounter = 0;
		
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
	
	var rallyQueries = {
		default : "((Owner.EmailAddress%20%3D%20**EMAIL**)%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))",
		defaultPlusBacklog : "((Owner.EmailAddress%20%3D%20**EMAIL**)%20and%20(((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze))%20or%20(ScheduleState%20=%20Backlog)))"
	};
	
	var userSettings = (function(){
		var localSettings = {};
		
		//generic methods
		var storeSetting = function(settingName,value){
			localStorage.setItem(appSettings.localStorageNamespace + ":" +currentUser.User.EmailAddress+":" + settingName,value);
		};
		
		var getSettingFromStore = function(settingName){
			return localSettings[settingName] = localStorage.getItem(appSettings.localStorageNamespace + ":" +currentUser.User.EmailAddress+":" + settingName);
		};
		
		var setSetting = function(settingName,settingValue){
			localSettings[settingName] = settingValue;
			storeSetting(settingName,settingValue);
		};
		
		var getSetting = function(settingName){
			return localSettings[settingName] || getSettingFromStore(settingName) || false;
		};
		
		
		//specific methods
		var setWorkspace = function(workspace){
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
		
		getCurrentUser(function(user){
			if (!user){
				openLogin();
			} else {
				loadUserSettings(user);
				setHeader(user);
				loadRallyData(user);
			}
		});
	};
	
	var bindProjectDropdown = function(){
		$(global.document).trigger("startLoading");
		getProjectsForCurrentWorkspace(function(projects){
			$("#ddlProjects").empty();
			_.each(projects,function(project){
				$("#ddlProjects").append("<option value='"+project.id+"'>"+project.name+"</option>");
			});
			
			$("#ddlProjects option[value='"+userSettings.getTopProject()+"']").attr("selected","selected");
			if (projects.length === 1){$("#ddlProjects").attr("disabled","disabled");}
			$(global.document).trigger("endLoading");
		});
	};
	
	var bindWorkspaceDropdown = function(){
		$(global.document).trigger("startLoading");
		getWorkspacesForCurrentUser(function(workspaces){
			$("#ddlWorkspaces").empty();
			_.each(workspaces,function(workspace){
				$("#ddlWorkspaces").append("<option value='"+workspace.id+"'>"+workspace.name+"</option>");
			});
			
			$("#ddlWorkspaces option[value='"+userSettings.getWorkspace()+"']").attr("selected","selected");
			if (workspaces.length === 1){$("#ddlWorkspaces").attr("disabled","disabled");}
			$(global.document).trigger("endLoading");
		});
	};
	
	var loadUserSettings = function(user){
		currentUser = user;
		
		if (!userSettings.getWorkspace()){
			if (user.User.UserProfile.DefaultWorkspace){
				userSettings.setWorkspace(user.User.UserProfile.DefaultWorkspace._ref.match(/\/([0-9]*)\.js/)[1]);
			} else {
				getWorkspacesForCurrentUser(function(workspaces){
					if (workspaces.length > 0){
						userSettings.setWorkspace(workspaces[0].id);
					}
				});
			}	
		}
		
		console.log(user.User.UserProfile.DefaultProject);
		if (!userSettings.getTopProject()){
			if (user.User.UserProfile.DefaultProject){
				userSettings.setTopProject(user.User.UserProfile.DefaultProject._ref.match(/\/([0-9]*)\.js/)[1]);
			} else {
				getProjectsForCurrentWorkspace(function(projects){
					if (projects.length > 0){
						userSettings.setTopProject(projects[0].id);
					}
				});
			}
		}
	};
	
	var bindEvents = function(){
		$(global.document).bind({
			"startLoading" : startLoading,
			"endLoading" : endLoading,
			"primaryDataLoadComplete": primaryDataLoadComplete
		});
		
		$("#settingsLink").click(function(){
			$("#settings").slideToggle("slow");
		});
		
		$("#backlog").click(function(){
			if ($(this).is(":checked")){
				currentQuery = rallyQueries.defaultPlusBacklog;
				genericLoadData();
			} else {
				currentQuery = rallyQueries.default;
				genericLoadData();
			}
		});
		
		$("#ddlProjects").live("change",function(){
			var $this = $(this);
			userSettings.setTopProject($this.val());
			genericLoadData();
		});
		
		$("#ddlWorkspaces").live("change",function(){
			var $this = $(this);
			userSettings.setWorkspace($this.val());
			genericLoadData();
		});
	};
	
	var primaryDataLoadComplete = function(){
		bindProjectDropdown();
		bindWorkspaceDropdown();
	};

	var startLoading = function(){
		loadCounter++;
		handleLoadEvent();
	};
	
	var endLoading = function(){
		loadCounter--;
		handleLoadEvent();
	};
	
	var handleLoadEvent = function(){
		console.log(loadCounter);
	
		if (loadCounter > 0 && !$("#header").hasClass("loading")){
			$("header").addClass("loading");
		} else if (loadCounter === 0){
			$("header").removeClass("loading");
		}
	};
	
	var setHeader = function(user){
		$("#userName").text(user.User._refObjectName);
	};
	
	var loadRallyData = function(user){
		currentQuery = rallyQueries.default;
		genericLoadData();
	};
	
	var genericLoadData = function(){
		var loaded = 0;
		$("#US,#DE").empty();
		$(global.document).trigger("startLoading");
		
		getUserStories(currentQuery+"&start=1&pagesize=999",function(stories){
				if (stories.QueryResult.Results.length === 0){
					$("#US").append("<p class='empty'>No user stories...</p>");
					
					$(global.document).trigger("endLoading");
					loaded++;
					if (loaded === 2){
						$(global.document).trigger("primaryDataLoadComplete");
					}
				} else {
					fillItemData(stories,function(storyArr){
					
						_.each(storyArr,function(story){
							$("#US").append("<p><a target='_blank' href='"+buildUserStoryLink(story.HierarchicalRequirement.ObjectID)+"'>"+story.HierarchicalRequirement.Name+"</a></p>");
						});
						
						$(global.document).trigger("endLoading");
						loaded++;
						if (loaded === 2){
							$(global.document).trigger("primaryDataLoadComplete");
						}
					});
				}
		});
		
		$(global.document).trigger("startLoading");
		getDefects(currentQuery+"&start=1&pagesize=999",function(defects){
			if (defects.QueryResult.Results.length === 0){
				$("#DE").append("<p class='empty'>No defects...</p>");
				loaded++;
				
				$(global.document).trigger("endLoading");
				if (loaded === 2){
					$(global.document).trigger("primaryDataLoadComplete");
				}
			} else {
				fillItemData(defects,function(defectArr){
						_.each(defectArr,function(defect){
							$("#DE").append("<p><a target='_blank' href='"+buildDefectLink(defect.Defect.ObjectID)+"'>"+defect.Defect.Name+"</a></p>");
						});
					
					$(global.document).trigger("endLoading");
					loaded++;
					if (loaded === 2){
						$(global.document).trigger("primaryDataLoadComplete");
					}
				});
			}
		});
	};
	
	var openLogin = function(){
		global.open(rallySettings.loginLink);
	};
	
	
	var getRallyObj = function(reqPath,query,callback){
		$.getJSON(rallySettings.baseURL+reqPath+"&query="+query.replace("**EMAIL**",encodeURI(currentUser.User.EmailAddress))+"&"+rallySettings.jsonParam,callback);
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
	
	var getWorkspacesForCurrentUser = function(callback){
		$.jsonp({
			callbackParameter: "jsonp",
			url : "https://rally1.rallydev.com/slm/webservice/1.29/workspace.js?query=&fetch=ObjectID&start=1&pagesize=200",
			success : function(result){
				var workspaces = [];
				_.each(result.QueryResult.Results,function(workspace){
					workspaces.push({name:workspace._refObjectName,id:workspace.ObjectID});
				});
				callback(workspaces);
			},
			error : function(){callback(false);}
		});
	};
	
	var getUserStories = function(query,callback){
		getRallyObj("hierarchicalrequirement.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+getWorkspace()+"&project=https://rally1.rallydev.com/slm/webservice/1.29/project/"+userSettings.getTopProject(),query,callback);
	};
	
	var getDefects = function(query,callback){
		getRallyObj("defect.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/"+getWorkspace()+"&project=https://rally1.rallydev.com/slm/webservice/1.29/project/"+userSettings.getTopProject(),query,callback);
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



