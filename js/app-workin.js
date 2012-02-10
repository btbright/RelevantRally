$(function(){

	$.getJSON("https://rally1.rallydev.com/slm/webservice/1.29/user.js?fetch=emailaddress&jsonp=?",function(response){
		console.log(response.User.EmailAddress);
		
		
		$.getJSON("https://rally1.rallydev.com/slm/webservice/1.29/defect.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/76779221&query=((Owner.EmailAddress%20%3D%20"+encodeURI(response.User.EmailAddress)+")%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))&start=1&pagesize=999&jsonp=?",function(response2){
		
		_.each(response2.QueryResult.Results,function(result,i){
			$.getJSON(response2.QueryResult.Results[i]._ref+"?jsonp=?",function(result){
				console.log(result);
				$("#DE").append("<p><a target='_blank' href='https://rally1.rallydev.com/slm/rally.sp#/82098953/detail/defect/"+result.Defect.ObjectID+"'>"+result.Defect.Name+"</a></p>");
			});
		});
		
		});
		
		
		
		$.getJSON("https://rally1.rallydev.com/slm/webservice/1.29/hierarchicalrequirement.js?workspace=https://rally1.rallydev.com/slm/webservice/1.29/workspace/76779221&query=((Owner.EmailAddress%20%3D%20"+encodeURI(response.User.EmailAddress)+")%20and%20((KanbanState%20contains%20Dev)%20or%20(KanbanState%20contains%20Analyze)))&start=1&pagesize=999&jsonp=?",function(response2){
		
		_.each(response2.QueryResult.Results,function(result,i){
			$.getJSON(response2.QueryResult.Results[i]._ref+"?jsonp=?",function(result){
				console.log(result);
				$("#US").append("<p><a target='_blank' href='https://rally1.rallydev.com/slm/rally.sp#/82098953/detail/userstory/"+result.HierarchicalRequirement.ObjectID+"'>"+result.HierarchicalRequirement.Name+"</a></p>");
			});
		});
			
		
	});
	});
	
});